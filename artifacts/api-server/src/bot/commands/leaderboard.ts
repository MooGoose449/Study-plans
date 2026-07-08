import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { upsertUser } from "../services/userService.js";
import {
  getGlobalLeaderboard,
  getServerLeaderboard,
} from "../services/statsService.js";
import { leaderboardEmbed, errorEmbed } from "../ui/embeds.js";

export const data = new SlashCommandBuilder()
  .setName("leaderboard")
  .setDescription("View the study streak leaderboard")
  .addStringOption((o) =>
    o
      .setName("type")
      .setDescription("Streak type to rank by")
      .setRequired(true)
      .addChoices(
        { name: "Current Streak", value: "current" },
        { name: "Longest Streak", value: "longest" },
      ),
  )
  .addStringOption((o) =>
    o
      .setName("scope")
      .setDescription("Server members only or everyone")
      .setRequired(true)
      .addChoices(
        { name: "Server", value: "server" },
        { name: "Global", value: "global" },
      ),
  );

export async function execute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  await interaction.deferReply();

  const discordId = interaction.user.id;
  await upsertUser(discordId, interaction.user.username);

  // Options are required; use the typed getter
  const type = interaction.options.getString("type", true) as "current" | "longest";
  const scope = interaction.options.getString("scope", true) as "server" | "global";

  let entries;
  let fallbackToGlobal = false;

  if (scope === "server" && interaction.guild) {
    // Try a fast, cached path first and otherwise fetch with a short timeout so the command doesn't hang.
    let memberIds: string[] = [];
    try {
      const cache = interaction.guild.members.cache;
      if (cache && cache.size > 0) {
        memberIds = cache.filter((m) => !m.user.bot).map((m) => m.user.id);
      } else {
        // Fetch but race against a timeout to avoid long waits on large guilds or network issues.
        const fetchPromise = interaction.guild.members.fetch();
        const timeoutMs = 3000;
        const timeoutPromise = new Promise<never>((_, rej) =>
          setTimeout(() => rej(new Error("member fetch timeout")), timeoutMs),
        );
        // If fetch resolves first, use it; otherwise the timeout rejects and we fall back.
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const members = (await Promise.race([fetchPromise, timeoutPromise])) as any;
        memberIds = members.filter((m: any) => !m.user.bot).map((m: any) => m.user.id);
      }

      // If there are no member IDs after the attempted fetch, fall back
      if (memberIds.length === 0) {
        fallbackToGlobal = true;
        entries = await getGlobalLeaderboard(type);
      } else {
        entries = await getServerLeaderboard(type, memberIds);
      }
    } catch (err) {
      // On any failure (permissions, intent disabled, timeout), fall back to global leaderboard
      fallbackToGlobal = true;
      entries = await getGlobalLeaderboard(type);
    }
  } else {
    entries = await getGlobalLeaderboard(type);
  }

  if (!entries || entries.length === 0) {
    await interaction.editReply({
      embeds: [
        errorEmbed(
          scope === "server"
            ? "No server members have used the bot yet. Be the first!"
            : "No users have recorded any reading days yet.",
        ),
      ],
    });

    return;
  }

  // Show the leaderboard as the main reply
  await interaction.editReply({
    embeds: [leaderboardEmbed(entries, type, scope === "server" && !fallbackToGlobal ? "server" : "global")],
  });

  // If we had to fall back to global due to member fetch failure, notify the user in a follow-up (plain text)
  if (fallbackToGlobal && scope === "server") {
    await interaction.followUp({
      content:
        "Unable to fetch server members (permissions or intent may be disabled). Showing global leaderboard instead.",
      ephemeral: true,
    });
  }
}
