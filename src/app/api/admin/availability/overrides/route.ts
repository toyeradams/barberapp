import { NextResponse } from "next/server";
import { db } from "@/db";
import { ensureSchema } from "@/db/ensure";
import { availabilityOverrides } from "@/db/schema";
import { requireAdmin } from "@/lib/require-admin";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  await ensureSchema();
  const rows = await db.select().from(availabilityOverrides);
  rows.sort((a, b) => (a.date < b.date ? 1 : -1));
  return NextResponse.json({ overrides: rows });
}

export async function POST(req: Request) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  try {
    await ensureSchema();
    const b = await req.json();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(b.date)))
      return NextResponse.json({ error: "date must be YYYY-MM-DD" }, { status: 400 });
    const inserted = await db
      .insert(availabilityOverrides)
      .values({
        date: String(b.date),
        barberId: b.barberId == null || b.barberId === "" ? null : Number(b.barberId),
        isClosed: Boolean(b.isClosed),
        startTime: b.startTime ? String(b.startTime) : null,
        endTime: b.endTime ? String(b.endTime) : null,
        reason: String(b.reason || ""),
      })
      .returning();
    return NextResponse.json({ override: inserted[0] }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}
