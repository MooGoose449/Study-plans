import type { ButtonInteraction, Client } from "discord.js";
import {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  type ModalActionRowComponentBuilder,
} from "discord.js";
import { markAsRead } from "../services/readService.js";
import { getPlan, deletePlan, updatePlan } from "../services/planService.js";
import { getActivePlans } from "../services/planService.js";
import { getUserStats } from "../services/statsService.js";
import { upsertUser } from "../services/userService.js";
import { getReminderSettings } from "../services/reminderService.js";
import {
  markReadSuccessEmbed,
  errorEmbed,
  successEmbed,
  todayPlanEmbed,
} from "../ui/embeds.js";
import { todayActionRow } from "../ui/components.js";
import { hasReadToday } from "../services/planService.js";
import { getTodayUTC } from "../utils/index.js";
import { EMOJI } from "../ui/emojis.js";

/**
 * Route a button interaction based on its custom ID.
 * Custom ID format: btn:<action>:<param1>:<param2>...
 */
export async function handleButton(
  interaction: ButtonInteraction,
  client: Client,
): Promise<void> {
  const [, action, ...params] = interaction.customId.split(":");
  const discordId = interaction.user.id;

  await upsertUser(discordId, interaction.user.username);

  switch (action) {
    case "mark_read":
      await handleMarkRead(interaction, discordId, Number(params[0]));
      break;

    case "view_today":
      await handleViewToday(interaction, discordId);
      break;

    case "plan_delete_confirm":
      await handlePlanDeleteConfirm(interaction, discordId, Number(params[0]));
      break;

    case "setup_reminder":
      await handleSetupReminder(interaction, discordId);
      break;

    case "skip_reminder":
      await interaction.update({ components: [] });
      break;

    case "cancel":
      await interaction.update({ content: "Cancelled.", embeds: [], components: [] });
      break;

    case "page":
      // handled per-feature; generic no-op here
      await interaction.deferUpdate();
      break;

    default:
      await interaction.reply({
        embeds: [errorEmbed("Unknown action. Please try the command again.")],
        ephemeral: true,
      });
  }
}

async function handleMarkRead(
  interaction: ButtonInteraction,
  discordId: string,
  planId: number,
) {
  if (isNaN(planId)) {
    await interaction.reply({ embeds: [errorEmbed("Invalid plan ID.")], ephemeral: true });
    return;
  }

  await interaction.deferUpdate();

  const result = await markAsRead(planId, discordId);

  if (!result.success) {
    const messages: Record<string, string> = {
      already_read: `${EMOJI.COMPLETE} Already marked as read today! Great job.`,
      plan_not_found: "Plan not found.",
      plan_complete: "This plan is already complete!",
    };
    await interaction.followUp({
      embeds: [errorEmbed(messages[result.reason] ?? "Something went wrong.")],
      ephemeral: true,
    });
    return;
  }

  const plan = await getPlan(planId, discordId);
  if (!plan) return;

  await interaction.followUp({
    embeds: [markReadSuccessEmbed(plan, result.newStreak, result.isComplete)],
    ephemeral: true,
  });
}

async function handlePlanDeleteConfirm(
  interaction: ButtonInteraction,
  discordId: string,
  planId: number,
) {
  if (isNaN(planId)) {
    await interaction.update({ content: "Invalid plan ID.", embeds: [], components: [] });
    return;
  }

  await interaction.deferUpdate();

  const plan = await getPlan(planId, discordId);
  if (!plan) {
    await interaction.editReply({ content: "Plan not found.", embeds: [], components: [] });
    return;
  }

  await deletePlan(planId, discordId);
  await interaction.editReply({
    embeds: [successEmbed(`Plan **${plan.name}** has been deleted.`)],
    components: [],
  });
}

async function handleSetupReminder(
  interaction: ButtonInteraction,
  discordId: string,
) {
  const existing = await getReminderSettings(discordId);

  const modal = new ModalBuilder()
    .setCustomId("mod:reminder_set")
    .setTitle(`${EMOJI.BELL} Set Study Reminder`);

  const timeInput = new TextInputBuilder()
    .setCustomId("time_of_day")
    .setLabel("Time (HH:MM, 24-hour format)")
    .setStyle(TextInputStyle.Short)
    .setPlaceholder("08:00")
    .setValue(existing?.timeOfDay ?? "08:00")
    .setRequired(true)
    .setMinLength(5)
    .setMaxLength(5);

  const timezoneInput = new TextInputBuilder()
    .setCustomId("timezone")
    .setLabel("Timezone (e.g. America/Denver)")
    .setStyle(TextInputStyle.Short)
    .setPlaceholder("America/Denver")
    .setValue(existing?.timezone ?? "UTC")
    .setRequired(true);

  const daysInput = new TextInputBuilder()
    .setCustomId("days_of_week")
    .setLabel("Days of week (0=Sun to 6=Sat, comma-separated)")
    .setStyle(TextInputStyle.Short)
    .setPlaceholder("0,1,2,3,4,5,6  (every day)")
    .setValue((existing?.daysOfWeek as number[] | undefined)?.join(",") ?? "0,1,2,3,4,5,6")
    .setRequired(true);

  modal.addComponents(
    new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(timeInput),
    new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(timezoneInput),
    new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(daysInput),
  );

  await interaction.showModal(modal);
}

async function handleViewToday(
  interaction: ButtonInteraction,
  discordId: string,
) {
  await interaction.deferReply({ ephemeral: true });

  const plans = await getActivePlans(discordId);
  const stats = await getUserStats(discordId);
  const streak = stats?.currentStreak ?? 0;
  const today = getTodayUTC();

  if (plans.length === 0) {
    await interaction.editReply({
      embeds: [errorEmbed("No active plans. Use `/plan create` to get started.")],
    });
    return;
  }

  const embeds = [];
  const rows = [];
  for (const plan of plans.slice(0, 5)) {
    const alreadyRead = await hasReadToday(plan.id, today);
    embeds.push(todayPlanEmbed(plan, alreadyRead, streak));
    if (!plan.isComplete) rows.push(todayActionRow(plan.id, alreadyRead));
  }

  await interaction.editReply({
    embeds,
    components: rows.slice(0, 5),
  });
}
