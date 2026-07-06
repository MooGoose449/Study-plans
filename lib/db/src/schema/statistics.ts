import {
  pgTable,
  text,
  integer,
  date,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const statisticsTable = pgTable("statistics", {
  discordId: text("discord_id")
    .primaryKey()
    .references(() => usersTable.discordId, { onDelete: "cascade" }),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  totalReadingDays: integer("total_reading_days").notNull().default(0),
  plansCompleted: integer("plans_completed").notNull().default(0),
  chaptersCompleted: integer("chapters_completed").notNull().default(0),
  talksCompleted: integer("talks_completed").notNull().default(0),
  lastReadDate: date("last_read_date"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertStatisticsSchema = createInsertSchema(statisticsTable).omit({
  updatedAt: true,
});
export type InsertStatistics = z.infer<typeof insertStatisticsSchema>;
export type Statistics = typeof statisticsTable.$inferSelect;
