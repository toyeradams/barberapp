import { and, eq, or, isNull } from "drizzle-orm";
import { db } from "@/db";
import { ensureSchema } from "@/db/ensure";
import {
  availabilityOverrides,
  availabilityRules,
  barbers,
  bookings,
  hairstyles,
} from "@/db/schema";
import { addMinutesToTime, isoDayOfWeek, overlaps, toMinutes } from "./time";

export type Slot = {
  time: string;
  endTime: string;
  available: boolean;
  barbersAvailable: number[];
  reason?: string;
};

export async function getActiveBarbers() {
  await ensureSchema();
  return db.select().from(barbers).where(eq(barbers.isActive, true));
}

export async function getHairstyleOrNull(id: number) {
  await ensureSchema();
  const rows = await db.select().from(hairstyles).where(eq(hairstyles.id, id));
  return rows[0] ?? null;
}

/**
 * Compute bookable slots for a date + service duration, optionally for one barber.
 * A slot is bookable when it fits inside working hours AND no overlapping
 * confirmed booking exists for at least one candidate barber.
 */
export async function computeSlots(opts: {
  date: string; // YYYY-MM-DD
  durationMinutes: number;
  barberId?: number | null;
  nowHHMM?: string; // for "today" — hide past times
}): Promise<{ slots: Slot[]; closed: boolean; closeReason: string; openHours: { start: string; end: string } | null }> {
  await ensureSchema();
  const { date, durationMinutes, barberId } = opts;
  const dow = isoDayOfWeek(date);

  const allBarbers = await db.select().from(barbers).where(eq(barbers.isActive, true));
  const candidateIds = barberId
    ? allBarbers.filter((b) => b.id === barberId).map((b) => b.id)
    : allBarbers.map((b) => b.id);

  if (candidateIds.length === 0) {
    return { slots: [], closed: true, closeReason: "No active barbers.", openHours: null };
  }

  // Shop-wide override first
  const overrides = await db
    .select()
    .from(availabilityOverrides)
    .where(eq(availabilityOverrides.date, date));

  const shopClosed = overrides.find((o) => o.barberId == null && o.isClosed);
  if (shopClosed) {
    return {
      slots: [],
      closed: true,
      closeReason: shopClosed.reason || "Closed on this date.",
      openHours: null,
    };
  }
  const shopCustom = overrides.find(
    (o) => o.barberId == null && !o.isClosed && o.startTime && o.endTime
  );

  // Which barbers are off that day?
  const barbersOff = new Set(
    overrides.filter((o) => o.barberId != null && o.isClosed).map((o) => o.barberId as number)
  );
  const workingBarbers = candidateIds.filter((id) => !barbersOff.has(id));
  if (workingBarbers.length === 0) {
    return { slots: [], closed: true, closeReason: "Selected barber is off on this date.", openHours: null };
  }

  // Hours: barber-specific rules > shop custom override > shop-wide weekly rules
  const rules = await db.select().from(availabilityRules).where(eq(availabilityRules.isActive, true));

  // Resolve per-barber hours, then union for "any barber"
  const hoursByBarber = new Map<number, { start: string; end: string; interval: number }>();
  for (const id of workingBarbers) {
    const barberCustom = overrides.find(
      (o) => o.barberId === id && !o.isClosed && o.startTime && o.endTime
    );
    if (barberCustom) {
      hoursByBarber.set(id, {
        start: barberCustom.startTime as string,
        end: barberCustom.endTime as string,
        interval: 30,
      });
      continue;
    }
    const specific = rules.find((r) => r.barberId === id && r.dayOfWeek === dow);
    if (specific) {
      hoursByBarber.set(id, {
        start: specific.startTime,
        end: specific.endTime,
        interval: specific.slotIntervalMinutes,
      });
      continue;
    }
    if (shopCustom) {
      hoursByBarber.set(id, {
        start: shopCustom.startTime as string,
        end: shopCustom.endTime as string,
        interval: 30,
      });
      continue;
    }
    const shopRule = rules.find((r) => r.barberId == null && r.dayOfWeek === dow);
    if (shopRule) {
      hoursByBarber.set(id, {
        start: shopRule.startTime,
        end: shopRule.endTime,
        interval: shopRule.slotIntervalMinutes,
      });
    }
  }

  if (hoursByBarber.size === 0) {
    return { slots: [], closed: true, closeReason: "Closed on this day of the week.", openHours: null };
  }

  // Union window
  let openStart = "23:59";
  let openEnd = "00:00";
  let interval = 30;
  for (const h of hoursByBarber.values()) {
    if (toMinutes(h.start) < toMinutes(openStart)) openStart = h.start;
    if (toMinutes(h.end) > toMinutes(openEnd)) openEnd = h.end;
    interval = Math.min(interval, h.interval || 30);
  }

  // Existing confirmed bookings for that date (exclude cancelled/no_show)
  const dayBookings = await db.select().from(bookings).where(eq(bookings.date, date));
  const activeBookings = dayBookings.filter(
    (b) => b.status !== "cancelled" && b.status !== "no_show"
  );

  const nowMins = opts.nowHHMM ? toMinutes(opts.nowHHMM) : null;

  const slots: Slot[] = [];
  for (let t = toMinutes(openStart); t + durationMinutes <= toMinutes(openEnd); t += interval) {
    const start = `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
    const end = addMinutesToTime(start, durationMinutes);

    if (nowMins != null && t <= nowMins + 15) {
      slots.push({ time: start, endTime: end, available: false, barbersAvailable: [], reason: "past" });
      continue;
    }

    const free: number[] = [];
    for (const [barber, h] of hoursByBarber) {
      // must fit inside this barber's hours
      if (toMinutes(start) < toMinutes(h.start) || toMinutes(end) > toMinutes(h.end)) continue;
      const clash = activeBookings.some(
        (b) => b.barberId === barber && overlaps(start, end, b.startTime, b.endTime)
      );
      if (!clash) free.push(barber);
    }
    slots.push({
      time: start,
      endTime: end,
      available: free.length > 0,
      barbersAvailable: free,
      reason: free.length === 0 ? "booked" : undefined,
    });
  }

  return { slots, closed: false, closeReason: "", openHours: { start: openStart, end: openEnd } };
}

/** Pick the least-busy free barber for a slot (load balancing). */
export async function pickBarberForSlot(date: string, start: string, end: string, candidates: number[]): Promise<number | null> {
  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0];
  const dayBookings = await db.select().from(bookings).where(eq(bookings.date, date));
  const counts = new Map<number, number>();
  for (const c of candidates) counts.set(c, 0);
  for (const b of dayBookings) {
    if (b.barberId != null && counts.has(b.barberId) && b.status !== "cancelled" && b.status !== "no_show") {
      counts.set(b.barberId, (counts.get(b.barberId) ?? 0) + 1);
    }
  }
  void end; void start;
  return [...counts.entries()].sort((a, b) => a[1] - b[1])[0][0];
}
