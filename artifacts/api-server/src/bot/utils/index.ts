import { format, toZonedTime } from "date-fns-tz";
import { addDays, differenceInCalendarDays, parseISO } from "date-fns";

// ── Date helpers ────────────────────────────────────────────────────────────

/** Return today's date string (YYYY-MM-DD) in a given timezone. */
export function getTodayInTimezone(timezone: string): string {
  const now = new Date();
  const zoned = toZonedTime(now, timezone);
  return format(zoned, "yyyy-MM-dd", { timeZone: timezone });
}

/** Return today's date string (YYYY-MM-DD) in UTC. */
export function getTodayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Parse a YYYY-MM-DD string to a Date object (midnight UTC). */
export function parseDate(dateStr: string): Date {
  return parseISO(dateStr);
}

/** Add N days to a YYYY-MM-DD string. */
export function addDaysToDate(dateStr: string, days: number): string {
  return format(addDays(parseISO(dateStr), days), "yyyy-MM-dd");
}

/** How many calendar days between two YYYY-MM-DD strings (b - a). */
export function daysBetween(a: string, b: string): number {
  return differenceInCalendarDays(parseISO(b), parseISO(a));
}

// ── Progress helpers ────────────────────────────────────────────────────────

/** Calculate progress percentage (0–100), capped at 100. */
export function calcProgress(current: number, total: number): number {
  if (total === 0) return 100;
  return Math.min(100, Math.round((current / total) * 100));
}

// ── Streak helpers ──────────────────────────────────────────────────────────

/**
 * Given the last read date and today's date, determine if the streak
 * continues, resets, or stays the same.
 * Returns: 'continue' | 'reset' | 'same'
 */
export function streakStatus(
  lastReadDate: string | null,
  today: string,
): "continue" | "reset" | "same" {
  if (!lastReadDate) return "reset";
  const diff = daysBetween(lastReadDate, today);
  if (diff === 0) return "same";
  if (diff === 1) return "continue";
  return "reset";
}

// ── Discord UI helpers ──────────────────────────────────────────────────────

/** Chunk an array into pages of a given size. */
export function paginate<T>(items: T[], pageSize: number): T[][] {
  const pages: T[][] = [];
  for (let i = 0; i < items.length; i += pageSize) {
    pages.push(items.slice(i, i + pageSize));
  }
  return pages;
}

/** Clamp a number between min and max. */
export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

/** Truncate a string to maxLen chars, appending "…" if needed. */
export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + "…";
}

/** Format a number with ordinal suffix (1st, 2nd, 3rd, …). */
export function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]!);
}

// ── Validation ──────────────────────────────────────────────────────────────

/** Validate a HH:MM time string (24-hour). */
export function isValidTime(time: string): boolean {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(time);
}

/** Validate a YYYY-MM-DD date string. */
export function isValidDate(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && !isNaN(Date.parse(date));
}

/** Validate a timezone string using Intl. */
export function isValidTimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** Parse comma-separated days of week (0–6). Returns sorted array or null if invalid. */
export function parseDaysOfWeek(input: string): number[] | null {
  const parts = input.split(",").map((p) => p.trim());
  const days: number[] = [];
  for (const p of parts) {
    const n = parseInt(p, 10);
    if (isNaN(n) || n < 0 || n > 6) return null;
    if (!days.includes(n)) days.push(n);
  }
  if (days.length === 0) return null;
  return days.sort();
}

/** Format days of week numbers to readable string. */
export function formatDaysOfWeek(days: number[]): string {
  const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const sorted = [...days].sort();
  if (sorted.length === 7) return "Every day";
  return sorted.map((d) => names[d] ?? `Day ${d}`).join(", ");
}
