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
//
// URL SLUG NOTES:
// Each talk's URL slug is computed as {session_num}{pos_in_session}{last_name}.
// Mark skipUrl: true for talks that have no individual URL (e.g. brief opening
// remarks that weren't published as a standalone talk on the Church website).
// ============================================================

const CONF_BASE = "https://www.churchofjesuschrist.org/study/general-conference";

export type ConferenceTalk = {
  order: number;        // 1-based position within the conference
  title: string;
  speaker: string;
  session?: string;     // e.g. "Saturday Morning", "Priesthood Session"
  /** True if this talk has no individual Church website URL (opening remarks, etc.) */
  skipUrl?: boolean;
};

export type Conference = {
  id: string;           // e.g. "april_2026"
  name: string;         // e.g. "April 2026 General Conference"
  shortName: string;    // e.g. "April 2026"
  talks: ConferenceTalk[];
};

export const CONFERENCES: Conference[] = [
  // ─── April 2026 ──────────────────────────────────────────────────────────
  {
    id: "april_2026",
    name: "April 2026 General Conference",
    shortName: "April 2026",
    talks: [
      // Saturday Morning
      { order: 1,  title: "Introduction",                                                      speaker: "President Dallin H. Oaks",              session: "Saturday Morning" },
      { order: 2,  title: "Solemn Assembly",                                                   speaker: "President D. Todd Christofferson",       session: "Saturday Morning" },
      { order: 3,  title: "About His Business",                                                speaker: "Elder Patrick Kearon",                  session: "Saturday Morning" },
      { order: 4,  title: "Ministering—\"That Ye Love One Another; as I Have Loved You\"",    speaker: "Sister Kristin M. Yee",                 session: "Saturday Morning" },
      { order: 5,  title: "Come Home",                                                         speaker: "Elder Clark G. Gilbert",                session: "Saturday Morning" },
      { order: 6,  title: "All Who Have Endured Valiantly",                                    speaker: "Elder David A. Bednar",                 session: "Saturday Morning" },
      { order: 7,  title: "Follow the Prophet; He Knows the Way",                              speaker: "Elder Michael John U. Teh",             session: "Saturday Morning" },
      { order: 8,  title: "Tithing—Putting God First",                                         speaker: "Elder Jorge T. Becerra",                session: "Saturday Morning" },
      { order: 9,  title: "Prayers for Peace",                                                  speaker: "President Henry B. Eyring",             session: "Saturday Morning" },
      // Saturday Afternoon
      { order: 10, title: "Sustaining of General Authorities, Area Seventies, and General Officers", speaker: "President D. Todd Christofferson", session: "Saturday Afternoon" },
      { order: 11, title: "Church Auditing Department Report, 2025",                           speaker: "Jared B. Larson",                       session: "Saturday Afternoon" },
      { order: 12, title: "Lost Luggage, Redeemed Souls",                                      speaker: "Elder Gary E. Stevenson",               session: "Saturday Afternoon" },
      { order: 13, title: "Christ—Author and Finisher of Our Faith",                           speaker: "Elder Eduardo F. Ortega",               session: "Saturday Afternoon" },
      { order: 14, title: "\"I Will Give Away All My Sins to Know Thee\"",                    speaker: "Elder Wan-Liang Wu",                    session: "Saturday Afternoon" },
      { order: 15, title: "Jesus Christ Is Not Our Burden; He Is Our Relief",                  speaker: "Brother David J. Wunderli",             session: "Saturday Afternoon" },
      { order: 16, title: "Love All; Love Each",                                                speaker: "Elder Gérald Caussé",                  session: "Saturday Afternoon" },
      { order: 17, title: "Jesus Christ Is the Way",                                            speaker: "Elder Brian J. Holmes",                 session: "Saturday Afternoon" },
      { order: 18, title: "He Knows You by Name",                                               speaker: "Elder Clement M. Matswagothata",        session: "Saturday Afternoon" },
      { order: 19, title: "Jesus Christ—the True Vine",                                         speaker: "Elder Ulisses Soares",                  session: "Saturday Afternoon" },
      // Sunday Morning
      { order: 20, title: "Encounter at the Empty Tomb",                                        speaker: "President Dieter F. Uchtdorf",          session: "Sunday Morning" },
      { order: 21, title: "Best Days and Worst Days",                                           speaker: "President Emily Belle Freeman",          session: "Sunday Morning" },
      { order: 22, title: "I Feel My Savior's Love",                                            speaker: "Elder Pedro X. Larreal",                session: "Sunday Morning" },
      { order: 23, title: "Choose Jesus Christ as Your Guide",                                  speaker: "Elder Edward B. Rowe",                  session: "Sunday Morning" },
      { order: 24, title: "He Is Risen",                                                        speaker: "Elder Ronald A. Rasband",               session: "Sunday Morning" },
      { order: 25, title: "Because of Jesus Christ",                                            speaker: "Elder Dale G. Renlund",                 session: "Sunday Morning" },
      { order: 26, title: "The Joy of a Covenant Relationship with God",                        speaker: "Elder Thierry K. Mutombo",              session: "Sunday Morning" },
      { order: 27, title: "A Peculiar Treasure",                                                speaker: "Elder Alan R. Walker",                  session: "Sunday Morning" },
      { order: 28, title: "Alive in Christ",                                                    speaker: "President Dallin H. Oaks",              session: "Sunday Morning" },
      // Sunday Afternoon
      { order: 29, title: "The Character of Christ",                                            speaker: "President D. Todd Christofferson",      session: "Sunday Afternoon" },
      { order: 30, title: "Remember, Remember",                                                  speaker: "Elder Chi Hong (Sam) Wong",             session: "Sunday Afternoon" },
      { order: 31, title: "I Glory in My Jesus",                                                speaker: "Elder Aaron T. Hall",                   session: "Sunday Afternoon" },
      { order: 32, title: "\"Here Am I, Send Me\"",                                             speaker: "President Susan H. Porter",             session: "Sunday Afternoon" },
      { order: 33, title: "Eternal Marriage Is an Eternal Journey",                             speaker: "Elder Neil L. Andersen",                session: "Sunday Afternoon" },
      { order: 34, title: "Keys, Covenants, and Easter",                                        speaker: "Elder Quentin L. Cook",                 session: "Sunday Afternoon" },
      { order: 35, title: "Come unto Christ—Together",                                          speaker: "Elder Taniela B. Wakolo",               session: "Sunday Afternoon" },
      { order: 36, title: "'Tis Eastertide: No One Walks Alone",                               speaker: "Elder Gerrit W. Gong",                  session: "Sunday Afternoon" },
      { order: 37, title: "Closing Remarks",                                                    speaker: "President Dallin H. Oaks",              session: "Sunday Afternoon" },
    ],
  },

  // ─── October 2025 ────────────────────────────────────────────────────────
  {
    id: "october_2025",
    name: "October 2025 General Conference",
    shortName: "October 2025",
    talks: [
      // Saturday Morning
      // order 1 is brief opening remarks — no standalone URL on the Church website
      { order: 1,  title: "Introduction",                                                      speaker: "President Dallin H. Oaks",              session: "Saturday Morning", skipUrl: true },
      { order: 2,  title: "Sustaining of General Authorities, Area Seventies, and General Officers", speaker: "Elder Henry B. Eyring",            session: "Saturday Morning" },
      { order: 3,  title: "Blessed Are the Peacemakers",                                       speaker: "Elder Gary E. Stevenson",               session: "Saturday Morning" },
      { order: 4,  title: "Tune Your Heart to Jesus Christ: The Sacred Gift of Primary Music", speaker: "Sister Tracy Y. Browning",              session: "Saturday Morning" },
      { order: 5,  title: "The Lord Looketh on the Heart",                                     speaker: "Elder Ronald M. Barcellos",             session: "Saturday Morning" },
      { order: 6,  title: "Know Who You Really Are",                                           speaker: "Elder Brik V. Eyre",                    session: "Saturday Morning" },
      { order: 7,  title: "Be Reconciled to God",                                              speaker: "Elder Kelly R. Johnson",                session: "Saturday Morning" },
      { order: 8,  title: "Do Your Part with All Your Heart",                                  speaker: "Elder Dieter F. Uchtdorf",              session: "Saturday Morning" },
      // Saturday Afternoon
      { order: 9,  title: "The Family Proclamation—Words from God",                            speaker: "Elder Ronald A. Rasband",               session: "Saturday Afternoon" },
      { order: 10, title: "That All May Be Edified",                                           speaker: "Brother Chad H Webb",                   session: "Saturday Afternoon" },
      { order: 11, title: "Humble Souls at Altars Kneel",                                      speaker: "Elder Jeremy R. Jaggi",                 session: "Saturday Afternoon" },
      { order: 12, title: "The Eternal Gift of Testimony",                                     speaker: "Elder Kevin G. Brown",                  session: "Saturday Afternoon" },
      { order: 13, title: "No One Sits Alone",                                                 speaker: "Elder Gerrit W. Gong",                  session: "Saturday Afternoon" },
      { order: 14, title: "Simplicity in Christ",                                              speaker: "Elder Michael Cziesla",                 session: "Saturday Afternoon" },
      { order: 15, title: "The Lord Is Hastening His Work",                                    speaker: "Elder Quentin L. Cook",                 session: "Saturday Afternoon" },
      // Saturday Evening
      { order: 16, title: "Jesus Christ and Your New Beginning",                               speaker: "Elder Patrick Kearon",                  session: "Saturday Evening" },
      { order: 17, title: "Cheering Each Other On",                                            speaker: "Sister J. Anette Dennis",               session: "Saturday Evening" },
      { order: 18, title: "\"Lovest Thou Me?\"",                                               speaker: "Elder Steven C. Barlow",                session: "Saturday Evening" },
      { order: 19, title: "Remembering the Sheep",                                             speaker: "Elder William K. Jackson",              session: "Saturday Evening" },
      { order: 20, title: "The Atoning Love of Jesus Christ",                                  speaker: "Elder Neil L. Andersen",                session: "Saturday Evening" },
      // Sunday Morning
      { order: 21, title: "And Now I See",                                                     speaker: "Elder Jeffrey R. Holland",              session: "Sunday Morning" },
      { order: 22, title: "Go and Do Likewise",                                                speaker: "Elder James E. Evanson",                session: "Sunday Morning" },
      { order: 23, title: "Adorned with the Virtue of Temperance",                             speaker: "Elder Ulisses Soares",                  session: "Sunday Morning" },
      { order: 24, title: "The Power of Ministering to the One",                               speaker: "Elder Peter M. Johnson",                session: "Sunday Morning" },
      { order: 25, title: "Look to God and Live",                                              speaker: "Elder D. Todd Christofferson",          session: "Sunday Morning" },
      { order: 26, title: "Prophets of God",                                                   speaker: "Sister Andrea Muñoz Spannaus",          session: "Sunday Morning" },
      { order: 27, title: "Proved and Strengthened in Christ",                                 speaker: "Elder Henry B. Eyring",                 session: "Sunday Morning" },
      // Sunday Afternoon
      { order: 28, title: "They Are Their Own Judges",                                         speaker: "Elder David A. Bednar",                 session: "Sunday Afternoon" },
      { order: 29, title: "The Name by Which Ye Are Called",                                   speaker: "Elder B. Corey Cuvelier",               session: "Sunday Afternoon" },
      { order: 30, title: "Forsake Not Your Own Mercy",                                        speaker: "Elder Matthew S. Holland",              session: "Sunday Afternoon" },
      { order: 31, title: "Smiling Faces and Grateful Hearts",                                 speaker: "Elder Carlos A. Godoy",                 session: "Sunday Afternoon" },
      { order: 32, title: "Taking on the Name of Jesus Christ",                                speaker: "Elder Dale G. Renlund",                 session: "Sunday Afternoon" },
      { order: 33, title: "The Good News Recipe",                                              speaker: "Elder John D. Amos",                    session: "Sunday Afternoon" },
      { order: 34, title: "The Book of Mormon—an Immeasurable Treasure on Our Journey",       speaker: "Elder Ozani Farias",                    session: "Sunday Afternoon" },
      { order: 35, title: "The Family-Centered Gospel of Jesus Christ",                        speaker: "President Dallin H. Oaks",              session: "Sunday Afternoon" },
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

/**
 * Get the Church website URL for the first linkable talk in a range (0-based start, count).
 * Scans forward from startPos until it finds a talk without skipUrl.
 * Returns null if no talk in the range has a URL or the conference is unknown.
 */
export function getConferenceFirstLinkableUrl(
  conferenceId: string,
  startPos: number,
  count: number,
): string | null {
  const conf = getConference(conferenceId);
  if (!conf) return null;
  const slice = conf.talks.slice(startPos, startPos + count);
  for (let i = 0; i < slice.length; i++) {
    const url = getConferenceTalkUrl(conferenceId, startPos + i);
    if (url) return url;
  }
  return null;
}

/**
 * Get the Church website URL for a single talk at the given position (0-based).
 * Returns null if the talk has no URL or the conference is unknown.
 */
export function getConferenceTalkUrl(conferenceId: string, position: number): string | null {
  const conf = getConference(conferenceId);
  if (!conf) return null;

  const talk = conf.talks[position];
  if (!talk || !talk.session || talk.skipUrl) return null;

  // Parse conference ID: e.g. "april_2026" → year="2026", month="04"
  const [monthName, yearStr] = conferenceId.split("_");
  const monthMap: Record<string, string> = { april: "04", october: "10" };
  const month = monthMap[monthName ?? ""];
  if (!month || !yearStr) return null;

  // Build ordered list of unique sessions in order of first appearance
  const sessions: string[] = [];
  for (const t of conf.talks) {
    if (t.session && !sessions.includes(t.session)) {
      sessions.push(t.session);
    }
  }

  const sessionNum = sessions.indexOf(talk.session) + 1;
  if (sessionNum === 0) return null;

  // Count position within this session, skipping skipUrl talks
  const talksInSession = conf.talks.filter(
    (t) => t.session === talk.session && !t.skipUrl,
  );
  const posInSession = talksInSession.findIndex((t) => t.order === talk.order) + 1;
  if (posInSession === 0) return null;

  // Extract last name: strip titles, take last word, remove diacritics, lowercase
  const lastName = talk.speaker
    .trim()
    .split(/\s+/)
    .at(-1)!
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  return `${CONF_BASE}/${yearStr}/${month}/${sessionNum}${posInSession}${lastName}?lang=eng`;
}
