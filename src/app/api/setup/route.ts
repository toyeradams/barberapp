import { NextResponse } from "next/server";
import { count } from "drizzle-orm";
import { db } from "@/db";
import { ensureSchema } from "@/db/ensure";
import { availabilityRules, barbers, hairstyles } from "@/db/schema";
import { SEED_BARBERS, SEED_HAIRSTYLES, SEED_RULES } from "@/db/seed-data";

export const dynamic = "force-dynamic";

// GET /api/setup — check whether DB is initialised (used by deploy guide + first run)
export async function GET() {
  try {
    await ensureSchema();
    const [h, b, r] = await Promise.all([
      db.select({ c: count() }).from(hairstyles),
      db.select({ c: count() }).from(barbers),
      db.select({ c: count() }).from(availabilityRules),
    ]);
    const seeded = h[0].c > 0 && b[0].c > 0;
    return NextResponse.json({
      ok: true,
      seeded,
      counts: { hairstyles: h[0].c, barbers: b[0].c, rules: r[0].c },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

// POST /api/setup — seed demo data (idempotent-ish: only seeds empty tables unless ?force=1)
export async function POST(req: Request) {
  try {
    await ensureSchema();
    const url = new URL(req.url);
    const force = url.searchParams.get("force") === "1";

    const existingStyles = await db.select({ c: count() }).from(hairstyles);
    const existingBarbers = await db.select({ c: count() }).from(barbers);
    const existingRules = await db.select({ c: count() }).from(availabilityRules);

    let inserted = { hairstyles: 0, barbers: 0, rules: 0 };

    if (force || existingStyles[0].c === 0) {
      if (force) await db.delete(hairstyles);
      await db.insert(hairstyles).values(
        SEED_HAIRSTYLES.map((s) => ({ ...s, isActive: true }))
      );
      inserted.hairstyles = SEED_HAIRSTYLES.length;
    }
    if (force || existingBarbers[0].c === 0) {
      if (force) await db.delete(barbers);
      await db.insert(barbers).values(SEED_BARBERS.map((b) => ({ ...b, isActive: true })));
      inserted.barbers = SEED_BARBERS.length;
    }
    if (force || existingRules[0].c === 0) {
      if (force) await db.delete(availabilityRules);
      await db.insert(availabilityRules).values(
        SEED_RULES.map((r) => ({ ...r, barberId: null, slotIntervalMinutes: 30, isActive: true }))
      );
      inserted.rules = SEED_RULES.length;
    }

    return NextResponse.json({ ok: true, inserted });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
