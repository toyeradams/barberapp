import { NextResponse } from "next/server";
import { db } from "@/db";
import { ensureSchema } from "@/db/ensure";
import { barbers, bookings, hairstyles } from "@/db/schema";
import { requireAdmin } from "@/lib/require-admin";
import { todayISO } from "@/lib/time";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  try {
    await ensureSchema();
    const url = new URL(req.url);
    const range = url.searchParams.get("range") || "30d";
    const days = range === "7d" ? 7 : range === "90d" ? 90 : 30;

    const today = todayISO(0);
    const fromDate = todayISO(-days + 1);

    const [allBookings, styles, barberRows] = await Promise.all([
      db.select().from(bookings),
      db.select().from(hairstyles),
      db.select().from(barbers),
    ]);

    const inRange = allBookings.filter((b) => b.date >= fromDate && b.date <= todayISO(60));
    const past = allBookings.filter((b) => b.date >= fromDate && b.date <= today);
    const active = past.filter((b) => b.status !== "cancelled" && b.status !== "no_show");
    const upcoming = allBookings.filter(
      (b) => b.date > today && b.status !== "cancelled" && b.status !== "no_show"
    );

    const revenueCents = active.reduce((s, b) => s + b.priceCents, 0);
    const completed = past.filter((b) => b.status === "completed").length;
    const cancelled = past.filter((b) => b.status === "cancelled").length;
    const noShow = past.filter((b) => b.status === "no_show").length;

    // Revenue per day (last N days)
    const byDay: { date: string; bookings: number; revenueCents: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = todayISO(-i);
      const dayB = active.filter((b) => b.date === d);
      byDay.push({ date: d, bookings: dayB.length, revenueCents: dayB.reduce((s, b) => s + b.priceCents, 0) });
    }

    // By hairstyle
    const styleMap = new Map(styles.map((s) => [s.id, s]));
    const byStyleAgg = new Map<number, { bookings: number; revenueCents: number }>();
    for (const b of active) {
      const cur = byStyleAgg.get(b.hairstyleId) ?? { bookings: 0, revenueCents: 0 };
      cur.bookings += 1;
      cur.revenueCents += b.priceCents;
      byStyleAgg.set(b.hairstyleId, cur);
    }
    const byStyle = [...byStyleAgg.entries()].map(([id, v]) => ({
      id,
      name: styleMap.get(id)?.name ?? `#${id}`,
      ...v,
    })).sort((a, b) => b.revenueCents - a.revenueCents);

    // By barber
    const barberMap = new Map(barberRows.map((s) => [s.id, s]));
    const byBarberAgg = new Map<number, { bookings: number; revenueCents: number }>();
    for (const b of active) {
      if (b.barberId == null) continue;
      const cur = byBarberAgg.get(b.barberId) ?? { bookings: 0, revenueCents: 0 };
      cur.bookings += 1;
      cur.revenueCents += b.priceCents;
      byBarberAgg.set(b.barberId, cur);
    }
    const byBarber = [...byBarberAgg.entries()].map(([id, v]) => ({
      id,
      name: barberMap.get(id)?.name ?? `#${id}`,
      ...v,
    })).sort((a, b) => b.bookings - a.bookings);

    // Peak hours
    const byHourAgg = new Map<string, number>();
    for (const b of active) {
      byHourAgg.set(b.startTime.slice(0, 2) + ":00", (byHourAgg.get(b.startTime.slice(0, 2) + ":00") ?? 0) + 1);
    }
    const byHour = [...byHourAgg.entries()].map(([hour, bookings]) => ({ hour, bookings })).sort((a, b) => a.hour.localeCompare(b.hour));

    // Status split
    const byStatus = [
      { status: "confirmed", count: past.filter((b) => b.status === "confirmed").length },
      { status: "completed", count: completed },
      { status: "cancelled", count: cancelled },
      { status: "no_show", count: noShow },
    ];

    const avgTicket = active.length ? Math.round(revenueCents / active.length) : 0;

    return NextResponse.json({
      range,
      days,
      kpis: {
        revenueCents,
        bookings: active.length,
        upcoming: upcoming.length,
        avgTicketCents: avgTicket,
        completed,
        cancelled,
        noShow,
        cancellationRate: past.length ? Math.round((cancelled / past.length) * 1000) / 10 : 0,
      },
      byDay,
      byStyle,
      byBarber,
      byHour,
      byStatus,
      todayCount: allBookings.filter((b) => b.date === today && b.status !== "cancelled" && b.status !== "no_show").length,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Analytics failed" }, { status: 500 });
  }
}
