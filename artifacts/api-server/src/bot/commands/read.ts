import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { getActivePlans, getPlan } from "../services/planService.js";
import { markAsRead, markAsUnread } from "../services/readService.js";
import { upsertUser } from "../services/userService.js";
import {
  markReadSuccessEmbed,
  errorEmbed,
} from "../ui/embeds.js";
import { planSelectMenu } from "../ui/components.js";
import { EMOJI } from "../ui/emojis.js";

export const data = new SlashCommandBuilder()
  .setName("read")
  .setDescription("Mark today's reading as complete or undo it")
  .addStringOption((o) =>
    o
      .setName("action")
      .setDescription("Mark as read or undo (mark as unread)")
      .setRequired(true)
      .addChoices(
        { name: "Read", value: "read" },
        { name: "Unread", value: "unread" },
      ),
  )
  .addIntegerOption((o) =>
    o
      .setName("plan")
      .setDescription("Plan ID to mark as read (optional if only one active plan)")
      .setRequired(false),
  )
  .addStringOption((o) =>
    o
      .setName("date")
      .setDescription("Mark as read up to this date (YYYY-MM-DD) - mutually exclusive with amount")
      .setRequired(false),
  )
  .addIntegerOption((o) =>
    o
      .setName("amount")
      .setDescription("Number of units to mark as read per day - mutually exclusive with date")
      .setRequired(false),
  );

export async function execute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  const discordId = interaction.user.id;
  await upsertUser(discordId, interaction.user.username);

  const action = interaction.options.getString("action", true);
  const planId = interaction.options.getInteger("plan");
  const dateOption = interaction.options.getString("date");
  const amountOption = interaction.options.getInteger("amount");

  // Validate that date and amount are not both provided
  if (dateOption && amountOption) {
    await interaction.editReply({
      embeds: [errorEmbed("Please choose either a date OR an amount, not both.")],
    });
    return;
  }

  // If plan ID specified, handle that one directly
  if (planId !== null) {
    if (action === "read") {
      await doMarkRead(interaction, discordId, planId, dateOption, amountOption);
    } else {
      await doMarkUnread(interaction, discordId, planId);
    }
    return;
  }

  // Otherwise, find active plans
  const activePlans = await getActivePlans(discordId);

  if (activePlans.length === 0) {
    await interaction.editReply({
      embeds: [errorEmbed("You have no active study plans. Use `/plan create` to get started.")],
    });
    return;
  }

  // Only one plan — handle it automatically
  if (activePlans.length === 1) {
    if (action === "read") {
      await doMarkRead(interaction, discordId, activePlans[0]!.id, dateOption, amountOption);
    } else {
      await doMarkUnread(interaction, discordId, activePlans[0]!.id);
    }
    return;
  }

  // Multiple plans — let user choose
  await interaction.editReply({
    content: `${EMOJI.BOOK} Which plan did you ${action === "read" ? "read" : "want to undo"} today?`,
    components: [planSelectMenu(activePlans, `sel:read_plan_select:${action}`)],
  });
}

export async function doMarkRead(
  interaction: ChatInputCommandInteraction | { editReply: Function; followUp?: Function },
  discordId: string,
  planId: number,
  dateOption: string | null,
  amountOption: number | null,
): Promise<void> {
  const result = await markAsRead(planId, discordId);

  if (!result.success) {
    const messages: Record<string, string> = {
      already_read: "You've already marked this plan as read today. Come back tomorrow!",
      plan_not_found: "Plan not found or doesn't belong to you.",
      plan_complete: "This plan is already complete. Start a new one with `/plan create`!",
    };
    await (interaction as any).editReply({
      embeds: [errorEmbed(messages[result.reason] ?? "Something went wrong.")],
    });
    return;
  }

  // Reload plan for updated position
  const plan = await getPlan(planId, discordId);
  if (!plan) return;

  await (interaction as any).editReply({
    embeds: [
      markReadSuccessEmbed(plan, result.newStreak, result.isComplete),
    ],
    components: [],
  });
}

export async function doMarkUnread(
  interaction: ChatInputCommandInteraction | { editReply: Function; followUp?: Function },
  discordId: string,
  planId: number,
): Promise<void> {
  const result = await markAsUnread(planId, discordId);

  if (!result.success) {
    const messages: Record<string, string> = {
      not_read: "This plan hasn't been marked as read today.",
      plan_not_found: "Plan not found or doesn't belong to you.",
    };
    await (interaction as any).editReply({
      embeds: [errorEmbed(messages[result.reason] ?? "Something went wrong.")],
    });
    return;
  }

  // Reload plan for updated position
  const plan = await getPlan(planId, discordId);
  if (!plan) return;

  await (interaction as any).editReply({
    embeds: [
      errorEmbed(
        `${EMOJI.UNDO} Marked as unread. Your progress has been restored to **${plan.currentPosition}** units.`,
      ),
    ],
    components: [],
  });
}
