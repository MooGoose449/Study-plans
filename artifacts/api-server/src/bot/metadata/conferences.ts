// General Conference metadata — titles and speakers only. No talk content is stored.
//
// ============================================================
// HOW TO UPDATE (every 6 months):
// 1. Remove the oldest conference from this array.
// 2. Add the newest conference as a new entry.
// 3. Existing study plans that reference removed conferences
//    continue to work — the plan stores position/total, and
//    the talk data is only needed for "today's reading" display.
//    If a plan references a removed conference, the display
//    will fall back to "Talk #N of M".
// ============================================================

export type ConferenceTalk = {
  order: number;        // 1-based position within the conference
  title: string;
  speaker: string;
  session?: string;     // e.g. "Saturday Morning", "Priesthood Session"
};

export type Conference = {
  id: string;           // e.g. "april_2026"
  name: string;         // e.g. "April 2026 General Conference"
  shortName: string;    // e.g. "April 2026"
  talks: ConferenceTalk[];
};

export const CONFERENCES: Conference[] = [
  // ─── April 2026 ──────────────────────────────────────────────────────────
  // TODO: Replace these placeholder entries with real talks from the official
  // General Conference website: https://www.churchofjesuschrist.org/study/general-conference
  {
    id: "april_2026",
    name: "April 2026 General Conference",
    shortName: "April 2026",
    talks: [
      { order: 1,  title: "[Opening Remarks]",                   speaker: "President Russell M. Nelson",        session: "Saturday Morning" },
      { order: 2,  title: "[Talk Title — update with real data]", speaker: "[Speaker Name]",                   session: "Saturday Morning" },
      { order: 3,  title: "[Talk Title — update with real data]", speaker: "[Speaker Name]",                   session: "Saturday Morning" },
      { order: 4,  title: "[Talk Title — update with real data]", speaker: "[Speaker Name]",                   session: "Saturday Morning" },
      { order: 5,  title: "[Talk Title — update with real data]", speaker: "[Speaker Name]",                   session: "Saturday Morning" },
      { order: 6,  title: "[Talk Title — update with real data]", speaker: "[Speaker Name]",                   session: "Saturday Afternoon" },
      { order: 7,  title: "[Talk Title — update with real data]", speaker: "[Speaker Name]",                   session: "Saturday Afternoon" },
      { order: 8,  title: "[Talk Title — update with real data]", speaker: "[Speaker Name]",                   session: "Saturday Afternoon" },
      { order: 9,  title: "[Talk Title — update with real data]", speaker: "[Speaker Name]",                   session: "Saturday Afternoon" },
      { order: 10, title: "[Talk Title — update with real data]", speaker: "[Speaker Name]",                   session: "Saturday Afternoon" },
      { order: 11, title: "[Talk Title — update with real data]", speaker: "[Speaker Name]",                   session: "Sunday Morning" },
      { order: 12, title: "[Talk Title — update with real data]", speaker: "[Speaker Name]",                   session: "Sunday Morning" },
      { order: 13, title: "[Talk Title — update with real data]", speaker: "[Speaker Name]",                   session: "Sunday Morning" },
      { order: 14, title: "[Talk Title — update with real data]", speaker: "[Speaker Name]",                   session: "Sunday Morning" },
      { order: 15, title: "[Talk Title — update with real data]", speaker: "[Speaker Name]",                   session: "Sunday Afternoon" },
      { order: 16, title: "[Talk Title — update with real data]", speaker: "[Speaker Name]",                   session: "Sunday Afternoon" },
      { order: 17, title: "[Talk Title — update with real data]", speaker: "[Speaker Name]",                   session: "Sunday Afternoon" },
      { order: 18, title: "[Talk Title — update with real data]", speaker: "[Speaker Name]",                   session: "Sunday Afternoon" },
      { order: 19, title: "[Closing Remarks]",                    speaker: "President Russell M. Nelson",        session: "Sunday Afternoon" },
    ],
  },

  // ─── October 2025 ────────────────────────────────────────────────────────
  // TODO: Replace these placeholder entries with real talks.
  {
    id: "october_2025",
    name: "October 2025 General Conference",
    shortName: "October 2025",
    talks: [
      { order: 1,  title: "[Opening Remarks]",                    speaker: "President Russell M. Nelson",       session: "Saturday Morning" },
      { order: 2,  title: "[Talk Title — update with real data]", speaker: "[Speaker Name]",                   session: "Saturday Morning" },
      { order: 3,  title: "[Talk Title — update with real data]", speaker: "[Speaker Name]",                   session: "Saturday Morning" },
      { order: 4,  title: "[Talk Title — update with real data]", speaker: "[Speaker Name]",                   session: "Saturday Morning" },
      { order: 5,  title: "[Talk Title — update with real data]", speaker: "[Speaker Name]",                   session: "Saturday Morning" },
      { order: 6,  title: "[Talk Title — update with real data]", speaker: "[Speaker Name]",                   session: "Saturday Afternoon" },
      { order: 7,  title: "[Talk Title — update with real data]", speaker: "[Speaker Name]",                   session: "Saturday Afternoon" },
      { order: 8,  title: "[Talk Title — update with real data]", speaker: "[Speaker Name]",                   session: "Saturday Afternoon" },
      { order: 9,  title: "[Talk Title — update with real data]", speaker: "[Speaker Name]",                   session: "Saturday Afternoon" },
      { order: 10, title: "[Talk Title — update with real data]", speaker: "[Speaker Name]",                   session: "Saturday Afternoon" },
      { order: 11, title: "[Talk Title — update with real data]", speaker: "[Speaker Name]",                   session: "Sunday Morning" },
      { order: 12, title: "[Talk Title — update with real data]", speaker: "[Speaker Name]",                   session: "Sunday Morning" },
      { order: 13, title: "[Talk Title — update with real data]", speaker: "[Speaker Name]",                   session: "Sunday Morning" },
      { order: 14, title: "[Talk Title — update with real data]", speaker: "[Speaker Name]",                   session: "Sunday Morning" },
      { order: 15, title: "[Talk Title — update with real data]", speaker: "[Speaker Name]",                   session: "Sunday Afternoon" },
      { order: 16, title: "[Talk Title — update with real data]", speaker: "[Speaker Name]",                   session: "Sunday Afternoon" },
      { order: 17, title: "[Talk Title — update with real data]", speaker: "[Speaker Name]",                   session: "Sunday Afternoon" },
      { order: 18, title: "[Talk Title — update with real data]", speaker: "[Speaker Name]",                   session: "Sunday Afternoon" },
      { order: 19, title: "[Closing Remarks]",                    speaker: "President Russell M. Nelson",       session: "Sunday Afternoon" },
    ],
  },
];

/** Get a conference by ID. */
export function getConference(id: string): Conference | undefined {
  return CONFERENCES.find((c) => c.id === id);
}

/** Get total number of talks for a conference. */
export function getConferenceTotalItems(id: string): number {
  const conf = CONFERENCES.find((c) => c.id === id);
  return conf?.talks.length ?? 0;
}

/** Get the display string for a range of talks. */
export function getConferenceRangeDisplay(
  conferenceId: string,
  startPos: number,
  count: number,
): string {
  const conf = getConference(conferenceId);

  if (!conf) {
    // Conference no longer in list — graceful fallback
    const end = startPos + count;
    return count === 1 ? `Talk #${startPos + 1}` : `Talks #${startPos + 1}–${end}`;
  }

  const slice = conf.talks.slice(startPos, startPos + count);
  if (slice.length === 0) return "Complete";

  if (slice.length === 1) {
    const talk = slice[0]!;
    return `"${talk.title}"\n${talk.speaker}`;
  }

  const first = slice[0]!;
  const last = slice[slice.length - 1]!;
  return `"${first.title}" – "${last.title}"\n${first.speaker} and others`;
}

/** Get a single talk display line. */
export function getTalkDisplay(conferenceId: string, position: number): string {
  const conf = getConference(conferenceId);
  if (!conf) return `Talk #${position + 1}`;
  const talk = conf.talks[position];
  if (!talk) return `Talk #${position + 1}`;
  return `"${talk.title}" by ${talk.speaker}${talk.session ? ` (${talk.session})` : ""}`;
}
