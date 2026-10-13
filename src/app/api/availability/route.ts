import { NextResponse } from "next/server";
import { computeSlots, getHairstyleOrNull } from "@/lib/availability";
import { isPastDate, todayISO } from "@/lib/time";

export const dynamic = "force-dynamic";

// GET /api/availability?date=2026-01-20&hairstyleId=1&barberId=2
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const date = url.searchParams.get("date") || "";
    const hairstyleId = Number(url.searchParams.get("hairstyleId") || 0);
    const barberRaw = url.searchParams.get("barberId");
    const barberId = barberRaw && barberRaw !== "any" ? Number(barberRaw) : null;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "Invalid date. Use YYYY-MM-DD." }, { status: 400 });
    }
    if (isPastDate(date)) {
      return NextResponse.json({ date, closed: true, closeReason: "This date is in the past.", slots: [], openHours: null });
    }
    const style = hairstyleId ? await getHairstyleOrNull(hairstyleId) : null;
    const duration = style?.durationMinutes ?? 30;

    const isToday = date === todayISO(0);
    const now = new Date();
    const nowHHMM = isToday
      ? `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
      : undefined;

    const result = await computeSlots({ date, durationMinutes: duration, barberId, nowHHMM });
    return NextResponse.json({ date, durationMinutes: duration, ...result });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to compute availability" }, { status: 500 });
  }
}
