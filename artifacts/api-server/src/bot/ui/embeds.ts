import {
  EmbedBuilder,
  type ColorResolvable,
} from "discord.js";
import type { StudyPlan, Statistics, ReminderSettings } from "@workspace/db";
import { EMOJI, buildProgressBar, getSourceEmoji } from "./emojis.js";
import {
  getTodaysAssignment,
  getTodaysAssignmentLinked,
  getPlanSourceLabel,
  estimateCompletionDate,
} from "../services/planService.js";
import type { LeaderboardEntry } from "../services/statsService.js";
import { calcProgress, formatDaysOfWeek, ordinal } from "../utils/index.js";
import type { Conference } from "../metadata/conferences.js";
import type { StandardWork } from "../metadata/scriptures.js";

// ── Colour palette ─────────────────────────────────────────────────────────
export const COLORS = {
  PRIMARY:  0x006EB6 as ColorResolvable,  // LDS blue
  SUCCESS:  0x2E7D32 as ColorResolvable,  // green
  WARNING:  0xF57C00 as ColorResolvable,  // amber
  ERROR:    0xC62828 as ColorResolvable,  // red
  GOLD:     0xFFD700 as ColorResolvable,  // leaderboard
  NEUTRAL:  0x5865F2 as ColorResolvable,  // Discord blurple
} as const;

// ── Generic helpers ─────────────────────────────────────────────────────────

export function errorEmbed(message: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(COLORS.ERROR)
    .setDescription(`${EMOJI.CROSS} ${message}`);
}

export function successEmbed(message: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(COLORS.SUCCESS)
    .setDescription(`${EMOJI.CHECK} ${message}`);
}

export function infoEmbed(title: string, description: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(COLORS.PRIMARY)
    .setTitle(title)
    .setDescription(description);
}

// ── Plan embeds ─────────────────────────────────────────────────────────────

export function planListEmbed(plans: StudyPlan[], page = 0, pageSize = 5): EmbedBuilder {
  const start = page * pageSize;
  const slice = plans.slice(start, start + pageSize);
  const totalPages = Math.ceil(plans.length / pageSize);

  const lines = slice.map((p) => {
    const pct = calcProgress(p.currentPosition, p.totalItems);
    const bar = buildProgressBar(pct, 8);
    const emoji = getSourceEmoji(p.sourceType, p.sourceId);
    const status = p.isComplete ? "[Done]" : p.isActive ? "[Active]" : "[Paused]";
    return `${status} **${p.name}** (ID: \`${p.id}\`)\n${emoji} ${getPlanSourceLabel(p)}\n${bar} ${pct}%`;
  });

  const embed = new EmbedBuilder()
    .setColor(COLORS.PRIMARY)
    .setTitle(`${EMOJI.BOOK} Your Study Plans`)
    .setDescription(lines.join("\n\n") || "No plans found.")
    .setFooter({ text: `Page ${page + 1} of ${totalPages} • ${plans.length} total plan(s)` });

  return embed;
}

export function planDetailEmbed(plan: StudyPlan): EmbedBuilder {
  const pct = calcProgress(plan.currentPosition, plan.totalItems);
  const bar = buildProgressBar(pct);
  const emoji = getSourceEmoji(plan.sourceType, plan.sourceId);
  const source = getPlanSourceLabel(plan);
  const est = estimateCompletionDate(plan);

  const embed = new EmbedBuilder()
    .setColor(plan.isComplete ? COLORS.SUCCESS : COLORS.PRIMARY)
    .setTitle(`${emoji} ${plan.name}`)
    .addFields(
      { name: "Source", value: source, inline: true },
      { name: "Progress", value: `${bar} **${pct}%**\n${plan.currentPosition}/${plan.totalItems} units`, inline: false },
      { name: "Units per Day", value: `${plan.unitsPerDay}`, inline: true },
      { name: "Started", value: plan.startDate, inline: true },
    );

  if (plan.goalDate) {
    embed.addFields({ name: "Goal Date", value: plan.goalDate, inline: true });
  }
  if (est && !plan.isComplete) {
    embed.addFields({ name: "Est. Completion", value: est, inline: true });
  }
  if (plan.isComplete) {
    embed.addFields({ name: "Status", value: `${EMOJI.COMPLETE} Completed!`, inline: true });
  }

  embed.setFooter({ text: `Plan ID: ${plan.id}` });
  return embed;
}

/** Build an embed showing today's reading for one plan. */
export function todayPlanEmbed(
  plan: StudyPlan,
  alreadyRead: boolean,
  streak: number,
): EmbedBuilder {
  const assignment = getTodaysAssignment(plan);
  const pct = calcProgress(plan.currentPosition, plan.totalItems);
  const bar = buildProgressBar(pct, 8);
  const emoji = getSourceEmoji(plan.sourceType, plan.sourceId);
  const source = getPlanSourceLabel(plan);

  const assignmentLinked = alreadyRead ? assignment : getTodaysAssignmentLinked(plan);

  const embed = new EmbedBuilder()
    .setColor(alreadyRead ? COLORS.SUCCESS : COLORS.PRIMARY)
    .setTitle(`${emoji} ${plan.name}`)
    .addFields(
      { name: "Source", value: source, inline: true },
      {
        name: alreadyRead ? `${EMOJI.COMPLETE} Today's Reading (Done)` : `${EMOJI.BOOK} Today's Reading`,
        value: alreadyRead ? `\`\`\`${assignment}\`\`\`` : assignmentLinked,
        inline: false,
      },
      { name: "Progress", value: `${bar} ${pct}%`, inline: true },
      { name: `${EMOJI.STREAK} Streak`, value: `${streak} day${streak !== 1 ? "s" : ""}`, inline: true },
    );

  if (plan.isComplete) {
    embed.setColor(COLORS.SUCCESS);
    embed.addFields({ name: "Status", value: `${EMOJI.COMPLETE} Completed!`, inline: false });
  }

  return embed;
}

export function markReadSuccessEmbed(
  plan: StudyPlan,
  newStreak: number,
  isComplete: boolean,
): EmbedBuilder {
  const pct = calcProgress(plan.currentPosition, plan.totalItems);
  const bar = buildProgressBar(pct);
  const emoji = getSourceEmoji(plan.sourceType, plan.sourceId);

  const embed = new EmbedBuilder()
    .setColor(isComplete ? COLORS.GOLD : COLORS.SUCCESS)
    .setTitle(
      isComplete
        ? `${EMOJI.TROPHY} Plan Complete: ${plan.name}`
        : `${EMOJI.COMPLETE} Reading Marked Complete: ${plan.name}`,
    )
    .addFields(
      { name: `${EMOJI.STREAK} Current Streak`, value: `${newStreak} day${newStreak !== 1 ? "s" : ""}`, inline: true },
      { name: "Progress", value: `${bar} ${pct}%`, inline: true },
    );

  if (isComplete) {
    embed.setDescription(`${EMOJI.STAR} Congratulations on finishing **${emoji} ${getPlanSourceLabel(plan)}**! Keep up the great work.`);
  }

  return embed;
}

// ── Stats embed ─────────────────────────────────────────────────────────────

export function statsEmbed(stats: Statistics, username: string, overallPct: number): EmbedBuilder {
  const bar = buildProgressBar(overallPct);

  return new EmbedBuilder()
    .setColor(COLORS.PRIMARY)
    .setTitle(`${EMOJI.CHART} Study Statistics: ${username}`)
    .addFields(
      { name: `${EMOJI.STREAK} Current Streak`,  value: `${stats.currentStreak} day${stats.currentStreak !== 1 ? "s" : ""}`, inline: true },
      { name: `${EMOJI.TROPHY} Longest Streak`,  value: `${stats.longestStreak} day${stats.longestStreak !== 1 ? "s" : ""}`, inline: true },
      { name: `${EMOJI.CALENDAR} Total Reading Days`, value: `${stats.totalReadingDays}`, inline: true },
      { name: `${EMOJI.BOOK} Chapters Read`,     value: `${stats.chaptersCompleted}`, inline: true },
      { name: `${EMOJI.CONFERENCE} Talks Read`,  value: `${stats.talksCompleted}`,   inline: true },
      { name: `${EMOJI.COMPLETE} Plans Finished`,value: `${stats.plansCompleted}`,   inline: true },
      {
        name: "Overall Progress",
        value: `${bar} **${overallPct}%**`,
        inline: false,
      },
    )
    .setFooter({ text: stats.lastReadDate ? `Last read: ${stats.lastReadDate}` : "No readings recorded yet." });
}

// ── Streak embed ─────────────────────────────────────────────────────────────

export function streakEmbed(stats: Statistics, username: string): EmbedBuilder {
  const fire = EMOJI.STREAK.repeat(Math.min(stats.currentStreak, 5));

  return new EmbedBuilder()
    .setColor(stats.currentStreak > 0 ? COLORS.WARNING : COLORS.NEUTRAL)
    .setTitle(`${EMOJI.STREAK} Streak: ${username}`)
    .addFields(
      { name: "Current Streak", value: `${fire} **${stats.currentStreak}** day${stats.currentStreak !== 1 ? "s" : ""}`, inline: false },
      { name: "Longest Streak", value: `${EMOJI.TROPHY} **${stats.longestStreak}** day${stats.longestStreak !== 1 ? "s" : ""}`, inline: false },
      { name: "Last Read", value: stats.lastReadDate ?? "Never", inline: true },
    );
}

// ── Leaderboard embed ────────────────────────────────────────────────────────

export function leaderboardEmbed(
  entries: LeaderboardEntry[],
  type: "current" | "longest",
  scope: "server" | "global",
): EmbedBuilder {
  const typeLabel = type === "current" ? "Current Streak" : "Longest Streak";
  const scopeEmoji = scope === "global" ? EMOJI.GLOBE : EMOJI.PEOPLE;
  const scopeLabel = scope === "global" ? "Global" : "Server";

  const medals: Record<number, string> = {
    1: EMOJI.MEDAL_GOLD,
    2: EMOJI.MEDAL_SILVER,
    3: EMOJI.MEDAL_BRONZE,
  };

  const lines = entries.map((e) => {
    const medal = medals[e.rank] ?? `**${ordinal(e.rank)}**`;
    const days = `${e.value} day${e.value !== 1 ? "s" : ""}`;
    return `${medal} **${e.username}** ${EMOJI.STREAK} ${days}`;
  });

  return new EmbedBuilder()
    .setColor(COLORS.GOLD)
    .setTitle(`${EMOJI.TROPHY} ${scopeEmoji} ${scopeLabel} Leaderboard: ${typeLabel}`)
    .setDescription(lines.join("\n") || "No entries yet. Be the first!")
    .setFooter({ text: `Top ${entries.length} • ${EMOJI.STREAK} = days` });
}

// ── Reminder embed ─────────────────────────────────────────────────────────

export function reminderSettingsEmbed(settings: ReminderSettings): EmbedBuilder {
  const daysLabel = formatDaysOfWeek(settings.daysOfWeek as number[]);

  return new EmbedBuilder()
    .setColor(settings.enabled ? COLORS.SUCCESS : COLORS.NEUTRAL)
    .setTitle(`${settings.enabled ? EMOJI.BELL : EMOJI.BELL_OFF} Reminder Settings`)
    .addFields(
      { name: "Status",    value: settings.enabled ? "Enabled" : "Disabled",  inline: true },
      { name: "Time",      value: settings.timeOfDay,                          inline: true },
      { name: "Timezone",  value: settings.timezone,                           inline: true },
      { name: "Days",      value: daysLabel,                                   inline: false },
    );
}

/** DM reminder embed sent to users. */
export function reminderDmEmbed(
  plans: StudyPlan[],
  streak: number,
): EmbedBuilder {
  const assignmentLines = plans
    .filter((p) => !p.isComplete)
    .map((p) => {
      const emoji = getSourceEmoji(p.sourceType, p.sourceId);
      return `${emoji} **${p.name}**\n${getTodaysAssignmentLinked(p)}`;
    });

  return new EmbedBuilder()
    .setColor(COLORS.PRIMARY)
    .setTitle(`${EMOJI.BELL} Time to Study!`)
    .setDescription(
      assignmentLines.join("\n\n") || "All plans complete! Great work!",
    )
    .addFields(
      { name: `${EMOJI.STREAK} Current Streak`, value: `${streak} day${streak !== 1 ? "s" : ""}`, inline: true },
    )
    .setFooter({ text: "Use the buttons below or /today to manage your reading." });
}

// ── Source selection embeds ─────────────────────────────────────────────────

export function selectSourceTypeEmbed(): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(COLORS.PRIMARY)
    .setTitle(`${EMOJI.PLUS} Create a Study Plan`)
    .setDescription("What would you like to study?");
}

export function selectSourceEmbed(sourceType: "scripture" | "conference"): EmbedBuilder {
  const label = sourceType === "scripture" ? "Standard Work" : "General Conference";
  return new EmbedBuilder()
    .setColor(COLORS.PRIMARY)
    .setTitle(`${EMOJI.PLUS} Create a Study Plan`)
    .setDescription(`Which ${label} would you like to study?`);
}

export function confirmPlanEmbed(
  name: string,
  sourceLabel: string,
  totalItems: number,
  unitsPerDay: number,
  goalDate?: string,
): EmbedBuilder {
  const daysToComplete = Math.ceil(totalItems / unitsPerDay);
  return new EmbedBuilder()
    .setColor(COLORS.PRIMARY)
    .setTitle(`${EMOJI.PLUS} Confirm Study Plan`)
    .addFields(
      { name: "Plan Name",       value: name,                        inline: false },
      { name: "Source",          value: sourceLabel,                  inline: true },
      { name: "Units per Day",   value: `${unitsPerDay}`,            inline: true },
      { name: "Total Units",     value: `${totalItems}`,             inline: true },
      { name: "Est. Days",       value: `~${daysToComplete} days`,   inline: true },
      ...(goalDate ? [{ name: "Goal Date", value: goalDate, inline: true }] : []),
    );
}
