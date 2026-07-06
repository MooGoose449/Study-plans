import { SlashCommandBuilder, EmbedBuilder, type ChatInputCommandInteraction } from "discord.js";
import { COLORS } from "../ui/embeds.js";
import { EMOJI } from "../ui/emojis.js";

export const data = new SlashCommandBuilder()
  .setName("ping")
  .setDescription("Check the bot's latency and responsiveness");

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const sent = await interaction.reply({ content: "Pinging…", ephemeral: true, fetchReply: true });
  const latency = sent.createdTimestamp - interaction.createdTimestamp;
  const websocket = interaction.client.ws.ping;

  const embed = new EmbedBuilder()
    .setColor(COLORS.PRIMARY)
    .setTitle(`${EMOJI.BELL} Pong!`)
    .addFields(
      { name: "Bot Latency", value: `\`${latency}ms\``, inline: true },
      { name: "API WebSocket", value: `\`${websocket}ms\``, inline: true },
    )
    .setFooter({ text: "Bot latency measures round-trip; API WebSocket is the gateway heartbeat" });

  await interaction.editReply({ content: null, embeds: [embed] });
}
