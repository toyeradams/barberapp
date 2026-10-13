"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { formatPrice } from "@/lib/time";

const GOLD = "#c9a86a";

export default function AdminAnalyticsPage() {
  const [range, setRange] = useState("30d");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/analytics?range=${range}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [range]);

  if (loading || !data) {
    return <div className="grid h-64 place-items-center"><Loader2 className="h-8 w-8 animate-spin text-[#c9a86a]" /></div>;
  }

  const k = data.kpis;
  const chartData = (data.byDay ?? []).map((d: any) => ({
    ...d,
    label: d.date.slice(5),
    revenue: d.revenueCents / 100,
  }));

  const STATUS_COLORS: Record<string, string> = {
    confirmed: "#34d399",
    completed: "#38bdf8",
    cancelled: "#f87171",
    no_show: "#fbbf24",
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Analytics</h1>
          <p className="mt-1 text-sm text-[#a7a7b0]">Revenue, bookings and trends.</p>
        </div>
        <div className="flex gap-2">
          {["7d", "30d", "90d"].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-full px-4 py-2 text-xs font-bold ${range === r ? "bg-[#c9a86a] text-[#0b0b0d]" : "border border-white/15 text-[#a7a7b0]"}`}
            >
              {r === "7d" ? "7 days" : r === "30d" ? "30 days" : "90 days"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Revenue" value={formatPrice(k.revenueCents)} sub={`${k.bookings} bookings`} />
        <Kpi label="Avg. ticket" value={formatPrice(k.avgTicketCents)} sub="per booking" />
        <Kpi label="Completed" value={String(k.completed)} sub={`${k.cancelled} cancelled · ${k.noShow} no-show`} />
        <Kpi label="Cancel rate" value={`${k.cancellationRate}%`} sub="of all bookings" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-[#131316] p-5 lg:col-span-2">
          <h2 className="font-bold">Revenue trend</h2>
          <p className="text-xs text-[#6b6b72]">Daily revenue · South African Rand (ZAR)</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={GOLD} stopOpacity={0.6} />
                    <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" tick={{ fill: "#6b6b72", fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis
                  tick={{ fill: "#6b6b72", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value: number) => formatPrice(Math.round(Number(value) * 100))}
                />
                <Tooltip
                  formatter={(value, name) => [
                    typeof value === "number" ? formatPrice(Math.round(value * 100)) : value,
                    name === "revenue" ? "Revenue (ZAR)" : name,
                  ]}
                />
                <Area type="monotone" dataKey="revenue" stroke={GOLD} strokeWidth={2.5} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#131316] p-5">
          <h2 className="font-bold">Booking status</h2>
          <p className="text-xs text-[#6b6b72]">Split across the period</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.byStatus} dataKey="count" nameKey="status" innerRadius={55} outerRadius={85} paddingAngle={3} strokeWidth={0}>
                  {(data.byStatus ?? []).map((s: any) => (
                    <Cell key={s.status} fill={STATUS_COLORS[s.status] ?? GOLD} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-3 text-xs">
            {(data.byStatus ?? []).map((s: any) => (
              <span key={s.status} className="flex items-center gap-1.5 capitalize text-[#a7a7b0]">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: STATUS_COLORS[s.status] }} />
                {s.status.replace("_", " ")} ({s.count})
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-[#131316] p-5">
          <h2 className="font-bold">Top services</h2>
          <p className="text-xs text-[#6b6b72]">By bookings</p>
          <div className="mt-4 space-y-3">
            {(data.byStyle ?? []).slice(0, 6).map((s: any) => {
              const max = Math.max(...(data.byStyle ?? [{ bookings: 1 }]).map((x: any) => x.bookings));
              return (
                <div key={s.id}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold">{s.name}</span>
                    <span className="text-xs text-[#a7a7b0]">{s.bookings} · {formatPrice(s.revenueCents)}</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-gradient-to-r from-[#8a6d35] to-[#e8cf9a]" style={{ width: `${(s.bookings / max) * 100}%` }} />
                  </div>
                </div>
              );
            })}
            {(data.byStyle ?? []).length === 0 && <p className="text-sm text-[#6b6b72]">No data yet.</p>}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#131316] p-5">
          <h2 className="font-bold">Barber leaderboard</h2>
          <p className="text-xs text-[#6b6b72]">By bookings in period</p>
          <div className="mt-4 space-y-3">
            {(data.byBarber ?? []).map((b: any, i: number) => (
              <div key={b.id} className="flex items-center gap-3 rounded-xl bg-black/30 p-3 text-sm">
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-extrabold ${i === 0 ? "bg-[#c9a86a] text-[#0b0b0d]" : "bg-white/10"}`}>
                  {i + 1}
                </span>
                <span className="font-bold">{b.name}</span>
                <span className="ml-auto text-xs text-[#a7a7b0]">{b.bookings} bookings · {formatPrice(b.revenueCents)}</span>
              </div>
            ))}
            {(data.byBarber ?? []).length === 0 && <p className="text-sm text-[#6b6b72]">No data yet.</p>}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-[#131316] p-5">
        <h2 className="font-bold">Peak hours</h2>
        <p className="text-xs text-[#6b6b72]">When your chairs fill up</p>
        <div className="mt-4 h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.byHour ?? []}>
              <XAxis dataKey="hour" tick={{ fill: "#6b6b72", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#6b6b72", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip cursor={{ fill: "rgba(201,168,106,0.1)" }} />
              <Bar dataKey="bookings" fill={GOLD} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#131316] p-5">
      <p className="text-xs font-bold uppercase tracking-widest text-[#a7a7b0]">{label}</p>
      <p className="font-display mt-2 text-3xl font-extrabold">{value}</p>
      <p className="mt-1 text-xs text-[#6b6b72]">{sub}</p>
    </div>
  );
}
