import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  type MessageActionRowComponentBuilder,
} from "discord.js";
import { EMOJI } from "./emojis.js";
import { STANDARD_WORKS } from "../metadata/scriptures.js";
import { CONFERENCES } from "../metadata/conferences.js";
import type { StudyPlan } from "@workspace/db";

// ── Custom ID convention ────────────────────────────────────────────────────
// Format: prefix:action:param1:param2...
// Keep each segment short. Discord limit: 100 chars total.

// ── Source type select menu ─────────────────────────────────────────────────

export function sourceTypeSelectMenu(): ActionRowBuilder<MessageActionRowComponentBuilder> {
  const menu = new StringSelectMenuBuilder()
    .setCustomId("sel:source_type")
    .setPlaceholder("Choose source type…")
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel("Scripture")
        .setValue("scripture")
        .setDescription("Old/New Testament, Book of Mormon, D&C, Pearl of Great Price")
        .setEmoji(EMOJI.BOOK),
      new StringSelectMenuOptionBuilder()
        .setLabel("General Conference")
        .setValue("conference")
        .setDescription("Recent General Conference talks")
        .setEmoji(EMOJI.CONFERENCE),
    );
  return new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(menu);
}

// ── Scripture select menu ───────────────────────────────────────────────────

export function scriptureSelectMenu(): ActionRowBuilder<MessageActionRowComponentBuilder> {
  const options = STANDARD_WORKS.map((work) =>
    new StringSelectMenuOptionBuilder()
      .setLabel(work.name)
      .setValue(work.id)
      .setDescription(`${work.books.reduce((s, b) => s + b.chapters, 0)} chapters`),
  );

  const menu = new StringSelectMenuBuilder()
    .setCustomId("sel:scripture_source")
    .setPlaceholder("Choose a Standard Work…")
    .addOptions(options);

  return new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(menu);
}

// ── Conference select menu ──────────────────────────────────────────────────

export function conferenceSelectMenu(): ActionRowBuilder<MessageActionRowComponentBuilder> {
  const options = CONFERENCES.map((conf) =>
    new StringSelectMenuOptionBuilder()
      .setLabel(conf.shortName)
      .setValue(conf.id)
      .setDescription(`${conf.talks.length} talks`),
  );

  const menu = new StringSelectMenuBuilder()
    .setCustomId("sel:conference_source")
    .setPlaceholder("Choose a conference…")
    .addOptions(options);

  return new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(menu);
}

// ── Plan select menu (dynamic) ──────────────────────────────────────────────

export function planSelectMenu(
  plans: StudyPlan[],
  customId: string,
  placeholder = "Choose a plan…",
): ActionRowBuilder<MessageActionRowComponentBuilder> {
  const options = plans.map((p) =>
    new StringSelectMenuOptionBuilder()
      .setLabel(`${p.name} (ID: ${p.id})`)
      .setValue(String(p.id))
      .setDescription(p.isComplete ? "Completed" : `${Math.round((p.currentPosition / p.totalItems) * 100)}% complete`),
  );

  const menu = new StringSelectMenuBuilder()
    .setCustomId(customId)
    .setPlaceholder(placeholder)
    .addOptions(options);

  return new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(menu);
}

// ── Plan edit field select menu ─────────────────────────────────────────────

export function planEditFieldMenu(planId: number): ActionRowBuilder<MessageActionRowComponentBuilder> {
  const menu = new StringSelectMenuBuilder()
    .setCustomId(`sel:plan_edit_field:${planId}`)
    .setPlaceholder("What would you like to edit?")
    .addOptions(
      new StringSelectMenuOptionBuilder().setLabel("Plan Name").setValue("name").setEmoji(EMOJI.PENCIL),
      new StringSelectMenuOptionBuilder().setLabel("Pace").setValue("pace").setDescription("Change chapters/talks per day or switch to a goal date").setEmoji(EMOJI.CALENDAR),
      new StringSelectMenuOptionBuilder().setLabel("Pause / Unpause").setValue("toggle_active").setEmoji(EMOJI.INFO),
    );
  return new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(menu);
}

// ── Mark as Read buttons ─────────────────────────────────────────────────────

export function markReadButton(planId: number): ButtonBuilder {
  return new ButtonBuilder()
    .setCustomId(`btn:mark_read:${planId}`)
    .setLabel("Mark as Read")
    .setStyle(ButtonStyle.Success)
    .setEmoji(EMOJI.COMPLETE);
}

export function viewTodayButton(): ButtonBuilder {
  return new ButtonBuilder()
    .setCustomId("btn:view_today")
    .setLabel("View Today's Reading")
    .setStyle(ButtonStyle.Primary)
    .setEmoji(EMOJI.BOOK);
}

export function snoozeButton(planId: number, minutes: number): ButtonBuilder {
  return new ButtonBuilder()
    .setCustomId(`btn:snooze:${planId}:${minutes}`)
    .setLabel(`Snooze ${minutes}m`)
    .setStyle(ButtonStyle.Secondary)
    .setEmoji(EMOJI.CLOCK);
}

/** Build a row with Mark as Read + View Today buttons for a plan. */
export function todayActionRow(
  planId: number,
  alreadyRead: boolean,
): ActionRowBuilder<MessageActionRowComponentBuilder> {
  const row = new ActionRowBuilder<MessageActionRowComponentBuilder>();
  if (!alreadyRead) {
    row.addComponents(markReadButton(planId));
  }
  row.addComponents(viewTodayButton());
  return row;
}

/** DM reminder action row. */
export function reminderActionRow(
  plans: StudyPlan[],
): ActionRowBuilder<MessageActionRowComponentBuilder>[] {
  const rows: ActionRowBuilder<MessageActionRowComponentBuilder>[] = [];

  // One mark-as-read button per active incomplete plan (up to 3 due to Discord limits)
  const activePlans = plans.filter((p) => !p.isComplete && p.isActive).slice(0, 3);
  if (activePlans.length > 0) {
    const row = new ActionRowBuilder<MessageActionRowComponentBuilder>();
    for (const plan of activePlans) {
      row.addComponents(markReadButton(plan.id));
    }
    row.addComponents(viewTodayButton());
    rows.push(row);
  }

  return rows;
}

// ── Confirm / Cancel buttons ─────────────────────────────────────────────────

export function confirmRow(
  confirmId: string,
  cancelId: string,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
): ActionRowBuilder<MessageActionRowComponentBuilder> {
  return new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(confirmId)
      .setLabel(confirmLabel)
      .setStyle(ButtonStyle.Success)
      .setEmoji(EMOJI.CHECK),
    new ButtonBuilder()
      .setCustomId(cancelId)
      .setLabel(cancelLabel)
      .setStyle(ButtonStyle.Secondary)
      .setEmoji(EMOJI.CROSS),
  );
}

// ── Pace type select menu ────────────────────────────────────────────────────

export function planPaceTypeMenu(
  sourceType: string,
  sourceId: string,
  totalItems: number,
): ActionRowBuilder<MessageActionRowComponentBuilder> {
  const unitLabel = sourceType === "conference" ? "talks" : "chapters";
  const menu = new StringSelectMenuBuilder()
    .setCustomId(`sel:plan_pace_type:${sourceType}:${sourceId}:${totalItems}`)
    .setPlaceholder("How do you want to pace your reading?")
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel(`${unitLabel === "chapters" ? "Chapters" : "Talks"} per day`)
        .setValue("daily")
        .setDescription(`Set how many ${unitLabel} to read each day`),
      new StringSelectMenuOptionBuilder()
        .setLabel("By goal date")
        .setValue("dated")
        .setDescription("Pick a finish date — we'll calculate your daily pace"),
    );
  return new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(menu);
}

// ── Plan edit pace type select menu ─────────────────────────────────────────

export function planEditPaceTypeMenu(planId: number): ActionRowBuilder<MessageActionRowComponentBuilder> {
  const menu = new StringSelectMenuBuilder()
    .setCustomId(`sel:plan_edit_pace_type:${planId}`)
    .setPlaceholder("How do you want to pace your reading?")
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel("Chapters / Talks per day")
        .setValue("daily")
        .setDescription("Set a fixed number to read each day"),
      new StringSelectMenuOptionBuilder()
        .setLabel("By goal date")
        .setValue("dated")
        .setDescription("Pick a finish date and we'll calculate the daily pace"),
    );
  return new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(menu);
}

// ── Unread (undo) button ─────────────────────────────────────────────────────

export function unreadRow(planId: number): ActionRowBuilder<MessageActionRowComponentBuilder> {
  return new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`btn:mark_unread:${planId}`)
      .setLabel("↩️ Undo Read")
      .setStyle(ButtonStyle.Danger),
  );
}

// ── Pagination buttons ───────────────────────────────────────────────────────

export function paginationRow(
  baseId: string,
  currentPage: number,
  totalPages: number,
): ActionRowBuilder<MessageActionRowComponentBuilder> {
  return new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`btn:page:${baseId}:${currentPage - 1}`)
      .setLabel("Previous")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(currentPage === 0),
    new ButtonBuilder()
      .setCustomId(`btn:page:${baseId}:${currentPage + 1}`)
      .setLabel("Next")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(currentPage >= totalPages - 1),
  );
}
