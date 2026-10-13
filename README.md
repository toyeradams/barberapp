# ✂ Rizz Fade Barbershop — Online Booking App

A complete barber booking platform for Rizz Fade. Customers book in 4 steps and see their booking reference instantly; branded email confirmations are sent when a live provider is configured. Admins manage bookings, hairstyles, barbers, availability and analytics — plus a built-in **Deploy to Vercel** guide.

**Currency:** All service prices and revenue analytics are South African Rand (**ZAR**), formatted using the `en-ZA` locale.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

---

## Features

### Customer
1. **Pick a hairstyle** — visual service menu with price + duration
2. **Pick barber, date & time** — live availability, no double-booking, 14-day window
3. **Enter details** — name, email, phone, notes for the barber
4. **Review & confirm** — full summary before committing
5. **Email confirmation** — branded HTML email with booking reference + manage link when Resend or SMTP is configured; failed attempts are clearly logged and can be retried.

Extras: booking lookup by reference or email, self-cancel with email verification.

### Admin (`/admin`, password: `admin123` by default)
- **Overview** — revenue, today's chairs, upcoming, quick actions
- **Bookings** — filter by status/date/search, update status, delete
- **Hairstyles** — full CRUD (name, price, duration, category, image, visibility)
- **Barbers** — full CRUD with ratings + specialties
- **Availability** — weekly hours (shop-wide or per-barber) + date overrides (holidays, days off, special hours)
- **Analytics** — revenue trend, top services, barber leaderboard, peak hours, status split, cancel rate
- **Emails** — delivery log + HTML preview of every confirmation
- **Deploy** — in-app Vercel guide with copy-paste env block + DB status + one-click seed

---

## Tech stack

- **Next.js 16** (App Router) + React 19 + Tailwind CSS 4
- **PostgreSQL** via **Drizzle ORM** (works with Vercel Postgres / Neon / Supabase / local)
- **Resend or SMTP** for email (with console/demo fallback — bookings never break)
- **Recharts** for analytics, **lucide-react** icons

---

## Quick start (local)

```bash
npm install

# 1. Copy env and edit
cp .env.example .env

# 2. Make sure Postgres is running, then push the schema
npx drizzle-kit push

# 3. Run
npm run dev
```

Open http://localhost:3000 → book a chair.
Open http://localhost:3000/admin → login with `ADMIN_PASSWORD` (default `admin123`).

> Tables are also auto-created on first request (`src/db/ensure.ts`), and demo data auto-seeds on the first visit to `/book` — so a fresh clone usually "just works".

---

## Deploy to Vercel (5 minutes)

Full guide: **[DEPLOY.md](./DEPLOY.md)** — or use the in-app guide at `/admin/deploy`.

Short version:

1. **Push to GitHub**, then **Import** at [vercel.com/new](https://vercel.com/new).
2. **Add storage**: Vercel dashboard → Storage → Create → Postgres → Connect (auto-sets `DATABASE_URL`).
3. **Add env vars** (Settings → Environment Variables):
   - `DATABASE_URL` *(auto-added by step 2)*
   - `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET` (generate: `openssl rand -base64 32`)
   - `NEXT_PUBLIC_APP_URL` = your `https://…vercel.app` URL
   - `RESEND_API_KEY` + `EMAIL_FROM` *(for live emails)*
4. **Deploy.** Then `POST https://your-app.vercel.app/api/setup` once to seed the demo menu (or click *Seed demo data* in `/admin/deploy`).
5. Log in at `/admin` and set your real hours, services and barbers.

---

## Project structure

```
src/
├── app/
│   ├── page.tsx                  # Homepage
│   ├── book/page.tsx             # 4-step booking wizard
│   ├── booking/[ref]/page.tsx    # Booking details + cancel
│   ├── services/ barbers/        # Public menu + team
│   ├── admin/                    # Dashboard, bookings, hairstyles, barbers,
│   │                             # availability, analytics, emails, deploy
│   └── api/
│       ├── hairstyles/ barbers/ availability/ bookings/  # public APIs
│       ├── setup/                # DB status + seed (deploy helper)
│       └── admin/...             # protected admin APIs
├── db/
│   ├── schema.ts                 # hairstyles, barbers, availability_*, bookings, email_logs
│   ├── ensure.ts                 # CREATE TABLE IF NOT EXISTS (zero-migration deploys)
│   └── seed-data.ts              # demo menu, team, hours
├── lib/
│   ├── availability.ts           # slot engine (rules + overrides + overlap checks)
│   ├── email.ts                  # Resend → SMTP → console fallback + HTML template
│   ├── admin-auth.ts             # signed cookie sessions
│   └── time.ts                   # formatting + slot math
├── components/                   # nav, footer
vercel.json  .env.example  DEPLOY.md  drizzle.config.ts
```

## Environment variables

See [`.env.example`](./.env.example) for every variable with explanations.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npx drizzle-kit push` | Push schema to `DATABASE_URL` |
| `npx drizzle-kit studio` | Visual DB browser |

---

Built with precision. Walk-ins welcome, bookings preferred. ✂
