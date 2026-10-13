import { NextResponse } from "next/server";
import { adminCookieHeader, adminPassword, createAdminToken } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const password = String(body.password ?? "");
  if (!password) return NextResponse.json({ error: "Password required" }, { status: 400 });
  if (password !== adminPassword()) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }
  const token = createAdminToken();
  const res = NextResponse.json({ ok: true });
  res.headers.set("Set-Cookie", adminCookieHeader(token));
  return res;
}
