import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { ensureSchema } from "@/db/ensure";
import { hairstyles } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureSchema();
    const rows = await db
      .select()
      .from(hairstyles)
      .where(eq(hairstyles.isActive, true));
    rows.sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
    return NextResponse.json({ hairstyles: rows });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load hairstyles" }, { status: 500 });
  }
}
