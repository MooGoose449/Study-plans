import { db } from "@workspace/db";
import { statisticsTable, studyPlansTable, usersTable } from "@workspace/db";
import { eq, desc, and, inArray } from "drizzle-orm";
import type { Statistics } from "@workspace/db";
import { getTodayUTC, streakStatus } from "../utils/index.js";

/** Get statistics for a user. */
export async function getUserStats(
  discordId: string,
): Promise<Statistics | undefined> {
  return db.query.statisticsTable.findFirst({
    where: eq(statisticsTable.discordId, discordId),
  });
}

/** Check and potentially break a user's streak (call on login/check-in). */
export async function checkAndBreakStreak(discordId: string): Promise<void> {
  const stats = await db.query.statisticsTable.findFirst({
    where: eq(statisticsTable.discordId, discordId),
  });
  if (!stats || !stats.lastReadDate) return;

  const today = getTodayUTC();
  const status = streakStatus(stats.lastReadDate, today);

  if (status === "reset") {
    await db
      .update(statisticsTable)
      .set({ currentStreak: 0, updatedAt: new Date() })
      .where(eq(statisticsTable.discordId, discordId));
  }
}

/** Get overall completion percentage across all plans. */
export async function getOverallCompletion(discordId: string): Promise<number> {
  const plans = await db.query.studyPlansTable.findMany({
    where: eq(studyPlansTable.discordId, discordId),
  });

  if (plans.length === 0) return 0;

  const totalItems = plans.reduce((sum, p) => sum + p.totalItems, 0);
  const completedItems = plans.reduce((sum, p) => sum + p.currentPosition, 0);

  return totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100);
}

// ── Leaderboard ─────────────────────────────────────────────────────────────

export type LeaderboardEntry = {
  rank: number;
  discordId: string;
  username: string;
  value: number;
};

/** Get the global leaderboard (top 10 by streak type). */
export async function getGlobalLeaderboard(
  type: "current" | "longest",
): Promise<LeaderboardEntry[]> {
  const rows = await db
    .select({
      discordId: statisticsTable.discordId,
      username: usersTable.username,
      currentStreak: statisticsTable.currentStreak,
      longestStreak: statisticsTable.longestStreak,
    })
    .from(statisticsTable)
    .innerJoin(usersTable, eq(statisticsTable.discordId, usersTable.discordId))
    .orderBy(
      desc(
        type === "current"
          ? statisticsTable.currentStreak
          : statisticsTable.longestStreak,
      ),
    )
    .limit(10);

  return rows.map((row, i) => ({
    rank: i + 1,
    discordId: row.discordId,
    username: row.username,
    value: type === "current" ? row.currentStreak : row.longestStreak,
  }));
}

/** Get the server leaderboard (top 10 among members currently in the guild). */
export async function getServerLeaderboard(
  type: "current" | "longest",
  memberIds: string[],
): Promise<LeaderboardEntry[]> {
  if (memberIds.length === 0) return [];

  const rows = await db
    .select({
      discordId: statisticsTable.discordId,
      username: usersTable.username,
      currentStreak: statisticsTable.currentStreak,
      longestStreak: statisticsTable.longestStreak,
    })
    .from(statisticsTable)
    .innerJoin(usersTable, eq(statisticsTable.discordId, usersTable.discordId))
    .where(inArray(statisticsTable.discordId, memberIds))
    .orderBy(
      desc(
        type === "current"
          ? statisticsTable.currentStreak
          : statisticsTable.longestStreak,
      ),
    )
    .limit(10);

  return rows.map((row, i) => ({
    rank: i + 1,
    discordId: row.discordId,
    username: row.username,
    value: type === "current" ? row.currentStreak : row.longestStreak,
  }));
}
