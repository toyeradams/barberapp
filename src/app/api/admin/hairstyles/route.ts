import { NextResponse } from "next/server";
import { db } from "@/db";
import { ensureSchema } from "@/db/ensure";
import { hairstyles } from "@/db/schema";
import { requireAdmin } from "@/lib/require-admin";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  await ensureSchema();
  const rows = await db.select().from(hairstyles);
  rows.sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
  return NextResponse.json({ hairstyles: rows });
}

export async function POST(req: Request) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  try {
    await ensureSchema();
    const b = await req.json();
    if (!b.name || String(b.name).trim().length < 2)
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    const inserted = await db
      .insert(hairstyles)
      .values({
        name: String(b.name).trim(),
        description: String(b.description ?? ""),
        priceCents: b.priceCents !== undefined ? Number(b.priceCents) : Math.max(0, Math.round(Number(b.price || 0) * 100)),
        durationMinutes: Math.max(10, Number(b.durationMinutes) || 30),
        category: String(b.category || "Haircut"),
        imageUrl: String(b.imageUrl || ""),
        isActive: b.isActive !== false,
        sortOrder: Number(b.sortOrder) || 0,
      })
      .returning();
    return NextResponse.json({ hairstyle: inserted[0] }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}
