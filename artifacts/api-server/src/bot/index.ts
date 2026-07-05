import { Client, GatewayIntentBits, Partials } from "discord.js";
import { onReady } from "./events/ready.js";
import { onInteractionCreate } from "./events/interactionCreate.js";
import { onGuildMemberRemove } from "./events/guildMemberRemove.js";
import { logger } from "../lib/logger.js";

let client: Client | null = null;

/** Start the Discord bot and attach all event handlers. */
export async function startBot(): Promise<Client> {
  const token = process.env["DISCORD_TOKEN"];
  if (!token) {
    throw new Error("DISCORD_TOKEN environment variable is required.");
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

  // ── Events ────────────────────────────────────────────────────────────────

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

  // ── Login ─────────────────────────────────────────────────────────────────

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
