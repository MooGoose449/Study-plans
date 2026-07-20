import type { Interaction, Client } from "discord.js";
import { handleButton } from "./buttons.js";
import { handleSelectMenu } from "./selectMenus.js";
import { handleModal } from "./modals.js";
import { logger } from "../../lib/logger.js";

/**
 * Dispatch any non-command interaction to the appropriate handler.
 */
export async function handleInteraction(
  interaction: Interaction,
  client: Client,
): Promise<void> {
  try {
    if (interaction.isButton()) {
      await handleButton(interaction, client);
    } else if (interaction.isStringSelectMenu()) {
      await handleSelectMenu(interaction, client);
    } else if (interaction.isModalSubmit()) {
      await handleModal(interaction, client);
    }
  } catch (err) {
    logger.error({ err, interactionId: interaction.id }, "Unhandled interaction error");

    // Attempt to send an error response if the interaction is still replyable
    try {
      const i = interaction as any;
      const payload = { content: "Something went wrong. Try the command again." };
      if (i.replied || i.deferred) {
        await i.followUp(payload);
      } else if (typeof i.reply === "function") {
        await i.reply(payload);
      }
    } catch {
      // Best-effort only
    }
  }
}
