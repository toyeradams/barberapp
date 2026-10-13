import { NextResponse } from "next/server";
import { ADMIN_COOKIE, getCookieFromHeader, verifyAdminToken } from "@/lib/admin-auth";
import { emailProviderStatus } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const token = getCookieFromHeader(req.headers.get("cookie"), ADMIN_COOKIE);
  if (!verifyAdminToken(token)) return NextResponse.json({ admin: false }, { status: 401 });
  return NextResponse.json({ admin: true, email: emailProviderStatus() });
}
