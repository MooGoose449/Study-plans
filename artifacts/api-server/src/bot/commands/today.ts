import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { getActivePlans, hasReadToday } from "../services/planService.js";
import { getUserStats, checkAndBreakStreak } from "../services/statsService.js";
import { upsertUser } from "../services/userService.js";
import { getReminderSettings } from "../services/reminderService.js";
import {
  todayPlanEmbed,
  errorEmbed,
  infoEmbed,
} from "../ui/embeds.js";
import { todayActionRow } from "../ui/components.js";
import { EMOJI } from "../ui/emojis.js";
import { getTodayUTC, formatDaysOfWeek } from "../utils/index.js";

export const data = new SlashCommandBuilder()
  .setName("today")
  .setDescription("Show today's reading assignment for all active plans");

export async function execute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  const discordId = interaction.user.id;
  const username = interaction.user.username;

  await upsertUser(discordId, username);
  await checkAndBreakStreak(discordId);

  const plans = await getActivePlans(discordId);

  if (plans.length === 0) {
    await interaction.editReply({
      embeds: [
        infoEmbed(
          `${EMOJI.BOOK} No Active Plans`,
          "You have no active study plans. Use `/plan create` to get started!",
        ),
      ],
    });
    return;
  }

  const stats = await getUserStats(discordId);
  const streak = stats?.currentStreak ?? 0;
  const today = getTodayUTC();

  // Build reminder footer text
  const reminderSettings = await getReminderSettings(discordId);
  let reminderFooter = "";
  if (reminderSettings?.enabled) {
    reminderFooter = `\n${EMOJI.BELL} Reminder set for **${reminderSettings.timeOfDay}** (${reminderSettings.timezone}) on ${formatDaysOfWeek(reminderSettings.daysOfWeek as number[])}`;
  } else {
    reminderFooter = `\n${EMOJI.BELL_OFF} No reminders set — use \`/reminder set\` to add one`;
  }

  const embeds = [];
  const componentRows = [];

  for (const plan of plans) {
    const alreadyRead = await hasReadToday(plan.id, today);
    embeds.push(todayPlanEmbed(plan, alreadyRead, streak));
    if (!plan.isComplete) {
      componentRows.push(todayActionRow(plan.id, alreadyRead));
    }
  }

  // Discord allows max 5 action rows and 10 embeds
  const safeEmbeds = embeds.slice(0, 10);
  const safeRows = componentRows.slice(0, 5);

  // Add footer to last embed
  if (safeEmbeds.length > 0) {
    safeEmbeds[safeEmbeds.length - 1]!.setFooter({ text: reminderFooter.trim() });
  }

  await interaction.editReply({
    embeds: safeEmbeds,
    components: safeRows,
  });
}
