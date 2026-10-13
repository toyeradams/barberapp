import Link from "next/link";
import {
  Scissors,
  Star,
  CalendarCheck,
  Clock,
  MailCheck,
  BadgeCheck,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export const dynamic = "force-dynamic";

const HERO_IMG =
  "https://images.pexels.com/photos/7195814/pexels-photo-7195814.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200";
const CUT_IMG =
  "https://images.pexels.com/photos/4625626/pexels-photo-4625626.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";

async function getData() {
  try {
    const base = process.env.NEXT_PUBLIC_APP_URL || "";
    // During build/prerender there may be no base — fall back to direct DB via API-less import
    if (!base) return { styles: [], barbers: [] };
    const [s, b] = await Promise.all([
      fetch(`${base}/api/hairstyles`, { cache: "no-store" }).then((r) => r.json()).catch(() => ({ hairstyles: [] })),
      fetch(`${base}/api/barbers`, { cache: "no-store" }).then((r) => r.json()).catch(() => ({ barbers: [] })),
    ]);
    return { styles: s.hairstyles ?? [], barbers: b.barbers ?? [] };
  } catch {
    return { styles: [], barbers: [] };
  }
}

export default async function HomePage() {
  const { styles, barbers } = await getData();

  return (
    <main>
      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${HERO_IMG})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0b0b0d] via-[#0b0b0d]/92 to-[#0b0b0d]/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0d] via-transparent to-[#0b0b0d]/60" />

        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 md:py-36">
          <div className="max-w-2xl">
            <div className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-[#c9a86a]/40 bg-[#c9a86a]/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#e8cf9a]">
              <Sparkles className="h-3.5 w-3.5" /> Rated 4.9 · 2,400+ reviews
            </div>
            <h1 className="font-display animate-fade-up stagger-1 mt-6 text-5xl font-extrabold leading-[1.02] md:text-7xl">
              Look Sharp.
              <br />
              <span className="text-gold-gradient italic">Feel Sharper.</span>
            </h1>
            <p className="animate-fade-up stagger-2 mt-6 max-w-xl text-lg leading-relaxed text-[#d8d8de]">
              Precision fades, beard architecture and hot-towel shaves from master
              barbers. Book your chair online in under a minute — get your booking
              reference instantly, with email confirmation when delivery is configured.
            </p>
            <div className="animate-fade-up stagger-3 mt-8 flex flex-wrap gap-3">
              <Link
                href="/book"
                className="group inline-flex items-center gap-2 rounded-full bg-[#c9a86a] px-8 py-4 text-base font-bold text-[#0b0b0d] transition hover:bg-[#e8cf9a] hover:shadow-[0_0_40px_rgba(201,168,106,0.45)]"
              >
                <CalendarCheck className="h-5 w-5" />
                Book Appointment
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/services"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 px-8 py-4 text-base font-semibold text-white transition hover:border-[#c9a86a] hover:text-[#e8cf9a]"
              >
                <Scissors className="h-5 w-5" /> View Services
              </Link>
            </div>
            <div className="animate-fade-up stagger-4 mt-10 flex flex-wrap items-center gap-6 text-sm text-[#a7a7b0]">
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#c9a86a]" /> Open today 9:00 – 19:00
              </span>
              <span className="flex items-center gap-2">
                <MailCheck className="h-4 w-4 text-[#c9a86a]" /> Booking reference instantly
              </span>
              <span className="flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 text-[#c9a86a]" /> Free cancellation
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── MARQUEE ──────────────────────────────────────── */}
      <div className="overflow-hidden border-y border-[#c9a86a]/20 bg-[#100f0c] py-3">
        <div className="animate-marquee flex w-max gap-10 whitespace-nowrap text-sm font-bold uppercase tracking-[0.25em] text-[#c9a86a]">
          {Array.from({ length: 2 }).flatMap((_, k) =>
            ["Skin Fades", "Hot Towel Shaves", "Beard Sculpt", "Classic Cuts", "Kids Cuts", "The Full Works"].map(
              (s, i) => (
                <span key={`${k}-${i}`} className="flex items-center gap-10">
                  {s} <Scissors className="h-4 w-4 opacity-60" />
                </span>
              )
            )
          )}
        </div>
      </div>

      {/* ── HOW IT WORKS ─────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <p className="text-center text-xs font-bold uppercase tracking-[0.3em] text-[#c9a86a]">
          Effortless booking
        </p>
        <h2 className="font-display mt-3 text-center text-4xl font-bold md:text-5xl">
          Booked in <span className="text-gold-gradient italic">4 steps</span>
        </h2>
        <div className="mt-12 grid gap-5 md:grid-cols-4">
          {[
            { n: "01", t: "Pick your style", d: "Choose from 6 signature services with transparent pricing.", icon: Scissors },
            { n: "02", t: "Choose date & time", d: "Live availability — only real open slots, no double-booking.", icon: CalendarCheck },
            { n: "03", t: "Confirm details", d: "Review barber, time and price before you commit.", icon: BadgeCheck },
            { n: "04", t: "Get confirmed", d: "Your reference appears instantly; an email follows when a delivery provider is configured.", icon: MailCheck },
          ].map((s) => (
            <div
              key={s.n}
              className="card-sheen rounded-2xl border border-white/10 bg-[#131316] p-6 transition hover:border-[#c9a86a]/50"
            >
              <div className="flex items-center justify-between">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#c9a86a]/12 text-[#c9a86a]">
                  <s.icon className="h-5 w-5" />
                </span>
                <span className="font-display text-3xl font-bold text-white/10">{s.n}</span>
              </div>
              <h3 className="mt-4 text-lg font-bold">{s.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#a7a7b0]">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── SERVICES PREVIEW ─────────────────────────────── */}
      <section className="border-y border-white/5 bg-[#0e0e11]">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#c9a86a]">Menu</p>
              <h2 className="font-display mt-3 text-4xl font-bold md:text-5xl">
                Signature <span className="text-gold-gradient italic">services</span>
              </h2>
            </div>
            <Link href="/services" className="group inline-flex items-center gap-2 text-sm font-bold text-[#e8cf9a]">
              See full menu <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {(styles.length ? styles.slice(0, 6) : FALLBACK_STYLES).map((s: any, i: number) => (
              <Link
                key={s.id ?? i}
                href="/book"
                className="card-sheen group overflow-hidden rounded-2xl border border-white/10 bg-[#131316] transition hover:border-[#c9a86a]/50"
              >
                <div className="relative h-44 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={s.imageUrl || CUT_IMG}
                    alt={s.name}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#131316] to-transparent" />
                  <span className="absolute left-4 top-4 rounded-full bg-black/60 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-[#e8cf9a] backdrop-blur">
                    {s.category}
                  </span>
                  <span className="absolute bottom-3 right-4 rounded-full bg-[#c9a86a] px-3 py-1 text-sm font-extrabold text-[#0b0b0d]">
                    ${((s.priceCents ?? 0) / 100).toFixed(0)}
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold group-hover:text-[#e8cf9a]">{s.name}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-[#a7a7b0]">{s.description}</p>
                  <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-[#c9a86a]">
                    <Clock className="h-3.5 w-3.5" /> {s.durationMinutes} min · Book now →
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── BARBERS PREVIEW ──────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <p className="text-center text-xs font-bold uppercase tracking-[0.3em] text-[#c9a86a]">The team</p>
        <h2 className="font-display mt-3 text-center text-4xl font-bold md:text-5xl">
          Master <span className="text-gold-gradient italic">barbers</span>
        </h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {(barbers.length ? barbers : FALLBACK_BARBERS).map((b: any, i: number) => (
            <div key={b.id ?? i} className="rounded-2xl border border-white/10 bg-[#131316] p-6 text-center transition hover:border-[#c9a86a]/50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={b.avatarUrl || CUT_IMG}
                alt={b.name}
                className="mx-auto h-28 w-28 rounded-full border-2 border-[#c9a86a]/60 object-cover"
              />
              <h3 className="mt-4 text-lg font-bold">{b.name}</h3>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#c9a86a]">{b.title}</p>
              <p className="mt-3 flex items-center justify-center gap-1 text-sm text-[#e8cf9a]">
                <Star className="h-4 w-4 fill-[#c9a86a] text-[#c9a86a]" /> {b.rating ?? "5.0"}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link
            href="/book"
            className="inline-flex items-center gap-2 rounded-full bg-[#c9a86a] px-8 py-4 text-base font-bold text-[#0b0b0d] transition hover:bg-[#e8cf9a]"
          >
            <CalendarCheck className="h-5 w-5" /> Claim Your Chair
          </Link>
        </div>
      </section>

      {/* ── REVIEWS ──────────────────────────────────────── */}
      <section className="border-t border-white/5 bg-[#0e0e11]">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <h2 className="font-display text-center text-4xl font-bold">
            Fresh cuts. <span className="text-gold-gradient italic">Fresh reviews.</span>
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              { n: "James W.", t: "Best fade I've had in years. Booked at 9pm, confirmed instantly, in the chair next day. Marcus is a surgeon with clippers.", s: "Signature Skin Fade" },
              { n: "Andre B.", t: "The Full Works is worth every penny. Hot towel, charcoal mask, left feeling like a new man. Email confirmation was a nice touch.", s: "The Full Works" },
              { n: "Chris P.", t: "Took my 8-year-old for his first proper cut. Patient, fast, zero tears. We're customers for life now.", s: "Kids Cut" },
            ].map((r) => (
              <figure key={r.n} className="rounded-2xl border border-white/10 bg-[#131316] p-6">
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-[#c9a86a] text-[#c9a86a]" />
                  ))}
                </div>
                <blockquote className="mt-4 text-sm leading-relaxed text-[#d8d8de]">“{r.t}”</blockquote>
                <figcaption className="mt-4 text-sm font-bold">
                  {r.n} <span className="ml-2 text-xs font-medium text-[#a7a7b0]">· {r.s}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

const FALLBACK_STYLES = [
  { name: "Signature Skin Fade", description: "Precision fade with razor detail and hot towel finish.", priceCents: 3500, durationMinutes: 45, category: "Fade", imageUrl: CUT_IMG },
  { name: "Classic Scissor Cut", description: "Timeless scissor work, wash and style.", priceCents: 3000, durationMinutes: 30, category: "Haircut", imageUrl: CUT_IMG },
  { name: "Beard Sculpt + Line-Up", description: "Razor-sharp line-up and beard shaping.", priceCents: 2500, durationMinutes: 30, category: "Beard", imageUrl: CUT_IMG },
];

const FALLBACK_BARBERS = [
  { name: "Marcus Cole", title: "Master Barber", rating: "4.98", avatarUrl: CUT_IMG },
  { name: "Diego Ramirez", title: "Senior Barber", rating: "4.94", avatarUrl: CUT_IMG },
  { name: "Jay Okafor", title: "Fade Specialist", rating: "4.91", avatarUrl: CUT_IMG },
];
