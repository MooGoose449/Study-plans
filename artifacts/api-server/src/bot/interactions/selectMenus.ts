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
import { markAsRead } from "../services/readService.js";
import { markReadSuccessEmbed, planDetailEmbed, errorEmbed, selectSourceEmbed } from "../ui/embeds.js";
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
      await handlePlanEditField(interaction, discordId, Number(params[0]));
      break;

    case "plan_delete_select":
      await handlePlanDeleteSelect(interaction, discordId);
      break;

    case "read_plan_select":
      await handleReadPlanSelect(interaction, discordId);
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
) {
  const field = interaction.values[0]!;
  const plan = await getPlan(planId, discordId);
  if (!plan) {
    await interaction.reply({ embeds: [errorEmbed("Plan not found.")], ephemeral: true });
    return;
  }

  if (field === "toggle_active") {
    const newActive = !plan.isActive;
    await updatePlan(planId, discordId, { isActive: newActive });
    await interaction.update({
      embeds: [errorEmbed(`Plan is now ${newActive ? "active" : "paused"}.`)],
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

  const { confirmRow } = await import("../ui/components.js");
  await interaction.update({
    content: `Are you sure you want to delete **${plan.name}**? This cannot be undone.`,
    embeds: [],
    components: [confirmRow(`btn:plan_delete_confirm:${plan.id}`, "btn:cancel")],
  });
}

async function handleReadPlanSelect(
  interaction: StringSelectMenuInteraction,
  discordId: string,
) {
  await interaction.deferUpdate();

  const planId = Number(interaction.values[0]);
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
