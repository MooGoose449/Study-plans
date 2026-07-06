import type { ChatInputCommandInteraction } from "discord.js";
import * as plan from "./plan.js";
import * as today from "./today.js";
import * as read from "./read.js";
import * as reminder from "./reminder.js";
import * as streak from "./streak.js";
import * as stats from "./stats.js";
import * as leaderboard from "./leaderboard.js";
import * as help from "./help.js";
import * as ping from "./ping.js";

// Use a loose data type to accommodate SlashCommandOptionsOnlyBuilder,
// SlashCommandSubcommandsOnlyBuilder, and SlashCommandBuilder equally.
export type Command = {
  data: { name: string; toJSON(): unknown };
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
};

export const commands: Command[] = [
  plan,
  today,
  read,
  reminder,
  streak,
  stats,
  leaderboard,
  help,
  ping,
];

/** Map from command name to handler. */
export const commandMap = new Map<string, Command>(
  commands.map((cmd) => [cmd.data.name, cmd]),
);
