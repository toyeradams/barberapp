import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { ensureSchema } from "@/db/ensure";
import { availabilityRules } from "@/db/schema";
import { requireAdmin } from "@/lib/require-admin";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  try {
    await ensureSchema();
    const { id } = await ctx.params;
    const b = await req.json();
    const patch: Record<string, unknown> = {};
    if (b.dayOfWeek !== undefined) patch.dayOfWeek = Number(b.dayOfWeek);
    if (b.startTime !== undefined) patch.startTime = String(b.startTime);
    if (b.endTime !== undefined) patch.endTime = String(b.endTime);
    if (b.slotIntervalMinutes !== undefined) patch.slotIntervalMinutes = Number(b.slotIntervalMinutes);
    if (b.isActive !== undefined) patch.isActive = Boolean(b.isActive);
    if (b.barberId !== undefined) patch.barberId = b.barberId == null ? null : Number(b.barberId);
    const updated = await db.update(availabilityRules).set(patch).where(eq(availabilityRules.id, Number(id))).returning();
    if (!updated[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ rule: updated[0] });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  try {
    await ensureSchema();
    const { id } = await ctx.params;
    await db.delete(availabilityRules).where(eq(availabilityRules.id, Number(id)));
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
