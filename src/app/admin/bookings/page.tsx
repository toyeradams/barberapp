"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Search, Trash2 } from "lucide-react";
import { formatDateShort, formatPrice, formatTime12 } from "@/lib/time";

const STATUSES = ["all", "confirmed", "completed", "cancelled", "no_show"];

export default function AdminBookingsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [styles, setStyles] = useState<any[]>([]);
  const [barbers, setBarbers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ status, search });
      if (from) q.set("from", from);
      if (to) q.set("to", to);
      const [b, s, br] = await Promise.all([
        fetch(`/api/admin/bookings?${q}`).then((r) => r.json()),
        fetch("/api/admin/hairstyles").then((r) => r.json()).catch(() => ({ hairstyles: [] })),
        fetch("/api/admin/barbers").then((r) => r.json()).catch(() => ({ barbers: [] })),
      ]);
      setRows(b.bookings ?? []);
      setStyles(s.hairstyles ?? []);
      setBarbers(br.barbers ?? []);
    } finally {
      setLoading(false);
    }
  }, [status, search, from, to]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  async function setBookingStatus(id: number, st: string) {
    const prev = rows;
    setRows(rows.map((r) => (r.id === id ? { ...r, status: st } : r)));
    const res = await fetch(`/api/admin/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: st }),
    });
    if (!res.ok) setRows(prev);
  }

  async function remove(id: number) {
    if (!confirm("Permanently delete this booking?")) return;
    await fetch(`/api/admin/bookings/${id}`, { method: "DELETE" });
    setRows(rows.filter((r) => r.id !== id));
  }

  const styleName = (id: number) => styles.find((s) => s.id === id)?.name ?? `#${id}`;
  const barberName = (id: number | null) => (id == null ? "—" : barbers.find((b) => b.id === id)?.name ?? `#${id}`);

  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Bookings</h1>
      <p className="mt-1 text-sm text-[#a7a7b0]">{rows.length} bookings · click a status pill to update</p>

      <div className="mt-5 flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`rounded-full px-4 py-2 text-xs font-bold capitalize transition ${status === s ? "bg-[#c9a86a] text-[#0b0b0d]" : "border border-white/15 text-[#a7a7b0] hover:border-white/30"}`}
          >
            {s.replace("_", " ")}
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b6b72]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, reference…"
            className="w-full rounded-xl border border-white/15 bg-[#131316] py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[#c9a86a]"
          />
        </div>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-xl border border-white/15 bg-[#131316] px-3 py-2.5 text-sm outline-none" />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-xl border border-white/15 bg-[#131316] px-3 py-2.5 text-sm outline-none" />
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-[#131316]">
        {loading ? (
          <div className="grid h-48 place-items-center"><Loader2 className="h-7 w-7 animate-spin text-[#c9a86a]" /></div>
        ) : rows.length === 0 ? (
          <p className="p-10 text-center text-sm text-[#6b6b72]">No bookings match these filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-widest text-[#6b6b72]">
                  <th className="px-4 py-3">Ref</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Service / Barber</th>
                  <th className="px-4 py-3">When</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-mono text-xs font-bold text-[#e8cf9a]">{r.bookingRef}</td>
                    <td className="px-4 py-3">
                      <span className="block font-bold">{r.customerName}</span>
                      <span className="block text-xs text-[#a7a7b0]">{r.customerEmail}</span>
                      {r.customerPhone && <span className="block text-xs text-[#6b6b72]">{r.customerPhone}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="block">{styleName(r.hairstyleId)}</span>
                      <span className="block text-xs text-[#a7a7b0]">{barberName(r.barberId)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="block font-semibold">{formatDateShort(r.date)}</span>
                      <span className="block font-mono text-xs text-[#a7a7b0]">{formatTime12(r.startTime)}–{formatTime12(r.endTime)}</span>
                    </td>
                    <td className="px-4 py-3 font-bold">{formatPrice(r.priceCents)}</td>
                    <td className="px-4 py-3">
                      <select
                        value={r.status}
                        onChange={(e) => setBookingStatus(r.id, e.target.value)}
                        className={`rounded-full border px-2 py-1.5 text-xs font-bold capitalize outline-none ${badge(r.status)}`}
                      >
                        <option value="confirmed">confirmed</option>
                        <option value="completed">completed</option>
                        <option value="cancelled">cancelled</option>
                        <option value="no_show">no show</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => remove(r.id)} className="rounded-lg p-2 text-red-300/70 transition hover:bg-red-500/10 hover:text-red-300" title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function badge(status: string) {
  switch (status) {
    case "confirmed": return "border-emerald-500/40 bg-emerald-500/10 text-emerald-200";
    case "completed": return "border-sky-500/40 bg-sky-500/10 text-sky-200";
    case "cancelled": return "border-red-500/40 bg-red-500/10 text-red-200";
    default: return "border-amber-500/40 bg-amber-500/10 text-amber-200";
  }
}
