import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { ensureSchema } from "@/db/ensure";
import { hairstyles } from "@/db/schema";
import { requireAdmin } from "@/lib/require-admin";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  try {
    await ensureSchema();
    const { id } = await ctx.params;
    const b = await req.json();
    const patch: Record<string, unknown> = { updatedAt: new Date() };
    if (b.name !== undefined) patch.name = String(b.name);
    if (b.description !== undefined) patch.description = String(b.description);
    if (b.price !== undefined) patch.priceCents = Math.max(0, Math.round(Number(b.price) * 100));
    if (b.priceCents !== undefined && b.price === undefined) patch.priceCents = Number(b.priceCents);
    if (b.durationMinutes !== undefined) patch.durationMinutes = Number(b.durationMinutes);
    if (b.category !== undefined) patch.category = String(b.category);
    if (b.imageUrl !== undefined) patch.imageUrl = String(b.imageUrl);
    if (b.isActive !== undefined) patch.isActive = Boolean(b.isActive);
    if (b.sortOrder !== undefined) patch.sortOrder = Number(b.sortOrder);
    const updated = await db.update(hairstyles).set(patch).where(eq(hairstyles.id, Number(id))).returning();
    if (!updated[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ hairstyle: updated[0] });
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
    await db.delete(hairstyles).where(eq(hairstyles.id, Number(id)));
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
