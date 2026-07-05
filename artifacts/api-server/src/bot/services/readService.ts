import { pool } from "@workspace/db";
import { getTodayUTC, streakStatus } from "../utils/index.js";

export type MarkReadResult =
  | { success: true; newPosition: number; isComplete: boolean; streakUpdated: boolean; newStreak: number }
  | { success: false; reason: "already_read" | "plan_not_found" | "plan_complete" };

/**
 * Mark a plan's reading as complete for today.
 * All writes run inside a single transaction to ensure consistency.
 * The DB-level UNIQUE(plan_id, read_date) constraint prevents duplicates
 * even under concurrent requests.
 */
export async function markAsRead(
  planId: number,
  discordId: string,
): Promise<MarkReadResult> {
  const today = getTodayUTC();

  // Use a raw pool client for a manual transaction so we can do
  // a SELECT … FOR UPDATE to lock the plan row and avoid TOCTOU races.
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Lock the plan row for this transaction
    const planResult = await client.query<{
      id: number;
      discord_id: string;
      current_position: number;
      total_items: number;
      units_per_day: number;
      is_complete: boolean;
      is_active: boolean;
      source_type: "scripture" | "conference";
      source_id: string;
    }>(
      `SELECT id, discord_id, current_position, total_items, units_per_day,
              is_complete, is_active, source_type, source_id
         FROM study_plans
        WHERE id = $1 AND discord_id = $2
        FOR UPDATE`,
      [planId, discordId],
    );

    if (planResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return { success: false, reason: "plan_not_found" };
    }

    const plan = planResult.rows[0]!;

    if (plan.is_complete) {
      await client.query("ROLLBACK");
      return { success: false, reason: "plan_complete" };
    }

    // Check for today's reading using the locked client
    const historyCheck = await client.query(
      `SELECT id FROM reading_history WHERE plan_id = $1 AND read_date = $2 LIMIT 1`,
      [planId, today],
    );

    if (historyCheck.rows.length > 0) {
      await client.query("ROLLBACK");
      return { success: false, reason: "already_read" };
    }

    const positionBefore = plan.current_position;
    const remaining = plan.total_items - positionBefore;
    const itemsToRead = Math.min(plan.units_per_day, remaining);
    const positionAfter = positionBefore + itemsToRead;
    const isComplete = positionAfter >= plan.total_items;

    // Insert reading history — the UNIQUE constraint is a second safety net
    try {
      await client.query(
        `INSERT INTO reading_history
           (plan_id, discord_id, read_date, items_read, position_before, position_after)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [planId, discordId, today, itemsToRead, positionBefore, positionAfter],
      );
    } catch (err: any) {
      if (err.code === "23505") {
        // Unique violation — another concurrent request beat us
        await client.query("ROLLBACK");
        return { success: false, reason: "already_read" };
      }
      throw err;
    }

    // Advance plan position
    await client.query(
      `UPDATE study_plans
          SET current_position = $1, is_complete = $2, updated_at = NOW()
        WHERE id = $3`,
      [positionAfter, isComplete, planId],
    );

    // Update statistics (still inside the transaction)
    const statsResult = await client.query<{
      current_streak: number;
      longest_streak: number;
      total_reading_days: number;
      plans_completed: number;
      chapters_completed: number;
      talks_completed: number;
      last_read_date: string | null;
    }>(
      `SELECT current_streak, longest_streak, total_reading_days, plans_completed,
              chapters_completed, talks_completed, last_read_date
         FROM statistics
        WHERE discord_id = $1`,
      [discordId],
    );

    let newStreak = 0;
    let streakUpdated = false;

    if (statsResult.rows.length > 0) {
      const stats = statsResult.rows[0]!;
      const status = streakStatus(stats.last_read_date, today);
      const isNewDay = status !== "same";

      const chaptersCompleted =
        plan.source_type === "scripture"
          ? stats.chapters_completed + itemsToRead
          : stats.chapters_completed;
      const talksCompleted =
        plan.source_type === "conference"
          ? stats.talks_completed + itemsToRead
          : stats.talks_completed;
      const totalReadingDays = isNewDay
        ? stats.total_reading_days + 1
        : stats.total_reading_days;
      const plansCompleted = isComplete
        ? stats.plans_completed + 1
        : stats.plans_completed;

      let currentStreak = stats.current_streak;
      let longestStreak = stats.longest_streak;

      if (status === "continue") {
        currentStreak += 1;
        streakUpdated = true;
      } else if (status === "reset") {
        currentStreak = 1;
        streakUpdated = true;
      }

      if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
      }

      newStreak = currentStreak;

      await client.query(
        `UPDATE statistics
            SET current_streak     = $1,
                longest_streak     = $2,
                total_reading_days = $3,
                plans_completed    = $4,
                chapters_completed = $5,
                talks_completed    = $6,
                last_read_date     = $7,
                updated_at         = NOW()
          WHERE discord_id = $8`,
        [
          currentStreak,
          longestStreak,
          totalReadingDays,
          plansCompleted,
          chaptersCompleted,
          talksCompleted,
          isNewDay ? today : stats.last_read_date,
          discordId,
        ],
      );
    }

    await client.query("COMMIT");

    return {
      success: true,
      newPosition: positionAfter,
      isComplete,
      streakUpdated,
      newStreak,
    };
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}
