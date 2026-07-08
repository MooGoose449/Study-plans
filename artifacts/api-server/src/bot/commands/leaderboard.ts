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

  if (scope === "server" && interaction.guild) {
    // Fetch member IDs currently in the server
    let memberIds: string[] = [];
    try {
      const members = await interaction.guild.members.fetch();
      memberIds = members
        .filter((m) => !m.user.bot)
        .map((m) => m.user.id);

      entries = await getServerLeaderboard(type, memberIds);
    } catch (err) {
      // If we can't fetch members (missing intent, permission, or rate limited), fall back to global
      fallbackToGlobal = true;
      entries = await getGlobalLeaderboard(type);
    }
  } else {
    entries = await getGlobalLeaderboard(type);
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
  if (fallbackToGlobal) {
    await interaction.followUp({
      embeds: [
        errorEmbed(
          "Unable to fetch server members. Make sure the bot has the **Server Members Intent** enabled in the Discord Developer Portal. Showing global leaderboard instead.",
        ),
      ],
      ephemeral: true,
    });
  }
}
