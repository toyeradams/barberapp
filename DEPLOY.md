# 🚀 Deploy Rizz Fade Barbershop to Vercel

This project is packaged for zero-friction Vercel deployment:
- ✅ `vercel.json` pre-configured (Next.js framework, build command)
- ✅ Database **auto-migrates** on first request — no manual SQL needed
- ✅ Works with Vercel Postgres, Neon, Supabase, or any Postgres with `?sslmode=require`
- ✅ Email works with **Resend** (recommended) or any **SMTP** provider, with safe demo fallback
- ✅ In-app guide at `/admin/deploy` (DB status, one-click seed, copy-paste env block)

---

## Option A — Vercel Dashboard (recommended, ~5 min)

### 1. Push the code to GitHub
```bash
git init
git add .
git commit -m "Rizz Fade barbershop"
git branch -M main
git remote add origin https://github.com/YOU/rizz-fade.git
git push -u origin main
```

### 2. Import into Vercel
1. Go to [vercel.com/new](https://vercel.com/new) → **Import** your repo.
2. Framework is auto-detected as **Next.js** (see `vercel.json`). Keep defaults.
3. **Don't deploy yet** — first add Storage + Env vars below (you can also add them after and redeploy).

### 3. Create the database
1. Vercel dashboard → your project → **Storage** → **Create** → **Postgres**.
2. Choose a name/region → **Create & Connect** to this project.
3. Vercel automatically adds `DATABASE_URL` (and related) env vars.

> Using **Neon** directly? Create a project at [neon.tech](https://neon.tech), copy the pooled connection string (it ends with `?sslmode=require`), and add it manually as `DATABASE_URL`.

### 4. Add environment variables
Project → **Settings** → **Environment Variables**. Add for **Production** (and Preview if you like):

| Key | Value | Required |
|---|---|---|
| `DATABASE_URL` | auto-added by Storage step | ✅ |
| `ADMIN_PASSWORD` | e.g. `MyShop-2026-Secure!` | ✅ |
| `ADMIN_SESSION_SECRET` | generate: `openssl rand -base64 32` | ✅ |
| `NEXT_PUBLIC_APP_URL` | `https://YOUR-PROJECT.vercel.app` (update after first deploy if needed) | ✅ |
| `SHOP_NAME` | `Rizz Fade Barbershop` | optional |
| `RESEND_API_KEY` | `re_…` from [resend.com](https://resend.com) | for live email |
| `EMAIL_FROM` | `Rizz Fade <bookings@yourdomain.com>` | for live email |

Or paste from `.env.example` / the `/admin/deploy` page.

### 5. Deploy
Hit **Deploy**. Vercel builds (`next build`) and gives you a URL like `https://rizz-fade-xyz.vercel.app`.

### 6. Seed the demo data (one click)
Option 1 — in-app (easiest):
1. Visit `https://YOUR-APP.vercel.app/admin` → log in with `ADMIN_PASSWORD`.
2. Open **Deploy** → click **Seed demo data**.

Option 2 — API:
```bash
curl -X POST https://YOUR-APP.vercel.app/api/setup
# verify:
curl https://YOUR-APP.vercel.app/api/setup
```

You should see `6 hairstyles · 3 barbers · 6 hour-rules`.

### 7. Go live checklist
- [ ] Update `NEXT_PUBLIC_APP_URL` to the real Vercel URL (then **Redeploy**).
- [ ] `/admin` → **Availability**: set your real weekly hours.
- [ ] `/admin` → **Hairstyles / Barbers**: replace demo entries with yours.
- [ ] Test a booking end-to-end at `/book` (check inbox + `/admin/emails`).
- [ ] (Optional) Add a custom domain: Settings → Domains.

---

## Option B — Vercel CLI (~3 min)

```bash
npm i -g vercel
vercel login
vercel              # link + preview deploy (creates DATABASE_URL prompt if storage linked)
vercel env add ADMIN_PASSWORD production
vercel env add ADMIN_SESSION_SECRET production
vercel env add NEXT_PUBLIC_APP_URL production
vercel env add RESEND_API_KEY production
vercel --prod       # production deploy
curl -X POST https://YOUR-APP.vercel.app/api/setup
```

---

## Email setup (live confirmations)

### Resend (recommended)
1. Sign up at [resend.com](https://resend.com) (free tier: 100 emails/day).
2. **API Keys** → Create → copy `re_…` → set as `RESEND_API_KEY`.
3. **Domains** → Add your domain + DNS records → set `EMAIL_FROM` to an address on it.
   - *Testing only?* You can use `onboarding@resend.dev` as `EMAIL_FROM`, but it only sends to your Resend account email.
4. Redeploy. Book a test appointment → check inbox + `/admin/emails` (provider should say `resend`).

### Any SMTP provider (Gmail example)
1. Gmail → Google Account → Security → **2-Step Verification** → **App passwords** → create one.
2. Set env vars: `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`, `SMTP_USER=you@gmail.com`, `SMTP_PASS=<16-char app password>`, `EMAIL_FROM="Rizz Fade <you@gmail.com>"`.
3. Redeploy and test.

### Demo mode (no email config)
Bookings still succeed. Every email is:
- logged to the Vercel function logs, and
- stored + previewable in `/admin` → **Emails**.

---

## How the database auto-migration works

`src/db/ensure.ts` runs `CREATE TABLE IF NOT EXISTS …` for all six tables on the first API request (health check included). That means:

- Fresh Vercel Postgres works with **zero manual steps**.
- Re-running is safe (idempotent).
- For local schema iteration you can still use `npx drizzle-kit push` / `npx drizzle-kit studio`.

## Troubleshooting

| Symptom | Fix |
|---|---|
| Build fails: `DATABASE_URL is required` | Add `DATABASE_URL` in Settings → Env Vars, then redeploy. (The app tolerates a missing DB at build time, but runtime needs it.) |
| `/admin` says unauthorized / loops to login | `ADMIN_SESSION_SECRET` differs between deploys, or cookies blocked. Re-login; ensure the secret is set in Production. |
| Booking page shows "No services" | Hit `POST /api/setup` once (or Deploy tab → Seed). Then refresh. |
| No email arrives | Check `/admin/emails` for provider + error. Add both `RESEND_API_KEY` and `EMAIL_FROM` (sender domain verified in Resend), or configure SMTP. Redeploy, then resend from the booking details page. Check spam. |
| Slots show "Closed" every day | `/admin` → Availability → save weekly hours for the shop scope. |
| SSL / connection errors to Postgres | Ensure the connection string includes `?sslmode=require` (Neon/Vercel do by default). The pool also enables SSL automatically on Vercel. |

---

## Cost estimate (hobby scale)

- Vercel Hobby: free tier · Vercel Postgres: free tier included · Resend: free tier (100/day) · Neon: free tier available.

Total to run: free to start. ✂
