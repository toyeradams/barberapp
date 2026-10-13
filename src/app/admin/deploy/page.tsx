"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Copy, Loader2, Rocket, Database, Mail, KeyRound, RefreshCw } from "lucide-react";

const ENVS = [
  { k: "DATABASE_URL", v: "postgresql://user:pass@host:5432/db?sslmode=require", desc: "Vercel Postgres / Neon connection string. Auto-added if you create storage in Vercel.", required: true },
  { k: "ADMIN_PASSWORD", v: "your-strong-password", desc: "Password for /admin login.", required: true },
  { k: "ADMIN_SESSION_SECRET", v: "a-long-random-string-min-32-chars", desc: "Signs admin sessions. Generate: openssl rand -base64 32", required: true },
  { k: "NEXT_PUBLIC_APP_URL", v: "https://your-shop.vercel.app", desc: "Public URL — used in emails and links.", required: true },
  { k: "SHOP_NAME", v: "SharpFade Barbershop", desc: "Shown in emails and pages.", required: false },
  { k: "RESEND_API_KEY", v: "re_xxxxxxxxxx", desc: "Easiest email option (free tier at resend.com). Live confirmations.", required: false },
  { k: "EMAIL_FROM", v: "SharpFade <bookings@yourdomain.com>", desc: "From address for confirmations.", required: false },
  { k: "SMTP_HOST", v: "smtp.gmail.com", desc: "Alternative to Resend: any SMTP host.", required: false },
  { k: "SMTP_PORT", v: "587", desc: "SMTP port (587 or 465).", required: false },
  { k: "SMTP_USER", v: "you@gmail.com", desc: "SMTP username.", required: false },
  { k: "SMTP_PASS", v: "app-password", desc: "SMTP password / app password.", required: false },
];

export default function DeployPage() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  async function check() {
    setLoading(true);
    try {
      const res = await fetch("/api/setup").then((r) => r.json());
      setStatus(res);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { check(); }, []);

  async function seed(force: boolean) {
    setSeeding(true);
    try {
      await fetch(`/api/setup${force ? "?force=1" : ""}`, { method: "POST" });
      await check();
    } finally {
      setSeeding(false);
    }
  }

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  }

  const envBlock = ENVS.map((e) => `${e.k}=${e.v}`).join("\n");

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display flex items-center gap-3 text-3xl font-bold">
        <Rocket className="h-8 w-8 text-[#c9a86a]" /> Deploy to Vercel
      </h1>
      <p className="mt-1 text-sm text-[#a7a7b0]">
        Everything is packaged — database auto-migrates on first request. Just connect, add env vars, deploy.
      </p>

      {/* Status */}
      <div className="mt-6 rounded-2xl border border-white/10 bg-[#131316] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-bold"><Database className="h-4 w-4 text-[#c9a86a]" /> Database status</h2>
          <button onClick={check} className="flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-1.5 text-xs font-bold hover:border-white/40">
            <RefreshCw className="h-3.5 w-3.5" /> Recheck
          </button>
        </div>
        {loading ? (
          <p className="mt-3 flex items-center gap-2 text-sm text-[#a7a7b0]"><Loader2 className="h-4 w-4 animate-spin" /> Checking…</p>
        ) : status?.ok ? (
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1.5 font-bold text-emerald-300">
              <CheckCircle2 className="h-4 w-4" /> Connected & migrated
            </span>
            <span className="text-[#a7a7b0]">
              {status.counts.hairstyles} hairstyles · {status.counts.barbers} barbers · {status.counts.rules} hour-rules
            </span>
            <button
              onClick={() => seed(false)}
              disabled={seeding}
              className="rounded-full border border-[#c9a86a]/50 px-4 py-1.5 text-xs font-bold text-[#e8cf9a] hover:bg-[#c9a86a]/10 disabled:opacity-60"
            >
              {seeding ? "Seeding…" : status.seeded ? "Top-up demo data" : "Seed demo data"}
            </button>
          </div>
        ) : (
          <p className="mt-3 text-sm text-red-300">Connection failed: {status?.error}</p>
        )}
      </div>

      {/* Steps */}
      <div className="mt-4 grid gap-4">
        {[
          { n: "1", t: "Push this project to GitHub", d: "git init → commit → push to a new GitHub repo. Or use the Vercel CLI: `vercel` from this folder. The included vercel.json already sets the framework and build command." },
          { n: "2", t: "Create the database", d: "In Vercel: Storage → Create → Postgres (or Neon). Connect it to your project — Vercel auto-adds DATABASE_URL. No manual migrations: tables are created automatically on first request (see src/db/ensure.ts)." },
          { n: "3", t: "Add environment variables", d: "Project → Settings → Environment Variables. Paste the block below (edit values first). Required: DATABASE_URL, ADMIN_PASSWORD, ADMIN_SESSION_SECRET, NEXT_PUBLIC_APP_URL." },
          { n: "4", t: "Deploy & seed", d: "Hit Deploy. Then visit https://your-app.vercel.app/api/setup (GET) to verify, and POST once to seed the demo menu — or click “Seed demo data” above after deploying. Log in at /admin with your ADMIN_PASSWORD." },
          { n: "5", t: "Enable live emails", d: "Get a free key at resend.com → add RESEND_API_KEY + EMAIL_FROM (verify your domain or use onboarding@resend.dev for tests). Redeploy. Every booking then sends a branded HTML confirmation. Without it, demo mode logs emails to the Emails tab." },
        ].map((s) => (
          <div key={s.n} className="flex gap-4 rounded-2xl border border-white/10 bg-[#131316] p-5">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#c9a86a] text-base font-extrabold text-[#0b0b0d]">{s.n}</span>
            <div>
              <h3 className="font-bold">{s.t}</h3>
              <p className="mt-1 text-sm leading-relaxed text-[#a7a7b0]">{s.d}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Env block */}
      <div className="mt-4 rounded-2xl border border-white/10 bg-[#131316] p-5">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-bold"><KeyRound className="h-4 w-4 text-[#c9a86a]" /> Copy-paste .env block</h2>
          <button onClick={() => copy(envBlock, "all")} className="flex items-center gap-1.5 rounded-full bg-[#c9a86a] px-4 py-2 text-xs font-extrabold text-[#0b0b0d] hover:bg-[#e8cf9a]">
            {copied === "all" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copied === "all" ? "Copied!" : "Copy all"}
          </button>
        </div>
        <pre className="mt-3 overflow-x-auto rounded-xl bg-black/50 p-4 font-mono text-xs leading-relaxed text-[#d8d8de]">{envBlock}</pre>
        <div className="mt-4 space-y-2">
          {ENVS.map((e) => (
            <div key={e.k} className="flex items-start gap-2 rounded-xl bg-black/30 p-3 text-xs">
              <button onClick={() => copy(`${e.k}=${e.v}`, e.k)} className="mt-0.5 rounded p-1 hover:bg-white/10" title="Copy">
                {copied === e.k ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" /> : <Copy className="h-3.5 w-3.5 text-[#a7a7b0]" />}
              </button>
              <div>
                <code className="font-mono font-bold text-[#e8cf9a]">{e.k}</code>
                {e.required && <span className="ml-2 rounded bg-red-500/20 px-1.5 py-0.5 text-[10px] font-bold text-red-200">required</span>}
                <p className="mt-0.5 text-[#a7a7b0]">{e.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Deploy button */}
      <div className="mt-4 rounded-2xl border border-[#c9a86a]/30 bg-gradient-to-br from-[#c9a86a]/15 to-transparent p-6 text-center">
        <Mail className="mx-auto h-6 w-6 text-[#c9a86a]" />
        <h3 className="mt-2 font-bold">One-click deploy</h3>
        <p className="mx-auto mt-1 max-w-md text-sm text-[#a7a7b0]">
          Push to GitHub, then import the repo at vercel.com/new. Full written guide ships in README.md + DEPLOY.md in the project root.
        </p>
        <a
          href="https://vercel.com/new"
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-block rounded-full bg-white px-6 py-3 text-sm font-extrabold text-black transition hover:bg-[#e8cf9a]"
        >
          ▲ Deploy to Vercel
        </a>
      </div>
    </div>
  );
}
