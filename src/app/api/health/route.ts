import { db } from "@/db";
import { ensureSchema } from "@/db/ensure";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureSchema();
    await db.execute(sql`select 1`);
    return Response.json({ ok: true, app: "rizz-fade-barbershop" });
  } catch (e) {
    console.error(e);
    return Response.json({ ok: false }, { status: 500 });
  }
}
