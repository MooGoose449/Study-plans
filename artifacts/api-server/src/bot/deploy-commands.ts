/**
 * Deploy slash commands to Discord.
 * Run this script once after initial setup or whenever commands change:
 *   pnpm --filter @workspace/api-server run deploy-commands
 *
 * This registers commands globally (visible in all servers).
 * It can take up to 1 hour for global commands to propagate.
 * For faster testing, add DISCORD_GUILD_ID to register commands to a single server instantly.
 */

import { REST, Routes } from "discord.js";
import { commands } from "./commands/index.js";

const token = process.env["DISCORD_TOKEN"];
const clientId = process.env["DISCORD_CLIENT_ID"];
const guildId = process.env["DISCORD_GUILD_ID"]; // optional: fast guild-scoped deployment

if (!token || !clientId) {
  throw new Error("DISCORD_TOKEN and DISCORD_CLIENT_ID must be set.");
}

const rest = new REST({ version: "10" }).setToken(token);

const commandData = commands.map((cmd) => cmd.data.toJSON());

async function deploy() {
  console.log(`Deploying ${commandData.length} command(s)…`);

  if (guildId) {
    // Guild-scoped (instant, good for development)
    await rest.put(Routes.applicationGuildCommands(clientId!, guildId), {
      body: commandData,
    });
    console.log(`Commands deployed to guild ${guildId}.`);
  } else {
    // Global (up to 1 hour propagation)
    await rest.put(Routes.applicationCommands(clientId!), {
      body: commandData,
    });
    console.log("Commands deployed globally.");
  }
}

deploy().catch((err) => {
  console.error("Failed to deploy commands:", err);
  process.exit(1);
});
