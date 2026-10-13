import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { ensureSchema } from "@/db/ensure";
import { bookings } from "@/db/schema";
import { requireAdmin } from "@/lib/require-admin";

export const dynamic = "force-dynamic";

const VALID = ["confirmed", "completed", "cancelled", "no_show"];

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  try {
    await ensureSchema();
    const { id } = await ctx.params;
    const body = await req.json().catch(() => ({}));
    const patch: Record<string, unknown> = { updatedAt: new Date() };
    if (body.status) {
      if (!VALID.includes(String(body.status))) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      patch.status = String(body.status);
    }
    if (body.notes !== undefined) patch.notes = String(body.notes).slice(0, 500);
    if (body.barberId !== undefined) patch.barberId = body.barberId == null ? null : Number(body.barberId);
    const updated = await db.update(bookings).set(patch).where(eq(bookings.id, Number(id))).returning();
    if (!updated[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ booking: updated[0] });
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
    await db.delete(bookings).where(eq(bookings.id, Number(id)));
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
