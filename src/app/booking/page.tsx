"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Ticket, Loader2, MailSearch } from "lucide-react";
import { formatDateShort, formatPrice, formatTime12 } from "@/lib/time";

export default function BookingLookupPage() {
  const router = useRouter();
  const [ref, setRef] = useState("");
  const [email, setEmail] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  async function lookupByEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings?email=${encodeURIComponent(email.trim())}`);
      const data = await res.json();
      setResults(data.bookings ?? []);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <p className="text-center text-xs font-bold uppercase tracking-[0.3em] text-[#c9a86a]">Manage booking</p>
      <h1 className="font-display mt-2 text-center text-4xl font-bold">
        Find my <span className="text-gold-gradient italic">booking</span>
      </h1>

      <div className="mt-8 rounded-2xl border border-white/10 bg-[#131316] p-6">
        <label className="flex items-center gap-2 text-sm font-bold"><Ticket className="h-4 w-4 text-[#c9a86a]" /> Have a booking reference?</label>
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => { e.preventDefault(); if (ref.trim()) router.push(`/booking/${ref.trim().toUpperCase()}`); }}
        >
          <input
            value={ref}
            onChange={(e) => setRef(e.target.value)}
            placeholder="e.g. SF-A3K9Q2"
            className="flex-1 rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-sm font-mono uppercase tracking-widest outline-none placeholder:text-[#4a4a52] focus:border-[#c9a86a]"
          />
          <button className="rounded-xl bg-[#c9a86a] px-5 py-3 text-sm font-extrabold text-[#0b0b0d] transition hover:bg-[#e8cf9a]">
            Open
          </button>
        </form>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-[#131316] p-6">
        <label className="flex items-center gap-2 text-sm font-bold"><MailSearch className="h-4 w-4 text-[#c9a86a]" /> Or look up by email</label>
        <form className="mt-3 flex gap-2" onSubmit={lookupByEmail}>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            type="email"
            className="flex-1 rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-sm outline-none placeholder:text-[#4a4a52] focus:border-[#c9a86a]"
          />
          <button disabled={loading} className="flex items-center gap-2 rounded-xl bg-[#c9a86a] px-5 py-3 text-sm font-extrabold text-[#0b0b0d] transition hover:bg-[#e8cf9a] disabled:opacity-60">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Search
          </button>
        </form>

        {searched && (
          <div className="mt-4 space-y-2">
            {results.length === 0 ? (
              <p className="rounded-xl border border-white/10 bg-black/30 p-4 text-center text-sm text-[#a7a7b0]">
                No bookings found for that email.
              </p>
            ) : (
              results.map((b) => (
                <Link
                  key={b.id}
                  href={`/booking/${b.bookingRef}`}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 p-4 transition hover:border-[#c9a86a]/50"
                >
                  <span>
                    <span className="font-mono text-sm font-bold text-[#e8cf9a]">{b.bookingRef}</span>
                    <span className="block text-xs text-[#a7a7b0]">{formatDateShort(b.date)} · {formatTime12(b.startTime)} · {formatPrice(b.priceCents)}</span>
                  </span>
                  <StatusBadge status={b.status} />
                </Link>
              ))
            )}
          </div>
        )}
      </div>
    </main>
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
