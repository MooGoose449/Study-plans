import { db } from "@workspace/db";
import {
  studyPlansTable,
  readingHistoryTable,
  type StudyPlan,
  type InsertStudyPlan,
} from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import {
  STANDARD_WORKS,
  getScriptureItems,
  getScriptureTotalItems,
  getScriptureRangeDisplay,
} from "../metadata/scriptures.js";
import {
  CONFERENCES,
  getConferenceTotalItems,
  getConferenceRangeDisplay,
  getTalkDisplay,
} from "../metadata/conferences.js";

// Pre-built lookup maps for source labels (avoids require() in ESM)
const STANDARD_WORKS_MAP = new Map(STANDARD_WORKS.map((w) => [w.id, w.name]));
const CONFERENCES_MAP = new Map(CONFERENCES.map((c) => [c.id, c.name]));
import { getTodayUTC } from "../utils/index.js";

/** Create a new study plan. */
export async function createPlan(data: InsertStudyPlan): Promise<StudyPlan> {
  const [plan] = await db.insert(studyPlansTable).values(data).returning();
  return plan!;
}

/** Get all plans for a user (active + completed). */
export async function getUserPlans(discordId: string): Promise<StudyPlan[]> {
  return db.query.studyPlansTable.findMany({
    where: eq(studyPlansTable.discordId, discordId),
    orderBy: [desc(studyPlansTable.createdAt)],
  });
}

/** Get only active plans for a user. */
export async function getActivePlans(discordId: string): Promise<StudyPlan[]> {
  return db.query.studyPlansTable.findMany({
    where: and(
      eq(studyPlansTable.discordId, discordId),
      eq(studyPlansTable.isActive, true),
      eq(studyPlansTable.isComplete, false),
    ),
    orderBy: [desc(studyPlansTable.createdAt)],
  });
}

/** Get a single plan by ID, verifying ownership. */
export async function getPlan(
  planId: number,
  discordId: string,
): Promise<StudyPlan | undefined> {
  return db.query.studyPlansTable.findFirst({
    where: and(
      eq(studyPlansTable.id, planId),
      eq(studyPlansTable.discordId, discordId),
    ),
  });
}

/** Update a plan's fields. */
export async function updatePlan(
  planId: number,
  discordId: string,
  fields: Partial<
    Pick<
      StudyPlan,
      "name" | "unitsPerDay" | "goalDate" | "isActive" | "isComplete" | "currentPosition"
    >
  >,
): Promise<void> {
  await db
    .update(studyPlansTable)
    .set({ ...fields, updatedAt: new Date() })
    .where(
      and(
        eq(studyPlansTable.id, planId),
        eq(studyPlansTable.discordId, discordId),
      ),
    );
}

/** Delete a plan. */
export async function deletePlan(
  planId: number,
  discordId: string,
): Promise<boolean> {
  const result = await db
    .delete(studyPlansTable)
    .where(
      and(
        eq(studyPlansTable.id, planId),
        eq(studyPlansTable.discordId, discordId),
      ),
    )
    .returning({ id: studyPlansTable.id });
  return result.length > 0;
}

/** Check if a plan has already been read today. */
export async function hasReadToday(
  planId: number,
  today: string,
): Promise<boolean> {
  const entry = await db.query.readingHistoryTable.findFirst({
    where: and(
      eq(readingHistoryTable.planId, planId),
      eq(readingHistoryTable.readDate, today),
    ),
  });
  return !!entry;
}

/** Get reading history for a plan. */
export async function getPlanHistory(planId: number, limit = 30) {
  return db.query.readingHistoryTable.findMany({
    where: eq(readingHistoryTable.planId, planId),
    orderBy: [desc(readingHistoryTable.readDate)],
    limit,
  });
}

// ── Display helpers ─────────────────────────────────────────────────────────

/** Get the display string for today's reading assignment on a plan. */
export function getTodaysAssignment(plan: StudyPlan): string {
  const { sourceType, sourceId, currentPosition, totalItems, unitsPerDay } =
    plan;

  if (currentPosition >= totalItems) return "Complete!";

  const remaining = totalItems - currentPosition;
  const count = Math.min(unitsPerDay, remaining);

  if (sourceType === "scripture") {
    return getScriptureRangeDisplay(sourceId, currentPosition, count);
  } else {
    return getConferenceRangeDisplay(sourceId, currentPosition, count);
  }
}

/** Get a simple one-line description of the plan's source. */
export function getPlanSourceLabel(plan: StudyPlan): string {
  if (plan.sourceType === "scripture") {
    const work = STANDARD_WORKS_MAP.get(plan.sourceId);
    return work ?? plan.sourceId;
  } else {
    const conf = CONFERENCES_MAP.get(plan.sourceId);
    return conf ?? plan.sourceId;
  }
}

/** Get total items for a given source. */
export function getSourceTotalItems(
  sourceType: "scripture" | "conference",
  sourceId: string,
): number {
  if (sourceType === "scripture") {
    return getScriptureTotalItems(sourceId);
  } else {
    return getConferenceTotalItems(sourceId);
  }
}

/** Estimate the completion date based on current position and units per day. */
export function estimateCompletionDate(plan: StudyPlan): string | null {
  const remaining = plan.totalItems - plan.currentPosition;
  if (remaining <= 0) return getTodayUTC();
  if (plan.unitsPerDay <= 0) return null;
  const days = Math.ceil(remaining / plan.unitsPerDay);
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}
