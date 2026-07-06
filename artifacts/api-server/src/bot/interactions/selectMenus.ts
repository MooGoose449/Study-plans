import type { StringSelectMenuInteraction, Client } from "discord.js";
import {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  type ModalActionRowComponentBuilder,
} from "discord.js";
import { upsertUser } from "../services/userService.js";
import {
  getPlan,
  getActivePlans,
  getUserPlans,
  updatePlan,
  getSourceTotalItems,
} from "../services/planService.js";
import { markAsRead, markAsUnread } from "../services/readService.js";
import { getReminderSettings, disableReminders } from "../services/reminderService.js";
import { cancelReminder } from "../scheduler/index.js";
import { markReadSuccessEmbed, planDetailEmbed, errorEmbed, selectSourceEmbed, successEmbed } from "../ui/embeds.js";
import {
  scriptureSelectMenu,
  conferenceSelectMenu,
  planEditFieldMenu,
} from "../ui/components.js";
import { getTodayUTC } from "../utils/index.js";
import { EMOJI } from "../ui/emojis.js";
import { STANDARD_WORKS } from "../metadata/scriptures.js";
import { CONFERENCES } from "../metadata/conferences.js";

/**
 * Route a string select menu interaction based on its custom ID.
 * Custom ID format: sel:<action>:<param1>...
 */
export async function handleSelectMenu(
  interaction: StringSelectMenuInteraction,
  client: Client,
): Promise<void> {
  const [, action, ...params] = interaction.customId.split(":");
  const discordId = interaction.user.id;

  await upsertUser(discordId, interaction.user.username);

  switch (action) {
    case "source_type":
      await handleSourceTypeSelect(interaction);
      break;

    case "scripture_source":
      await handleScriptureSourceSelect(interaction);
      break;

    case "conference_source":
      await handleConferenceSourceSelect(interaction);
      break;

    case "plan_view":
      await handlePlanView(interaction, discordId);
      break;

    case "plan_edit_select":
      await handlePlanEditSelect(interaction, discordId);
      break;

    case "plan_edit_field":
      await handlePlanEditField(interaction, discordId, Number(params[0]), client);
      break;

    case "plan_delete_select":
      await handlePlanDeleteSelect(interaction, discordId);
      break;

    case "read_plan_select":
      await handleReadPlanSelect(interaction, discordId, params[0]);
      break;

    default:
      await interaction.reply({
        embeds: [errorEmbed("Unknown selection. Please try again.")],
        ephemeral: true,
      });
  }
}

// ── Plan creation flow ────────────────────────────────────────────────────

async function handleSourceTypeSelect(interaction: StringSelectMenuInteraction) {
  const sourceType = interaction.values[0] as "scripture" | "conference";

  if (sourceType === "scripture") {
    await interaction.update({
      embeds: [selectSourceEmbed("scripture")],
      components: [scriptureSelectMenu()],
    });
  } else {
    await interaction.update({
      embeds: [selectSourceEmbed("conference")],
      components: [conferenceSelectMenu()],
    });
  }
}

async function handleScriptureSourceSelect(
  interaction: StringSelectMenuInteraction,
) {
  const sourceId = interaction.values[0]!;
  const work = STANDARD_WORKS.find((w) => w.id === sourceId);
  if (!work) {
    await interaction.reply({ embeds: [errorEmbed("Invalid selection.")], ephemeral: true });
    return;
  }

  const totalItems = getSourceTotalItems("scripture", sourceId);
  await showPlanCreationModal(interaction, "scripture", sourceId, work.name, totalItems);
}

async function handleConferenceSourceSelect(
  interaction: StringSelectMenuInteraction,
) {
  const sourceId = interaction.values[0]!;
  const conf = CONFERENCES.find((c) => c.id === sourceId);
  if (!conf) {
    await interaction.reply({ embeds: [errorEmbed("Invalid selection.")], ephemeral: true });
    return;
  }

  const totalItems = getSourceTotalItems("conference", sourceId);
  await showPlanCreationModal(interaction, "conference", sourceId, conf.name, totalItems);
}

async function showPlanCreationModal(
  interaction: StringSelectMenuInteraction,
  sourceType: "scripture" | "conference",
  sourceId: string,
  sourceName: string,
  totalItems: number,
) {
  const defaultUnits = sourceType === "conference" ? "1" : "2";

  const modal = new ModalBuilder()
    .setCustomId(`mod:plan_create:${sourceType}:${sourceId}:${totalItems}`)
    .setTitle(`${EMOJI.PLUS} New Study Plan`);

  const nameInput = new TextInputBuilder()
    .setCustomId("plan_name")
    .setLabel("Plan Name")
    .setStyle(TextInputStyle.Short)
    .setPlaceholder(`e.g. Morning ${sourceName} Study`)
    .setRequired(true)
    .setMaxLength(80);

  const unitsInput = new TextInputBuilder()
    .setCustomId("units_per_day")
    .setLabel(`${sourceType === "scripture" ? "Chapters" : "Talks"} per day`)
    .setStyle(TextInputStyle.Short)
    .setPlaceholder(defaultUnits)
    .setValue(defaultUnits)
    .setRequired(true);

  const goalInput = new TextInputBuilder()
    .setCustomId("goal_date")
    .setLabel("Goal completion date (optional, YYYY-MM-DD)")
    .setStyle(TextInputStyle.Short)
    .setPlaceholder("2025-12-31")
    .setRequired(false);

  modal.addComponents(
    new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(nameInput),
    new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(unitsInput),
    new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(goalInput),
  );

  await interaction.showModal(modal);
}

// ── Plan management ───────────────────────────────────────────────────────

async function handlePlanView(
  interaction: StringSelectMenuInteraction,
  discordId: string,
) {
  const planId = Number(interaction.values[0]);
  const plan = await getPlan(planId, discordId);
  if (!plan) {
    await interaction.update({ embeds: [errorEmbed("Plan not found.")], components: [] });
    return;
  }
  await interaction.update({ embeds: [planDetailEmbed(plan)], components: [] });
}

async function handlePlanEditSelect(
  interaction: StringSelectMenuInteraction,
  discordId: string,
) {
  const planId = Number(interaction.values[0]);
  const plan = await getPlan(planId, discordId);
  if (!plan) {
    await interaction.update({ embeds: [errorEmbed("Plan not found.")], components: [] });
    return;
  }
  await interaction.update({
    embeds: [planDetailEmbed(plan)],
    components: [planEditFieldMenu(plan.id)],
  });
}

async function handlePlanEditField(
  interaction: StringSelectMenuInteraction,
  discordId: string,
  planId: number,
  client: Client,
) {
  const field = interaction.values[0]!;

  // ── Reminder actions (per-user, not per-plan) ──────────────────────────
  if (field === "reminder_set") {
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
    return;
  }

  if (field === "reminder_disable") {
    const existing = await getReminderSettings(discordId);
    if (!existing || !existing.enabled) {
      await interaction.update({
        embeds: [errorEmbed("You don't have any active reminders to disable.")],
        components: [],
      });
      return;
    }
    await disableReminders(discordId);
    cancelReminder(discordId);
    await interaction.update({
      embeds: [successEmbed(`${EMOJI.BELL_OFF} Reminders disabled.`)],
      components: [],
    });
    return;
  }

  // ── Plan field edits ───────────────────────────────────────────────────
  const plan = await getPlan(planId, discordId);
  if (!plan) {
    await interaction.reply({ embeds: [errorEmbed("Plan not found.")], ephemeral: true });
    return;
  }

  if (field === "toggle_active") {
    const newActive = !plan.isActive;
    await updatePlan(planId, discordId, { isActive: newActive });
    await interaction.update({
      embeds: [
        successEmbed(
          `${newActive ? EMOJI.COMPLETE + " Plan **" + plan.name + "** is now active." : EMOJI.INFO + " Plan **" + plan.name + "** is now paused."}`,
        ),
      ],
      components: [],
    });
    return;
  }

  // Show modal for text edits
  const modal = new ModalBuilder()
    .setCustomId(`mod:plan_edit:${planId}:${field}`)
    .setTitle(`${EMOJI.PENCIL} Edit Plan`);

  let input: TextInputBuilder;

  if (field === "name") {
    input = new TextInputBuilder()
      .setCustomId("value")
      .setLabel("New Plan Name")
      .setStyle(TextInputStyle.Short)
      .setValue(plan.name)
      .setRequired(true)
      .setMaxLength(80);
  } else if (field === "units_per_day") {
    input = new TextInputBuilder()
      .setCustomId("value")
      .setLabel("Units per Day")
      .setStyle(TextInputStyle.Short)
      .setValue(String(plan.unitsPerDay))
      .setRequired(true);
  } else {
    input = new TextInputBuilder()
      .setCustomId("value")
      .setLabel("Goal Date (YYYY-MM-DD, leave blank to remove)")
      .setStyle(TextInputStyle.Short)
      .setValue(plan.goalDate ?? "")
      .setRequired(false);
  }

  modal.addComponents(
    new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(input),
  );

  await interaction.showModal(modal);
}

async function handlePlanDeleteSelect(
  interaction: StringSelectMenuInteraction,
  discordId: string,
) {
  const planId = Number(interaction.values[0]);
  const plan = await getPlan(planId, discordId);
  if (!plan) {
    await interaction.update({ embeds: [errorEmbed("Plan not found.")], components: [] });
    return;
  }

  // Show confirmation modal asking user to type plan name
  const modal = new ModalBuilder()
    .setCustomId(`mod:plan_delete_confirm:${planId}`)
    .setTitle(`${EMOJI.TRASH} Confirm Deletion`);

  const input = new TextInputBuilder()
    .setCustomId("plan_name_confirm")
    .setLabel(`Type the plan name to confirm deletion`)
    .setStyle(TextInputStyle.Short)
    .setPlaceholder(plan.name)
    .setRequired(true)
    .setMaxLength(80);

  modal.addComponents(
    new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(input),
  );

  await interaction.showModal(modal);
}

async function handleReadPlanSelect(
  interaction: StringSelectMenuInteraction,
  discordId: string,
  action?: string,
) {
  await interaction.deferUpdate();

  const planId = Number(interaction.values[0]);
  const readAction = action || "read";

  if (readAction === "unread") {
    const result = await markAsUnread(planId, discordId);

    if (!result.success) {
      const messages: Record<string, string> = {
        not_read: "This plan hasn't been marked as read today.",
        plan_not_found: "Plan not found.",
      };
      await interaction.followUp({
        embeds: [errorEmbed(messages[result.reason] ?? "Something went wrong.")],
        ephemeral: true,
      });
      return;
    }

    const plan = await getPlan(planId, discordId);
    if (!plan) return;

    await interaction.editReply({
      content: "",
      embeds: [
        errorEmbed(
          `${EMOJI.UNDO} Marked as unread. Your progress has been restored to **${plan.currentPosition}** units.`,
        ),
      ],
      components: [],
    });
    return;
  }

  // Handle read action
  const result = await markAsRead(planId, discordId);

  if (!result.success) {
    const messages: Record<string, string> = {
      already_read: "You've already read this plan today!",
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

  await interaction.editReply({
    content: "",
    embeds: [markReadSuccessEmbed(plan, result.newStreak, result.isComplete)],
    components: [],
  });
}
