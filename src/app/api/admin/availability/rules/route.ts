import { NextResponse } from "next/server";
import { db } from "@/db";
import { ensureSchema } from "@/db/ensure";
import { availabilityRules } from "@/db/schema";
import { requireAdmin } from "@/lib/require-admin";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  await ensureSchema();
  const rows = await db.select().from(availabilityRules);
  rows.sort((a, b) => (a.barberId ?? -1) - (b.barberId ?? -1) || a.dayOfWeek - b.dayOfWeek);
  return NextResponse.json({ rules: rows });
}

export async function POST(req: Request) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  try {
    await ensureSchema();
    const b = await req.json();
    const day = Number(b.dayOfWeek);
    if (!(day >= 0 && day <= 6)) return NextResponse.json({ error: "dayOfWeek must be 0-6" }, { status: 400 });
    if (!/^\d{2}:\d{2}$/.test(String(b.startTime)) || !/^\d{2}:\d{2}$/.test(String(b.endTime)))
      return NextResponse.json({ error: "startTime/endTime must be HH:MM" }, { status: 400 });
    const inserted = await db
      .insert(availabilityRules)
      .values({
        barberId: b.barberId == null ? null : Number(b.barberId),
        dayOfWeek: day,
        startTime: String(b.startTime),
        endTime: String(b.endTime),
        slotIntervalMinutes: Number(b.slotIntervalMinutes) || 30,
        isActive: b.isActive !== false,
      })
      .returning();
    return NextResponse.json({ rule: inserted[0] }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}
