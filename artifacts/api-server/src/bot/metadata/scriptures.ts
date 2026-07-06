// Scripture metadata — chapter counts only. No text is stored or displayed.
// To add a new standard work, add an entry to STANDARD_WORKS with books and chapter counts.

export type Book = {
  name: string;
  abbr: string;
  chapters: number;
};

export type StandardWork = {
  id: string;
  name: string;
  shortName: string;
  books: Book[];
};

export const STANDARD_WORKS: StandardWork[] = [
  {
    id: "OLD_TESTAMENT",
    name: "Old Testament",
    shortName: "OT",
    books: [
      { name: "Genesis", abbr: "Gen.", chapters: 50 },
      { name: "Exodus", abbr: "Ex.", chapters: 40 },
      { name: "Leviticus", abbr: "Lev.", chapters: 27 },
      { name: "Numbers", abbr: "Num.", chapters: 36 },
      { name: "Deuteronomy", abbr: "Deut.", chapters: 34 },
      { name: "Joshua", abbr: "Josh.", chapters: 24 },
      { name: "Judges", abbr: "Judg.", chapters: 21 },
      { name: "Ruth", abbr: "Ruth", chapters: 4 },
      { name: "1 Samuel", abbr: "1 Sam.", chapters: 31 },
      { name: "2 Samuel", abbr: "2 Sam.", chapters: 24 },
      { name: "1 Kings", abbr: "1 Kgs.", chapters: 22 },
      { name: "2 Kings", abbr: "2 Kgs.", chapters: 25 },
      { name: "1 Chronicles", abbr: "1 Chr.", chapters: 29 },
      { name: "2 Chronicles", abbr: "2 Chr.", chapters: 36 },
      { name: "Ezra", abbr: "Ezra", chapters: 10 },
      { name: "Nehemiah", abbr: "Neh.", chapters: 13 },
      { name: "Esther", abbr: "Esth.", chapters: 10 },
      { name: "Job", abbr: "Job", chapters: 42 },
      { name: "Psalms", abbr: "Ps.", chapters: 150 },
      { name: "Proverbs", abbr: "Prov.", chapters: 31 },
      { name: "Ecclesiastes", abbr: "Eccl.", chapters: 12 },
      { name: "Song of Solomon", abbr: "Song", chapters: 8 },
      { name: "Isaiah", abbr: "Isa.", chapters: 66 },
      { name: "Jeremiah", abbr: "Jer.", chapters: 52 },
      { name: "Lamentations", abbr: "Lam.", chapters: 5 },
      { name: "Ezekiel", abbr: "Ezek.", chapters: 48 },
      { name: "Daniel", abbr: "Dan.", chapters: 12 },
      { name: "Hosea", abbr: "Hosea", chapters: 14 },
      { name: "Joel", abbr: "Joel", chapters: 3 },
      { name: "Amos", abbr: "Amos", chapters: 9 },
      { name: "Obadiah", abbr: "Obad.", chapters: 1 },
      { name: "Jonah", abbr: "Jonah", chapters: 4 },
      { name: "Micah", abbr: "Micah", chapters: 7 },
      { name: "Nahum", abbr: "Nahum", chapters: 3 },
      { name: "Habakkuk", abbr: "Hab.", chapters: 3 },
      { name: "Zephaniah", abbr: "Zeph.", chapters: 3 },
      { name: "Haggai", abbr: "Hag.", chapters: 2 },
      { name: "Zechariah", abbr: "Zech.", chapters: 14 },
      { name: "Malachi", abbr: "Mal.", chapters: 4 },
    ],
  },
  {
    id: "NEW_TESTAMENT",
    name: "New Testament",
    shortName: "NT",
    books: [
      { name: "Matthew", abbr: "Matt.", chapters: 28 },
      { name: "Mark", abbr: "Mark", chapters: 16 },
      { name: "Luke", abbr: "Luke", chapters: 24 },
      { name: "John", abbr: "John", chapters: 21 },
      { name: "Acts", abbr: "Acts", chapters: 28 },
      { name: "Romans", abbr: "Rom.", chapters: 16 },
      { name: "1 Corinthians", abbr: "1 Cor.", chapters: 16 },
      { name: "2 Corinthians", abbr: "2 Cor.", chapters: 13 },
      { name: "Galatians", abbr: "Gal.", chapters: 6 },
      { name: "Ephesians", abbr: "Eph.", chapters: 6 },
      { name: "Philippians", abbr: "Philip.", chapters: 4 },
      { name: "Colossians", abbr: "Col.", chapters: 4 },
      { name: "1 Thessalonians", abbr: "1 Thes.", chapters: 5 },
      { name: "2 Thessalonians", abbr: "2 Thes.", chapters: 3 },
      { name: "1 Timothy", abbr: "1 Tim.", chapters: 6 },
      { name: "2 Timothy", abbr: "2 Tim.", chapters: 4 },
      { name: "Titus", abbr: "Titus", chapters: 3 },
      { name: "Philemon", abbr: "Philem.", chapters: 1 },
      { name: "Hebrews", abbr: "Heb.", chapters: 13 },
      { name: "James", abbr: "James", chapters: 5 },
      { name: "1 Peter", abbr: "1 Pet.", chapters: 5 },
      { name: "2 Peter", abbr: "2 Pet.", chapters: 3 },
      { name: "1 John", abbr: "1 Jn.", chapters: 5 },
      { name: "2 John", abbr: "2 Jn.", chapters: 1 },
      { name: "3 John", abbr: "3 Jn.", chapters: 1 },
      { name: "Jude", abbr: "Jude", chapters: 1 },
      { name: "Revelation", abbr: "Rev.", chapters: 22 },
    ],
  },
  {
    id: "BOOK_OF_MORMON",
    name: "Book of Mormon",
    shortName: "BoM",
    books: [
      { name: "1 Nephi", abbr: "1 Ne.", chapters: 22 },
      { name: "2 Nephi", abbr: "2 Ne.", chapters: 33 },
      { name: "Jacob", abbr: "Jacob", chapters: 7 },
      { name: "Enos", abbr: "Enos", chapters: 1 },
      { name: "Jarom", abbr: "Jarom", chapters: 1 },
      { name: "Omni", abbr: "Omni", chapters: 1 },
      { name: "Words of Mormon", abbr: "W of M", chapters: 1 },
      { name: "Mosiah", abbr: "Mosiah", chapters: 29 },
      { name: "Alma", abbr: "Alma", chapters: 63 },
      { name: "Helaman", abbr: "Hel.", chapters: 16 },
      { name: "3 Nephi", abbr: "3 Ne.", chapters: 30 },
      { name: "4 Nephi", abbr: "4 Ne.", chapters: 1 },
      { name: "Mormon", abbr: "Morm.", chapters: 9 },
      { name: "Ether", abbr: "Ether", chapters: 15 },
      { name: "Moroni", abbr: "Moro.", chapters: 10 },
    ],
  },
  {
    id: "DOC_AND_COV",
    name: "Doctrine and Covenants",
    shortName: "D&C",
    books: [
      // Each "book" entry = one logical section group.
      // Sections 1–138 treated as chapters; OD 1 and OD 2 as extra items.
      { name: "Sections 1–138", abbr: "D&C", chapters: 138 },
      { name: "Official Declarations", abbr: "OD", chapters: 2 },
    ],
  },
  {
    id: "PEARL_OF_GREAT_PRICE",
    name: "Pearl of Great Price",
    shortName: "PGP",
    books: [
      { name: "Moses", abbr: "Moses", chapters: 8 },
      { name: "Abraham", abbr: "Abr.", chapters: 5 },
      { name: "Joseph Smith—Matthew", abbr: "JS—M", chapters: 1 },
      { name: "Joseph Smith—History", abbr: "JS—H", chapters: 1 },
      { name: "Articles of Faith", abbr: "A of F", chapters: 1 },
    ],
  },
];

/** Flat list of all chapters for a given standard work, in canonical order. */
export type StudyItem = {
  /** Human-readable reference, e.g. "Alma 32" or "D&C 76" */
  reference: string;
  bookName: string;
  unitNumber: number; // chapter number within the book
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
      // D&C sections 1-138 + OD 1-2
      if (book.abbr === "D&C") {
        for (let s = 1; s <= 138; s++) {
          items.push({ reference: `D&C ${s}`, bookName: book.name, unitNumber: s });
        }
      } else {
        for (let od = 1; od <= 2; od++) {
          items.push({ reference: `Official Declaration ${od}`, bookName: book.name, unitNumber: od });
        }
      }
    } else {
      for (let ch = 1; ch <= book.chapters; ch++) {
        items.push({
          reference: `${book.abbr} ${ch}`,
          bookName: book.name,
          unitNumber: ch,
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

/** Get a standard work by ID (throws if not found). */
export function getStandardWork(workId: string): StandardWork {
  const work = STANDARD_WORKS.find((w) => w.id === workId);
  if (!work) throw new Error(`Unknown standard work: ${workId}`);
  return work;
}
