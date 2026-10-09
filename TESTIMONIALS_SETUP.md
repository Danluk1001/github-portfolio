# Testimonials system setup

The portfolio reads approved testimonials from Supabase on both `index.html` and `testimonials.html`. New submissions go through a Supabase Edge Function that validates input, verifies Cloudflare Turnstile, applies a three-submissions-per-hour rate limit, and inserts each record with `status = 'pending'`.

No email address is requested or stored. The browser receives only the Supabase URL, anon key, and Turnstile site key. Never place a Supabase service-role key or Turnstile secret in frontend files.

## 1. Create the database

1. Create or open a Supabase project.
2. Open **SQL Editor**.
3. Run [`supabase/testimonials.sql`](supabase/testimonials.sql).
4. In **Table Editor → testimonials**, confirm Row Level Security is enabled.

The SQL permits `anon` and `authenticated` users to select only rows where `status = 'approved'` and consent is true. Browser users have no insert, update, or delete permission.

## 2. Configure Cloudflare Turnstile

1. Create a Turnstile widget for the production portfolio hostname.
2. Add `localhost` while testing locally.
3. Save the site key for the frontend and the secret key for the Edge Function.

## 3. Deploy the protected submission function

Install and authenticate the Supabase CLI, link the project, and deploy:

```powershell
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy submit-testimonial
```

Set function secrets. Use a long random value for `RATE_LIMIT_SALT`. List every allowed origin as a comma-separated value without trailing slashes:

```powershell
supabase secrets set TURNSTILE_SECRET_KEY="YOUR_TURNSTILE_SECRET"
supabase secrets set RATE_LIMIT_SALT="A_LONG_RANDOM_SECRET"
supabase secrets set ALLOWED_ORIGINS="https://your-domain.example,http://localhost:4173"
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided automatically in hosted Supabase Edge Functions. The service-role key remains server-side.

## 4. Add public browser configuration

Edit [`testimonials-config.js`](testimonials-config.js):

```js
export const testimonialsConfig = Object.freeze({
  supabaseUrl: "https://YOUR_PROJECT.supabase.co",
  supabaseAnonKey: "YOUR_PUBLIC_ANON_KEY",
  turnstileSiteKey: "YOUR_PUBLIC_TURNSTILE_SITE_KEY"
});
```

The anon key is designed for browser use and is constrained by Row Level Security. Do not substitute the service-role key.

## 5. Moderate submissions

The initial admin workflow uses the authenticated Supabase Dashboard, so no administrative credentials or privileged controls are shipped to the portfolio.

1. Open **Supabase Dashboard → Table Editor → testimonials**.
2. Filter `status` to `pending`.
3. Review the text, consent, rating, name, organization, optional job title, and optional LinkedIn URL.
4. To publish, change `status` to `approved`. The database trigger sets `approved_at` automatically, and the testimonial appears on the site on the next page load.
5. To reject without publishing, change `status` to `rejected`.
6. To remove a previously approved testimonial, change `status` to `removed`. It disappears from public queries immediately.

Do not delete a submission unless permanent erasure is intended. Status changes preserve a moderation record.

## 6. Test locally

Start a static server from the repository root:

```powershell
python -m http.server 4173
```

Then test:

1. Open `http://localhost:4173/testimonials.html`.
2. Confirm the grid is three columns at large desktop widths, two columns at tablet widths, and one column on mobile.
3. Confirm only approved rows appear on the dedicated page.
4. Confirm the homepage loads at most the latest three approved rows.
5. Submit valid feedback and verify it appears in Supabase as `pending`, not publicly.
6. Try an invalid LinkedIn URL, fewer than 30 testimonial characters, no consent, and no rating; each should be rejected.
7. Approve the test record in the dashboard and refresh both pages.
8. Change it to `removed` and confirm it disappears.
9. Submit more than three times within an hour from the same browser/network and confirm the function returns a rate-limit response.
10. Check keyboard focus, star-rating selection, form errors, and status announcements.

## Deployment checklist

- Add the production origin to `ALLOWED_ORIGINS` and the Turnstile widget.
- Keep RLS enabled.
- Confirm there are no service-role or Turnstile secret values in Git.
- Serve the site over HTTPS.
- Review pending submissions regularly in the Supabase Dashboard.
