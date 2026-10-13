import { NextResponse } from "next/server";
import { db } from "@/db";
import { ensureSchema } from "@/db/ensure";
import { emailLogs } from "@/db/schema";
import { requireAdmin } from "@/lib/require-admin";
import { emailProviderStatus } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  await ensureSchema();
  const rows = await db.select().from(emailLogs);
  rows.sort((a, b) => b.id - a.id);
  return NextResponse.json({ emails: rows.slice(0, 50), provider: emailProviderStatus() });
}
