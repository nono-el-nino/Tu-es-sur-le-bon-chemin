import { describe, expect, it } from "vitest";
import structureRaw from "../src/content/data/bible-structure.json";
import passages from "../src/content/data/passages.json";
import { computeCoverage, percent, verseRange, type BibleStructure } from "../src/lib/coverage";

const structure = structureRaw as BibleStructure;
const published = passages.filter((p) => p.editorial.status === "valide");
const refs = (ps: typeof passages) => ps.map((p) => ({ id: p.id, title: p.title, bookCode: p.reference.bookCode, chapter: p.reference.chapter, verses: p.reference.verses }));

describe("structure de la Bible AELF", () => {
  it("contient les 73 livres du canon catholique (Lettre de Jérémie présentée à part)", () => {
    const codes = structure.books.map((b) => b.code);
    expect(new Set(codes).size).toBe(codes.length);
    expect(codes.filter((c) => c !== "XXX")).toHaveLength(73);
    expect(structure.books.filter((b) => b.testament === "NT")).toHaveLength(27);
  });

  it("a des comptages plausibles", () => {
    structure.books.forEach((b) => b.chapters.forEach((c) => expect(c.verses, `${b.code} ${c.id}`).toBeGreaterThan(0)));
    const mt = structure.books.find((b) => b.code === "Mt")!;
    expect(mt.chapters).toHaveLength(28);
    expect(mt.chapters.find((c) => c.id === "5")!.verses).toBe(48);
    expect(structure.books.find((b) => b.code === "Ps")!.chapters.length).toBeGreaterThanOrEqual(150);
    const total = structure.books.reduce((s, b) => s + b.chapters.reduce((t, c) => t + c.verses, 0), 0);
    expect(total).toBeGreaterThan(30000);
    expect(total).toBeLessThan(40000);
  });
});

describe("références des fiches face à la Bible AELF", () => {
  it("chaque fiche renvoie à un chapitre existant et à des versets qui ne dépassent pas sa fin", () => {
    for (const p of passages) {
      const book = structure.books.find((b) => b.code === p.reference.bookCode);
      expect(book, `${p.id} : livre ${p.reference.bookCode}`).toBeDefined();
      const ch = book!.chapters.find((c) => c.id === String(p.reference.chapter));
      expect(ch, `${p.id} : chapitre ${p.reference.chapter}`).toBeDefined();
      const [a, z] = verseRange(p.reference.verses);
      expect(a, p.id).toBeGreaterThanOrEqual(1);
      const last = (ch as { last?: number }).last ?? ch!.verses;
      expect(z, `${p.id} : verset ${z} > ${last}`).toBeLessThanOrEqual(last);
    }
  });
});

describe("calcul de la couverture", () => {
  it("compte une seule fois les versets couverts par plusieurs fiches", () => {
    const cov = computeCoverage(structure, [
      { id: "a", title: "", bookCode: "Mt", chapter: 6, verses: "5-8" },
      { id: "b", title: "", bookCode: "Mt", chapter: 6, verses: "5-13" },
    ]);
    expect(cov.verses.covered).toBe(9);
    expect(cov.chapters.touched).toBe(1);
    expect(cov.bookCount.touched).toBe(1);
  });

  it("ne compte pas un verset absent de la traduction (Mt 18, 11)", () => {
    const cov = computeCoverage(structure, [{ id: "a", title: "", bookCode: "Mt", chapter: 18, verses: "1-35" }]);
    const ch = cov.books.find((b) => b.code === "Mt")!.chapters.find((c) => c.id === "18")!;
    expect(ch.covered).toBe(ch.total);
    expect(ch.total).toBe(34);
  });

  it("reflète les fiches publiées uniquement", () => {
    const cov = computeCoverage(structure, refs(published));
    expect(cov.passages).toBe(published.length);
    expect(cov.verses.covered).toBeGreaterThan(0);
    expect(cov.verses.covered).toBeLessThan(cov.verses.total);
    expect(cov.bookCount.total).toBe(73);
    // les psaumes « à vérifier » ne comptent pas
    expect(cov.books.find((b) => b.code === "Ps")!.coveredVerses).toBe(0);
  });

  it("formate les pourcentages à la française", () => {
    expect(percent(9, 1000)).toBe("0,9 %");
    expect(percent(1, 2)).toBe("50 %");
    expect(verseRange("1-12")).toEqual([1, 12]);
    expect(verseRange("9")).toEqual([9, 9]);
  });
});
