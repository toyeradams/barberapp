import { NextResponse } from "next/server";
import { ADMIN_COOKIE, getCookieFromHeader, verifyAdminToken } from "./admin-auth";

export function requireAdmin(req: Request): NextResponse | null {
  const token = getCookieFromHeader(req.headers.get("cookie"), ADMIN_COOKIE);
  if (!verifyAdminToken(token)) {
    return NextResponse.json({ error: "Unauthorized — admin login required." }, { status: 401 });
  }
  return null;
}
