// Scripture metadata — chapter counts only. No text is stored or displayed.
// To add a new standard work, add an entry to STANDARD_WORKS with books and chapter counts.

const BASE = "https://www.churchofjesuschrist.org/study/scriptures";

export type Book = {
  name: string;
  abbr: string;
  chapters: number;
  /** URL path segment for this book, e.g. "1-ne", "gen", "dc" */
  urlAbbr: string;
};

export type StandardWork = {
  id: string;
  name: string;
  shortName: string;
  /** URL path segment for this volume, e.g. "ot", "bofm", "dc-testament" */
  urlSection: string;
  books: Book[];
};

export const STANDARD_WORKS: StandardWork[] = [
  {
    id: "OLD_TESTAMENT",
    name: "Old Testament",
    shortName: "OT",
    urlSection: "ot",
    books: [
      { name: "Genesis",          abbr: "Gen.",    chapters: 50,  urlAbbr: "gen"    },
      { name: "Exodus",           abbr: "Ex.",     chapters: 40,  urlAbbr: "ex"     },
      { name: "Leviticus",        abbr: "Lev.",    chapters: 27,  urlAbbr: "lev"    },
      { name: "Numbers",          abbr: "Num.",    chapters: 36,  urlAbbr: "num"    },
      { name: "Deuteronomy",      abbr: "Deut.",   chapters: 34,  urlAbbr: "deut"   },
      { name: "Joshua",           abbr: "Josh.",   chapters: 24,  urlAbbr: "josh"   },
      { name: "Judges",           abbr: "Judg.",   chapters: 21,  urlAbbr: "judg"   },
      { name: "Ruth",             abbr: "Ruth",    chapters: 4,   urlAbbr: "ruth"   },
      { name: "1 Samuel",         abbr: "1 Sam.",  chapters: 31,  urlAbbr: "1-sam"  },
      { name: "2 Samuel",         abbr: "2 Sam.",  chapters: 24,  urlAbbr: "2-sam"  },
      { name: "1 Kings",          abbr: "1 Kgs.",  chapters: 22,  urlAbbr: "1-kgs"  },
      { name: "2 Kings",          abbr: "2 Kgs.",  chapters: 25,  urlAbbr: "2-kgs"  },
      { name: "1 Chronicles",     abbr: "1 Chr.",  chapters: 29,  urlAbbr: "1-chr"  },
      { name: "2 Chronicles",     abbr: "2 Chr.",  chapters: 36,  urlAbbr: "2-chr"  },
      { name: "Ezra",             abbr: "Ezra",    chapters: 10,  urlAbbr: "ezra"   },
      { name: "Nehemiah",         abbr: "Neh.",    chapters: 13,  urlAbbr: "neh"    },
      { name: "Esther",           abbr: "Esth.",   chapters: 10,  urlAbbr: "esth"   },
      { name: "Job",              abbr: "Job",     chapters: 42,  urlAbbr: "job"    },
      { name: "Psalms",           abbr: "Ps.",     chapters: 150, urlAbbr: "ps"     },
      { name: "Proverbs",         abbr: "Prov.",   chapters: 31,  urlAbbr: "prov"   },
      { name: "Ecclesiastes",     abbr: "Eccl.",   chapters: 12,  urlAbbr: "eccl"   },
      { name: "Song of Solomon",  abbr: "Song",    chapters: 8,   urlAbbr: "song"   },
      { name: "Isaiah",           abbr: "Isa.",    chapters: 66,  urlAbbr: "isa"    },
      { name: "Jeremiah",         abbr: "Jer.",    chapters: 52,  urlAbbr: "jer"    },
      { name: "Lamentations",     abbr: "Lam.",    chapters: 5,   urlAbbr: "lam"    },
      { name: "Ezekiel",          abbr: "Ezek.",   chapters: 48,  urlAbbr: "ezek"   },
      { name: "Daniel",           abbr: "Dan.",    chapters: 12,  urlAbbr: "dan"    },
      { name: "Hosea",            abbr: "Hosea",   chapters: 14,  urlAbbr: "hosea"  },
      { name: "Joel",             abbr: "Joel",    chapters: 3,   urlAbbr: "joel"   },
      { name: "Amos",             abbr: "Amos",    chapters: 9,   urlAbbr: "amos"   },
      { name: "Obadiah",          abbr: "Obad.",   chapters: 1,   urlAbbr: "obad"   },
      { name: "Jonah",            abbr: "Jonah",   chapters: 4,   urlAbbr: "jonah"  },
      { name: "Micah",            abbr: "Micah",   chapters: 7,   urlAbbr: "micah"  },
      { name: "Nahum",            abbr: "Nahum",   chapters: 3,   urlAbbr: "nahum"  },
      { name: "Habakkuk",         abbr: "Hab.",    chapters: 3,   urlAbbr: "hab"    },
      { name: "Zephaniah",        abbr: "Zeph.",   chapters: 3,   urlAbbr: "zeph"   },
      { name: "Haggai",           abbr: "Hag.",    chapters: 2,   urlAbbr: "hag"    },
      { name: "Zechariah",        abbr: "Zech.",   chapters: 14,  urlAbbr: "zech"   },
      { name: "Malachi",          abbr: "Mal.",    chapters: 4,   urlAbbr: "mal"    },
    ],
  },
  {
    id: "NEW_TESTAMENT",
    name: "New Testament",
    shortName: "NT",
    urlSection: "nt",
    books: [
      { name: "Matthew",          abbr: "Matt.",   chapters: 28, urlAbbr: "matt"   },
      { name: "Mark",             abbr: "Mark",    chapters: 16, urlAbbr: "mark"   },
      { name: "Luke",             abbr: "Luke",    chapters: 24, urlAbbr: "luke"   },
      { name: "John",             abbr: "John",    chapters: 21, urlAbbr: "john"   },
      { name: "Acts",             abbr: "Acts",    chapters: 28, urlAbbr: "acts"   },
      { name: "Romans",           abbr: "Rom.",    chapters: 16, urlAbbr: "rom"    },
      { name: "1 Corinthians",    abbr: "1 Cor.",  chapters: 16, urlAbbr: "1-cor"  },
      { name: "2 Corinthians",    abbr: "2 Cor.",  chapters: 13, urlAbbr: "2-cor"  },
      { name: "Galatians",        abbr: "Gal.",    chapters: 6,  urlAbbr: "gal"    },
      { name: "Ephesians",        abbr: "Eph.",    chapters: 6,  urlAbbr: "eph"    },
      { name: "Philippians",      abbr: "Philip.", chapters: 4,  urlAbbr: "philip" },
      { name: "Colossians",       abbr: "Col.",    chapters: 4,  urlAbbr: "col"    },
      { name: "1 Thessalonians",  abbr: "1 Thes.", chapters: 5,  urlAbbr: "1-thes" },
      { name: "2 Thessalonians",  abbr: "2 Thes.", chapters: 3,  urlAbbr: "2-thes" },
      { name: "1 Timothy",        abbr: "1 Tim.",  chapters: 6,  urlAbbr: "1-tim"  },
      { name: "2 Timothy",        abbr: "2 Tim.",  chapters: 4,  urlAbbr: "2-tim"  },
      { name: "Titus",            abbr: "Titus",   chapters: 3,  urlAbbr: "titus"  },
      { name: "Philemon",         abbr: "Philem.", chapters: 1,  urlAbbr: "philem" },
      { name: "Hebrews",          abbr: "Heb.",    chapters: 13, urlAbbr: "heb"    },
      { name: "James",            abbr: "James",   chapters: 5,  urlAbbr: "james"  },
      { name: "1 Peter",          abbr: "1 Pet.",  chapters: 5,  urlAbbr: "1-pet"  },
      { name: "2 Peter",          abbr: "2 Pet.",  chapters: 3,  urlAbbr: "2-pet"  },
      { name: "1 John",           abbr: "1 Jn.",   chapters: 5,  urlAbbr: "1-jn"   },
      { name: "2 John",           abbr: "2 Jn.",   chapters: 1,  urlAbbr: "2-jn"   },
      { name: "3 John",           abbr: "3 Jn.",   chapters: 1,  urlAbbr: "3-jn"   },
      { name: "Jude",             abbr: "Jude",    chapters: 1,  urlAbbr: "jude"   },
      { name: "Revelation",       abbr: "Rev.",    chapters: 22, urlAbbr: "rev"    },
    ],
  },
  {
    id: "BOOK_OF_MORMON",
    name: "Book of Mormon",
    shortName: "BoM",
    urlSection: "bofm",
    books: [
      { name: "1 Nephi",          abbr: "1 Ne.",   chapters: 22, urlAbbr: "1-ne"   },
      { name: "2 Nephi",          abbr: "2 Ne.",   chapters: 33, urlAbbr: "2-ne"   },
      { name: "Jacob",            abbr: "Jacob",   chapters: 7,  urlAbbr: "jacob"  },
      { name: "Enos",             abbr: "Enos",    chapters: 1,  urlAbbr: "enos"   },
      { name: "Jarom",            abbr: "Jarom",   chapters: 1,  urlAbbr: "jarom"  },
      { name: "Omni",             abbr: "Omni",    chapters: 1,  urlAbbr: "omni"   },
      { name: "Words of Mormon",  abbr: "W of M",  chapters: 1,  urlAbbr: "w-of-m" },
      { name: "Mosiah",           abbr: "Mosiah",  chapters: 29, urlAbbr: "mosiah" },
      { name: "Alma",             abbr: "Alma",    chapters: 63, urlAbbr: "alma"   },
      { name: "Helaman",          abbr: "Hel.",    chapters: 16, urlAbbr: "hel"    },
      { name: "3 Nephi",          abbr: "3 Ne.",   chapters: 30, urlAbbr: "3-ne"   },
      { name: "4 Nephi",          abbr: "4 Ne.",   chapters: 1,  urlAbbr: "4-ne"   },
      { name: "Mormon",           abbr: "Morm.",   chapters: 9,  urlAbbr: "morm"   },
      { name: "Ether",            abbr: "Ether",   chapters: 15, urlAbbr: "ether"  },
      { name: "Moroni",           abbr: "Moro.",   chapters: 10, urlAbbr: "moro"   },
    ],
  },
  {
    id: "DOC_AND_COV",
    name: "Doctrine and Covenants",
    shortName: "D&C",
    urlSection: "dc-testament",
    books: [
      // Each "book" entry = one logical section group.
      // Sections 1–138 treated as chapters; OD 1 and OD 2 as extra items.
      { name: "Sections 1–138", abbr: "D&C", chapters: 138, urlAbbr: "dc" },
      { name: "Official Declarations", abbr: "OD", chapters: 2, urlAbbr: "od" },
    ],
  },
  {
    id: "PEARL_OF_GREAT_PRICE",
    name: "Pearl of Great Price",
    shortName: "PGP",
    urlSection: "pgp",
    books: [
      { name: "Moses",              abbr: "Moses",  chapters: 8, urlAbbr: "moses" },
      { name: "Abraham",            abbr: "Abr.",   chapters: 5, urlAbbr: "abr"   },
      { name: "Joseph Smith—Matthew",  abbr: "JS—M", chapters: 1, urlAbbr: "js-m"  },
      { name: "Joseph Smith—History",  abbr: "JS—H", chapters: 1, urlAbbr: "js-h"  },
      { name: "Articles of Faith",  abbr: "A of F", chapters: 1, urlAbbr: "a-of-f" },
    ],
  },
];

/** Flat list of all chapters for a given standard work, in canonical order. */
export type StudyItem = {
  /** Human-readable reference, e.g. "Alma 32" or "D&C 76" */
  reference: string;
  bookName: string;
  unitNumber: number; // chapter number within the book
  /** Direct Church website URL for this item, or null if unavailable */
  url: string | null;
};

/** Build and cache the flat item list for each standard work. */
const itemCache = new Map<string, StudyItem[]>();

export function getScriptureItems(workId: string): StudyItem[] {
  if (itemCache.has(workId)) return itemCache.get(workId)!;

  const work = STANDARD_WORKS.find((w) => w.id === workId);
  if (!work) throw new Error(`Unknown standard work: ${workId}`);

  const items: StudyItem[] = [];

  for (const book of work.books) {
    if (workId === "DOC_AND_COV") {
      if (book.abbr === "D&C") {
        for (let s = 1; s <= 138; s++) {
          items.push({
            reference: `D&C ${s}`,
            bookName: book.name,
            unitNumber: s,
            url: `${BASE}/dc-testament/dc/${s}?lang=eng`,
          });
        }
      } else {
        for (let od = 1; od <= 2; od++) {
          items.push({
            reference: `Official Declaration ${od}`,
            bookName: book.name,
            unitNumber: od,
            url: `${BASE}/dc-testament/od/${od}?lang=eng`,
          });
        }
      }
    } else {
      for (let ch = 1; ch <= book.chapters; ch++) {
        items.push({
          reference: `${book.abbr} ${ch}`,
          bookName: book.name,
          unitNumber: ch,
          url: `${BASE}/${work.urlSection}/${book.urlAbbr}/${ch}?lang=eng`,
        });
      }
    }
  }

  itemCache.set(workId, items);
  return items;
}

/** Get the total number of chapters/sections for a standard work. */
export function getScriptureTotalItems(workId: string): number {
  return getScriptureItems(workId).length;
}

/** Get human-readable display for a range of items. */
export function getScriptureRangeDisplay(
  workId: string,
  startPos: number,
  count: number,
): string {
  const items = getScriptureItems(workId);
  const slice = items.slice(startPos, startPos + count);
  if (slice.length === 0) return "Complete";

  if (slice.length === 1) {
    return slice[0]!.reference;
  }

  const first = slice[0]!;
  const last = slice[slice.length - 1]!;

  if (first.bookName === last.bookName) {
    // Same book: "Alma 32–33"
    return `${first.bookName} ${first.unitNumber}–${last.unitNumber}`;
  } else {
    // Different books: "2 Ne. 32 – Jacob 1"
    return `${first.reference} – ${last.reference}`;
  }
}

/** Get the Church website URL for the item at a given position, or null. */
export function getScriptureItemUrl(workId: string, position: number): string | null {
  const items = getScriptureItems(workId);
  return items[position]?.url ?? null;
}

/** Get a standard work by ID (throws if not found). */
export function getStandardWork(workId: string): StandardWork {
  const work = STANDARD_WORKS.find((w) => w.id === workId);
  if (!work) throw new Error(`Unknown standard work: ${workId}`);
  return work;
}
