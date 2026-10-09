-- Run this file in the Supabase SQL Editor.
-- Public clients can read approved testimonials only. They cannot insert, update, or delete.

create extension if not exists pgcrypto;

create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 80),
  organization text not null check (char_length(btrim(organization)) between 2 and 120),
  job_title text check (job_title is null or char_length(btrim(job_title)) between 1 and 100),
  relationship text not null check (relationship in ('Client', 'Coworker', 'Nonprofit Partner', 'Collaborator', 'Other')),
  rating smallint not null check (rating between 1 and 5),
  testimonial text not null check (char_length(btrim(testimonial)) between 30 and 1500),
  linkedin_url text check (
    linkedin_url is null or linkedin_url ~* '^https://([a-z0-9-]+\.)?linkedin\.com(/|$)'
  ),
  consent_given boolean not null check (consent_given = true),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'removed')),
  created_at timestamptz not null default now(),
  approved_at timestamptz
);

create index if not exists testimonials_public_order_idx
  on public.testimonials (approved_at desc, created_at desc)
  where status = 'approved' and consent_given = true;

create or replace function public.set_testimonial_approval_timestamp()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status = 'approved' and old.status is distinct from 'approved' then
    new.approved_at = now();
  elsif new.status <> 'approved' then
    new.approved_at = null;
  end if;
  return new;
end;
$$;

drop trigger if exists set_testimonial_approval_timestamp on public.testimonials;
create trigger set_testimonial_approval_timestamp
before update of status on public.testimonials
for each row execute function public.set_testimonial_approval_timestamp();

alter table public.testimonials enable row level security;

drop policy if exists "Approved testimonials are publicly readable" on public.testimonials;
create policy "Approved testimonials are publicly readable"
on public.testimonials
for select
to anon, authenticated
using (status = 'approved' and consent_given = true);

revoke insert, update, delete on public.testimonials from anon, authenticated;
grant select on public.testimonials to anon, authenticated;

-- Stores only a salted hash, never a raw IP address.
create table if not exists public.testimonial_submission_limits (
  fingerprint text primary key,
  window_started_at timestamptz not null default now(),
  submission_count integer not null default 1 check (submission_count > 0)
);

alter table public.testimonial_submission_limits enable row level security;
revoke all on public.testimonial_submission_limits from anon, authenticated;

create or replace function public.check_testimonial_rate_limit(p_fingerprint text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_record public.testimonial_submission_limits%rowtype;
begin
  insert into public.testimonial_submission_limits (fingerprint)
  values (p_fingerprint)
  on conflict (fingerprint) do update
    set window_started_at = case
          when testimonial_submission_limits.window_started_at < now() - interval '1 hour' then now()
          else testimonial_submission_limits.window_started_at
        end,
        submission_count = case
          when testimonial_submission_limits.window_started_at < now() - interval '1 hour' then 1
          else testimonial_submission_limits.submission_count + 1
        end
  returning * into current_record;

  return current_record.submission_count <= 3;
end;
$$;

revoke all on function public.check_testimonial_rate_limit(text) from public, anon, authenticated;
grant execute on function public.check_testimonial_rate_limit(text) to service_role;

-- Optional scheduled cleanup: delete rate-limit buckets older than 24 hours.
-- delete from public.testimonial_submission_limits where window_started_at < now() - interval '24 hours';
