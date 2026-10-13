import { formatDateLong, formatPrice, formatTime12 } from "./time";

export type BookingEmailData = {
  bookingRef: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  priceCents: number;
  notes: string;
  hairstyleName: string;
  barberName: string;
  status: string;
};

export function shopName(): string {
  return process.env.SHOP_NAME || "SharpFade Barbershop";
}

export function buildConfirmationHtml(b: BookingEmailData): string {
  const shop = shopName();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const manageLink = appUrl ? `${appUrl}/booking/${b.bookingRef}` : `/booking/${b.bookingRef}`;
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{margin:0;background:#0c0c0e;font-family:Georgia,'Times New Roman',serif;color:#f5efe6} .wrap{max-width:600px;margin:0 auto;padding:32px 20px} .card{background:#17171b;border:1px solid #2b2b31;border-radius:20px;overflow:hidden} .hero{background:linear-gradient(135deg,#c9a86a,#8a6d35);padding:36px 32px;text-align:center} .hero h1{margin:0;font-size:30px;letter-spacing:2px;color:#0c0c0e} .hero p{margin:8px 0 0;color:#231a08;font-family:Arial,sans-serif;font-size:13px;letter-spacing:3px;text-transform:uppercase} .body{padding:32px} .ref{display:inline-block;background:#0c0c0e;border:1px dashed #c9a86a;color:#c9a86a;padding:8px 18px;border-radius:999px;font-family:Arial,sans-serif;letter-spacing:2px;font-size:14px;font-weight:bold} h2{color:#fff;font-size:20px;margin:20px 0 6px} .sub{color:#a3a3ab;font-family:Arial,sans-serif;font-size:14px;margin:0 0 20px} .rows{border-top:1px solid #2b2b31} .row{display:flex;justify-content:space-between;padding:13px 0;border-bottom:1px solid #2b2b31;font-family:Arial,sans-serif;font-size:14px} .row span:first-child{color:#8f8f96} .row span:last-child{color:#fff;font-weight:bold;text-align:right} .cta{display:block;text-align:center;background:#c9a86a;color:#0c0c0e!important;text-decoration:none;font-family:Arial,sans-serif;font-weight:bold;padding:15px;border-radius:12px;margin-top:24px;letter-spacing:1px} .foot{color:#6b6b72;font-family:Arial,sans-serif;font-size:12px;text-align:center;margin-top:22px;line-height:1.7}</style>
</head><body><div class="wrap"><div class="card">
<div class="hero"><p>${shop}</p><h1>BOOKING CONFIRMED</h1></div>
<div class="body">
<div style="text-align:center"><span class="ref">${b.bookingRef}</span></div>
<h2>Hi ${escapeHtml(b.customerName)}, you're booked in. ✂</h2>
<p class="sub">Show this email or your booking reference when you arrive. We can't wait to get you looking sharp.</p>
<div class="rows">
<div class="row"><span>Service</span><span>${escapeHtml(b.hairstyleName)}</span></div>
<div class="row"><span>Barber</span><span>${escapeHtml(b.barberName)}</span></div>
<div class="row"><span>Date</span><span>${formatDateLong(b.date)}</span></div>
<div class="row"><span>Time</span><span>${formatTime12(b.startTime)} – ${formatTime12(b.endTime)}</span></div>
<div class="row"><span>Duration</span><span>${b.durationMinutes} min</span></div>
<div class="row"><span>Price</span><span>${formatPrice(b.priceCents)}</span></div>
${b.customerPhone ? `<div class="row"><span>Phone</span><span>${escapeHtml(b.customerPhone)}</span></div>` : ""}
${b.notes ? `<div class="row"><span>Notes</span><span>${escapeHtml(b.notes)}</span></div>` : ""}
</div>
<a class="cta" href="${manageLink}">VIEW / MANAGE BOOKING</a>
<p class="foot">Need to reschedule or cancel? Please reply to this email or use the link above.<br>${shop} • Walk-ins welcome, bookings preferred.</p>
</div></div></div></body></html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildConfirmationText(b: BookingEmailData): string {
  return `${shopName()} — Booking Confirmed (${b.bookingRef})
Hi ${b.customerName}!
Service: ${b.hairstyleName}
Barber: ${b.barberName}
Date: ${formatDateLong(b.date)}
Time: ${formatTime12(b.startTime)} - ${formatTime12(b.endTime)}
Duration: ${b.durationMinutes} min
Price: ${formatPrice(b.priceCents)}
Manage: ${process.env.NEXT_PUBLIC_APP_URL || ""}/booking/${b.bookingRef}`;
}

type SendResult =
  | { ok: true; provider: string; id?: string }
  | { ok: false; provider: string; error: string };

export async function sendBookingEmail(
  data: BookingEmailData
): Promise<{ result: SendResult; html: string }> {
  const html = buildConfirmationHtml(data);
  const text = buildConfirmationText(data);
  const subject = `Booking confirmed ${data.bookingRef} — ${formatDateLong(data.date)} at ${formatTime12(data.startTime)}`;
  const from = process.env.EMAIL_FROM || "SharpFade Barbershop <bookings@sharpfade.shop>";
  const to = data.customerEmail;

  // 1) Resend (recommended on Vercel — easiest)
  if (process.env.RESEND_API_KEY) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from, to, subject, html, text }),
      });
      const json = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
      if (res.ok) return { result: { ok: true, provider: "resend", id: json.id }, html };
      return { result: { ok: false, provider: "resend", error: json.message || `HTTP ${res.status}` }, html };
    } catch (e) {
      return { result: { ok: false, provider: "resend", error: String(e) }, html };
    }
  }

  // 2) SMTP via nodemailer (Gmail, SendGrid, Mailgun, etc.)
  if (process.env.SMTP_HOST) {
    try {
      const nodemailer = await import("nodemailer");
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === "true" || Number(process.env.SMTP_PORT) === 465,
        auth:
          process.env.SMTP_USER || process.env.SMTP_PASS
            ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
            : undefined,
      });
      const info = await transporter.sendMail({ from, to, subject, html, text });
      return { result: { ok: true, provider: "smtp", id: String(info.messageId || "") }, html };
    } catch (e) {
      return { result: { ok: false, provider: "smtp", error: String(e) }, html };
    }
  }

  // 3) No provider configured — log to console (demo mode). Booking still succeeds.
  console.log("━".repeat(60));
  console.log(`[email:console] To: ${to}\nSubject: ${subject}\n${text}`);
  console.log("━".repeat(60));
  return { result: { ok: true, provider: "console", id: "demo" }, html };
}

export function emailProviderStatus(): { provider: string; configured: boolean; hint: string } {
  if (process.env.RESEND_API_KEY)
    return { provider: "resend", configured: true, hint: "Resend API key detected — live emails enabled." };
  if (process.env.SMTP_HOST)
    return { provider: "smtp", configured: true, hint: `SMTP ${process.env.SMTP_HOST} detected — live emails enabled.` };
  return {
    provider: "console",
    configured: false,
    hint: "No email provider configured. Set RESEND_API_KEY or SMTP_* vars. Bookings still work; emails are logged + stored for preview.",
  };
}
