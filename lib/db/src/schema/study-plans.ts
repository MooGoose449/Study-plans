import {
  pgTable,
  text,
  integer,
  boolean,
  date,
  timestamp,
  serial,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const sourceTypeEnum = pgEnum("source_type", [
  "scripture",
  "conference",
]);

export const studyPlansTable = pgTable("study_plans", {
  id: serial("id").primaryKey(),
  discordId: text("discord_id")
    .notNull()
    .references(() => usersTable.discordId, { onDelete: "cascade" }),
  name: text("name").notNull(),
  sourceType: sourceTypeEnum("source_type").notNull(),
  // For scriptures: e.g. "BOOK_OF_MORMON"; for conferences: e.g. "april_2026"
  sourceId: text("source_id").notNull(),
  currentPosition: integer("current_position").notNull().default(0),
  totalItems: integer("total_items").notNull(),
  unitsPerDay: integer("units_per_day").notNull().default(1),
  startDate: date("start_date").notNull(),
  goalDate: date("goal_date"),
  isActive: boolean("is_active").notNull().default(true),
  isComplete: boolean("is_complete").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertStudyPlanSchema = createInsertSchema(studyPlansTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertStudyPlan = z.infer<typeof insertStudyPlanSchema>;
export type StudyPlan = typeof studyPlansTable.$inferSelect;
