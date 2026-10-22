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
  it("le relevé des pages vatican.va couvre les 2865 paragraphes, sans trou ni chevauchement", () => {
    expect(cecPages[0].first).toBe(1);
    expect(cecPages[cecPages.length - 1].last).toBe(2865);
    for (let i = 1; i < cecPages.length; i++) expect(cecPages[i].first).toBe(cecPages[i - 1].last + 1);
    cecPages.forEach((p) => expect(p.url).toMatch(/^https:\/\/www\.vatican\.va\/archive\/FRA0013\/__P[0-9A-Z]+\.HTM$/));
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

  it("chaque lien ouvre la page et se positionne sur le paragraphe", () => {
    expect(cecPageFor(cecPages, "1716-1729")).toBe("https://www.vatican.va/archive/FRA0013/__P5C.HTM#:~:text=1716");
    expect(cecPageFor(cecPages, "2759-2865")).toBe("https://www.vatican.va/archive/FRA0013/__P9P.HTM#:~:text=2759");
    refs.forEach((t) => expect(t.url, t.where).toMatch(/__P[0-9A-Z]+\.HTM(#:~:text=\d+)?$/));
  });

  it("le premier paragraphe est bien lu", () => {
    expect(firstParagraph("1716-1729")).toBe(1716);
    expect(firstParagraph("949, 2624")).toBe(949);
  });
});
