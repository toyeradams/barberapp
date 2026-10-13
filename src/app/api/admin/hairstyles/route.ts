import { NextResponse } from "next/server";
import { db } from "@/db";
import { ensureSchema } from "@/db/ensure";
import { hairstyles } from "@/db/schema";
import { requireAdmin } from "@/lib/require-admin";

export const dynamic = "force-dynamic";

function databaseError(error: unknown): { status: number; message: string } {
  const err = error as { code?: string; message?: string };
  switch (err?.code) {
    case "42P01":
    case "42703":
      return {
        status: 500,
        message: "The hairstyle database schema is out of date. Refresh the admin page and try again; if it continues, redeploy so the automatic schema repair can run.",
      };
    case "22003":
      return { status: 400, message: "The price is too large. Enter a valid amount in ZAR." };
    case "22001":
      return { status: 400, message: "One of the fields is too long. Shorten the name or category and try again." };
    case "23505":
      return { status: 409, message: "A hairstyle with those unique details already exists." };
    case "ECONNREFUSED":
    case "ETIMEDOUT":
      return { status: 503, message: "The database is temporarily unreachable. Please try again shortly." };
    default:
      console.error("[admin-hairstyles] create failed:", error);
      return {
        status: 500,
        message: err?.message
          ? `Could not save hairstyle: ${err.message}`
          : "Could not save hairstyle. Check the required fields and try again.",
      };
  }
}

export async function GET(req: Request) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  try {
    await ensureSchema();
    const rows = await db.select().from(hairstyles);
    rows.sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
    return NextResponse.json({ hairstyles: rows });
  } catch (error) {
    console.error("[admin-hairstyles] list failed:", error);
    return NextResponse.json({ error: "Could not load hairstyles. Check the database connection and retry." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  let body: Record<string, unknown>;
  try {
    const parsed: unknown = await req.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return NextResponse.json({ error: "Enter hairstyle details and try again." }, { status: 400 });
    }
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "The hairstyle form was incomplete. Please review it and try again." }, { status: 400 });
  }

  const name = String(body.name ?? "").trim();
  if (name.length < 2) {
    return NextResponse.json({ error: "Enter a hairstyle name with at least 2 characters." }, { status: 400 });
  }
  if (name.length > 120) {
    return NextResponse.json({ error: "The hairstyle name must be 120 characters or fewer." }, { status: 400 });
  }

  const rawPrice = body.priceCents !== undefined
    ? Number(body.priceCents) / 100
    : body.price !== undefined && body.price !== ""
      ? Number(body.price)
      : 0;
  if (!Number.isFinite(rawPrice) || rawPrice < 0) {
    return NextResponse.json({ error: "Enter a valid non-negative price in ZAR." }, { status: 400 });
  }
  const priceCents = Math.round(rawPrice * 100);
  if (!Number.isSafeInteger(priceCents) || priceCents > 2_147_483_647) {
    return NextResponse.json({ error: "The price is too large. Enter a valid amount in ZAR." }, { status: 400 });
  }

  const durationMinutes = body.durationMinutes === undefined || body.durationMinutes === ""
    ? 30
    : Number(body.durationMinutes);
  if (!Number.isInteger(durationMinutes) || durationMinutes < 10 || durationMinutes > 1440) {
    return NextResponse.json({ error: "Duration must be a whole number from 10 to 1,440 minutes." }, { status: 400 });
  }

  const category = String(body.category ?? "Haircut").trim() || "Haircut";
  if (category.length > 60) {
    return NextResponse.json({ error: "Category must be 60 characters or fewer." }, { status: 400 });
  }
  const description = String(body.description ?? "").trim();
  const imageUrl = String(body.imageUrl ?? "").trim();
  const sortOrder = body.sortOrder === undefined || body.sortOrder === "" ? 0 : Number(body.sortOrder);
  if (!Number.isSafeInteger(sortOrder) || sortOrder < 0) {
    return NextResponse.json({ error: "Display order must be a non-negative whole number." }, { status: 400 });
  }
  if (body.isActive !== undefined && typeof body.isActive !== "boolean") {
    return NextResponse.json({ error: "Choose whether the hairstyle should be visible." }, { status: 400 });
  }

  try {
    await ensureSchema();
    const inserted = await db
      .insert(hairstyles)
      .values({
        name,
        description,
        priceCents,
        durationMinutes,
        category,
        imageUrl,
        isActive: body.isActive !== false,
        sortOrder,
      })
      .returning();
    return NextResponse.json({ hairstyle: inserted[0] }, { status: 201 });
  } catch (error) {
    const failure = databaseError(error);
    return NextResponse.json({ error: failure.message }, { status: failure.status });
  }
}
