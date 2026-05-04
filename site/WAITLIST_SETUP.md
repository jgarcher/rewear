# Waitlist setup — making the form actually send emails

The form on the marketing site at `/site` writes signups to Supabase **and**
sends two emails on every successful submit:

1. A notification to JG (`WAITLIST_NOTIFY_EMAIL`)
2. A confirmation to the person who signed up

Until you do the steps below, the **database write works** (signups land in
the `waitlist_signups` table) but the **emails will silently no-op**.

---

## 1. Run the database migration

Already in this repo at:

```
app/supabase/migrations/0010_waitlist_signups.sql
```

Paste it into the Supabase SQL editor:
https://supabase.com/dashboard/project/dsegzkolqoosxphqxapt/sql/new

Creates the `waitlist_signups` table + the SECURITY DEFINER `join_waitlist`
RPC granted to anon. You can read submissions any time via the dashboard:
**Table editor → waitlist_signups**.

---

## 2. Get a Resend API key

[Resend](https://resend.com) is the email provider. Free tier covers 3,000
emails/month and 100/day — way more than you need.

1. Sign up at https://resend.com
2. Go to **API Keys** → **Create API Key** → name it "ReWear site"
3. Copy the key (starts with `re_`)

---

## 3. (Optional but recommended) Verify a sending domain

Until you verify a domain, emails go from `onboarding@resend.dev` which works
fine but lands in spam more often.

To use `hello@rewear.app` as the From address:

1. In Resend dashboard → **Domains** → **Add Domain** → `rewear.app`
2. Resend gives you DNS records to add (TXT, MX, DKIM)
3. Add them in your domain provider's DNS panel
4. Click **Verify** in Resend (takes a few minutes)

Once verified, set `WAITLIST_FROM_EMAIL=ReWear <hello@rewear.app>` in your
Vercel env vars.

---

## 4. Set the env vars on Vercel

The marketing site (`site`) is a separate Vercel project from the app. Open
the **site** project's settings and add these:

| Name | Value | Environments |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://dsegzkolqoosxphqxapt.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (anon key from Supabase project settings) | Production, Preview, Development |
| `RESEND_API_KEY` | (from step 2) | Production, Preview |
| `WAITLIST_NOTIFY_EMAIL` | `johngarcher@gmail.com` | Production, Preview |
| `WAITLIST_FROM_EMAIL` | `ReWear <onboarding@resend.dev>` (or your verified address) | Production, Preview |
| `NEXT_PUBLIC_APP_URL` | `https://rewear-app-one.vercel.app` (or app.rewear.app once set) | Production, Preview, Development |

Then **Redeploy** the site project (Settings → Deployments → ⋯ → Redeploy)
so the new env vars take effect.

---

## 5. Test it

1. Visit the deployed site
2. Enter your email in the waitlist form
3. Tap **Join the waitlist**
4. You should:
   - See "You're on the list. We'll be in touch." in the form
   - Get a notification email at `johngarcher@gmail.com` titled
     "New ReWear waitlist signup: ..."
   - Get a confirmation email at the address you submitted
5. Check the Supabase **waitlist_signups** table — your row should be there

If the form says success but no email arrives, check:
- Resend dashboard → **Logs** for delivery errors
- Vercel project → **Functions** → look at the server-action log
- Spam folder

---

## What's already idiot-proofed

- **Idempotent inserts:** re-submitting the same email is silent success
  (no duplicate rows, no duplicate emails sent — actually the email sends
  every time, so it's mildly chatty; if that becomes annoying we can guard)
- **No email sent if `RESEND_API_KEY` is missing** — the database write
  still works, the form still says success, the user is still added to the
  list. You just don't get notified until you wire up Resend.
- **Bad email format:** form rejects client-side and the RPC rejects again
  server-side. Both surfaces show a friendly error.
- **RLS:** nobody can read or write `waitlist_signups` directly. Only the
  RPC, which is granted to anon. Inserts are atomic.
