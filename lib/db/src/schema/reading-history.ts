import {
  pgTable,
  text,
  integer,
  date,
  timestamp,
  serial,
  unique,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { studyPlansTable } from "./study-plans";
import { usersTable } from "./users";

export const readingHistoryTable = pgTable("reading_history", {
  id: serial("id").primaryKey(),
  planId: integer("plan_id")
    .notNull()
    .references(() => studyPlansTable.id, { onDelete: "cascade" }),
  discordId: text("discord_id")
    .notNull()
    .references(() => usersTable.discordId, { onDelete: "cascade" }),
  readDate: date("read_date").notNull(),
  itemsRead: integer("items_read").notNull().default(1),
  positionBefore: integer("position_before").notNull(),
  positionAfter: integer("position_after").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => [
  // Enforce one entry per plan per day at the database level
  unique("reading_history_plan_date_unique").on(table.planId, table.readDate),
]);

export const insertReadingHistorySchema = createInsertSchema(
  readingHistoryTable,
).omit({ id: true, createdAt: true });
export type InsertReadingHistory = z.infer<typeof insertReadingHistorySchema>;
export type ReadingHistory = typeof readingHistoryTable.$inferSelect;
