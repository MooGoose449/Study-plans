// Emoji constants — centralised here so custom Discord emojis can be swapped
// in later without touching any other file.
//
// To use a custom Discord emoji, replace a string such as "📖" with the
// Discord emoji format: "<:emoji_name:emoji_id>" (for static) or
// "<a:emoji_name:emoji_id>" (for animated).
//
// Example:
//   export const EMOJI_BOOK = "<:scriptures:1234567890123456789>";

export const EMOJI = {
  // Standard works
  OLD_TESTAMENT:      "📜",
  NEW_TESTAMENT:      "✝️",
  BOOK_OF_MORMON:     "📖",
  DOC_AND_COV:        "🕊️",
  PEARL_OF_GREAT_PRICE: "⭐",
  CONFERENCE:         "🎙️",

  // Progress / status
  COMPLETE:           "✅",
  INCOMPLETE:         "⬜",
  STREAK:             "🔥",
  STAR:               "⭐",
  TROPHY:             "🏆",
  MEDAL_GOLD:         "🥇",
  MEDAL_SILVER:       "🥈",
  MEDAL_BRONZE:       "🥉",

  // UI
  CALENDAR:           "📅",
  CLOCK:              "🕐",
  BELL:               "🔔",
  BELL_OFF:           "🔕",
  CHART:              "📊",
  PENCIL:             "✏️",
  TRASH:              "🗑️",
  PLUS:               "➕",
  CHECK:              "✔️",
  CROSS:              "❌",
  INFO:               "ℹ️",
  BOOK:               "📗",
  PIN:                "📌",
  ARROW_RIGHT:        "➡️",
  LOADING:            "⏳",
  GLOBE:              "🌐",
  PEOPLE:             "👥",

  // Progress bar pieces (text-based, no emoji needed)
  PROGRESS_FILLED:    "█",
  PROGRESS_EMPTY:     "░",
} as const;

/** Get the emoji for a given source (standard work ID or "conference"). */
export function getSourceEmoji(sourceType: "scripture" | "conference", sourceId?: string): string {
  if (sourceType === "conference") return EMOJI.CONFERENCE;
  switch (sourceId) {
    case "OLD_TESTAMENT":          return EMOJI.OLD_TESTAMENT;
    case "NEW_TESTAMENT":          return EMOJI.NEW_TESTAMENT;
    case "BOOK_OF_MORMON":         return EMOJI.BOOK_OF_MORMON;
    case "DOC_AND_COV":            return EMOJI.DOC_AND_COV;
    case "PEARL_OF_GREAT_PRICE":   return EMOJI.PEARL_OF_GREAT_PRICE;
    default:                       return EMOJI.BOOK;
  }
}

/** Build a simple text progress bar. */
export function buildProgressBar(percentage: number, width = 10): string {
  const filled = Math.round((percentage / 100) * width);
  const empty = width - filled;
  return EMOJI.PROGRESS_FILLED.repeat(filled) + EMOJI.PROGRESS_EMPTY.repeat(empty);
}
