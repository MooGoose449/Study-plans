import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  type ModalActionRowComponentBuilder,
} from "discord.js";
import { upsertUser } from "../services/userService.js";
import { getReminderSettings, disableReminders } from "../services/reminderService.js";
import {
  reminderSettingsEmbed,
  errorEmbed,
  successEmbed,
  infoEmbed,
} from "../ui/embeds.js";
import { EMOJI } from "../ui/emojis.js";

export const data = new SlashCommandBuilder()
  .setName("reminder")
  .setDescription("Manage your daily study reminders")
  .addSubcommand((sub) =>
    sub.setName("set").setDescription("Set up or update your reminder"),
  )
  .addSubcommand((sub) =>
    sub.setName("edit").setDescription("Edit your existing reminder settings"),
  )
  .addSubcommand((sub) =>
    sub.setName("view").setDescription("View your current reminder settings"),
  )
  .addSubcommand((sub) =>
    sub.setName("disable").setDescription("Disable your study reminders"),
  );

export async function execute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const discordId = interaction.user.id;
  await upsertUser(discordId, interaction.user.username);

  const subcommand = interaction.options.getSubcommand();

  switch (subcommand) {
    case "set":
    case "edit":
      await handleSetOrEdit(interaction, discordId);
      break;
    case "view":
      await handleView(interaction, discordId);
      break;
    case "disable":
      await handleDisable(interaction, discordId);
      break;
  }
}

async function handleSetOrEdit(
  interaction: ChatInputCommandInteraction,
  discordId: string,
) {
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
    .setLabel("Days of week (0=Sun … 6=Sat, comma-separated)")
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
}

async function handleView(
  interaction: ChatInputCommandInteraction,
  discordId: string,
) {
  const settings = await getReminderSettings(discordId);

  if (!settings) {
    await interaction.reply({
      embeds: [
        infoEmbed(
          `${EMOJI.BELL_OFF} No Reminder Set`,
          "You haven't set up a reminder yet. Use `/reminder set` to create one.",
        ),
      ],
      ephemeral: true,
    });
    return;
  }

  await interaction.reply({
    embeds: [reminderSettingsEmbed(settings)],
    ephemeral: true,
  });
}

async function handleDisable(
  interaction: ChatInputCommandInteraction,
  discordId: string,
) {
  const settings = await getReminderSettings(discordId);

  if (!settings || !settings.enabled) {
    await interaction.reply({
      embeds: [errorEmbed("You don't have any active reminders to disable.")],
      ephemeral: true,
    });
    return;
  }

  await disableReminders(discordId);

  // Also cancel the cron job via the scheduler
  const { cancelReminder } = await import("../scheduler/index.js");
  cancelReminder(discordId);

  await interaction.reply({
    embeds: [successEmbed("Your study reminders have been disabled.")],
    ephemeral: true,
  });
}
