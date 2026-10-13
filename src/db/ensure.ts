import { sql } from "drizzle-orm";
import { db } from "./index";

let ensured = false;

/**
 * Creates all tables with plain SQL (IF NOT EXISTS) so a fresh Vercel/Neon
 * database works instantly without running drizzle-kit manually.
 * Safe to call on every request — runs once per process.
 */
export async function ensureSchema(): Promise<void> {
  if (ensured) return;
  // Skip entirely when there's no DATABASE_URL at build time
  if (!process.env.DATABASE_URL && process.env.VERCEL !== "1") {
    // still try locally — local DATABASE_URL may come from .env at runtime
  }
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS hairstyles (
        id SERIAL PRIMARY KEY,
        name VARCHAR(120) NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        price_cents INTEGER NOT NULL DEFAULT 0,
        duration_minutes INTEGER NOT NULL DEFAULT 30,
        category VARCHAR(60) NOT NULL DEFAULT 'Haircut',
        image_url TEXT NOT NULL DEFAULT '',
        is_active BOOLEAN NOT NULL DEFAULT true,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    // Repair columns on older deployments too. CREATE TABLE IF NOT EXISTS alone
    // does not update a table that already exists in Postgres.
    await db.execute(sql`ALTER TABLE hairstyles ADD COLUMN IF NOT EXISTS name VARCHAR(120) NOT NULL DEFAULT '';`);
    await db.execute(sql`ALTER TABLE hairstyles ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '';`);
    await db.execute(sql`ALTER TABLE hairstyles ADD COLUMN IF NOT EXISTS price_cents INTEGER NOT NULL DEFAULT 0;`);
    await db.execute(sql`ALTER TABLE hairstyles ADD COLUMN IF NOT EXISTS duration_minutes INTEGER NOT NULL DEFAULT 30;`);
    await db.execute(sql`ALTER TABLE hairstyles ADD COLUMN IF NOT EXISTS category VARCHAR(60) NOT NULL DEFAULT 'Haircut';`);
    await db.execute(sql`ALTER TABLE hairstyles ADD COLUMN IF NOT EXISTS image_url TEXT NOT NULL DEFAULT '';`);
    await db.execute(sql`ALTER TABLE hairstyles ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;`);
    await db.execute(sql`ALTER TABLE hairstyles ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;`);
    await db.execute(sql`ALTER TABLE hairstyles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW();`);
    await db.execute(sql`ALTER TABLE hairstyles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW();`);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS barbers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(120) NOT NULL,
        title VARCHAR(120) NOT NULL DEFAULT 'Master Barber',
        bio TEXT NOT NULL DEFAULT '',
        avatar_url TEXT NOT NULL DEFAULT '',
        specialties TEXT NOT NULL DEFAULT '',
        rating NUMERIC(3,2) NOT NULL DEFAULT '5.00',
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS availability_rules (
        id SERIAL PRIMARY KEY,
        barber_id INTEGER,
        day_of_week INTEGER NOT NULL,
        start_time VARCHAR(5) NOT NULL,
        end_time VARCHAR(5) NOT NULL,
        slot_interval_minutes INTEGER NOT NULL DEFAULT 30,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS availability_overrides (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL,
        barber_id INTEGER,
        is_closed BOOLEAN NOT NULL DEFAULT false,
        start_time VARCHAR(5),
        end_time VARCHAR(5),
        reason VARCHAR(255) NOT NULL DEFAULT '',
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        booking_ref VARCHAR(20) NOT NULL UNIQUE,
        customer_name VARCHAR(120) NOT NULL,
        customer_email VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(40) NOT NULL DEFAULT '',
        hairstyle_id INTEGER NOT NULL,
        barber_id INTEGER,
        date DATE NOT NULL,
        start_time VARCHAR(5) NOT NULL,
        end_time VARCHAR(5) NOT NULL,
        duration_minutes INTEGER NOT NULL DEFAULT 30,
        price_cents INTEGER NOT NULL DEFAULT 0,
        status VARCHAR(20) NOT NULL DEFAULT 'confirmed',
        notes TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS email_logs (
        id SERIAL PRIMARY KEY,
        booking_ref VARCHAR(20) NOT NULL DEFAULT '',
        to_email VARCHAR(255) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        provider VARCHAR(40) NOT NULL DEFAULT 'console',
        status VARCHAR(20) NOT NULL DEFAULT 'sent',
        preview_html TEXT NOT NULL DEFAULT '',
        error TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_bookings_ref ON bookings(booking_ref);`);
    // Older releases marked console-only demo logs as sent even though no email
    // was delivered. Correct those records so the admin log is trustworthy.
    await db.execute(sql`
      UPDATE email_logs
      SET status = 'failed',
          error = CASE
            WHEN error = '' THEN 'Email was logged locally only; no live email provider was configured.'
            ELSE error
          END
      WHERE provider = 'console' AND status = 'sent';
    `);
    ensured = true;
  } catch (e) {
    console.error("[ensureSchema] failed:", e);
    throw e;
  }
}
