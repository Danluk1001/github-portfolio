import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const allowedRelationships = new Set(["Client", "Coworker", "Nonprofit Partner", "Collaborator", "Other"]);
const encoder = new TextEncoder();

function corsHeaders(origin: string | null) {
  const allowedOrigins = (Deno.env.get("ALLOWED_ORIGINS") || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const allowedOrigin = origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0] || "";
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin"
  };
}

function jsonResponse(body: Record<string, unknown>, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json", "Cache-Control": "no-store" }
  });
}

function cleanString(value: unknown, maximum: number) {
  return typeof value === "string" ? value.trim().slice(0, maximum + 1) : "";
}

function validLinkedInUrl(value: string | null) {
  if (!value) return true;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    return url.protocol === "https:" && (host === "linkedin.com" || host.endsWith(".linkedin.com"));
  } catch {
    return false;
  }
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (request) => {
  const origin = request.headers.get("origin");
  const headers = corsHeaders(origin);
  const allowedOrigins = (Deno.env.get("ALLOWED_ORIGINS") || "").split(",").map((value) => value.trim()).filter(Boolean);

  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405, headers);
  if (!origin || !allowedOrigins.includes(origin)) return jsonResponse({ error: "Origin not allowed" }, 403, headers);

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 12_000) return jsonResponse({ error: "Request too large" }, 413, headers);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid request" }, 400, headers);
  }

  // Honeypot and minimum-completion-time checks reject common automated submissions.
  if (cleanString(body.website, 200)) return jsonResponse({ ok: true }, 202, headers);
  const startedAt = Number(body.form_started_at);
  const elapsed = Date.now() - startedAt;
  if (!Number.isFinite(startedAt) || elapsed < 3000 || elapsed > 3_600_000) {
    return jsonResponse({ error: "Invalid form session" }, 400, headers);
  }

  const name = cleanString(body.name, 80);
  const organization = cleanString(body.organization, 120);
  const jobTitle = cleanString(body.job_title, 100) || null;
  const relationship = cleanString(body.relationship, 40);
  const testimonial = cleanString(body.testimonial, 1500);
  const linkedinUrl = cleanString(body.linkedin_url, 300) || null;
  const rating = Number(body.rating);
  const consentGiven = body.consent_given === true;

  if (
    name.length < 2 || organization.length < 2 ||
    !allowedRelationships.has(relationship) || !Number.isInteger(rating) || rating < 1 || rating > 5 ||
    testimonial.length < 30 || !validLinkedInUrl(linkedinUrl) || !consentGiven
  ) {
    return jsonResponse({ error: "Please review the submitted fields" }, 422, headers);
  }

  const turnstileSecret = Deno.env.get("TURNSTILE_SECRET_KEY");
  const turnstileToken = cleanString(body.turnstile_token, 2048);
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!turnstileSecret || !turnstileToken) return jsonResponse({ error: "Bot protection is unavailable" }, 503, headers);

  const verificationBody = new FormData();
  verificationBody.set("secret", turnstileSecret);
  verificationBody.set("response", turnstileToken);
  if (forwardedFor !== "unknown") verificationBody.set("remoteip", forwardedFor);
  const verificationResponse = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: verificationBody
  });
  const verification = await verificationResponse.json();
  if (!verification.success) return jsonResponse({ error: "Bot-protection check failed" }, 403, headers);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const rateLimitSalt = Deno.env.get("RATE_LIMIT_SALT");
  if (!supabaseUrl || !serviceRoleKey || !rateLimitSalt) return jsonResponse({ error: "Server configuration error" }, 500, headers);

  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
  const userAgent = request.headers.get("user-agent") || "unknown";
  const fingerprint = await sha256(`${rateLimitSalt}:${forwardedFor}:${userAgent}`);
  const { data: allowed, error: rateLimitError } = await supabase.rpc("check_testimonial_rate_limit", { p_fingerprint: fingerprint });
  if (rateLimitError) return jsonResponse({ error: "Server configuration error" }, 500, headers);
  if (!allowed) return jsonResponse({ error: "Rate limit exceeded" }, 429, headers);

  const { error } = await supabase.from("testimonials").insert({
    name,
    organization,
    job_title: jobTitle,
    relationship,
    rating,
    testimonial,
    linkedin_url: linkedinUrl,
    consent_given: true,
    status: "pending"
  });

  if (error) return jsonResponse({ error: "Submission could not be saved" }, 500, headers);
  return jsonResponse({ ok: true, message: "Submitted for review" }, 201, headers);
});
