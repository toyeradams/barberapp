import { NextResponse } from "next/server";
import { desc, eq, gte, lte, and } from "drizzle-orm";
import { db } from "@/db";
import { ensureSchema } from "@/db/ensure";
import { bookings } from "@/db/schema";
import { requireAdmin } from "@/lib/require-admin";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  try {
    await ensureSchema();
    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const search = (url.searchParams.get("search") || "").toLowerCase();

    let rows = await db.select().from(bookings);
    if (status && status !== "all") rows = rows.filter((r) => r.status === status);
    if (from) rows = rows.filter((r) => r.date >= from);
    if (to) rows = rows.filter((r) => r.date <= to);
    if (search) {
      rows = rows.filter(
        (r) =>
          r.customerName.toLowerCase().includes(search) ||
          r.customerEmail.toLowerCase().includes(search) ||
          r.bookingRef.toLowerCase().includes(search) ||
          r.customerPhone.includes(search)
      );
    }
    rows.sort((a, b) => (a.date + a.startTime < b.date + b.startTime ? 1 : -1));
    return NextResponse.json({ bookings: rows });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load bookings" }, { status: 500 });
  }
}
