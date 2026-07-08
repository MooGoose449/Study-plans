// Use only these emojis:
//   <:lds:1523480103189876836>  — used for all scripture and conference sources
//   🔔                          — used for reminders only
//   ↩️                          — used for unread acknowledgements
//   🔥                          — used for streak indicator

const LDS = "<:lds:1523480103189876836>";
const BELL = "🔔";
const UNDO = "↩️";
const FIRE = "🔥";

export const EMOJI = {
  // Standard works — all use the lds server emoji
  OLD_TESTAMENT:        LDS,
  NEW_TESTAMENT:        LDS,
  BOOK_OF_MORMON:       LDS,
  DOC_AND_COV:          LDS,
  PEARL_OF_GREAT_PRICE: LDS,
  CONFERENCE:           LDS,

  // Progress / status
  COMPLETE:             "",
  INCOMPLETE:           "",
  STREAK:               FIRE,
  STAR:                 "",
  TROPHY:               "",
  MEDAL_GOLD:           "",
  MEDAL_SILVER:         "",
  MEDAL_BRONZE:         "",

  // UI — only BELL and UNDO are used; everything else blank
  CALENDAR:             "",
  CLOCK:                "",
  BELL:                 BELL,
  BELL_OFF:             BELL,
  CHART:                "",
  PENCIL:               "",
  TRASH:                "",
  PLUS:                 "",
  CHECK:                "",
  CROSS:                "",
  INFO:                 "",
  BOOK:                 LDS,
  PIN:                  "",
  ARROW_RIGHT:          "",
  LOADING:              "",
  GLOBE:                "",
  PEOPLE:               "",
  UNDO:                 UNDO,

  // Progress bar pieces (text characters)
  PROGRESS_FILLED:      "█",
  PROGRESS_EMPTY:       "░",
} as const;

/** Get the emoji for a given source (standard work ID or "conference"). */
export function getSourceEmoji(sourceType: "scripture" | "conference", sourceId?: string): string {
  return LDS;
}

/**
 * Build a simple textual progress bar.
 * @param pct percentage 0-100
 * @param width number of characters (default 10)
 */
export function buildProgressBar(pct: number, width = 10): string {
  const clamped = Math.max(0, Math.min(100, Math.round(pct)));
  const filledCount = Math.round((clamped / 100) * width);
  const emptyCount = Math.max(0, width - filledCount);
  return EMOJI.PROGRESS_FILLED.repeat(filledCount) + EMOJI.PROGRESS_EMPTY.repeat(emptyCount);
}
