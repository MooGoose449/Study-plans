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
  successEmbed,
} from "../ui/embeds.js";
import { planSelectMenu } from "../ui/components.js";
import { EMOJI } from "../ui/emojis.js";

export const data = new SlashCommandBuilder()
  .setName("read")
  .setDescription("Track your daily reading")
  .addSubcommand((sub) =>
    sub
      .setName("read")
      .setDescription("Mark today's reading as complete")
      .addIntegerOption((o) =>
        o
          .setName("plan")
          .setDescription("Plan ID (optional if you only have one active plan)")
          .setRequired(false),
      )
      .addStringOption((o) =>
        o
          .setName("date")
          .setDescription("Read up to this date (YYYY-MM-DD). Cannot be used with 'amount'.")
          .setRequired(false),
      )
      .addIntegerOption((o) =>
        o
          .setName("amount")
          .setDescription("Units to mark as read today. Cannot be used with 'date'.")
          .setRequired(false),
      ),
  )
  .addSubcommand((sub) =>
    sub
      .setName("unread")
      .setDescription("Undo today's reading for a plan")
      .addIntegerOption((o) =>
        o
          .setName("plan")
          .setDescription("Plan ID (optional if you only have one active plan)")
          .setRequired(false),
      ),
  );

export async function execute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  const discordId = interaction.user.id;
  await upsertUser(discordId, interaction.user.username);

  const subcommand = interaction.options.getSubcommand();

  if (subcommand === "unread") {
    await handleUnread(interaction, discordId);
    return;
  }

  // subcommand === "read"
  const dateOption = interaction.options.getString("date");
  const amountOption = interaction.options.getInteger("amount");

  if (dateOption && amountOption !== null) {
    await interaction.editReply({
      embeds: [errorEmbed("Please provide either a **date** or an **amount** — not both.")],
    });
    return;
  }

  await handleRead(interaction, discordId, dateOption, amountOption);
}

// ── Read ──────────────────────────────────────────────────────────────────

async function handleRead(
  interaction: ChatInputCommandInteraction,
  discordId: string,
  dateOption: string | null,
  amountOption: number | null,
) {
  const planId = interaction.options.getInteger("plan");
  const activePlans = await getActivePlans(discordId);

  if (activePlans.length === 0) {
    await interaction.editReply({
      embeds: [errorEmbed("You have no active study plans. Use `/plan create` to get started.")],
    });
    return;
  }

  if (planId !== null) {
    await doMarkRead(interaction, discordId, planId, dateOption, amountOption);
    return;
  }

  if (activePlans.length === 1) {
    await doMarkRead(interaction, discordId, activePlans[0]!.id, dateOption, amountOption);
    return;
  }

  await interaction.editReply({
    content: `${EMOJI.BOOK} Which plan did you read today?`,
    components: [planSelectMenu(activePlans, "sel:read_plan_select:read")],
  });
}

// ── Unread ────────────────────────────────────────────────────────────────

async function handleUnread(
  interaction: ChatInputCommandInteraction,
  discordId: string,
) {
  const planId = interaction.options.getInteger("plan");
  const activePlans = await getActivePlans(discordId);

  if (activePlans.length === 0) {
    await interaction.editReply({
      embeds: [errorEmbed("You have no active study plans.")],
    });
    return;
  }

  if (planId !== null) {
    await doMarkUnread(interaction, discordId, planId);
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

// ── Shared helpers ────────────────────────────────────────────────────────

export async function doMarkRead(
  interaction: ChatInputCommandInteraction | { editReply: Function },
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

  const plan = await getPlan(planId, discordId);
  if (!plan) return;

  await (interaction as any).editReply({
    embeds: [markReadSuccessEmbed(plan, result.newStreak, result.isComplete)],
    components: [],
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
