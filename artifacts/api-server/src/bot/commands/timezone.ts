import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { getUser, updateUserTimezone } from "../services/userService.js";
import { errorEmbed, successEmbed, infoEmbed } from "../ui/embeds.js";
import { isValidTimezone } from "../utils/index.js";

export const data = new SlashCommandBuilder()
  .setName("timezone")
  .setDescription("Set or view your timezone")
  .addSubcommand((sub) =>
    sub.setName("set").setDescription("Set your IANA timezone").addStringOption((o) =>
      o.setName("timezone").setDescription("Example: America/Phoenix").setRequired(true),
    ),
  )
  .addSubcommand((sub) => sub.setName("view").setDescription("View your current timezone"));

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const discordId = interaction.user.id;
  const user = await getUser(discordId);
  if (interaction.options.getSubcommand() === "view") {
    await interaction.reply({
      embeds: [infoEmbed("Your Timezone", user?.timezone ?? "UTC")],
    });
    return;
  }

  const timezone = interaction.options.getString("timezone", true).trim();
  if (!isValidTimezone(timezone)) {
    await interaction.reply({
      embeds: [errorEmbed("Invalid timezone. Use an IANA timezone such as America/Phoenix or UTC.")],
    });
    return;
  }

  await updateUserTimezone(discordId, timezone);
  await interaction.reply({ embeds: [successEmbed(`Your timezone is now **${timezone}**.`)] });
}