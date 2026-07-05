import type { GuildMember, PartialGuildMember } from "discord.js";
import { logger } from "../../lib/logger.js";

/**
 * When a member leaves a guild, we don't delete their data.
 * The leaderboard filters by current guild membership dynamically.
 * This handler is here for future extensibility (e.g. notifications).
 */
export async function onGuildMemberRemove(
  member: GuildMember | PartialGuildMember,
): Promise<void> {
  logger.info(
    { userId: member.user?.id, guildId: member.guild.id },
    "Member left guild — data retained, removed from server leaderboard automatically",
  );
}
