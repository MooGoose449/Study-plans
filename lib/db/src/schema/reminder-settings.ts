import {
  pgTable,
  text,
  boolean,
  timestamp,
  serial,
  jsonb,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

// daysOfWeek: array of integers 0 (Sun) - 6 (Sat)
export const reminderSettingsTable = pgTable("reminder_settings", {
  id: serial("id").primaryKey(),
  discordId: text("discord_id")
    .notNull()
    .unique()
    .references(() => usersTable.discordId, { onDelete: "cascade" }),
  enabled: boolean("enabled").notNull().default(true),
  // HH:MM in 24-hour format, e.g. "08:00"
  timeOfDay: text("time_of_day").notNull().default("08:00"),
  timezone: text("timezone").notNull().default("UTC"),
  // JSON array of day numbers: [1,2,3,4,5] for Mon-Fri
  daysOfWeek: jsonb("days_of_week")
    .notNull()
    .$type<number[]>()
    .default([0, 1, 2, 3, 4, 5, 6]),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertReminderSettingsSchema = createInsertSchema(
  reminderSettingsTable,
).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertReminderSettings = z.infer<
  typeof insertReminderSettingsSchema
>;
export type ReminderSettings = typeof reminderSettingsTable.$inferSelect;
