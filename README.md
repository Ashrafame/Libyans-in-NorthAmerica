# Libyans in North America — ليبيون في أمريكا الشمالية

A bilingual (English / العربية) community platform for Libyan families across the United States and Canada:
a verified family directory, public community news and events, a members-only suggestion box, state community
funds with transparent reports, and a fully independent administration console with role-based access and an
audit log.

Built with **Next.js 16 (App Router)**, **React 19**, **Tailwind v4 + a custom design system**, **Supabase**
(Postgres + Auth), and **Stripe**.

---

## Quick start

```bash
npm install
cp .env.example .env.local     # optional for demo mode
npm run dev
```

Open <http://localhost:3000> — the proxy redirects to `/en`. Switch language from the header (`العربية` / `English`).

### Demo mode (no keys required)

If Supabase credentials are absent, the app runs against a local JSON store in `.data/db.json`:

| Account | Email | Password |
| --- | --- | --- |
| Member (Ohio) | `ahmed.mansouri@example.com` | `Member12345!` |
| Events manager | `events@libyansna.org` | `Events12345!` |
| Observer | `viewer@libyansna.org` | `Viewer12345!` |
| Super admin | `admin@libyansna.org` | `Admin12345!` |

Verification codes and password-reset links are printed to the server console **and** shown on screen in demo
mode. Donations are recorded locally when Stripe is not configured. Delete `.data/` to reseed.

Admin console: <http://localhost:3000/admin> (its design is intentionally independent from the public site).

---

## What is implemented

### Public site
- Bilingual routing (`/en/...`, `/ar/...`) with RTL, Cairo for Arabic and Tahoma for English by default.
- Photographic hero, live statistics, latest news, event spotlight, qualification showcase, community CTA.
- Community feed filterable by topic, country, state/province, and city.
- Article pages, events page, about page.
- Configurable scrolling notice (ticker) that reverses direction for Arabic.
- Public donation flow per state fund (Stripe Checkout or demo mode).

### Membership onboarding (7 guarded steps)
1. Country → state/province → city (postal code auto-filled) + account creation with a pledge.
2. Six-digit email verification, with resend and expiry handling.
3. Personal details (English letters only).
4. Household logic for married / widowed / divorced / single, including child counts.
5. One screen per child (name, birth date, school/work, activities).
6. Professional details.
7. Household circumstances and volunteering questions (admin-extensible).
8. Completion signs the member out and returns them to the login screen, as specified.

Every step is persisted, so a member who leaves resumes exactly where they stopped. Back navigation is provided
on every step except the account and personal screens.

### Members' area
- Overview, family directory (members only), suggestion box with threaded responses, state fund with committee and
  expense reports, inbox with fund reports, editable profile.

### Administration console
- Separate dark design, never affected by public appearance settings.
- Roles: super admin, admin, content manager, events manager, donations manager, observer.
- Appearance: title, hero, colours, fonts and sizes, card/button/input radii, footer, contacts, social links,
  membership CTA, monthly cap, ticker switch, and banking details (super admin only).
- Content CRUD with bilingual fields, drafts, publishing, and a home-page feature flag.
- Events: featured card window + independent ticker window with colours and live preview; soft deletion with
  actor and timestamp recorded.
- Members, suggestion moderation, donations, fund reports (auto-delivered to the state's members' inbox),
  committees, volunteer questions, administrators, audit log.
- Every mutation and sign-in is written to `audit_logs` (visible to the super admin only).

---

## Supabase setup

1. Create a project at <https://supabase.com>.
2. Run `supabase/migrations/20260101000000_libyans_init.sql`, then `supabase/seed.sql` in the SQL editor.
3. Copy the project URL, publishable key, and **secret** key into `.env.local` (`SUPABASE_SECRET_KEY`).
4. In **Authentication → Email Templates**, use `{{ .Token }}` in the confirmation email so the six-digit code is
   sent (e.g. “Your verification code is {{ .Token }}”).
5. Set the Site URL and redirect URLs to your deployment (the password reset returns through `/auth/callback`).

In Supabase mode, members authenticate with Supabase Auth; family records are stored in `members`, linked by email.
The app performs all writes with the service role from server actions only. Row-level security still protects the
public API: anonymous visitors can read only published posts/events, and signed-in members can read only their own
family record, inbox, donations, and the members-only surfaces.

## Stripe setup

1. Add `STRIPE_SECRET_KEY`.
2. Create a webhook endpoint at `/api/stripe/webhook` for `checkout.session.completed` and set
   `STRIPE_WEBHOOK_SECRET`.
3. Test locally with `stripe listen --forward-to localhost:3000/api/stripe/webhook`.

The donation amount is validated server-side against the admin-configured monthly cap. Fulfilment happens in the
webhook, never on the success page alone.

---

## Structure

```
app/[locale]/          public site, onboarding, members' area
app/admin/(console)/   administration console (own layout and design system)
app/api/stripe/        Stripe webhook
lib/repo.ts            domain access layer over the storage adapter
lib/storage.ts         JSON (demo) and Supabase adapters
lib/actions/           server actions (join, member, admin, donation, auth)
lib/i18n.ts            English/Arabic dictionaries
lib/geo/               states, provinces, and major cities with postal codes
supabase/              schema, RLS policies, and seed data
```

The console is intentionally English-only in this version so that operational language never depends on the
public site's locale; the dictionary already contains Arabic administrator strings for a future toggle.

## Notes

- City lists cover the most populated metro areas per state/province. Extend `lib/geo/data.ts` as needed.
- `AUTH_SECRET` must be set in production; the fallback value is development-only.
- Demo data lives in `.data/` and is git-ignored.
