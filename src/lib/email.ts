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
  return process.env.SHOP_NAME || "Rizz Fade Barbershop";
}

function resolveAppUrl(requestUrl?: string): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) return `https://${vercelUrl.replace(/\/$/, "")}`;
  if (requestUrl) {
    try {
      return new URL(requestUrl).origin;
    } catch {
      // Use a relative manage link when the request URL is not available.
    }
  }
  return "";
}

export function buildConfirmationHtml(b: BookingEmailData, requestUrl?: string): string {
  const shop = shopName();
  const baseUrl = resolveAppUrl(requestUrl);
  const manageLink = baseUrl ? `${baseUrl}/booking/${encodeURIComponent(b.bookingRef)}` : `/booking/${encodeURIComponent(b.bookingRef)}`;
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{margin:0;background:#0c0c0e;font-family:Georgia,'Times New Roman',serif;color:#f5efe6} .wrap{max-width:600px;margin:0 auto;padding:32px 20px} .card{background:#17171b;border:1px solid #2b2b31;border-radius:20px;overflow:hidden} .hero{background:linear-gradient(135deg,#c9a86a,#8a6d35);padding:36px 32px;text-align:center} .hero h1{margin:0;font-size:30px;letter-spacing:2px;color:#0c0c0e} .hero p{margin:8px 0 0;color:#231a08;font-family:Arial,sans-serif;font-size:13px;letter-spacing:3px;text-transform:uppercase} .body{padding:32px} .ref{display:inline-block;background:#0c0c0e;border:1px dashed #c9a86a;color:#c9a86a;padding:8px 18px;border-radius:999px;font-family:Arial,sans-serif;letter-spacing:2px;font-size:14px;font-weight:bold} h2{color:#fff;font-size:20px;margin:20px 0 6px} .sub{color:#a3a3ab;font-family:Arial,sans-serif;font-size:14px;margin:0 0 20px} .rows{border-top:1px solid #2b2b31} .row{display:flex;justify-content:space-between;padding:13px 0;border-bottom:1px solid #2b2b31;font-family:Arial,sans-serif;font-size:14px} .row span:first-child{color:#8f8f96} .row span:last-child{color:#fff;font-weight:bold;text-align:right} .cta{display:block;text-align:center;background:#c9a86a;color:#0c0c0e!important;text-decoration:none;font-family:Arial,sans-serif;font-weight:bold;padding:15px;border-radius:12px;margin-top:24px;letter-spacing:1px} .foot{color:#6b6b72;font-family:Arial,sans-serif;font-size:12px;text-align:center;margin-top:22px;line-height:1.7}</style>
</head><body><div class="wrap"><div class="card">
<div class="hero"><p>${escapeHtml(shop)}</p><h1>BOOKING CONFIRMED</h1></div>
<div class="body">
<div style="text-align:center"><span class="ref">${escapeHtml(b.bookingRef)}</span></div>
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
<a class="cta" href="${escapeHtml(manageLink)}">VIEW / MANAGE BOOKING</a>
<p class="foot">Need to reschedule or cancel? Please reply to this email or use the link above.<br>${escapeHtml(shop)} • Walk-ins welcome, bookings preferred.</p>
</div></div></div></body></html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildConfirmationText(b: BookingEmailData, requestUrl?: string): string {
  const baseUrl = resolveAppUrl(requestUrl);
  const manageUrl = `${baseUrl}/booking/${encodeURIComponent(b.bookingRef)}`;
  return `${shopName()} — Booking Confirmed (${b.bookingRef})
Hi ${b.customerName}!
Service: ${b.hairstyleName}
Barber: ${b.barberName}
Date: ${formatDateLong(b.date)}
Time: ${formatTime12(b.startTime)} - ${formatTime12(b.endTime)}
Duration: ${b.durationMinutes} min
Price: ${formatPrice(b.priceCents)}
Manage: ${manageUrl}`;
}

type SendResult =
  | { ok: true; provider: string; id?: string }
  | { ok: false; provider: string; error: string };

export async function sendBookingEmail(
  data: BookingEmailData,
  requestUrl?: string
): Promise<{ result: SendResult; html: string }> {
  const html = buildConfirmationHtml(data, requestUrl);
  const text = buildConfirmationText(data, requestUrl);
  const subject = `Booking confirmed ${data.bookingRef} — ${formatDateLong(data.date)} at ${formatTime12(data.startTime)}`;
  const to = data.customerEmail;
  const resendKey = process.env.RESEND_API_KEY?.trim();
  const smtpHost = process.env.SMTP_HOST?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  const failures: string[] = [];

  // Try Resend first. It requires a sender from a verified domain in production.
  if (resendKey) {
    if (!from) {
      failures.push("Resend is configured but EMAIL_FROM is missing. Set it to an address on a verified Resend domain.");
    } else {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ from, to, subject, html, text }),
          signal: AbortSignal.timeout(15_000),
        });
        const json = (await res.json().catch(() => ({}))) as {
          id?: string;
          message?: string;
          name?: string;
        };
        if (res.ok) return { result: { ok: true, provider: "resend", id: json.id }, html };
        const message = json.message || json.name || `HTTP ${res.status}`;
        failures.push(`Resend rejected the email: ${message}`);
      } catch (e) {
        failures.push(`Resend request failed: ${errorMessage(e)}`);
      }
    }
  }

  // If Resend isn't available or rejects the request, use SMTP when configured.
  if (smtpHost) {
    const smtpFrom = from || process.env.SMTP_USER?.trim();
    if (!smtpFrom) {
      failures.push("SMTP is configured but no sender is available. Set EMAIL_FROM or SMTP_USER.");
    } else {
      let transporter: Awaited<ReturnType<(typeof import("nodemailer"))["createTransport"]>> | undefined;
      try {
        const nodemailer = await import("nodemailer");
        transporter = nodemailer.createTransport({
          host: smtpHost,
          port: Number(process.env.SMTP_PORT || 587),
          secure: process.env.SMTP_SECURE === "true" || Number(process.env.SMTP_PORT) === 465,
          auth:
            process.env.SMTP_USER || process.env.SMTP_PASS
              ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
              : undefined,
          connectionTimeout: 10_000,
          greetingTimeout: 10_000,
          socketTimeout: 15_000,
        });
        const info = await transporter.sendMail({ from: smtpFrom, to, subject, html, text });
        return { result: { ok: true, provider: "smtp", id: String(info.messageId || "") }, html };
      } catch (e) {
        failures.push(`SMTP delivery failed: ${errorMessage(e)}`);
      } finally {
        transporter?.close();
      }
    }
  }

  const provider = resendKey ? "resend" : smtpHost ? "smtp" : "unconfigured";
  const error = failures.length
    ? failures.join("; ")
    : "No email provider is configured. Set RESEND_API_KEY and EMAIL_FROM (verified sender), or configure SMTP_HOST, SMTP_USER, SMTP_PASS, and EMAIL_FROM.";
  console.error(`[email] Confirmation was not delivered via ${provider}: ${error}`);
  return { result: { ok: false, provider, error }, html };
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

export function emailProviderStatus(): { provider: string; configured: boolean; hint: string } {
  const resendKey = Boolean(process.env.RESEND_API_KEY?.trim());
  const smtpHost = Boolean(process.env.SMTP_HOST?.trim());
  const from = Boolean(process.env.EMAIL_FROM?.trim());
  const smtpSender = Boolean(process.env.SMTP_USER?.trim());

  if (resendKey && from) {
    return {
      provider: "resend",
      configured: true,
      hint: "Resend credentials and sender are configured. The sender address must belong to a verified Resend domain.",
    };
  }
  if (resendKey && !from && smtpHost && (smtpSender || from)) {
    return {
      provider: "smtp",
      configured: true,
      hint: "Resend has no EMAIL_FROM sender; SMTP will be used as fallback.",
    };
  }
  if (resendKey && !from) {
    return {
      provider: "resend",
      configured: false,
      hint: "RESEND_API_KEY is set, but EMAIL_FROM is missing. Add a sender address from a verified Resend domain.",
    };
  }
  if (smtpHost && (from || smtpSender)) {
    return {
      provider: "smtp",
      configured: true,
      hint: `SMTP ${process.env.SMTP_HOST} credentials and sender are configured.`,
    };
  }
  if (smtpHost) {
    return {
      provider: "smtp",
      configured: false,
      hint: "SMTP_HOST is set, but add SMTP_USER or EMAIL_FROM so the mail server can identify the sender.",
    };
  }
  return {
    provider: "unconfigured",
    configured: false,
    hint: "No live email provider is configured. Set RESEND_API_KEY and EMAIL_FROM (verified sender), or configure SMTP_* variables. Until then, bookings are saved but confirmation emails cannot be delivered.",
  };
}
