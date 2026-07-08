import type { Client } from "discord.js";
import { logger } from "../../lib/logger.js";
import { getActivePlans } from "../services/planService.js";
import { getUserStats } from "../services/statsService.js";
import { reminderDmEmbed } from "../ui/embeds.js";
import { reminderActionRow } from "../ui/components.js";
import { createClient as createRedisClient, type RedisClientType } from "redis";

type ReminderJob = {
  discordId: string;
  attempts: number;
  nextRunAt?: number;
};

const DEFAULT_RATE = Number(process.env.DM_RATE_PER_SEC ?? 10);
const JITTER_MS = 3000; // +/- jitter when re-enqueueing
const REDIS_QUEUE_KEY = process.env.REMINDER_REDIS_QUEUE_KEY ?? "reminder_queue";

let clientRef: Client | null = null;
let queue: ReminderJob[] = [];
let intervalId: NodeJS.Timeout | null = null;
let rate = DEFAULT_RATE;
let redisClient: RedisClientType | null = null;

// Metrics
let processedCount = 0;
let failedCount = 0;
let backoffCount = 0;

export async function initDmQueue(client: Client, opts?: { ratePerSec?: number; redisUrl?: string }) {
  clientRef = client;
  rate = opts?.ratePerSec ?? DEFAULT_RATE;

  const redisUrl = opts?.redisUrl ?? process.env.REDIS_URL;
  if (redisUrl) {
    try {
      redisClient = createRedisClient({ url: redisUrl });
      await redisClient.connect();
      logger.info({ redisUrl }, "Connected to Redis for reminder queue");
    } catch (err) {
      logger.warn({ err }, "Failed to connect to Redis for reminder queue — falling back to in-memory queue");
      redisClient = null;
    }
  }

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

export async function enqueueReminder(discordId: string) {
  const job: ReminderJob = { discordId, attempts: 0 };
  if (redisClient) {
    try {
      await redisClient.rPush(REDIS_QUEUE_KEY, JSON.stringify(job));
    } catch (err) {
      logger.warn({ err }, "Failed to push reminder job to Redis — falling back to in-memory");
      queue.push(job);
    }
  } else {
    queue.push(job);
  }
}

async function processTick() {
  if (!clientRef) return;
  // pop one ready job from Redis or memory
  let job: ReminderJob | null = null;

  if (redisClient) {
    try {
      const raw = await redisClient.lPop(REDIS_QUEUE_KEY);
      if (raw) job = JSON.parse(raw) as ReminderJob;
    } catch (err) {
      logger.warn({ err }, "Redis pop failed, will try memory queue next tick");
      job = null;
    }
  }

  if (!job) {
    const now = Date.now();
    const index = queue.findIndex((j) => !j.nextRunAt || (j.nextRunAt && j.nextRunAt <= now));
    if (index === -1) return;
    job = queue.splice(index, 1)[0];
  }

  if (!job) return;

  await processJob(job)
    .then(() => {
      processedCount++;
    })
    .catch(async (err) => {
      failedCount++;
      backoffCount++;
      logger.warn({ err, discordId: job!.discordId, attempts: job!.attempts }, "Reminder job failed");
      // exponential backoff
      job!.attempts = Math.min((job!.attempts || 0) + 1, 5);
      const backoff = Math.pow(2, job!.attempts) * 1000;
      const jitter = Math.floor(Math.random() * JITTER_MS) - JITTER_MS / 2;
      job!.nextRunAt = Date.now() + backoff + jitter;
      if (redisClient) {
        try {
          await redisClient.rPush(REDIS_QUEUE_KEY, JSON.stringify(job));
        } catch (err2) {
          logger.warn({ err2 }, "Failed to requeue job to Redis — pushing to in-memory queue");
          queue.push(job!);
        }
      } else {
        queue.push(job!);
      }
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

export async function getQueueStats() {
  const queued = redisClient ? (await redisClient.lLen(REDIS_QUEUE_KEY)).valueOf() : queue.length;
  return {
    queued,
    processed: processedCount,
    failed: failedCount,
    backoff: backoffCount,
  };
}
