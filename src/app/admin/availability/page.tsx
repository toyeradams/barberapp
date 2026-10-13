"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2, Save } from "lucide-react";
import { DAYS_LONG, todayISO } from "@/lib/time";

type Rule = { id: number; barberId: number | null; dayOfWeek: number; startTime: string; endTime: string; slotIntervalMinutes: number; isActive: boolean };
type Override = { id: number; date: string; barberId: number | null; isClosed: boolean; startTime: string | null; endTime: string | null; reason: string };

export default function AdminAvailabilityPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [overrides, setOverrides] = useState<Override[]>([]);
  const [barbers, setBarbers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState<string>("shop"); // "shop" or barber id
  const [draft, setDraft] = useState<Record<number, { on: boolean; start: string; end: string }>>({});
  const [saving, setSaving] = useState(false);

  // override form
  const [oDate, setODate] = useState(todayISO(7));
  const [oBarber, setOBarber] = useState("");
  const [oClosed, setOClosed] = useState(true);
  const [oStart, setOStart] = useState("10:00");
  const [oEnd, setOEnd] = useState("16:00");
  const [oReason, setOReason] = useState("");

  async function load() {
    setLoading(true);
    try {
      const [r, o, b] = await Promise.all([
        fetch("/api/admin/availability/rules").then((x) => x.json()),
        fetch("/api/admin/availability/overrides").then((x) => x.json()),
        fetch("/api/admin/barbers").then((x) => x.json()),
      ]);
      setRules(r.rules ?? []);
      setOverrides(o.overrides ?? []);
      setBarbers(b.barbers ?? []);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  // Build draft from rules whenever scope/rules change
  useEffect(() => {
    const barberId = scope === "shop" ? null : Number(scope);
    const d: Record<number, { on: boolean; start: string; end: string }> = {};
    for (let dow = 0; dow <= 6; dow++) {
      const found = rules.find((r) => (r.barberId ?? null) === barberId && r.dayOfWeek === dow && r.isActive);
      d[dow] = found ? { on: true, start: found.startTime, end: found.endTime } : { on: false, start: "09:00", end: "18:00" };
    }
    setDraft(d);
  }, [rules, scope]);

  async function saveWeek() {
    setSaving(true);
    try {
      const barberId = scope === "shop" ? null : Number(scope);
      // delete existing active rules for this scope, then re-insert
      const existing = rules.filter((r) => (r.barberId ?? null) === barberId);
      for (const e of existing) {
        await fetch(`/api/admin/availability/rules/${e.id}`, { method: "DELETE" });
      }
      for (let dow = 0; dow <= 6; dow++) {
        const v = draft[dow];
        if (!v?.on) continue;
        await fetch("/api/admin/availability/rules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ barberId, dayOfWeek: dow, startTime: v.start, endTime: v.end, slotIntervalMinutes: 30, isActive: true }),
        });
      }
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function addOverride() {
    if (!oDate) return alert("Pick a date");
    const res = await fetch("/api/admin/availability/overrides", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: oDate,
        barberId: oBarber === "" ? null : Number(oBarber),
        isClosed: oClosed,
        startTime: oClosed ? null : oStart,
        endTime: oClosed ? null : oEnd,
        reason: oReason,
      }),
    });
    if (!res.ok) { alert("Failed"); return; }
    setOReason("");
    load();
  }

  async function removeOverride(id: number) {
    if (!confirm("Remove this override?")) return;
    await fetch(`/api/admin/availability/overrides/${id}`, { method: "DELETE" });
    load();
  }

  const order = [1, 2, 3, 4, 5, 6, 0]; // Mon-first

  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Availability</h1>
      <p className="mt-1 text-sm text-[#a7a7b0]">Weekly hours drive live booking slots. Overrides handle holidays & days off.</p>

      {loading ? (
        <div className="grid h-48 place-items-center"><Loader2 className="h-7 w-7 animate-spin text-[#c9a86a]" /></div>
      ) : (
        <>
          <div className="mt-6 rounded-2xl border border-white/10 bg-[#131316] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-bold">Weekly hours</h2>
              <select value={scope} onChange={(e) => setScope(e.target.value)} className="rounded-xl border border-white/15 bg-black/40 px-4 py-2 text-sm outline-none">
                <option value="shop">Whole shop (default)</option>
                {barbers.map((b) => <option key={b.id} value={String(b.id)}>Only {b.name}</option>)}
              </select>
            </div>
            <p className="mt-1 text-xs text-[#6b6b72]">
              {scope === "shop"
                ? "These hours apply to every barber unless a barber has their own schedule."
                : "Barber-specific hours override the shop default for that barber."}
            </p>
            <div className="mt-4 space-y-2">
              {order.map((dow) => {
                const v = draft[dow] ?? { on: false, start: "09:00", end: "18:00" };
                return (
                  <div key={dow} className={`flex flex-wrap items-center gap-3 rounded-xl border p-3 ${v.on ? "border-[#c9a86a]/30 bg-[#c9a86a]/5" : "border-white/10 bg-black/20"}`}>
                    <button
                      onClick={() => setDraft({ ...draft, [dow]: { ...v, on: !v.on } })}
                      className={`relative h-6 w-11 shrink-0 rounded-full transition ${v.on ? "bg-[#c9a86a]" : "bg-white/15"}`}
                      aria-label="toggle day"
                    >
                      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${v.on ? "left-[22px]" : "left-0.5"}`} />
                    </button>
                    <span className="w-28 text-sm font-bold">{DAYS_LONG[dow]}</span>
                    {v.on ? (
                      <span className="flex items-center gap-2 text-sm">
                        <input type="time" value={v.start} onChange={(e) => setDraft({ ...draft, [dow]: { ...v, start: e.target.value } })} className="rounded-lg border border-white/15 bg-black/40 px-2 py-1.5 outline-none" />
                        <span className="text-[#6b6b72]">to</span>
                        <input type="time" value={v.end} onChange={(e) => setDraft({ ...draft, [dow]: { ...v, end: e.target.value } })} className="rounded-lg border border-white/15 bg-black/40 px-2 py-1.5 outline-none" />
                      </span>
                    ) : (
                      <span className="text-sm text-[#6b6b72]">Closed</span>
                    )}
                  </div>
                );
              })}
            </div>
            <button onClick={saveWeek} disabled={saving} className="mt-4 flex items-center gap-2 rounded-full bg-[#c9a86a] px-6 py-2.5 text-sm font-extrabold text-[#0b0b0d] hover:bg-[#e8cf9a] disabled:opacity-60">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save weekly hours
            </button>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-[#131316] p-5">
              <h2 className="flex items-center gap-2 font-bold"><Plus className="h-4 w-4 text-[#c9a86a]" /> Add day override</h2>
              <p className="mt-1 text-xs text-[#6b6b72]">Close the shop (or one barber) for a holiday, or set special hours.</p>
              <div className="mt-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className={lbl}>Date</span>
                    <input type="date" value={oDate} onChange={(e) => setODate(e.target.value)} className={input} />
                  </label>
                  <label className="block">
                    <span className={lbl}>Applies to</span>
                    <select value={oBarber} onChange={(e) => setOBarber(e.target.value)} className={input}>
                      <option value="">Whole shop</option>
                      {barbers.map((b) => <option key={b.id} value={String(b.id)}>{b.name}</option>)}
                    </select>
                  </label>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setOClosed(true)} className={`flex-1 rounded-xl border px-3 py-2.5 text-sm font-bold ${oClosed ? "border-red-500/60 bg-red-500/10 text-red-200" : "border-white/15 text-[#a7a7b0]"}`}>Closed all day</button>
                  <button onClick={() => setOClosed(false)} className={`flex-1 rounded-xl border px-3 py-2.5 text-sm font-bold ${!oClosed ? "border-[#c9a86a] bg-[#c9a86a]/10 text-[#e8cf9a]" : "border-white/15 text-[#a7a7b0]"}`}>Custom hours</button>
                </div>
                {!oClosed && (
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block"><span className={lbl}>Open</span><input type="time" value={oStart} onChange={(e) => setOStart(e.target.value)} className={input} /></label>
                    <label className="block"><span className={lbl}>Close</span><input type="time" value={oEnd} onChange={(e) => setOEnd(e.target.value)} className={input} /></label>
                  </div>
                )}
                <label className="block">
                  <span className={lbl}>Reason</span>
                  <input value={oReason} onChange={(e) => setOReason(e.target.value)} placeholder="e.g. Christmas Day" className={input} />
                </label>
                <button onClick={addOverride} className="w-full rounded-xl bg-[#c9a86a] px-4 py-3 text-sm font-extrabold text-[#0b0b0d] hover:bg-[#e8cf9a]">
                  Add override
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#131316] p-5">
              <h2 className="font-bold">Upcoming overrides</h2>
              <div className="mt-4 space-y-2">
                {overrides.filter((o) => o.date >= todayISO(0)).length === 0 && (
                  <p className="rounded-xl bg-black/30 p-4 text-center text-sm text-[#6b6b72]">No overrides scheduled.</p>
                )}
                {overrides.filter((o) => o.date >= todayISO(0)).map((o) => (
                  <div key={o.id} className="flex items-center gap-3 rounded-xl bg-black/30 p-3 text-sm">
                    <span className="font-mono font-bold">{o.date}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">
                        {o.isClosed ? "Closed" : `${o.startTime}–${o.endTime}`}
                        <span className="ml-2 text-xs font-normal text-[#a7a7b0]">
                          {o.barberId == null ? "Whole shop" : barbers.find((b) => b.id === o.barberId)?.name}
                        </span>
                      </span>
                      {o.reason && <span className="block truncate text-xs text-[#6b6b72]">{o.reason}</span>}
                    </span>
                    <button onClick={() => removeOverride(o.id)} className="rounded-lg p-2 text-red-300/70 hover:bg-red-500/10">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const input = "mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2.5 text-sm outline-none focus:border-[#c9a86a]";
const lbl = "text-xs font-bold uppercase tracking-widest text-[#a7a7b0]";
