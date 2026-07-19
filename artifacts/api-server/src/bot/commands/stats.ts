import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { upsertUser } from "../services/userService.js";
import {
  getUserStats,
  checkAndBreakStreak,
  getOverallCompletion,
} from "../services/statsService.js";
import { statsEmbed, errorEmbed } from "../ui/embeds.js";

export const data = new SlashCommandBuilder()
  .setName("stats")
  .setDescription("View your study statistics")
  .addUserOption((o) =>
    o
      .setName("user")
      .setDescription("View another user's statistics")
      .setRequired(false),
  );

export async function execute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  await interaction.deferReply();

  const discordId = interaction.user.id;
  await upsertUser(discordId, interaction.user.username);

  const targetUser = interaction.options.getUser("user");
  const targetId = targetUser?.id ?? discordId;
  const targetUsername = targetUser?.username ?? interaction.user.username;

  await checkAndBreakStreak(discordId);

  const [stats, overallPct] = await Promise.all([
    getUserStats(targetId),
    getOverallCompletion(targetId),
  ]);

  if (!stats) {
    await interaction.editReply({
      embeds: [
        errorEmbed(
          targetUser
            ? `${targetUsername} hasn't used the bot yet.`
            : "No stats found yet. Start reading with `/today` or `/read`!",
        ),
      ],
    });
    return;
  }

  await interaction.editReply({
    embeds: [statsEmbed(stats, targetUsername, overallPct)],
  });
}
