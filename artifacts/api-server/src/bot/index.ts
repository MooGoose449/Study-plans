import { Client, GatewayIntentBits, Partials } from "discord.js";
import { onReady } from "./events/ready.js";
import { onInteractionCreate } from "./events/interactionCreate.js";
import { onGuildMemberRemove } from "./events/guildMemberRemove.js";
import { logger } from "../lib/logger.js";
import { initCache } from "./utils/cache.js";

let client: Client | null = null;

/** Start the Discord bot and attach all event handlers. */
export async function startBot(): Promise<Client> {
  const token = process.env["DISCORD_TOKEN"];
  if (!token) {
    throw new Error("DISCORD_TOKEN environment variable is required.");
  }

  // Initialize Redis-backed cache if REDIS_URL is provided
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    try {
      // Dynamically require 'redis' at runtime so the bundler doesn't try to
      // resolve it during build. Redis is optional; if it's not available the
      // app will fall back to an in-memory cache.
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      const req = new Function("return require")() as any;
      const redisModule = req("redis");
      const createRedisClient = redisModule.createClient;
      const redis = createRedisClient({ url: redisUrl });
      await redis.connect();
      initCache(redis as any);
      logger.info({ redisUrl }, "Connected to Redis for cache/queue");
    } catch (err) {
      logger.warn({ err }, "Failed to connect to Redis — falling back to in-memory cache");
      initCache();
    }
  } else {
    initCache();
  }

  // Build intents list. GuildMembers is a privileged intent that must be
  // explicitly enabled in the Discord Developer Portal (Bot → Privileged
  // Gateway Intents → Server Members Intent). Without it the bot still
  // works — only the server-scoped leaderboard is affected.
  const intents = [GatewayIntentBits.Guilds, GatewayIntentBits.DirectMessages];

  const enableMembersIntent =
    process.env["DISCORD_MEMBERS_INTENT"] === "true";
  if (enableMembersIntent) {
    intents.push(GatewayIntentBits.GuildMembers);
  }

  client = new Client({
    intents,
    partials: [Partials.Channel, Partials.Message],
  });

  // ── Events ───────────────────────────────────────────────────────────[...]

  client.once("clientReady", async (c) => {
    await onReady(c).catch((err) =>
      logger.error({ err }, "Error in ready event handler"),
    );
  });

  client.on("interactionCreate", async (interaction) => {
    await onInteractionCreate(interaction, client!).catch((err) =>
      logger.error({ err }, "Unhandled error in interactionCreate"),
    );
  });

  client.on("guildMemberRemove", async (member) => {
    await onGuildMemberRemove(member).catch((err) =>
      logger.error({ err }, "Error in guildMemberRemove"),
    );
  });

  client.on("error", (err) => {
    logger.error({ err }, "Discord client error");
  });

  client.on("warn", (message) => {
    logger.warn({ message }, "Discord client warning");
  });

  // ── Login ────────────────────────────────────────────────────────────

  await client.login(token);
  return client;
}

/** Gracefully shut down the bot. */
export function stopBot(): void {
  if (client) {
    client.destroy();
    client = null;
    logger.info("Discord bot disconnected");
  }
}
