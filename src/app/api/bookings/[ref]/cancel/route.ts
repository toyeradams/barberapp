import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { ensureSchema } from "@/db/ensure";
import { bookings } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function POST(req: Request, ctx: { params: Promise<{ ref: string }> }) {
  try {
    await ensureSchema();
    const { ref } = await ctx.params;
    const body = await req.json().catch(() => ({}));
    const email = String(body.email ?? "").trim().toLowerCase();

    const rows = await db.select().from(bookings).where(eq(bookings.bookingRef, ref.toUpperCase()));
    const booking = rows[0];
    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    if (email && booking.customerEmail.toLowerCase() !== email) {
      return NextResponse.json({ error: "Email does not match this booking." }, { status: 403 });
    }
    if (booking.status === "cancelled") return NextResponse.json({ booking });
    if (booking.status === "completed") {
      return NextResponse.json({ error: "This booking is already completed." }, { status: 400 });
    }
    const updated = await db
      .update(bookings)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(eq(bookings.id, booking.id))
      .returning();
    return NextResponse.json({ booking: updated[0] });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to cancel booking" }, { status: 500 });
  }
}
