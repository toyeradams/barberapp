import { NextResponse } from "next/server";
import { verifyAdminCookieHeader } from "@/lib/admin-auth";
import { emailProviderStatus } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!verifyAdminCookieHeader(req.headers.get("cookie"))) {
    return NextResponse.json({ admin: false }, { status: 401 });
  }
  return NextResponse.json({ admin: true, email: emailProviderStatus() });
}
