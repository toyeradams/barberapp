import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  date,
  numeric,
} from "drizzle-orm/pg-core";

// ─── Hairstyles / Services ────────────────────────────────────────────
export const hairstyles = pgTable("hairstyles", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  description: text("description").notNull().default(""),
  priceCents: integer("price_cents").notNull().default(0),
  durationMinutes: integer("duration_minutes").notNull().default(30),
  category: varchar("category", { length: 60 }).notNull().default("Haircut"),
  imageUrl: text("image_url").notNull().default(""),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Hairstyle = typeof hairstyles.$inferSelect;
export type NewHairstyle = typeof hairstyles.$inferInsert;

// ─── Barbers ──────────────────────────────────────────────────────────
export const barbers = pgTable("barbers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  title: varchar("title", { length: 120 }).notNull().default("Master Barber"),
  bio: text("bio").notNull().default(""),
  avatarUrl: text("avatar_url").notNull().default(""),
  specialties: text("specialties").notNull().default(""), // comma separated
  rating: numeric("rating", { precision: 3, scale: 2 }).notNull().default("5.00"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Barber = typeof barbers.$inferSelect;
export type NewBarber = typeof barbers.$inferInsert;

// ─── Weekly availability rules ────────────────────────────────────────
// dayOfWeek: 0=Sunday … 6=Saturday. barberId NULL = shop-wide default.
export const availabilityRules = pgTable("availability_rules", {
  id: serial("id").primaryKey(),
  barberId: integer("barber_id"),
  dayOfWeek: integer("day_of_week").notNull(),
  startTime: varchar("start_time", { length: 5 }).notNull(), // "09:00"
  endTime: varchar("end_time", { length: 5 }).notNull(), // "18:00"
  slotIntervalMinutes: integer("slot_interval_minutes").notNull().default(30),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type AvailabilityRule = typeof availabilityRules.$inferSelect;
export type NewAvailabilityRule = typeof availabilityRules.$inferInsert;

// ─── Date-specific overrides (holidays, days off, extended hours) ─────
export const availabilityOverrides = pgTable("availability_overrides", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(), // YYYY-MM-DD
  barberId: integer("barber_id"), // NULL = whole shop
  isClosed: boolean("is_closed").notNull().default(false),
  startTime: varchar("start_time", { length: 5 }),
  endTime: varchar("end_time", { length: 5 }),
  reason: varchar("reason", { length: 255 }).notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type AvailabilityOverride = typeof availabilityOverrides.$inferSelect;
export type NewAvailabilityOverride = typeof availabilityOverrides.$inferInsert;

// ─── Bookings ─────────────────────────────────────────────────────────
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  bookingRef: varchar("booking_ref", { length: 20 }).notNull().unique(),
  customerName: varchar("customer_name", { length: 120 }).notNull(),
  customerEmail: varchar("customer_email", { length: 255 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 40 }).notNull().default(""),
  hairstyleId: integer("hairstyle_id").notNull(),
  barberId: integer("barber_id"),
  date: date("date").notNull(), // YYYY-MM-DD
  startTime: varchar("start_time", { length: 5 }).notNull(),
  endTime: varchar("end_time", { length: 5 }).notNull(),
  durationMinutes: integer("duration_minutes").notNull().default(30),
  priceCents: integer("price_cents").notNull().default(0),
  status: varchar("status", { length: 20 }).notNull().default("confirmed"), // confirmed | completed | cancelled | no_show
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;

// ─── Email log (audit + demo preview when no SMTP configured) ─────────
export const emailLogs = pgTable("email_logs", {
  id: serial("id").primaryKey(),
  bookingRef: varchar("booking_ref", { length: 20 }).notNull().default(""),
  toEmail: varchar("to_email", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  provider: varchar("provider", { length: 40 }).notNull().default("console"),
  status: varchar("status", { length: 20 }).notNull().default("sent"),
  previewHtml: text("preview_html").notNull().default(""),
  error: text("error").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type EmailLog = typeof emailLogs.$inferSelect;
