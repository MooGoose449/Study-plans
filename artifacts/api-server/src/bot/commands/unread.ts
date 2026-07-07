import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { getActivePlans, getPlan } from "../services/planService.js";
import { markAsUnread } from "../services/readService.js";
import { upsertUser } from "../services/userService.js";
import { errorEmbed, successEmbed } from "../ui/embeds.js";
import { planSelectMenu } from "../ui/components.js";
import { EMOJI } from "../ui/emojis.js";

export const data = new SlashCommandBuilder()
  .setName("unread")
  .setDescription("Undo today's reading for a plan");

export async function execute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  const discordId = interaction.user.id;
  await upsertUser(discordId, interaction.user.username);

  const activePlans = await getActivePlans(discordId);

  if (activePlans.length === 0) {
    await interaction.editReply({
      embeds: [errorEmbed("You have no active study plans.")],
    });
    return;
  }

  if (activePlans.length === 1) {
    await doMarkUnread(interaction, discordId, activePlans[0]!.id);
    return;
  }

  await interaction.editReply({
    content: `${EMOJI.UNDO} Which plan do you want to mark as unread?`,
    components: [planSelectMenu(activePlans, "sel:read_plan_select:unread")],
  });
}

export async function doMarkUnread(
  interaction: ChatInputCommandInteraction | { editReply: Function },
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

  const plan = await getPlan(planId, discordId);
  if (!plan) return;

  await (interaction as any).editReply({
    embeds: [
      successEmbed(
        `${EMOJI.UNDO} Marked as unread. Your progress has been restored to **${plan.currentPosition}** units.`,
      ),
    ],
    components: [],
  });
}
