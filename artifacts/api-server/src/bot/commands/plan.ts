import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  type ModalActionRowComponentBuilder,
} from "discord.js";
import {
  getActivePlans,
  getUserPlans,
  getPlan,
  deletePlan,
  updatePlan,
} from "../services/planService.js";
import { upsertUser } from "../services/userService.js";
import {
  planListEmbed,
  planDetailEmbed,
  errorEmbed,
  successEmbed,
  selectSourceTypeEmbed,
  selectSourceEmbed,
  confirmPlanEmbed,
} from "../ui/embeds.js";
import {
  sourceTypeSelectMenu,
  planSelectMenu,
  planEditFieldMenu,
  confirmRow,
  paginationRow,
} from "../ui/components.js";

export const data = new SlashCommandBuilder()
  .setName("plan")
  .setDescription("Manage your study plans")
  .addSubcommand((sub) =>
    sub.setName("create").setDescription("Create a new study plan"),
  )
  .addSubcommand((sub) =>
    sub
      .setName("view")
      .setDescription("View details of a specific plan")
      .addIntegerOption((o) =>
        o.setName("id").setDescription("Plan ID (from /plan list)").setRequired(false),
      ),
  )
  .addSubcommand((sub) =>
    sub.setName("list").setDescription("List all your study plans"),
  )
  .addSubcommand((sub) =>
    sub
      .setName("edit")
      .setDescription("Edit a study plan")
      .addIntegerOption((o) =>
        o.setName("id").setDescription("Plan ID to edit").setRequired(false),
      ),
  )
  .addSubcommand((sub) =>
    sub
      .setName("delete")
      .setDescription("Delete a study plan")
      .addIntegerOption((o) =>
        o.setName("id").setDescription("Plan ID to delete").setRequired(false),
      ),
  );

export async function execute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const discordId = interaction.user.id;
  const username = interaction.user.username;

  await upsertUser(discordId, username);

  const subcommand = interaction.options.getSubcommand();

  switch (subcommand) {
    case "create":
      await handleCreate(interaction);
      break;
    case "view":
      await handleView(interaction, discordId);
      break;
    case "list":
      await handleList(interaction, discordId);
      break;
    case "edit":
      await handleEdit(interaction, discordId);
      break;
    case "delete":
      await handleDelete(interaction, discordId);
      break;
  }
}

async function handleCreate(interaction: ChatInputCommandInteraction) {
  await interaction.reply({
    embeds: [selectSourceTypeEmbed()],
    components: [sourceTypeSelectMenu()],
  });
}

async function handleList(
  interaction: ChatInputCommandInteraction,
  discordId: string,
) {
  const plans = await getUserPlans(discordId);
  if (plans.length === 0) {
    await interaction.reply({
      embeds: [errorEmbed("You have no study plans. Use `/plan create` to get started.")],
    });
    return;
  }

  const totalPages = Math.ceil(plans.length / 5);
  const embed = planListEmbed(plans, 0);
  const components = totalPages > 1 ? [paginationRow("plan_list", 0, totalPages)] : [];

  await interaction.reply({ embeds: [embed], components});
}

async function handleView(
  interaction: ChatInputCommandInteraction,
  discordId: string,
) {
  const planId = interaction.options.getInteger("id");

  if (!planId) {
    // No ID given — show active plans as select menu
    const plans = await getActivePlans(discordId);
    if (plans.length === 0) {
      await interaction.reply({
        embeds: [errorEmbed("No active plans. Use `/plan create` to create one.")],
      });
      return;
    }
    if (plans.length === 1) {
      await interaction.reply({
        embeds: [planDetailEmbed(plans[0]!)],
      });
      return;
    }
    await interaction.reply({
      content: "Select a plan to view:",
      components: [planSelectMenu(plans, "sel:plan_view")],
    });
    return;
  }

  const plan = await getPlan(planId, discordId);
  if (!plan) {
    await interaction.reply({
      embeds: [errorEmbed(`Plan \`${planId}\` not found or doesn't belong to you.`)],
    });
    return;
  }

  await interaction.reply({ embeds: [planDetailEmbed(plan)]});
}

async function handleEdit(
  interaction: ChatInputCommandInteraction,
  discordId: string,
) {
  const planId = interaction.options.getInteger("id");

  if (!planId) {
    const plans = await getActivePlans(discordId);
    if (plans.length === 0) {
      await interaction.reply({
        embeds: [errorEmbed("No active plans to edit.")],
      });
      return;
    }
    await interaction.reply({
      content: "Select a plan to edit:",
      components: [planSelectMenu(plans, "sel:plan_edit_select")],
    });
    return;
  }

  const plan = await getPlan(planId, discordId);
  if (!plan) {
    await interaction.reply({
      embeds: [errorEmbed(`Plan \`${planId}\` not found.`)],
    });
    return;
  }

  await interaction.reply({
    embeds: [planDetailEmbed(plan)],
    components: [planEditFieldMenu(plan.id)],
  });
}

async function handleDelete(
  interaction: ChatInputCommandInteraction,
  discordId: string,
) {
  const planId = interaction.options.getInteger("id");

  if (!planId) {
    const plans = await getUserPlans(discordId);
    if (plans.length === 0) {
      await interaction.reply({
        embeds: [errorEmbed("No plans to delete.")],
      });
      return;
    }
    await interaction.reply({
      content: "Select a plan to delete:",
      components: [planSelectMenu(plans, "sel:plan_delete_select")],
    });
    return;
  }

  const plan = await getPlan(planId, discordId);
  if (!plan) {
    await interaction.reply({
      embeds: [errorEmbed(`Plan \`${planId}\` not found.`)],
    });
    return;
  }

  await interaction.reply({
    content: `Are you sure you want to delete **${plan.name}**? This cannot be undone.`,
    components: [confirmRow(`btn:plan_delete_confirm:${plan.id}`, "btn:cancel")],
  });
}
