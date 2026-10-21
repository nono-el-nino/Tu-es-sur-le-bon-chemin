import { describe, expect, it } from "vitest";
import passages from "../src/content/data/passages.json";
import parcours from "../src/content/data/parcours.json";
import cecPages from "../scripts/data/cec-pages.json";
// @ts-expect-error module JS sans types
import { cecPageFor, firstParagraph } from "../scripts/cec-map.mjs";

const refs = [
  ...passages.flatMap((p) => p.teaching.map((t) => ({ where: p.id, ...t }))),
  ...parcours.flatMap((pc) => pc.steps.flatMap((s) => s.teaching.map((t) => ({ where: `${pc.id}/${s.id}`, ...t })))),
];

describe("liens vers le Catéchisme", () => {
  it("le relevé des pages vatican.va couvre tout le Catéchisme", () => {
    const covered = new Set(cecPages.flatMap((p: { nums: number[] }) => p.nums));
    expect(covered.size).toBeGreaterThan(2700);
  });

  it("chaque référence ouvre la page qui contient son premier paragraphe", () => {
    expect(refs.length).toBeGreaterThan(0);
    for (const t of refs) {
      const expected = cecPageFor(cecPages, t.paragraphs);
      expect(expected, `${t.where} : § ${t.paragraphs} introuvable`).toBeTruthy();
      expect(t.url, `${t.where} : § ${t.paragraphs}`).toBe(expected);
    }
  });

  it("plus aucun lien ne renvoie vers la page d'accueil du Catéchisme", () => {
    refs.forEach((t) => expect(t.url, t.where).not.toBe("https://www.vatican.va/archive/ccc/index_fr.htm"));
  });

  it("le premier paragraphe est bien lu", () => {
    expect(firstParagraph("1716-1729")).toBe(1716);
    expect(firstParagraph("949, 2624")).toBe(949);
  });
});
