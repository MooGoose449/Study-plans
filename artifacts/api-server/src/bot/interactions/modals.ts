import type { ModalSubmitInteraction, Client } from "discord.js";
import { upsertUser } from "../services/userService.js";
import {
  createPlan,
  getPlan,
  updatePlan,
  deletePlan,
  getSourceTotalItems,
} from "../services/planService.js";
import { upsertReminderSettings } from "../services/reminderService.js";
import { refreshUserReminder } from "../scheduler/index.js";
import {
  planDetailEmbed,
  reminderSettingsEmbed,
  errorEmbed,
  successEmbed,
} from "../ui/embeds.js";
import {
  isValidTime,
  isValidDate,
  isValidTimezone,
  parseDaysOfWeek,
  getTodayUTC,
  daysBetween,
} from "../utils/index.js";
import { STANDARD_WORKS } from "../metadata/scriptures.js";
import { CONFERENCES } from "../metadata/conferences.js";
import { EMOJI } from "../ui/emojis.js";

/**
 * Route a modal submit interaction based on its custom ID.
 * Custom ID format: mod:<action>:<param1>:<param2>...
 */
export async function handleModal(
  interaction: ModalSubmitInteraction,
  client: Client,
): Promise<void> {
  const [, action, ...params] = interaction.customId.split(":");
  const discordId = interaction.user.id;

  await upsertUser(discordId, interaction.user.username);

  switch (action) {
    case "plan_delete_type":
      await handlePlanDeleteType(interaction, discordId, Number(params[0]));
      break;

    case "plan_create":
      await handlePlanCreate(interaction, discordId, params);
      break;

    case "plan_edit":
      if (!params[0] || !params[1]) {
        await interaction.reply({ embeds: [errorEmbed("Invalid edit request. Try the command again.")] });
        return;
      }
      await handlePlanEdit(interaction, discordId, Number(params[0]), params[1]);
      break;

    case "reminder_set":
      await handleReminderSet(interaction, discordId, client);
      break;

    default:
      await interaction.reply({
        embeds: [errorEmbed("That form is no longer active. Try the command again.")],
      });
  }
}

// ── Plan creation ─────────────────────────────────────────────────────────

async function handlePlanCreate(
  interaction: ModalSubmitInteraction,
  discordId: string,
  params: string[],
) {
  const [sourceType, sourceId, totalItemsStr, mode] = params as [
    "scripture" | "conference",
    string,
    string,
    "daily" | "dated",
  ];

  const name = interaction.fields.getTextInputValue("plan_name").trim();
  const today = getTodayUTC();
  const totalItems = parseInt(totalItemsStr ?? "0", 10) || getSourceTotalItems(sourceType, sourceId);

  let unitsPerDay: number;
  let goalDate: string | null = null;

  if (mode === "dated") {
    const goalDateRaw = interaction.fields.getTextInputValue("goal_date").trim();
    if (!isValidDate(goalDateRaw)) {
      await interaction.reply({
        embeds: [errorEmbed("Invalid date format. Please use YYYY-MM-DD, e.g. `2025-12-31`.")],
      });
      return;
    }
    const days = daysBetween(today, goalDateRaw);
    if (days < 1) {
      await interaction.reply({
        embeds: [errorEmbed("Goal date must be in the future.")],
      });
      return;
    }
    unitsPerDay = Math.max(1, Math.ceil(totalItems / days));
    goalDate = goalDateRaw;
  } else {
    const unitsRaw = interaction.fields.getTextInputValue("units_per_day").trim();
    unitsPerDay = parseInt(unitsRaw, 10);
    if (isNaN(unitsPerDay) || unitsPerDay < 1 || unitsPerDay > 20) {
      await interaction.reply({
        embeds: [errorEmbed("Units per day must be a number between 1 and 20.")],
      });
      return;
    }
  }

  const plan = await createPlan({
    discordId,
    name,
    sourceType,
    sourceId,
    currentPosition: 0,
    totalItems,
    unitsPerDay,
    startDate: today,
    goalDate,
    isActive: true,
    isComplete: false,
  });

  await interaction.reply({
    embeds: [planDetailEmbed(plan)],
  });
}

async function handlePlanDeleteType(
  interaction: ModalSubmitInteraction,
  discordId: string,
  planId: number,
) {
  const typed = interaction.fields.getTextInputValue("confirm_name").trim();
  const plan = await getPlan(planId, discordId);

  if (!plan) {
    await interaction.reply({ embeds: [errorEmbed("Plan not found.")] });
    return;
  }

  if (typed.toLowerCase() !== plan.name.toLowerCase()) {
    await interaction.reply({
      embeds: [errorEmbed(`Name doesn't match. Expected: **${plan.name}**`)],
    });
    return;
  }

  await deletePlan(planId, discordId);
  await interaction.reply({
    embeds: [successEmbed(`**${plan.name}** has been deleted.`)],
  });
}

// ── Plan editing ──────────────────────────────────────────────────────────

async function handlePlanEdit(
  interaction: ModalSubmitInteraction,
  discordId: string,
  planId: number,
  field: string,
) {
  const value = interaction.fields.getTextInputValue("value").trim();
  const plan = await getPlan(planId, discordId);

  if (!plan) {
    await interaction.reply({ embeds: [errorEmbed("Plan not found.")]});
    return;
  }

  if (field === "name") {
    if (!value) {
      await interaction.reply({ embeds: [errorEmbed("Name cannot be empty.")]});
      return;
    }
    await updatePlan(planId, discordId, { name: value });
  } else if (field === "units_per_day") {
    const n = parseInt(value, 10);
    if (isNaN(n) || n < 1 || n > 20) {
      await interaction.reply({
        embeds: [errorEmbed("Units per day must be between 1 and 20.")],
      });
      return;
    }
    // Switching to daily pace — clear goal date so both can't coexist
    await updatePlan(planId, discordId, { unitsPerDay: n, goalDate: null });
  } else if (field === "goal_date") {
    if (!isValidDate(value)) {
      await interaction.reply({
        embeds: [errorEmbed("Invalid date format. Use YYYY-MM-DD, e.g. `2025-12-31`.")],
      });
      return;
    }
    const days = daysBetween(getTodayUTC(), value);
    if (days < 1) {
      await interaction.reply({
        embeds: [errorEmbed("Goal date must be in the future.")],
      });
      return;
    }
    // Switching to goal-date pace — compute daily units and store both
    const unitsPerDay = Math.max(1, Math.ceil(plan.totalItems / days));
    await updatePlan(planId, discordId, { goalDate: value, unitsPerDay });
  }

  const updated = await getPlan(planId, discordId);
  await interaction.reply({
    embeds: [planDetailEmbed(updated ?? plan)],
  });
}

// ── Reminder setup ────────────────────────────────────────────────────────

async function handleReminderSet(
  interaction: ModalSubmitInteraction,
  discordId: string,
  client: Client,
) {
  const timeOfDay = interaction.fields.getTextInputValue("time_of_day").trim();
  const timezone = interaction.fields.getTextInputValue("timezone").trim();
  const daysRaw = interaction.fields.getTextInputValue("days_of_week").trim();

  // Validate time
  if (!isValidTime(timeOfDay)) {
    await interaction.reply({
      embeds: [errorEmbed("Invalid time format. Please use HH:MM (24-hour), e.g. `08:00`.")],
    });
    return;
  }

  // Validate timezone
  if (!isValidTimezone(timezone)) {
    await interaction.reply({
      embeds: [
        errorEmbed(
          `Invalid timezone \`${timezone}\`. Use a valid IANA name like \`America/Denver\`, \`America/New_York\`, or \`UTC\`.`,
        ),
      ],
    });
    return;
  }

  // Validate days
  const daysOfWeek = parseDaysOfWeek(daysRaw);
  if (!daysOfWeek) {
    await interaction.reply({
      embeds: [
        errorEmbed(
          "Invalid days of week. Enter comma-separated numbers 0–6 (0=Sunday). Example: `1,2,3,4,5` for Mon–Fri.",
        ),
      ],
    });
    return;
  }

  const settings = await upsertReminderSettings(discordId, {
    enabled: true,
    timeOfDay,
    timezone,
    daysOfWeek,
  });

  // Reschedule the cron job
  await refreshUserReminder(client, discordId);

  await interaction.reply({
    embeds: [reminderSettingsEmbed(settings)],
  });
}
