import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { ensureSchema } from "@/db/ensure";
import { barbers, bookings, hairstyles } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET(_: Request, ctx: { params: Promise<{ ref: string }> }) {
  try {
    await ensureSchema();
    const { ref } = await ctx.params;
    const rows = await db.select().from(bookings).where(eq(bookings.bookingRef, ref.toUpperCase()));
    const booking = rows[0];
    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    const style = (await db.select().from(hairstyles).where(eq(hairstyles.id, booking.hairstyleId)))[0] ?? null;
    const barber = booking.barberId
      ? (await db.select().from(barbers).where(eq(barbers.id, booking.barberId)))[0] ?? null
      : null;
    return NextResponse.json({
      booking,
      hairstyle: style,
      barber,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load booking" }, { status: 500 });
  }
}
