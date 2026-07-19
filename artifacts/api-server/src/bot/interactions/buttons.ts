import type { ButtonInteraction, Client } from "discord.js";
import { markAsRead } from "../services/readService.js";
import { getPlan, deletePlan, updatePlan } from "../services/planService.js";
import { getActivePlans } from "../services/planService.js";
import { getUserStats } from "../services/statsService.js";
import { upsertUser } from "../services/userService.js";
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

    case "mark_unread":
      await handleMarkUnread(interaction, discordId, Number(params[0]));
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
        embeds: [errorEmbed("That button is no longer active. Try the command again.")],
      });
  }
}

async function handleMarkRead(
  interaction: ButtonInteraction,
  discordId: string,
  planId: number,
) {
  if (isNaN(planId)) {
    await interaction.reply({ embeds: [errorEmbed("Invalid plan ID.")]});
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
      embeds: [errorEmbed(messages[result.reason] ?? "Couldn't mark that as read. Try again.")],
    });
    return;
  }

  const plan = await getPlan(planId, discordId);
  if (!plan) return;

  await interaction.followUp({
    embeds: [markReadSuccessEmbed(plan, result.newStreak, result.isComplete)],
    components: result.isComplete ? [] : [unreadRow(planId)],
  });
}

async function handleMarkUnread(
  interaction: ButtonInteraction,
  discordId: string,
  planId: number,
) {
  await interaction.deferUpdate();

  const result = await markAsUnread(planId, discordId);

  if (!result.success) {
    await interaction.followUp({
      embeds: [errorEmbed(
        result.reason === "not_read_today"
          ? "Nothing to undo. Today's reading was already removed or not marked yet."
          : "Couldn't undo that reading. Try again.",
      )],
    });
    return;
  }

  await interaction.followUp({
    embeds: [successEmbed("Reading undone! Today's entry has been removed.")],
  });
}

async function handleViewToday(
  interaction: ButtonInteraction,
  discordId: string,
) {
  await interaction.deferReply();

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

async function handlePlanDeleteConfirm(
  interaction: ButtonInteraction,
  discordId: string,
  planId: number,
) {
  await interaction.deferUpdate();

  const deleted = await deletePlan(planId, discordId);
  if (!deleted) {
    await interaction.followUp({
      embeds: [errorEmbed("Plan not found or already deleted.")],
    });
    return;
  }

  await interaction.editReply({
    embeds: [successEmbed(`Plan deleted successfully.`)],
    components: [],
  });
}
