"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Scissors,
  CalendarDays,
  Clock,
  User,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Loader2,
  MailCheck,
  Star,
  BadgeCheck,
  PartyPopper,
} from "lucide-react";
import { formatPrice, formatTime12, formatDateLong, todayISO, DAYS } from "@/lib/time";

type Hairstyle = {
  id: number; name: string; description: string; priceCents: number;
  durationMinutes: number; category: string; imageUrl: string;
};
type Barber = { id: number; name: string; title: string; bio: string; avatarUrl: string; specialties: string; rating: string };
type Slot = { time: string; endTime: string; available: boolean; barbersAvailable: number[] };

const STEPS = [
  { n: 1, label: "Style", icon: Scissors },
  { n: 2, label: "Date & Time", icon: CalendarDays },
  { n: 3, label: "Details", icon: User },
  { n: 4, label: "Confirm", icon: BadgeCheck },
];

function next14Days(): string[] {
  const out: string[] = [];
  for (let i = 0; i < 14; i++) out.push(todayISO(i));
  return out;
}

export default function BookPage() {
  const [step, setStep] = useState(1);
  const [styles, setStyles] = useState<Hairstyle[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);

  const [styleId, setStyleId] = useState<number | null>(null);
  const [barberId, setBarberId] = useState<number | "any">("any");
  const [date, setDate] = useState(todayISO(1));
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [closedMsg, setClosedMsg] = useState("");
  const [time, setTime] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [emailRetrying, setEmailRetrying] = useState(false);
  const [emailRetryError, setEmailRetryError] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ ref: string; emailSent: boolean; provider: string; emailError?: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        // Ensure DB seeded on first ever visit (helps fresh deploys)
        await fetch("/api/setup", { method: "POST" }).catch(() => null);
        const [s, b] = await Promise.all([
          fetch("/api/hairstyles").then((r) => r.json()),
          fetch("/api/barbers").then((r) => r.json()),
        ]);
        setStyles(s.hairstyles ?? []);
        setBarbers(b.barbers ?? []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const style = useMemo(() => styles.find((s) => s.id === styleId) ?? null, [styles, styleId]);
  const barber = useMemo(
    () => (barberId === "any" ? null : barbers.find((b) => b.id === barberId) ?? null),
    [barbers, barberId]
  );

  const loadSlots = useCallback(async () => {
    if (!styleId || !date) return;
    setSlotsLoading(true);
    setTime(null);
    setClosedMsg("");
    try {
      const barberQ = barberId === "any" ? "any" : String(barberId);
      const res = await fetch(`/api/availability?date=${date}&hairstyleId=${styleId}&barberId=${barberQ}`);
      const data = await res.json();
      if (data.closed) {
        setSlots([]);
        setClosedMsg(data.closeReason || "Closed");
      } else {
        setSlots(data.slots ?? []);
      }
    } catch {
      setClosedMsg("Failed to load times. Try again.");
    } finally {
      setSlotsLoading(false);
    }
  }, [styleId, date, barberId]);

  useEffect(() => {
    if (step === 2 && styleId) loadSlots();
  }, [step, styleId, loadSlots]);

  const canNext1 = styleId != null;
  const canNext2 = time != null;
  const canNext3 = name.trim().length >= 2 && /.+@.+\..+/.test(email.trim());

  async function submit() {
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name.trim(),
          customerEmail: email.trim(),
          customerPhone: phone.trim(),
          hairstyleId: styleId,
          barberId: barberId === "any" ? null : barberId,
          date,
          startTime: time,
          notes: notes.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Booking failed. Please try again.");
        if (res.status === 409) {
          loadSlots(); // refresh — slot was taken
          setStep(2);
        }
        return;
      }
      setDone({
        ref: data.booking.bookingRef,
        emailSent: data.email?.sent === true && data.email?.provider !== "console",
        provider: data.email?.provider ?? "unconfigured",
        emailError: data.email?.error,
      });
      setEmailRetryError("");
      setStep(5);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function resendConfirmation() {
    if (!done) return;
    setEmailRetrying(true);
    setEmailRetryError("");
    try {
      const res = await fetch(`/api/bookings/${done.ref}/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok || data.email?.sent !== true) {
        const message = data.email?.error || data.error || "The email could not be delivered.";
        setEmailRetryError(message);
        setDone({ ...done, emailSent: false, emailError: message });
        return;
      }
      setDone({ ...done, emailSent: true, provider: data.email.provider, emailError: undefined });
    } catch {
      setEmailRetryError("Network error while retrying the email. Please try again.");
    } finally {
      setEmailRetrying(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-24 text-center">
        <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#c9a86a]" />
        <p className="mt-4 text-[#a7a7b0]">Preparing your booking experience…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 md:py-14">
      <p className="text-center text-xs font-bold uppercase tracking-[0.3em] text-[#c9a86a]">
        Online booking
      </p>
      <h1 className="font-display mt-2 text-center text-4xl font-bold md:text-5xl">
        Book your <span className="text-gold-gradient italic">chair</span>
      </h1>
      <p className="mt-2 text-center text-xs font-semibold uppercase tracking-widest text-[#c9a86a]">
        All prices in South African Rand (ZAR)
      </p>

      {/* Stepper */}
      {step <= 4 && (
        <div className="mx-auto mt-8 flex max-w-2xl items-center justify-between">
          {STEPS.map((s, i) => (
            <div key={s.n} className="flex flex-1 items-center last:flex-none">
              <button
                onClick={() => s.n < step && setStep(s.n)}
                className={`flex items-center gap-2 ${s.n < step ? "cursor-pointer" : ""}`}
              >
                <span
                  className={`grid h-10 w-10 place-items-center rounded-full border-2 text-sm font-bold transition ${
                    s.n === step
                      ? "border-[#c9a86a] bg-[#c9a86a] text-[#0b0b0d]"
                      : s.n < step
                        ? "border-[#c9a86a] bg-[#c9a86a]/15 text-[#e8cf9a]"
                        : "border-white/15 bg-white/5 text-[#6b6b72]"
                  }`}
                >
                  {s.n < step ? <CheckCircle2 className="h-5 w-5" /> : <s.icon className="h-4 w-4" />}
                </span>
                <span className={`hidden text-sm font-semibold sm:block ${s.n === step ? "text-white" : "text-[#6b6b72]"}`}>
                  {s.label}
                </span>
              </button>
              {i < STEPS.length - 1 && (
                <div className={`mx-3 h-0.5 flex-1 rounded ${s.n < step ? "bg-[#c9a86a]" : "bg-white/10"}`} />
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-10">
        {/* ── STEP 1: STYLE ─────────────────────────────── */}
        {step === 1 && (
          <section className="animate-fade-up">
            <h2 className="text-xl font-bold">1 · Select your hairstyle</h2>
            <p className="mt-1 text-sm text-[#a7a7b0]">Transparent pricing · every service includes consultation & style finish.</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {styles.map((s) => {
                const active = s.id === styleId;
                return (
                  <button
                    key={s.id}
                    onClick={() => setStyleId(s.id)}
                    className={`group overflow-hidden rounded-2xl border-2 text-left transition ${
                      active ? "border-[#c9a86a] bg-[#c9a86a]/8 shadow-[0_0_30px_rgba(201,168,106,0.15)]" : "border-white/10 bg-[#131316] hover:border-white/25"
                    }`}
                  >
                    <div className="relative h-36">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={s.imageUrl} alt={s.name} className="h-full w-full object-cover" loading="lazy" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <span className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#e8cf9a] backdrop-blur">
                        {s.category}
                      </span>
                      {active && (
                        <span className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-[#c9a86a] text-[#0b0b0d]">
                          <CheckCircle2 className="h-5 w-5" />
                        </span>
                      )}
                      <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                        <span className="text-base font-bold">{s.name}</span>
                        <span className="rounded-full bg-[#c9a86a] px-3 py-1 text-sm font-extrabold text-[#0b0b0d]">
                          {formatPrice(s.priceCents)}
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="line-clamp-2 text-sm text-[#a7a7b0]">{s.description}</p>
                      <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-[#c9a86a]">
                        <Clock className="h-3.5 w-3.5" /> {s.durationMinutes} minutes
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
            {styles.length === 0 && (
              <p className="mt-6 rounded-xl border border-white/10 bg-[#131316] p-6 text-center text-sm text-[#a7a7b0]">
                No services found yet. If you just deployed, the menu seeds automatically — refresh in a moment.
              </p>
            )}
            <NavRow onNext={() => setStep(2)} canNext={canNext1} nextLabel="Choose date & time" />
          </section>
        )}

        {/* ── STEP 2: BARBER + DATE + TIME ───────────────── */}
        {step === 2 && (
          <section className="animate-fade-up">
            <h2 className="text-xl font-bold">2 · Barber, date & time</h2>
            <p className="mt-1 text-sm text-[#a7a7b0]">
              {style?.name} · {style?.durationMinutes} min · {style && formatPrice(style.priceCents)}
            </p>

            {/* Barber */}
            <h3 className="mt-6 text-sm font-bold uppercase tracking-widest text-[#c9a86a]">Barber</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <button
                onClick={() => setBarberId("any")}
                className={`rounded-2xl border-2 p-4 text-center transition ${barberId === "any" ? "border-[#c9a86a] bg-[#c9a86a]/10" : "border-white/10 bg-[#131316] hover:border-white/25"}`}
              >
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-[#e8cf9a] to-[#8a6d35] text-lg font-extrabold text-[#0b0b0d]">★</span>
                <span className="mt-2 block text-sm font-bold">First Available</span>
                <span className="text-xs text-[#a7a7b0]">Fastest booking</span>
              </button>
              {barbers.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setBarberId(b.id)}
                  className={`rounded-2xl border-2 p-4 text-center transition ${barberId === b.id ? "border-[#c9a86a] bg-[#c9a86a]/10" : "border-white/10 bg-[#131316] hover:border-white/25"}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={b.avatarUrl} alt={b.name} className="mx-auto h-14 w-14 rounded-full border border-[#c9a86a]/50 object-cover" loading="lazy" />
                  <span className="mt-2 block text-sm font-bold leading-tight">{b.name}</span>
                  <span className="mt-0.5 flex items-center justify-center gap-1 text-xs text-[#e8cf9a]">
                    <Star className="h-3 w-3 fill-[#c9a86a] text-[#c9a86a]" /> {Number(b.rating).toFixed(2)}
                  </span>
                </button>
              ))}
            </div>

            {/* Date */}
            <h3 className="mt-8 text-sm font-bold uppercase tracking-widest text-[#c9a86a]">Date</h3>
            <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-7">
              {next14Days().map((d) => {
                const dt = new Date(d + "T12:00:00");
                const active = d === date;
                return (
                  <button
                    key={d}
                    onClick={() => setDate(d)}
                    className={`rounded-xl border-2 px-2 py-3 text-center transition ${
                      active ? "border-[#c9a86a] bg-[#c9a86a] text-[#0b0b0d]" : "border-white/10 bg-[#131316] hover:border-white/25"
                    }`}
                  >
                    <span className={`block text-[11px] font-bold uppercase ${active ? "" : "text-[#a7a7b0]"}`}>{DAYS[dt.getDay()]}</span>
                    <span className="block text-lg font-extrabold leading-tight">{dt.getDate()}</span>
                    <span className={`block text-[10px] ${active ? "" : "text-[#6b6b72]"}`}>
                      {dt.toLocaleDateString("en-US", { month: "short" })}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Time */}
            <h3 className="mt-8 text-sm font-bold uppercase tracking-widest text-[#c9a86a]">
              Available times · {formatDateLong(date)}
            </h3>
            {slotsLoading ? (
              <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/10 bg-[#131316] p-6 text-sm text-[#a7a7b0]">
                <Loader2 className="h-5 w-5 animate-spin text-[#c9a86a]" /> Checking live availability…
              </div>
            ) : closedMsg ? (
              <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center text-sm">
                {closedMsg} — please pick another date.
              </div>
            ) : (
              <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                {slots.map((s) => (
                  <button
                    key={s.time}
                    disabled={!s.available}
                    onClick={() => setTime(s.time)}
                    className={`rounded-xl border-2 px-2 py-2.5 text-sm font-bold transition ${
                      time === s.time
                        ? "border-[#c9a86a] bg-[#c9a86a] text-[#0b0b0d]"
                        : s.available
                          ? "border-white/10 bg-[#131316] hover:border-[#c9a86a]/60"
                          : "cursor-not-allowed border-white/5 bg-black/30 text-[#4a4a52] line-through"
                    }`}
                  >
                    {formatTime12(s.time)}
                  </button>
                ))}
              </div>
            )}
            {!slotsLoading && !closedMsg && slots.length > 0 && !slots.some((s) => s.available) && (
              <p className="mt-3 text-sm text-[#a7a7b0]">Fully booked this day — try another date or barber.</p>
            )}

            <NavRow onBack={() => setStep(1)} onNext={() => setStep(3)} canNext={canNext2} nextLabel="Add your details" />
          </section>
        )}

        {/* ── STEP 3: DETAILS ─────────────────────────────── */}
        {step === 3 && (
          <section className="animate-fade-up mx-auto max-w-xl">
            <h2 className="text-xl font-bold">3 · Your details</h2>
            <p className="mt-1 text-sm text-[#a7a7b0]">We&apos;ll send your confirmation to this email.</p>
            <div className="mt-6 space-y-4 rounded-2xl border border-white/10 bg-[#131316] p-6">
              <div>
                <label className="text-sm font-semibold">Full name *</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Jordan Smith"
                  className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-sm outline-none transition placeholder:text-[#4a4a52] focus:border-[#c9a86a]"
                />
              </div>
              <div>
                <label className="text-sm font-semibold">Email address *</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  type="email"
                  className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-sm outline-none transition placeholder:text-[#4a4a52] focus:border-[#c9a86a]"
                />
              </div>
              <div>
                <label className="text-sm font-semibold">Phone <span className="font-normal text-[#6b6b72]">(optional)</span></label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 000-0000"
                  type="tel"
                  className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-sm outline-none transition placeholder:text-[#4a4a52] focus:border-[#c9a86a]"
                />
              </div>
              <div>
                <label className="text-sm font-semibold">Notes for your barber <span className="font-normal text-[#6b6b72]">(optional)</span></label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Reference photos, allergies, preferences…"
                  rows={3}
                  className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-sm outline-none transition placeholder:text-[#4a4a52] focus:border-[#c9a86a]"
                />
              </div>
            </div>
            <NavRow onBack={() => setStep(2)} onNext={() => setStep(4)} canNext={canNext3} nextLabel="Review booking" />
          </section>
        )}

        {/* ── STEP 4: REVIEW ──────────────────────────────── */}
        {step === 4 && style && (
          <section className="animate-fade-up mx-auto max-w-xl">
            <h2 className="text-xl font-bold">4 · Check & confirm</h2>
            <p className="mt-1 text-sm text-[#a7a7b0]">Please review everything before confirming.</p>
            <div className="mt-6 overflow-hidden rounded-2xl border border-[#c9a86a]/30 bg-[#131316]">
              <div className="flex items-center gap-4 bg-gradient-to-r from-[#c9a86a]/20 to-transparent p-5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={style.imageUrl} alt="" className="h-16 w-16 rounded-xl object-cover" />
                <div>
                  <p className="font-bold">{style.name}</p>
                  <p className="text-sm text-[#a7a7b0]">{barber ? barber.name : "First available barber"}</p>
                </div>
                <span className="ml-auto rounded-full bg-[#c9a86a] px-4 py-1.5 text-base font-extrabold text-[#0b0b0d]">
                  {formatPrice(style.priceCents)}
                </span>
              </div>
              <dl className="divide-y divide-white/5 px-5 text-sm">
                <Row k="Date" v={formatDateLong(date)} />
                <Row k="Time" v={time ? `${formatTime12(time)} (${style.durationMinutes} min)` : "—"} />
                <Row k="Name" v={name} />
                <Row k="Email" v={email} />
                {phone && <Row k="Phone" v={phone} />}
                {notes && <Row k="Notes" v={notes} />}
              </dl>
            </div>
            <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-[#a7a7b0]">
              <MailCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#c9a86a]" />
              We&apos;ll attempt to email your booking confirmation to <b className="text-white">{email}</b>. Your booking reference will be shown here even if email delivery needs attention.
            </p>
            {error && (
              <p className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">{error}</p>
            )}
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setStep(3)}
                className="flex items-center gap-2 rounded-full border border-white/20 px-6 py-3.5 text-sm font-bold transition hover:border-white/40"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button
                onClick={submit}
                disabled={submitting}
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#c9a86a] px-6 py-3.5 text-sm font-extrabold text-[#0b0b0d] transition hover:bg-[#e8cf9a] disabled:opacity-60"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <BadgeCheck className="h-4 w-4" />}
                {submitting ? "Confirming…" : `Confirm Booking · ${formatPrice(style.priceCents)}`}
              </button>
            </div>
          </section>
        )}

        {/* ── STEP 5: SUCCESS ─────────────────────────────── */}
        {step === 5 && done && style && (
          <section className="animate-fade-up mx-auto max-w-xl text-center">
            <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[#c9a86a]/15 text-[#c9a86a]">
              <PartyPopper className="h-9 w-9" />
            </span>
            <h2 className="font-display mt-6 text-4xl font-bold">
              You&apos;re <span className="text-gold-gradient italic">booked in!</span>
            </h2>
            <p className="mt-3 text-[#a7a7b0]">
              {formatDateLong(date)} at {time && formatTime12(time)} · {style.name}
            </p>
            <div className="mt-6 rounded-2xl border border-dashed border-[#c9a86a]/50 bg-[#131316] p-6">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#a7a7b0]">Booking reference</p>
              <p className="font-display mt-2 text-4xl font-extrabold tracking-widest text-[#e8cf9a]">{done.ref}</p>
              <p className={`mt-3 flex items-start justify-center gap-2 text-sm ${done.emailSent ? "text-emerald-200" : "text-amber-200"}`}>
                <MailCheck className="mt-0.5 h-4 w-4 shrink-0" />
                {done.emailSent ? (
                  <span>
                    Email accepted by <b>{done.provider}</b> for <b>{email}</b>. Check your inbox and spam folder.
                  </span>
                ) : (
                  <span>
                    Your booking is confirmed, but the confirmation email was <b>not delivered</b>. Your booking reference above is valid.
                  </span>
                )}
              </p>
              {!done.emailSent && (
                <div className="mt-4">
                  <button
                    onClick={resendConfirmation}
                    disabled={emailRetrying}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-[#c9a86a]/50 px-5 py-2.5 text-sm font-bold text-[#e8cf9a] transition hover:bg-[#c9a86a]/10 disabled:opacity-60"
                  >
                    {emailRetrying && <Loader2 className="h-4 w-4 animate-spin" />}
                    {emailRetrying ? "Retrying…" : "Resend confirmation email"}
                  </button>
                  {(emailRetryError || done.emailError) && (
                    <p className="mt-3 text-left text-xs leading-relaxed text-amber-200/80">
                      {emailRetryError || done.emailError}
                    </p>
                  )}
                </div>
              )}
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href={`/booking/${done.ref}`}
                className="rounded-full bg-[#c9a86a] px-6 py-3 text-sm font-bold text-[#0b0b0d] transition hover:bg-[#e8cf9a]"
              >
                View Booking Details
              </Link>
              <Link
                href="/"
                className="rounded-full border border-white/20 px-6 py-3 text-sm font-bold transition hover:border-white/40"
              >
                Back to Home
              </Link>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <dt className="text-[#a7a7b0]">{k}</dt>
      <dd className="text-right font-semibold">{v}</dd>
    </div>
  );
}

function NavRow({
  onBack,
  onNext,
  canNext,
  nextLabel,
}: {
  onBack?: () => void;
  onNext: () => void;
  canNext: boolean;
  nextLabel: string;
}) {
  return (
    <div className="mt-8 flex gap-3">
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-2 rounded-full border border-white/20 px-6 py-3.5 text-sm font-bold transition hover:border-white/40"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
      )}
      <button
        onClick={onNext}
        disabled={!canNext}
        className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#c9a86a] px-6 py-3.5 text-sm font-extrabold text-[#0b0b0d] transition hover:bg-[#e8cf9a] disabled:cursor-not-allowed disabled:opacity-30 sm:flex-none sm:px-10"
      >
        {nextLabel} <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
