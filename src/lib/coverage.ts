/**
 * Couverture des fiches publiées au regard de toute la Bible (structure AELF).
 * Fonctions pures : le calcul est testé indépendamment de l'affichage.
 */

export type BibleStructure = {
  source: string;
  retrievedAt: string;
  books: {
    code: string;
    name: string;
    testament: "AT" | "NT";
    /** verses : nombre de versets ; last : dernier numéro ; missing : numéros absents (ex. Mt 18, 11). */
    chapters: { id: string; verses: number; last?: number | null; missing?: number[] }[];
  }[];
};

type Ref = { id: string; title: string; bookCode: string; chapter: number; verses: string };

export type ChapterCoverage = { id: string; total: number; covered: number };
export type BookCoverage = {
  code: string;
  name: string;
  testament: "AT" | "NT";
  chapters: ChapterCoverage[];
  totalVerses: number;
  coveredVerses: number;
  passages: Ref[];
};
export type Coverage = {
  books: BookCoverage[];
  passages: number;
  verses: { covered: number; total: number };
  chapters: { touched: number; total: number };
  bookCount: { touched: number; total: number };
  byTestament: Record<"AT" | "NT", { covered: number; total: number; books: number; touchedBooks: number }>;
};

/** « 1-12 » → [1, 12] ; « 9 » → [9, 9] */
export function verseRange(verses: string): [number, number] {
  const [a, b] = verses.split("-").map((x) => parseInt(x, 10));
  return [a, Number.isNaN(b) || b === undefined ? a : b];
}

export function computeCoverage(structure: BibleStructure, refs: Ref[]): Coverage {
  const sets = new Map<string, Set<number>>(); // "Mt|5" -> versets couverts
  const byBook = new Map<string, Ref[]>();
  for (const r of refs) {
    const key = `${r.bookCode}|${r.chapter}`;
    const set = sets.get(key) ?? new Set<number>();
    const [a, z] = verseRange(r.verses);
    for (let v = a; v <= z; v++) set.add(v);
    sets.set(key, set);
    byBook.set(r.bookCode, [...(byBook.get(r.bookCode) ?? []), r]);
  }

  const books: BookCoverage[] = structure.books.map((b) => {
    const chapters = b.chapters.map((c) => {
      const last = c.last ?? c.verses;
      const missing = new Set(c.missing ?? []);
      const set = sets.get(`${b.code}|${c.id}`);
      const covered = set ? [...set].filter((v) => v >= 1 && v <= last && !missing.has(v)).length : 0;
      return { id: c.id, total: last - missing.size, covered };
    });
    return {
      code: b.code,
      name: b.name,
      testament: b.testament,
      chapters,
      totalVerses: chapters.reduce((s, c) => s + c.total, 0),
      coveredVerses: chapters.reduce((s, c) => s + c.covered, 0),
      passages: byBook.get(b.code) ?? [],
    };
  });

  const sum = (xs: BookCoverage[], f: (b: BookCoverage) => number) => xs.reduce((s, b) => s + f(b), 0);
  const canonical = (xs: BookCoverage[]) => xs.filter((b) => b.code !== "XXX");
  const testament = (t: "AT" | "NT") => {
    const xs = books.filter((b) => b.testament === t);
    const cs = canonical(xs);
    return { covered: sum(xs, (b) => b.coveredVerses), total: sum(xs, (b) => b.totalVerses), books: cs.length, touchedBooks: cs.filter((b) => b.coveredVerses > 0).length };
  };

  return {
    books,
    passages: refs.length,
    verses: { covered: sum(books, (b) => b.coveredVerses), total: sum(books, (b) => b.totalVerses) },
    chapters: { touched: sum(books, (b) => b.chapters.filter((c) => c.covered > 0).length), total: sum(books, (b) => b.chapters.length) },
    // Canon catholique : 73 livres. AELF présente la Lettre de Jérémie (code XXX) à part ;
    // elle est comptée avec Baruch, dont elle forme traditionnellement le chapitre 6.
    bookCount: { touched: canonical(books).filter((b) => b.coveredVerses > 0).length, total: canonical(books).length },
    byTestament: { AT: testament("AT"), NT: testament("NT") },
  };
}

export const percent = (n: number, d: number) =>
  d === 0 ? "0 %" : `${((n / d) * 100).toLocaleString("fr-FR", { maximumFractionDigits: n / d < 0.1 ? 1 : 0, minimumFractionDigits: n / d < 0.1 && n > 0 ? 1 : 0 })} %`;
