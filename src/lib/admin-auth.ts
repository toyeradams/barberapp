import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE = "rizz_fade_admin";
export const LEGACY_ADMIN_COOKIE = "sharpfade_admin";

function secret(): string {
  return process.env.ADMIN_SESSION_SECRET || "rizz-fade-dev-secret-change-me";
}

export function adminPassword(): string {
  return process.env.ADMIN_PASSWORD || "admin123";
}

type Payload = { admin: true; exp: number };

function b64urlEncode(s: string): string {
  return Buffer.from(s, "utf8").toString("base64url");
}
function b64urlDecode(s: string): string {
  return Buffer.from(s, "base64url").toString("utf8");
}

export function createAdminToken(): string {
  const payload: Payload = { admin: true, exp: Date.now() + 7 * 24 * 3600 * 1000 };
  const body = b64urlEncode(JSON.stringify(payload));
  const sig = createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyAdminToken(
  token: string | undefined | null,
  signingSecret = secret()
): boolean {
  if (!token || !token.includes(".")) return false;
  try {
    const [body, sig] = token.split(".");
    const expected = createHmac("sha256", signingSecret).update(body).digest("base64url");
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
    const payload = JSON.parse(b64urlDecode(body)) as Payload;
    if (!payload.admin) return false;
    if (Date.now() > payload.exp) return false;
    return true;
  } catch {
    return false;
  }
}

export function adminCookieHeader(token: string): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${ADMIN_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 3600}${secure}`;
}

export function clearAdminCookieHeader(): string {
  return `${ADMIN_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export function getCookieFromHeader(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return rest.join("=");
  }
  return null;
}

/** Accept sessions created before the Rizz Fade cookie rename. */
export function verifyAdminCookieHeader(cookieHeader: string | null): boolean {
  const current = getCookieFromHeader(cookieHeader, ADMIN_COOKIE);
  if (verifyAdminToken(current)) return true;

  const legacy = getCookieFromHeader(cookieHeader, LEGACY_ADMIN_COOKIE);
  if (verifyAdminToken(legacy)) return true;

  // Before ADMIN_SESSION_SECRET was configured, old local sessions used this
  // development fallback. Keep them valid only when no explicit secret exists.
  if (!process.env.ADMIN_SESSION_SECRET) {
    return verifyAdminToken(legacy, "sharpfade-dev-secret-change-me");
  }
  return false;
}
