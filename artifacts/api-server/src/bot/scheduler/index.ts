import { CronJob } from "cron";
import type { Client } from "discord.js";
import { getAllEnabledReminders, getReminderSettings } from "../services/reminderService.js";
import { getActivePlans } from "../services/planService.js";
import { getUserStats } from "../services/statsService.js";
import { upsertUser } from "../services/userService.js";
import { reminderDmEmbed } from "../ui/embeds.js";
import { reminderActionRow } from "../ui/components.js";
import { logger } from "../../lib/logger.js";
import type { ReminderSettings } from "@workspace/db";
import { enqueueReminder, initDmQueue } from "../reminders/dmQueue.js";

// Map of discordId → active CronJob
const jobs = new Map<string, CronJob>();

/**
 * Build a cron expression for a given time and days of week.
 * time: "HH:MM" (24-hour)
 * days: array of 0–6 (0 = Sunday)
 */
function buildCronExpression(time: string, days: number[]): string {
  const [hh, mm] = time.split(":").map(Number);
  const dayExpr = days.length === 7 ? "*" : days.join(",");
  return `${mm ?? 0} ${hh ?? 8} * * ${dayExpr}`;
}

/** Send a reminder DM to a single user. */
async function sendReminderDm(client: Client, discordId: string): Promise<void> {
  try {
    const plans = await getActivePlans(discordId);
    if (plans.length === 0) return; // nothing to remind about

    const stats = await getUserStats(discordId);
    const streak = stats?.currentStreak ?? 0;

    const user = await client.users.fetch(discordId);
    const embed = reminderDmEmbed(plans, streak);
    const rows = reminderActionRow(plans);

    await user.send({ embeds: [embed], components: rows });
    logger.info({ discordId }, "Sent reminder DM");
  } catch (err) {
    // User may have DMs disabled — log but don't crash
    logger.warn({ discordId, err }, "Failed to send reminder DM");
  }
}

/** Schedule (or reschedule) reminders for a single user. */
export function scheduleReminder(
  client: Client,
  settings: ReminderSettings,
): void {
  // Cancel existing job if any
  cancelReminder(settings.discordId);

  if (!settings.enabled) return;

  const days = settings.daysOfWeek as number[];
  if (!days || days.length === 0) return;

  const cronExpr = buildCronExpression(settings.timeOfDay, days);

  const job = new CronJob(
    cronExpr,
    () => { enqueueReminder(settings.discordId); },
    null,   // onComplete
    true,   // start immediately
    settings.timezone,
  );

  jobs.set(settings.discordId, job);
  logger.info(
    { discordId: settings.discordId, cronExpr, timezone: settings.timezone },
    "Scheduled reminder",
  );
}

/** Cancel a user's reminder job. */
export function cancelReminder(discordId: string): void {
  const existing = jobs.get(discordId);
  if (existing) {
    existing.stop();
    jobs.delete(discordId);
  }
}

/** On bot startup: restore all enabled reminders from the database. */
export async function restoreAllReminders(client: Client): Promise<void> {
  // Initialize the DM queue so enqueued jobs are processed
  initDmQueue(client);

  const allSettings = await getAllEnabledReminders();
  let restored = 0;
  let failed = 0;

  for (const settings of allSettings) {
    try {
      scheduleReminder(client, settings);
      restored++;
    } catch (err) {
      // Isolate per-user failures so a single bad record doesn't abort all restores
      failed++;
      logger.warn(
        { discordId: settings.discordId, err },
        "Failed to restore reminder — skipping this user",
      );
    }
  }

  logger.info({ restored, failed }, "Restored reminder schedules");
}

/** Update a user's reminder schedule after their settings change. */
export async function refreshUserReminder(
  client: Client,
  discordId: string,
): Promise<void> {
  const settings = await getReminderSettings(discordId);
  if (!settings) {
    cancelReminder(discordId);
    return;
  }
  scheduleReminder(client, settings);
}

/** Get count of active scheduled jobs (for health/debug). */
export function activeJobCount(): number {
  return jobs.size;
}
