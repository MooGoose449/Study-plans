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
  planEditPaceTypeMenu,
  planPaceTypeMenu,
  unreadRow,
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

    case "plan_pace_type":
      await handlePlanPaceTypeSelect(interaction);
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

    case "plan_edit_pace_type":
      await handlePlanEditPaceTypeSelect(interaction, discordId, Number(params[0]));
      break;

    case "plan_delete_select":
      await handlePlanDeleteSelect(interaction, discordId);
      break;

    case "read_plan_select":
      await handleReadPlanSelect(interaction, discordId);
      break;

    default:
      await interaction.reply({
        embeds: [errorEmbed("That menu is no longer active. Try the command again.")],
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
    await interaction.reply({ embeds: [errorEmbed("Invalid selection.")]});
    return;
  }

  const totalItems = getSourceTotalItems("scripture", sourceId);
  await showPaceTypeMenu(interaction, "scripture", sourceId, totalItems);
}

async function handleConferenceSourceSelect(
  interaction: StringSelectMenuInteraction,
) {
  const sourceId = interaction.values[0]!;
  const conf = CONFERENCES.find((c) => c.id === sourceId);
  if (!conf) {
    await interaction.reply({ embeds: [errorEmbed("Invalid selection.")]});
    return;
  }

  const totalItems = getSourceTotalItems("conference", sourceId);
  await showPaceTypeMenu(interaction, "conference", sourceId, totalItems);
}

async function showPaceTypeMenu(
  interaction: StringSelectMenuInteraction,
  sourceType: "scripture" | "conference",
  sourceId: string,
  totalItems: number,
) {
  await interaction.update({
    embeds: [],
    content: "How would you like to pace your reading?",
    components: [planPaceTypeMenu(sourceType, sourceId, totalItems)],
  });
}

async function handlePlanPaceTypeSelect(interaction: StringSelectMenuInteraction) {
  // customId = "sel:plan_pace_type:<sourceType>:<sourceId>:<totalItems>"
  const parts = interaction.customId.split(":");
  const sourceType = parts[2] as "scripture" | "conference";
  const sourceId = parts[3]!;
  const totalItems = Number(parts[4]);
  const mode = interaction.values[0] as "daily" | "dated";

  const sourceName =
    sourceType === "scripture"
      ? (STANDARD_WORKS.find((w) => w.id === sourceId)?.name ?? sourceId)
      : (CONFERENCES.find((c) => c.id === sourceId)?.name ?? sourceId);

  const unitLabel = sourceType === "scripture" ? "Chapters" : "Talks";
  const defaultUnits = sourceType === "conference" ? "1" : "2";

  const modal = new ModalBuilder()
    .setCustomId(`mod:plan_create:${sourceType}:${sourceId}:${totalItems}:${mode}`)
    .setTitle(`${EMOJI.PLUS} New Study Plan`);

  modal.addComponents(
    new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId("plan_name")
        .setLabel("Plan Name")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder(`e.g. Morning ${sourceName} Study`)
        .setRequired(true)
        .setMaxLength(80),
    ),
  );

  if (mode === "daily") {
    modal.addComponents(
      new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("units_per_day")
          .setLabel(`${unitLabel} per day`)
          .setStyle(TextInputStyle.Short)
          .setPlaceholder(defaultUnits)
          .setValue(defaultUnits)
          .setRequired(true),
      ),
    );
  } else {
    modal.addComponents(
      new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("goal_date")
          .setLabel("Goal completion date (YYYY-MM-DD)")
          .setStyle(TextInputStyle.Short)
          .setPlaceholder("2025-12-31")
          .setRequired(true),
      ),
    );
  }

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
    await interaction.reply({ embeds: [errorEmbed("Plan not found.")]});
    return;
  }

  if (field === "toggle_active") {
    const newActive = !plan.isActive;
    await updatePlan(planId, discordId, { isActive: newActive });
    await interaction.update({
      embeds: [planDetailEmbed(plan)],
      content: `Plan is now **${newActive ? "active ▶️" : "paused ⏸️"}**.`,
      components: [],
    });
    return;
  }

  if (field === "pace") {
    await interaction.update({
      embeds: [],
      content: "How would you like to pace your reading?",
      components: [planEditPaceTypeMenu(planId)],
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

async function handlePlanEditPaceTypeSelect(
  interaction: StringSelectMenuInteraction,
  discordId: string,
  planId: number,
) {
  const mode = interaction.values[0] as "daily" | "dated";
  const plan = await getPlan(planId, discordId);
  if (!plan) {
    await interaction.reply({ embeds: [errorEmbed("Plan not found.")] });
    return;
  }

  const unitLabel = plan.sourceType === "scripture" ? "Chapters" : "Talks";

  const modal = new ModalBuilder()
    .setCustomId(`mod:plan_edit:${planId}:${mode === "daily" ? "units_per_day" : "goal_date"}`)
    .setTitle(`${EMOJI.PENCIL} Edit Pace`);

  if (mode === "daily") {
    modal.addComponents(
      new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("value")
          .setLabel(`${unitLabel} per day`)
          .setStyle(TextInputStyle.Short)
          .setValue(String(plan.unitsPerDay))
          .setRequired(true),
      ),
    );
  } else {
    modal.addComponents(
      new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("value")
          .setLabel("Goal completion date (YYYY-MM-DD)")
          .setStyle(TextInputStyle.Short)
          .setValue(plan.goalDate ?? "")
          .setPlaceholder("2025-12-31")
          .setRequired(true),
      ),
    );
  }

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

  const modal = new ModalBuilder()
    .setCustomId(`mod:plan_delete_type:${plan.id}`)
    .setTitle("Confirm Plan Deletion");
  modal.addComponents(
    new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId("confirm_name")
        .setLabel(`Type "${plan.name}" to confirm`)
        .setStyle(TextInputStyle.Short)
        .setPlaceholder(plan.name)
        .setRequired(true),
    ),
  );
  await interaction.showModal(modal);
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
      embeds: [errorEmbed(messages[result.reason] ?? "Couldn't mark that as read. Try again.")],
    });
    return;
  }

  const plan = await getPlan(planId, discordId);
  if (!plan) return;

  await interaction.editReply({
    content: "",
    embeds: [markReadSuccessEmbed(plan, result.newStreak, result.isComplete)],
    components: result.isComplete ? [] : [unreadRow(planId)],
  });
}
