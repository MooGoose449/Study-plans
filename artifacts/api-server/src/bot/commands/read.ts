import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { getActivePlans, getPlan } from "../services/planService.js";
import { markAsRead } from "../services/readService.js";
import { upsertUser } from "../services/userService.js";
import {
  markReadSuccessEmbed,
  errorEmbed,
} from "../ui/embeds.js";
import { planSelectMenu } from "../ui/components.js";
import { EMOJI } from "../ui/emojis.js";

export const data = new SlashCommandBuilder()
  .setName("read")
  .setDescription("Mark today's reading as complete")
  .addIntegerOption((o) =>
    o
      .setName("plan")
      .setDescription("Plan ID to mark as read (optional if only one active plan)")
      .setRequired(false),
  );

export async function execute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  await interaction.deferReply();

  const discordId = interaction.user.id;
  await upsertUser(discordId, interaction.user.username);

  const planId = interaction.options.getInteger("plan");

  // If plan ID specified, mark that one directly
  if (planId !== null) {
    await doMarkRead(interaction, discordId, planId);
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

  // Only one plan — mark it automatically
  if (activePlans.length === 1) {
    await doMarkRead(interaction, discordId, activePlans[0]!.id);
    return;
  }

  // Multiple plans — let user choose
  await interaction.editReply({
    content: `${EMOJI.BOOK} Which plan did you read today?`,
    components: [planSelectMenu(activePlans, "sel:read_plan_select")],
  });
}

export async function doMarkRead(
  interaction: ChatInputCommandInteraction | { editReply: Function; followUp?: Function },
  discordId: string,
  planId: number,
): Promise<void> {
  const result = await markAsRead(planId, discordId);

  if (!result.success) {
    const messages: Record<string, string> = {
      already_read: "You've already marked this plan as read today. Come back tomorrow!",
      plan_not_found: "Plan not found or doesn't belong to you.",
      plan_complete: "This plan is already complete. Start a new one with `/plan create`!",
    };
    await (interaction as any).editReply({
      embeds: [errorEmbed(messages[result.reason] ?? "Couldn't mark that as read. Try again.")],
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
    components: result.isComplete ? [] : [unreadRow(plan.id)],
  });
}
