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
  await interaction.deferReply();

  const discordId = interaction.user.id;

  try {
    const user = await upsertUser(
      discordId,
      interaction.user.username,
      interaction.guild?.name,
    );
    await checkAndBreakStreak(discordId);

    const timezone = user.timezone || "UTC";
    const today = getTodayInTimezone(timezone);
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
    const reminderSettings = await getReminderSettings(discordId);

    const embeds = [];
    const componentRows = [];

    for (const plan of plans.slice(0, 10)) {
      const alreadyRead = await hasReadToday(plan.id, today);
      embeds.push(todayPlanEmbed(plan, alreadyRead, streak));
      if (!plan.isComplete) {
        componentRows.push(todayActionRow(plan.id, alreadyRead));
      }
    }

    const reminderFooter = reminderSettings?.enabled
      ? `${EMOJI.BELL} Reminder: **${reminderSettings.timeOfDay}** (${reminderSettings.timezone}) • ${formatDaysOfWeek(reminderSettings.daysOfWeek as number[])}`
      : `${EMOJI.BELL_OFF} No reminder set. Use `/reminder set`.`,

    embeds[embeds.length - 1]!.setFooter({
      text: `Today: ${today} • Timezone: ${timezone} • ${reminderFooter}`,
    });

    await interaction.editReply({
      embeds,
      components: componentRows.slice(0, 5),
    });
  } catch (err) {
    await interaction.editReply({
      embeds: [
        errorEmbed(
          "I couldn't load today's reading right now. Please try `/today` again. If it keeps happening, check `/timezone view` and `/plan list`.",
        ),
      ],
    });
  }
}