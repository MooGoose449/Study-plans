import type { Client } from "discord.js";
import { logger } from "../../lib/logger.js";
import { getActivePlans } from "../services/planService.js";
import { getUserStats } from "../services/statsService.js";
import { reminderDmEmbed } from "../ui/embeds.js";
import { reminderActionRow } from "../ui/components.js";

type ReminderJob = {
  discordId: string;
  attempts: number;
  nextRunAt?: number;
};

const DEFAULT_RATE = Number(process.env.DM_RATE_PER_SEC ?? 10);
const JITTER_MS = 3000; // +/- jitter when re-enqueueing

let clientRef: Client | null = null;
let queue: ReminderJob[] = [];
let intervalId: NodeJS.Timeout | null = null;
let rate = DEFAULT_RATE;

// Metrics
let processedCount = 0;
let failedCount = 0;
let backoffCount = 0;

export function initDmQueue(client: Client, opts?: { ratePerSec?: number }) {
  clientRef = client;
  rate = opts?.ratePerSec ?? DEFAULT_RATE;
  startWorker();
}

function startWorker() {
  if (intervalId) return; // already running
  const intervalMs = Math.max(50, Math.floor(1000 / rate));
  intervalId = setInterval(processTick, intervalMs);
  logger.info({ rate }, "DM queue started");
}

export function stopWorker() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

export function enqueueReminder(discordId: string) {
  const job: ReminderJob = { discordId, attempts: 0 };
  queue.push(job);
}

async function processTick() {
  if (!clientRef) return;
  // pop one ready job
  const now = Date.now();
  let index = queue.findIndex((j) => !j.nextRunAt || (j.nextRunAt && j.nextRunAt <= now));
  if (index === -1) return;
  const job = queue.splice(index, 1)[0];
  await processJob(job)
    .then(() => {
      processedCount++;
    })
    .catch((err) => {
      failedCount++;
      backoffCount++;
      logger.warn({ err, discordId: job.discordId, attempts: job.attempts }, "Reminder job failed");
      // exponential backoff
      job.attempts = Math.min((job.attempts || 0) + 1, 5);
      const backoff = Math.pow(2, job.attempts) * 1000;
      const jitter = Math.floor(Math.random() * JITTER_MS) - JITTER_MS / 2;
      job.nextRunAt = Date.now() + backoff + jitter;
      queue.push(job);
    });
}

async function processJob(job: ReminderJob): Promise<void> {
  if (!clientRef) throw new Error("DM queue client not initialized");
  const discordId = job.discordId;

  // Build payload (DB calls) at send time so data is fresh
  const plans = await getActivePlans(discordId);
  if (plans.length === 0) return; // nothing to remind about

  const stats = await getUserStats(discordId);
  const streak = stats?.currentStreak ?? 0;

  const embed = reminderDmEmbed(plans, streak);
  const rows = reminderActionRow(plans);

  try {
    const user = await clientRef.users.fetch(discordId);
    await user.send({ embeds: [embed], components: rows });
    logger.info({ discordId }, "Sent reminder DM (queued)");
  } catch (err: any) {
    // If Discord returns a 429 or Retry-After header we should respect it.
    // discord.js surfaces HTTP 429 as a DiscordAPIError; we handle generically by rethrowing to trigger backoff.
    logger.warn({ discordId, err }, "Failed to send queued reminder DM");
    throw err;
  }
}

export function getQueueStats() {
  return {
    queued: queue.length,
    processed: processedCount,
    failed: failedCount,
    backoff: backoffCount,
  };
}
