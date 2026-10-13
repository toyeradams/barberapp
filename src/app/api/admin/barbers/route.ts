import { NextResponse } from "next/server";
import { db } from "@/db";
import { ensureSchema } from "@/db/ensure";
import { barbers } from "@/db/schema";
import { requireAdmin } from "@/lib/require-admin";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  await ensureSchema();
  const rows = await db.select().from(barbers);
  return NextResponse.json({ barbers: rows });
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
      .insert(barbers)
      .values({
        name: String(b.name).trim(),
        title: String(b.title || "Barber"),
        bio: String(b.bio || ""),
        avatarUrl: String(b.avatarUrl || ""),
        specialties: String(b.specialties || ""),
        rating: String(b.rating || "5.00"),
        isActive: b.isActive !== false,
      })
      .returning();
    return NextResponse.json({ barber: inserted[0] }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}
