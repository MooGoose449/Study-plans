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
      .setRequired(false)
      .addChoices(
        { name: "Current Streak", value: "current" },
        { name: "Longest Streak", value: "longest" },
      ),
  )
  .addStringOption((o) =>
    o
      .setName("scope")
      .setDescription("Server members only or everyone")
      .setRequired(false)
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

  const type = (interaction.options.getString("type") ?? "current") as
    | "current"
    | "longest";
  const scope = (interaction.options.getString("scope") ?? "server") as
    | "server"
    | "global";

  let entries;

  if (scope === "server" && interaction.guild) {
    // Fetch member IDs currently in the server
    let memberIds: string[] = [];
    try {
      const members = await interaction.guild.members.fetch();
      memberIds = members
        .filter((m) => !m.user.bot)
        .map((m) => m.user.id);
    } catch {
      // If we can't fetch members (missing intent), fall back to global
      await interaction.editReply({
        embeds: [
          errorEmbed(
            "Unable to fetch server members. Make sure the bot has the **Server Members Intent** enabled in the Discord Developer Portal.\n\nShowing global leaderboard instead.",
          ),
        ],
      });
    }

    entries = await getServerLeaderboard(type, memberIds);
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

  await interaction.editReply({
    embeds: [leaderboardEmbed(entries, type, scope)],
  });
}
