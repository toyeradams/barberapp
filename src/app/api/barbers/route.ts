import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { ensureSchema } from "@/db/ensure";
import { barbers } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureSchema();
    const rows = await db.select().from(barbers).where(eq(barbers.isActive, true));
    return NextResponse.json({ barbers: rows });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load barbers" }, { status: 500 });
  }
}
