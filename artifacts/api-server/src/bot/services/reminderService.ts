import { db } from "@workspace/db";
import { reminderSettingsTable, type ReminderSettings } from "@workspace/db";
import { eq } from "drizzle-orm";

/** Get reminder settings for a user. */
export async function getReminderSettings(
  discordId: string,
): Promise<ReminderSettings | undefined> {
  return db.query.reminderSettingsTable.findFirst({
    where: eq(reminderSettingsTable.discordId, discordId),
  });
}

/** Create or update reminder settings for a user. */
export async function upsertReminderSettings(
  discordId: string,
  settings: {
    enabled?: boolean;
    timeOfDay?: string;
    timezone?: string;
    daysOfWeek?: number[];
  },
): Promise<ReminderSettings> {
  const existing = await getReminderSettings(discordId);

  if (existing) {
    const [updated] = await db
      .update(reminderSettingsTable)
      .set({ ...settings, updatedAt: new Date() })
      .where(eq(reminderSettingsTable.discordId, discordId))
      .returning();
    return updated!;
  } else {
    const [created] = await db
      .insert(reminderSettingsTable)
      .values({
        discordId,
        enabled: settings.enabled ?? true,
        timeOfDay: settings.timeOfDay ?? "08:00",
        timezone: settings.timezone ?? "UTC",
        daysOfWeek: settings.daysOfWeek ?? [0, 1, 2, 3, 4, 5, 6],
      })
      .returning();
    return created!;
  }
}

/** Disable reminders for a user. */
export async function disableReminders(discordId: string): Promise<void> {
  await upsertReminderSettings(discordId, { enabled: false });
}

/** Load all users with enabled reminders (for scheduler restore on startup). */
export async function getAllEnabledReminders(): Promise<ReminderSettings[]> {
  return db.query.reminderSettingsTable.findMany({
    where: eq(reminderSettingsTable.enabled, true),
  });
}
