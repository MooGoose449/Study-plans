import type { Interaction, Client } from "discord.js";
import { commandMap } from "../commands/index.js";
import { handleInteraction } from "../interactions/index.js";
import { logger } from "../../lib/logger.js";

export async function onInteractionCreate(
  interaction: Interaction,
  client: Client,
): Promise<void> {
  // ── Slash commands ────────────────────────────────────────────────────────
  if (interaction.isChatInputCommand()) {
    const command = commandMap.get(interaction.commandName);
    if (!command) {
      logger.warn({ commandName: interaction.commandName }, "Unknown slash command");
      await interaction.reply({
        content: "That command isn't recognized. Try again.",
      });
      return;
    }

    try {
      await command.execute(interaction);
    } catch (err) {
      logger.error(
        { err, commandName: interaction.commandName, userId: interaction.user.id },
        "Error executing command",
      );

      const errorMsg = { content: "Something went wrong running that command. Try again." };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorMsg);
      } else {
        await interaction.reply(errorMsg);
      }
    }
    return;
  }

  // ── All other interactions (buttons, selects, modals) ────────────────────
  await handleInteraction(interaction, client);
}
