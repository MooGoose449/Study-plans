import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { upsertUser } from "../services/userService.js";
import {
  getGlobalLeaderboard,
  getServerLeaderboard,
} from "../services/statsService.js";
import { leaderboardEmbed, errorEmbed } from "../ui/embeds.js";
import { EMOJI } from "../ui/emojis.js";
import { fetchWithTimeout } from "../utils/fetchWithTimeout.js";
import { cacheGet, cacheSet } from "../utils/cache.js";
import { logger } from "../../lib/logger.js";

const MEMBER_FETCH_TIMEOUT_MS = Number(process.env.MEMBER_FETCH_TIMEOUT_MS ?? 3000);
const LEADERBOARD_CACHE_TTL = Number(process.env.LEADERBOARD_CACHE_TTL ?? 60);

export const data = new SlashCommandBuilder()
  .setName("leaderboard")
  .setDescription("View the study streak leaderboard")
  .addStringOption((o) =>
    o
      .setName("type")
      .setDescription("Streak type to rank by")
      .setRequired(true)
      .addChoices(
        { name: "Current Streak", value: "current" },
        { name: "Longest Streak", value: "longest" },
      ),
  )
  .addStringOption((o) =>
    o
      .setName("scope")
      .setDescription("Server members only or everyone")
      .setRequired(true)
      .addChoices(
        { name: "Server", value: "server" },
        { name: "Global", value: "global" },
      ),
  );

export async function execute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  await interaction.deferReply();

  const discordId = interaction.user.id;
  await upsertUser(discordId, interaction.user.username);

  // Options are required; use the typed getter
  const type = interaction.options.getString("type", true) as "current" | "longest";
  const scope = interaction.options.getString("scope", true) as "server" | "global";

  let entries;
  let fallbackToGlobal = false;

  // Try cache first for performance
  try {
    const cacheKey = scope === "server" && interaction.guild
      ? `leaderboard:server:${type}:${interaction.guild.id}`
      : `leaderboard:global:${type}`;

    const cached = await cacheGet(cacheKey);
    if (cached) {
      try {
        entries = JSON.parse(cached) as unknown as typeof entries;
      } catch (err) {
        // parsing failed; ignore cache
        entries = undefined;
      }
    }

    if (!entries) {
      if (scope === "server" && interaction.guild) {
        // Try to use cached members list first, otherwise fetch with timeout
        let memberIds: string[] = [];
        try {
          const cachedMembers = interaction.guild.members.cache;
          if (cachedMembers && cachedMembers.size > 0) {
            memberIds = cachedMembers.filter((m) => !m.user.bot).map((m) => m.user.id);
          } else {
            // fetch with timeout
            const members = await fetchWithTimeout(interaction.guild.members.fetch(), MEMBER_FETCH_TIMEOUT_MS);
            memberIds = members.filter((m) => !m.user.bot).map((m) => m.user.id);
          }

          if (memberIds.length === 0) {
            // No members found — fall back to global
            fallbackToGlobal = true;
            entries = await getGlobalLeaderboard(type);
          } else {
            entries = await getServerLeaderboard(type, memberIds);
          }
        } catch (err) {
          // Fetch failed (timeout, permissions, or other) — fall back to global
          const reason = (err instanceof Error && err.message) ? err.message : String(err);
          logger.warn({ guildId: interaction.guild.id, userId: discordId, reason }, "Falling back to global leaderboard");
          fallbackToGlobal = true;
          entries = await getGlobalLeaderboard(type);
        }
      } else {
        entries = await getGlobalLeaderboard(type);
      }

      // Cache the computed entries
      try {
        await cacheSet(cacheKey, JSON.stringify(entries ?? []), LEADERBOARD_CACHE_TTL);
      } catch (err) {
        // caching should not block the response
        logger.debug({ err }, "Failed to set leaderboard cache");
      }
    }
  } catch (err) {
    // Top-level protection — fall back to global leaderboard
    logger.error({ err, userId: discordId }, "Error computing leaderboard; falling back to global");
    entries = await getGlobalLeaderboard(type);
    fallbackToGlobal = true;
  }

  if (!entries || entries.length === 0) {
    await interaction.editReply({
      embeds: [
        errorEmbed(
          scope === "server"
            ? "No server members have used the bot yet. Be the first!"
            : "No users have recorded any reading days yet.",
        ),
      ],
    });

    return;
  }

  // Show the leaderboard as the main reply
  await interaction.editReply({
    embeds: [leaderboardEmbed(entries, type, scope === "server" && !fallbackToGlobal ? "server" : "global")],
  });

  // If we had to fall back to global due to member fetch failure, notify the user in a follow-up
  if (fallbackToGlobal && scope === "server") {
    await interaction.followUp({
      content:
        "Unable to fetch server members (permissions or intent may be disabled). Showing global leaderboard instead.",
      ephemeral: true,
    });
  }
}
