import { NextResponse } from "next/server";
import { verifyAdminCookieHeader } from "./admin-auth";

export function requireAdmin(req: Request): NextResponse | null {
  if (!verifyAdminCookieHeader(req.headers.get("cookie"))) {
    return NextResponse.json({ error: "Unauthorized — admin login required." }, { status: 401 });
  }
  return null;
}
