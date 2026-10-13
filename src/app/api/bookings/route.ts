import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { ensureSchema } from "@/db/ensure";
import { barbers, bookings, emailLogs, hairstyles } from "@/db/schema";
import { computeSlots } from "@/lib/availability";
import { buildConfirmationHtml, sendBookingEmail } from "@/lib/email";
import { addMinutesToTime, generateBookingRef, isPastDate, todayISO } from "@/lib/time";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export async function POST(req: Request) {
  try {
    await ensureSchema();
    const body = await req.json().catch(() => ({}));
    const {
      customerName = "",
      customerEmail = "",
      customerPhone = "",
      hairstyleId,
      barberId = null,
      date = "",
      startTime = "",
      notes = "",
    } = body as Record<string, unknown>;

    const name = String(customerName).trim();
    const email = String(customerEmail).trim().toLowerCase();
    const phone = String(customerPhone ?? "").trim();
    const styleId = Number(hairstyleId);
    const barber = barberId === "any" || barberId === null || barberId === undefined || barberId === "" ? null : Number(barberId);
    const d = String(date);
    const start = String(startTime);

    if (name.length < 2) return NextResponse.json({ error: "Please enter your full name." }, { status: 400 });
    if (!isEmail(email)) return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    if (!styleId) return NextResponse.json({ error: "Please select a hairstyle." }, { status: 400 });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return NextResponse.json({ error: "Please choose a valid date." }, { status: 400 });
    if (isPastDate(d)) return NextResponse.json({ error: "You can't book a date in the past." }, { status: 400 });
    if (!/^\d{2}:\d{2}$/.test(start)) return NextResponse.json({ error: "Please choose a time slot." }, { status: 400 });

    const styleRows = await db.select().from(hairstyles).where(eq(hairstyles.id, styleId));
    const style = styleRows[0];
    if (!style || !style.isActive) return NextResponse.json({ error: "Selected hairstyle is unavailable." }, { status: 400 });

    if (barber != null) {
      const bRows = await db.select().from(barbers).where(eq(barbers.id, barber));
      if (!bRows[0] || !bRows[0].isActive) return NextResponse.json({ error: "Selected barber is unavailable." }, { status: 400 });
    }

    const isToday = d === todayISO(0);
    const now = new Date();
    const nowHHMM = isToday
      ? `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
      : undefined;

    // Re-validate slot is still free (prevents double-booking)
    const avail = await computeSlots({ date: d, durationMinutes: style.durationMinutes, barberId: barber, nowHHMM });
    if (avail.closed) return NextResponse.json({ error: avail.closeReason || "We're closed on that date." }, { status: 400 });
    const slot = avail.slots.find((s) => s.time === start);
    if (!slot || !slot.available) {
      return NextResponse.json({ error: "Sorry — that time was just taken. Please pick another slot." }, { status: 409 });
    }

    const assignedBarberId = barber ?? slot.barbersAvailable[0] ?? null;
    if (!assignedBarberId) return NextResponse.json({ error: "No barber available for that slot." }, { status: 409 });

    const end = addMinutesToTime(start, style.durationMinutes);
    const ref = generateBookingRef();

    const inserted = await db
      .insert(bookings)
      .values({
        bookingRef: ref,
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        hairstyleId: style.id,
        barberId: assignedBarberId,
        date: d,
        startTime: start,
        endTime: end,
        durationMinutes: style.durationMinutes,
        priceCents: style.priceCents,
        status: "confirmed",
        notes: String(notes ?? "").slice(0, 500),
      })
      .returning();

    const booking = inserted[0];
    const barberRows = await db.select().from(barbers).where(eq(barbers.id, assignedBarberId));
    const barberName = barberRows[0]?.name ?? "First available";

    // Attempt live delivery. A missing email provider never rolls back the booking,
    // but is explicitly reported as failed instead of pretending it was sent.
    const emailData = {
      bookingRef: ref,
      customerName: name,
      customerEmail: email,
      customerPhone: phone,
      date: d,
      startTime: start,
      endTime: end,
      durationMinutes: style.durationMinutes,
      priceCents: style.priceCents,
      notes: String(notes ?? "").slice(0, 500),
      hairstyleName: style.name,
      barberName,
      status: "confirmed",
    };
    let emailStatus: { provider: string; sent: boolean; error?: string } = {
      provider: "unconfigured",
      sent: false,
      error: "No email provider is configured.",
    };
    let emailHtml = "";
    try {
      const { result, html } = await sendBookingEmail(emailData, req.url);
      emailHtml = html;
      emailStatus = {
        provider: result.provider,
        sent: result.ok,
        error: result.ok ? undefined : result.error,
      };
    } catch (e) {
      emailHtml = buildConfirmationHtml(emailData, req.url);
      emailStatus = {
        provider: "unknown",
        sent: false,
        error: e instanceof Error ? e.message : String(e),
      };
      console.error("[booking] Confirmation email failed:", e);
    }

    // Email logging is best-effort; a logging issue must not change actual delivery status.
    try {
      await db.insert(emailLogs).values({
        bookingRef: ref,
        toEmail: email,
        subject: `Booking confirmed ${ref}`,
        provider: emailStatus.provider,
        status: emailStatus.sent ? "sent" : "failed",
        previewHtml: emailHtml,
        error: emailStatus.error ?? "",
      });
    } catch (e) {
      console.error("[booking] Could not write email log:", e);
    }

    return NextResponse.json(
      {
        booking: { ...booking, hairstyleName: style.name, barberName },
        email: emailStatus,
      },
      { status: 201 }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Something went wrong creating your booking." }, { status: 500 });
  }
}

// Lookup bookings by email (for "My bookings")
export async function GET(req: Request) {
  try {
    await ensureSchema();
    const url = new URL(req.url);
    const email = (url.searchParams.get("email") || "").trim().toLowerCase();
    if (!email) return NextResponse.json({ error: "email query param required" }, { status: 400 });
    const rows = await db.select().from(bookings).where(eq(bookings.customerEmail, email));
    rows.sort((a, b) => (a.date < b.date ? 1 : -1));
    return NextResponse.json({ bookings: rows.slice(0, 20) });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
}
