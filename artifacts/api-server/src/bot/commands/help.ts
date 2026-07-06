import { SlashCommandBuilder, EmbedBuilder, type ChatInputCommandInteraction } from "discord.js";
import { COLORS } from "../ui/embeds.js";
import { EMOJI } from "../ui/emojis.js";

export const data = new SlashCommandBuilder()
  .setName("help")
  .setDescription("Show all available commands and how to use them");

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const embed = new EmbedBuilder()
    .setColor(COLORS.PRIMARY)
    .setTitle(`${EMOJI.BOOK} Study Companion — Commands`)
    .setDescription("Track your scripture and General Conference study, build streaks, and stay consistent.")
    .addFields(
      {
        name: "📋 Plans",
        value: [
          "`/plan create` — Start a new study plan (scripture or General Conference)",
          "`/plan list` — See all your plans with progress",
          "`/plan view` — View details for a specific plan",
          "`/plan edit` — Change a plan's name, pace, goal date, or pause it",
          "`/plan delete` — Remove a plan",
        ].join("\n"),
      },
      {
        name: "📖 Reading",
        value: [
          "`/today` — See what to read today across all your active plans",
          "`/read` — Mark today's reading complete (with optional plan selector)",
        ].join("\n"),
      },
      {
        name: `${EMOJI.BELL} Reminders`,
        value: [
          "`/reminder set` — Set up a daily DM reminder",
          "`/reminder edit` — Change your reminder time, timezone, or days",
          "`/reminder view` — See your current reminder settings",
          "`/reminder disable` — Turn off reminders",
        ].join("\n"),
      },
      {
        name: "📊 Stats & Leaderboards",
        value: [
          "`/streak [user]` — View current and longest streak",
          "`/stats [user]` — Full reading statistics",
          "`/leaderboard` — Top 10 by current or longest streak, server or global",
        ].join("\n"),
      },
      {
        name: "🔧 Utility",
        value: ["`/ping` — Check the bot's latency and responsiveness"].join("\n"),
      },
      {
        name: "💡 Tips",
        value: [
          "• Set a **goal date** when creating a plan — the bot calculates your required daily pace",
          "• Use `/today` every day and hit **Mark as Read** to build your streak",
          "• Reminders include Mark as Read buttons directly in the DM",
          "• You can have multiple active plans at once (e.g. Book of Mormon + April 2026 conference)",
        ].join("\n"),
      },
    )
    .setFooter({ text: "All commands are private — only you can see the responses" });

  await interaction.reply({ embeds: [embed], ephemeral: true });
}
