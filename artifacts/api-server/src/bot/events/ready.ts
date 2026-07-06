import type { Client } from "discord.js";
import { restoreAllReminders } from "../scheduler/index.js";
import { logger } from "../../lib/logger.js";

export async function onReady(client: Client): Promise<void> {
  logger.info({ tag: client.user?.tag }, "Discord bot connected and ready");

  // Restore all reminder schedules persisted in the database
  try {
    await restoreAllReminders(client);
  } catch (err) {
    logger.error({ err }, "Failed to restore reminder schedules");
  }
}
