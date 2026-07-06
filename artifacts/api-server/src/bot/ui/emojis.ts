// Two emojis are used throughout the bot:
//   <:lds:1523480103189876836>  — used for all scripture and conference sources
//   🔔                          — used for reminders only

const LDS = "<:lds:1523480103189876836>";
const BELL = "🔔";

export const EMOJI = {
  // Standard works — all use the lds server emoji
  OLD_TESTAMENT:        LDS,
  NEW_TESTAMENT:        LDS,
  BOOK_OF_MORMON:       LDS,
  DOC_AND_COV:          LDS,
  PEARL_OF_GREAT_PRICE: LDS,
  CONFERENCE:           LDS,

  // Progress / status — no emoji
  COMPLETE:             "",
  INCOMPLETE:           "",
  STREAK:               "",
  STAR:                 "",
  TROPHY:               "",
  MEDAL_GOLD:           "",
  MEDAL_SILVER:         "",
  MEDAL_BRONZE:         "",

  // UI — no emoji (except bell for reminders)
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

  // Progress bar pieces (text characters, not emoji)
  PROGRESS_FILLED:      "█",
  PROGRESS_EMPTY:       "░",
} as const;

/** Get the emoji for a given source (standard work ID or "conference"). */
export function getSourceEmoji(sourceType: "scripture" | "conference", sourceId?: string): string {
  return LDS;
}

/** Build a simple text progress bar. */
export function buildProgressBar(percentage: number, width = 10): string {
  const filled = Math.round((percentage / 100) * width);
  const empty = width - filled;
  return EMOJI.PROGRESS_FILLED.repeat(filled) + EMOJI.PROGRESS_EMPTY.repeat(empty);
}
