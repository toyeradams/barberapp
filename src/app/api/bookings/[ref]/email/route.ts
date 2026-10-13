import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { ensureSchema } from "@/db/ensure";
import { barbers, bookings, emailLogs, hairstyles } from "@/db/schema";
import { buildConfirmationHtml, sendBookingEmail } from "@/lib/email";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(req: Request, ctx: { params: Promise<{ ref: string }> }) {
  try {
    await ensureSchema();
    const { ref } = await ctx.params;
    const body = await req.json().catch(() => ({}));
    const email = String(body.email ?? "").trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Enter the email address used for this booking." }, { status: 400 });
    }

    const bookingRows = await db
      .select()
      .from(bookings)
      .where(eq(bookings.bookingRef, ref.toUpperCase()));
    const booking = bookingRows[0];
    if (!booking) return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    if (booking.customerEmail.toLowerCase() !== email) {
      return NextResponse.json({ error: "That email address does not match the booking." }, { status: 403 });
    }
    if (booking.status !== "confirmed") {
      return NextResponse.json({ error: `This booking is ${booking.status.replace("_", " ")}; only confirmed bookings can receive a confirmation email.` }, { status: 400 });
    }

    const [styleRows, barberRows] = await Promise.all([
      db.select().from(hairstyles).where(eq(hairstyles.id, booking.hairstyleId)),
      booking.barberId
        ? db.select().from(barbers).where(eq(barbers.id, booking.barberId))
        : Promise.resolve([]),
    ]);
    const style = styleRows[0];
    const barber = barberRows[0];
    const emailData = {
      bookingRef: booking.bookingRef,
      customerName: booking.customerName,
      customerEmail: booking.customerEmail,
      customerPhone: booking.customerPhone,
      date: booking.date,
      startTime: booking.startTime,
      endTime: booking.endTime,
      durationMinutes: booking.durationMinutes,
      priceCents: booking.priceCents,
      notes: booking.notes,
      hairstyleName: style?.name ?? "Barber service",
      barberName: barber?.name ?? "First available",
      status: booking.status,
    };

    let delivery: Awaited<ReturnType<typeof sendBookingEmail>>;
    try {
      delivery = await sendBookingEmail(emailData, req.url);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      const html = buildConfirmationHtml(emailData, req.url);
      await db.insert(emailLogs).values({
        bookingRef: booking.bookingRef,
        toEmail: booking.customerEmail,
        subject: `Booking confirmed ${booking.bookingRef}`,
        provider: "unknown",
        status: "failed",
        previewHtml: html,
        error: message,
      });
      return NextResponse.json({ error: `Email could not be sent: ${message}`, email: { sent: false } }, { status: 502 });
    }

    const { result, html } = delivery;
    try {
      await db.insert(emailLogs).values({
        bookingRef: booking.bookingRef,
        toEmail: booking.customerEmail,
        subject: `Booking confirmed ${booking.bookingRef}`,
        provider: result.provider,
        status: result.ok ? "sent" : "failed",
        previewHtml: html,
        error: result.ok ? "" : result.error,
      });
    } catch (e) {
      console.error("[booking-email] Could not write email log:", e);
    }

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, email: { sent: false, provider: result.provider, error: result.error } },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, email: { sent: true, provider: result.provider } });
  } catch (e) {
    console.error("[booking-email] Retry failed:", e);
    return NextResponse.json({ error: "Unable to resend confirmation email right now." }, { status: 500 });
  }
}
