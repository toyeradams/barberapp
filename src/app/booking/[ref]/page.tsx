"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, CalendarDays, Clock, User, Scissors, ArrowLeft, XCircle, CheckCircle2 } from "lucide-react";
import { formatDateLong, formatPrice, formatTime12 } from "@/lib/time";

export default function BookingDetailPage({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = use(params);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch(`/api/bookings/${ref}`)
      .then((r) => {
        if (!r.ok) throw new Error("nf");
        return r.json();
      })
      .then(setData)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [ref]);

  async function cancel() {
    setCancelling(true);
    setMsg("");
    try {
      const res = await fetch(`/api/bookings/${ref}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const d = await res.json();
      if (!res.ok) {
        setMsg(d.error || "Cancel failed");
        return;
      }
      setData({ ...data, booking: d.booking });
      setShowCancel(false);
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return <main className="mx-auto max-w-2xl px-4 py-24 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-[#c9a86a]" /></main>;
  }
  if (notFound || !data) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="font-display text-3xl font-bold">Booking not found</h1>
        <p className="mt-2 text-[#a7a7b0]">Check your reference and try again.</p>
        <Link href="/booking" className="mt-6 inline-block rounded-full bg-[#c9a86a] px-6 py-3 text-sm font-bold text-[#0b0b0d]">Find my booking</Link>
      </main>
    );
  }

  const b = data.booking;
  const style = data.hairstyle;
  const barber = data.barber;

  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <Link href="/booking" className="inline-flex items-center gap-2 text-sm text-[#a7a7b0] hover:text-white">
        <ArrowLeft className="h-4 w-4" /> All bookings
      </Link>

      <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-[#131316]">
        <div className="bg-gradient-to-r from-[#c9a86a] to-[#8a6d35] p-6 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#231a08]">Booking reference</p>
          <p className="font-display mt-1 text-4xl font-extrabold tracking-widest text-[#0b0b0d]">{b.bookingRef}</p>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">{style?.name}</h1>
            <StatusBadge status={b.status} />
          </div>
          <dl className="mt-4 space-y-3 text-sm">
            <Row icon={<CalendarDays className="h-4 w-4 text-[#c9a86a]" />} k="Date" v={formatDateLong(b.date)} />
            <Row icon={<Clock className="h-4 w-4 text-[#c9a86a]" />} k="Time" v={`${formatTime12(b.startTime)} – ${formatTime12(b.endTime)} (${b.durationMinutes} min)`} />
            <Row icon={<Scissors className="h-4 w-4 text-[#c9a86a]" />} k="Barber" v={barber?.name ?? "First available"} />
            <Row icon={<User className="h-4 w-4 text-[#c9a86a]" />} k="Client" v={`${b.customerName} · ${b.customerEmail}`} />
            <div className="flex items-center justify-between border-t border-white/10 pt-3">
              <span className="text-[#a7a7b0]">Price (pay at shop)</span>
              <span className="text-xl font-extrabold text-[#e8cf9a]">{formatPrice(b.priceCents)}</span>
            </div>
          </dl>

          {b.status === "confirmed" && !showCancel && (
            <button
              onClick={() => setShowCancel(true)}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-200 transition hover:bg-red-500/20"
            >
              <XCircle className="h-4 w-4" /> Cancel this booking
            </button>
          )}

          {showCancel && b.status === "confirmed" && (
            <div className="mt-6 rounded-xl border border-red-500/40 bg-red-500/5 p-4">
              <p className="text-sm font-bold">Confirm cancellation?</p>
              <p className="mt-1 text-xs text-[#a7a7b0]">Enter the email used for this booking to confirm.</p>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                type="email"
                className="mt-3 w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-sm outline-none focus:border-red-400"
              />
              {msg && <p className="mt-2 text-xs text-red-300">{msg}</p>}
              <div className="mt-3 flex gap-2">
                <button onClick={() => setShowCancel(false)} className="flex-1 rounded-xl border border-white/20 px-4 py-2.5 text-sm font-bold">Keep booking</button>
                <button onClick={cancel} disabled={cancelling} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">
                  {cancelling && <Loader2 className="h-4 w-4 animate-spin" />} Yes, cancel
                </button>
              </div>
            </div>
          )}

          {b.status !== "confirmed" && (
            <p className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-white/5 p-4 text-sm text-[#a7a7b0]">
              <CheckCircle2 className="h-4 w-4" /> This booking is {b.status.replace("_", " ")}.
              <Link href="/book" className="font-bold text-[#e8cf9a]">Book again →</Link>
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

function Row({ icon, k, v }: { icon: React.ReactNode; k: string; v: string }) {
  return (
    <div className="flex items-center gap-3">
      {icon}
      <span className="w-16 shrink-0 text-[#a7a7b0]">{k}</span>
      <span className="font-semibold">{v}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    confirmed: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    completed: "bg-sky-500/15 text-sky-300 border-sky-500/30",
    cancelled: "bg-red-500/15 text-red-300 border-red-500/30",
    no_show: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  };
  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-bold capitalize ${map[status] ?? map.confirmed}`}>
      {status.replace("_", " ")}
    </span>
  );
}
