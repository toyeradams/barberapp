"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Banknote,
  Users,
  TrendingUp,
  Loader2,
  ArrowRight,
  Clock,
} from "lucide-react";
import { formatPrice, formatTime12, todayISO } from "@/lib/time";

export default function AdminOverviewPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [today, setToday] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [a, b] = await Promise.all([
          fetch("/api/admin/analytics?range=30d").then((r) => r.json()),
          fetch(`/api/admin/bookings?from=${todayISO(0)}&to=${todayISO(0)}`).then((r) => r.json()),
        ]);
        setAnalytics(a);
        setToday((b.bookings ?? []).filter((x: any) => x.status !== "cancelled" && x.status !== "no_show"));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <div className="grid h-64 place-items-center"><Loader2 className="h-8 w-8 animate-spin text-[#c9a86a]" /></div>;
  }

  const k = analytics?.kpis ?? {};
  const cards = [
    { label: "Revenue (30d)", value: formatPrice(k.revenueCents ?? 0), icon: Banknote, sub: `${k.bookings ?? 0} bookings` },
    { label: "Today's chairs", value: String(today.length), icon: CalendarDays, sub: "confirmed bookings" },
    { label: "Avg. ticket", value: formatPrice(k.avgTicketCents ?? 0), icon: TrendingUp, sub: "per booking" },
    { label: "Upcoming", value: String(k.upcoming ?? 0), icon: Users, sub: "future bookings" },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Good day, Boss. ✂</h1>
          <p className="mt-1 text-sm text-[#a7a7b0]">Here&apos;s what&apos;s happening in your shop.</p>
        </div>
        <Link href="/admin/bookings" className="inline-flex items-center gap-2 rounded-full bg-[#c9a86a] px-5 py-2.5 text-sm font-bold text-[#0b0b0d] hover:bg-[#e8cf9a]">
          Manage bookings <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-white/10 bg-[#131316] p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-widest text-[#a7a7b0]">{c.label}</p>
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#c9a86a]/12 text-[#c9a86a]">
                <c.icon className="h-4 w-4" />
              </span>
            </div>
            <p className="font-display mt-2 text-3xl font-extrabold">{c.value}</p>
            <p className="mt-1 text-xs text-[#6b6b72]">{c.sub}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {/* Today's schedule */}
        <div className="rounded-2xl border border-white/10 bg-[#131316] p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Today&apos;s schedule</h2>
            <Link href="/admin/bookings" className="text-xs font-bold text-[#e8cf9a] hover:underline">View all →</Link>
          </div>
          <div className="mt-4 space-y-2">
            {today.length === 0 && (
              <p className="rounded-xl bg-black/30 p-4 text-center text-sm text-[#6b6b72]">
                No bookings today. Quiet chairs, loud potential.
              </p>
            )}
            {today.sort((a, b) => a.startTime.localeCompare(b.startTime)).map((b) => (
              <div key={b.id} className="flex items-center gap-3 rounded-xl bg-black/30 p-3 text-sm">
                <span className="flex items-center gap-1.5 rounded-lg bg-[#c9a86a]/15 px-2.5 py-1.5 font-mono text-xs font-bold text-[#e8cf9a]">
                  <Clock className="h-3 w-3" /> {formatTime12(b.startTime)}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-bold">{b.customerName}</span>
                  <span className="block truncate text-xs text-[#a7a7b0]">{b.bookingRef}</span>
                </span>
                <span className="ml-auto font-bold text-[#e8cf9a]">{formatPrice(b.priceCents)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="rounded-2xl border border-white/10 bg-[#131316] p-5">
          <h2 className="font-bold">Quick actions</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {[
              { href: "/admin/hairstyles", t: "Add hairstyle", d: "New service or price" },
              { href: "/admin/availability", t: "Set hours", d: "Weekly rules & days off" },
              { href: "/admin/analytics", t: "View analytics", d: "Revenue & trends" },
              { href: "/admin/deploy", t: "Deploy guide", d: "Ship to Vercel" },
            ].map((q) => (
              <Link key={q.href} href={q.href} className="rounded-xl border border-white/10 bg-black/30 p-4 transition hover:border-[#c9a86a]/50">
                <span className="block text-sm font-bold">{q.t}</span>
                <span className="block text-xs text-[#a7a7b0]">{q.d}</span>
              </Link>
            ))}
          </div>
          <div className="mt-4 rounded-xl border border-[#c9a86a]/30 bg-[#c9a86a]/5 p-4 text-xs leading-relaxed text-[#a7a7b0]">
            <b className="text-[#e8cf9a]">Email status:</b> {analytics ? "see Emails tab for provider details." : ""}
            <Link href="/admin/emails" className="ml-1 font-bold text-[#e8cf9a] hover:underline">Check →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
