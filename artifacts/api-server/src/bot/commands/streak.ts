import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { upsertUser } from "../services/userService.js";
import { getUserStats, checkAndBreakStreak } from "../services/statsService.js";
import { streakEmbed, errorEmbed } from "../ui/embeds.js";
import { EMOJI } from "../ui/emojis.js";

export const data = new SlashCommandBuilder()
  .setName("streak")
  .setDescription("View your current reading streak")
  .addUserOption((o) =>
    o
      .setName("user")
      .setDescription("View another user's streak")
      .setRequired(false),
  );

export async function execute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  const discordId = interaction.user.id;
  await upsertUser(discordId, interaction.user.username);

  const targetUser = interaction.options.getUser("user");
  const targetId = targetUser?.id ?? discordId;
  const targetUsername = targetUser?.username ?? interaction.user.username;

  // Update the streak for the requesting user (in case it's broken)
  await checkAndBreakStreak(discordId);

  const stats = await getUserStats(targetId);

  if (!stats) {
    await interaction.editReply({
      embeds: [
        errorEmbed(
          targetUser
            ? `${targetUsername} hasn't used the bot yet.`
            : "No stats found. Use `/today` or `/read` to start tracking your streak!",
        ),
      ],
    });
    return;
  }

  await interaction.editReply({
    embeds: [streakEmbed(stats, targetUsername)],
  });
}
