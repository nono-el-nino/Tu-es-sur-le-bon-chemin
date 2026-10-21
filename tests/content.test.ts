import { describe, expect, it } from "vitest";
import passages from "../src/content/data/passages.json";
import topics from "../src/content/data/topics.json";
import parcours from "../src/content/data/parcours.json";
import sources from "../src/content/data/sources.json";
import { catalog, AELF_BIBLE_BASE } from "../src/content/schema";
import { buildPublicCatalog, formatReference, passageOfTheDay, randomPassage } from "../src/content/catalog";

const raw = catalog.parse({ passages, topics, parcours, sources });

describe("schéma JSON", () => {
  it("le catalogue respecte le schéma", () => {
    const r = catalog.safeParse({ passages, topics, parcours, sources });
    if (!r.success) console.error(r.error.issues);
    expect(r.success).toBe(true);
  });

  it("les identifiants sont uniques", () => {
    const ids = (xs: { id: string }[]) => new Set(xs.map((x) => x.id)).size === xs.length;
    expect(ids(raw.passages)).toBe(true);
    expect(ids(raw.topics)).toBe(true);
    expect(ids(raw.parcours)).toBe(true);
    raw.parcours.forEach((p) => expect(ids(p.steps)).toBe(true));
  });

  it("toutes les références croisées existent", () => {
    const known = new Set(raw.passages.map((p) => p.id));
    raw.topics.forEach((t) => t.passageIds.forEach((id) => expect(known, `${t.id} → ${id}`).toContain(id)));
    raw.parcours.forEach((p) => p.steps.forEach((s) => expect(known, `${p.id}/${s.id}`).toContain(s.passageId)));
  });

  it("rejette une fiche sans lien vers le bon chapitre", () => {
    const bad = { ...raw.passages[0], sourceUrl: `${AELF_BIBLE_BASE}Mt/99` };
    expect(catalog.safeParse({ ...raw, passages: [bad] }).success).toBe(false);
  });
});

describe("références et sources", () => {
  it("chaque passage indique traduction, livre, chapitre, versets et lien AELF", () => {
    for (const p of raw.passages) {
      expect(p.translation).toBe("AELF");
      expect(p.reference.bookName.length).toBeGreaterThan(1);
      expect(p.reference.chapter).toBeGreaterThan(0);
      expect(p.reference.verses).toMatch(/\d/);
      expect(p.sourceUrl).toBe(`${AELF_BIBLE_BASE}${p.reference.bookCode}/${p.reference.chapter}`);
      expect(formatReference(p)).toContain(p.reference.verses);
    }
  });

  it("chaque référence au Catéchisme pointe vers vatican.va", () => {
    const refs = [...raw.passages.flatMap((p) => p.teaching), ...raw.parcours.flatMap((p) => p.steps.flatMap((s) => s.teaching))];
    expect(refs.length).toBeGreaterThan(0);
    refs.forEach((t) => expect(t.url.startsWith("https://www.vatican.va/")).toBe(true));
  });

  it("chaque contenu validé est rattaché à au moins une source officielle", () => {
    const pub = buildPublicCatalog(raw);
    pub.parcours.forEach((p) => p.steps.forEach((s) => expect(s.teaching.length, `${p.id}/${s.id}`).toBeGreaterThan(0)));
    pub.passages.forEach((p) => expect(p.sourceUrl).toMatch(/^https:\/\/www\.aelf\.org\/bible\//));
  });
});

describe("statut éditorial", () => {
  const pub = buildPublicCatalog(raw);

  it("seuls les contenus validés sont publics", () => {
    pub.passages.forEach((p) => expect(p.editorial.status).toBe("valide"));
    [...pub.moods, ...pub.themes].forEach((t) => expect(t.editorial.status).toBe("valide"));
    pub.parcours.forEach((p) => {
      expect(p.editorial.status).toBe("valide");
      p.steps.forEach((s) => expect(s.editorial.status).toBe("valide"));
    });
  });

  it("les passages non validés disparaissent aussi des humeurs et thèmes", () => {
    const hidden = new Set(raw.passages.filter((p) => p.editorial.status !== "valide").map((p) => p.id));
    expect(hidden.size).toBeGreaterThan(0);
    [...pub.moods, ...pub.themes].forEach((t) => t.passageIds.forEach((id) => expect(hidden.has(id)).toBe(false)));
    expect(pub.passagesById.has("p-ps23-berger")).toBe(false);
    expect(pub.themes.find((t) => t.id === "marie")).toBeUndefined();
  });

  it("l'aperçu éditorial montre les fiches « à vérifier » mais jamais les brouillons", () => {
    const preview = buildPublicCatalog(raw, { preview: true });
    expect(preview.passagesById.has("p-ps23-berger")).toBe(true);
    preview.passages.forEach((p) => expect(p.editorial.status).not.toBe("brouillon"));
  });

  it("une étape dont le passage n'est pas validé est retirée du parcours", () => {
    const tweaked = structuredClone(raw);
    tweaked.passages.find((p) => p.id === "p-mc1-royaume")!.editorial.status = "a_verifier";
    const p = buildPublicCatalog(tweaked).parcours.find((x) => x.id === "decouvrir-jesus")!;
    expect(p.steps.map((s) => s.passageId)).not.toContain("p-mc1-royaume");
  });

  it("le MVP propose 8 à 10 humeurs, des thèmes et 3 parcours de 5 étapes", () => {
    expect(pub.moods.length).toBeGreaterThanOrEqual(8);
    expect(pub.moods.length).toBeLessThanOrEqual(10);
    expect(pub.themes.length).toBeGreaterThanOrEqual(6);
    expect(pub.parcours).toHaveLength(3);
    pub.parcours.forEach((p) => expect(p.steps.length).toBeGreaterThanOrEqual(5));
    pub.moods.forEach((m) => expect(m.passageIds.length, m.id).toBeGreaterThanOrEqual(2));
    expect(pub.passages.length).toBeGreaterThanOrEqual(20);
  });
});

describe("droits de reproduction", () => {
  it("aucun texte biblique n'est reproduit sans autorisation documentée", () => {
    for (const p of raw.passages) {
      if (p.text !== null) expect(p.text.authorization.trim().length, p.id).toBeGreaterThan(10);
    }
  });

  it("le texte AELF n'est reproduit nulle part (catalogue actuel)", () => {
    expect(raw.passages.every((p) => p.text === null)).toBe(true);
  });

  it("aucune longue citation entre guillemets dans les textes éditoriaux", () => {
    const strings: string[] = [];
    const walk = (v: unknown) => {
      if (typeof v === "string") strings.push(v);
      else if (Array.isArray(v)) v.forEach(walk);
      else if (v && typeof v === "object") Object.values(v).forEach(walk);
    };
    walk({ passages: raw.passages.map((p) => ({ ...p, text: null })), topics: raw.topics, parcours: raw.parcours });
    for (const s of strings) {
      for (const m of s.matchAll(/«([^»]*)»/g)) {
        const words = m[1].trim().split(/\s+/).length;
        expect(words, `Citation trop longue : «${m[1]}»`).toBeLessThanOrEqual(6);
      }
    }
  });
});

describe("sélection des passages", () => {
  const pub = buildPublicCatalog(raw);
  it("passage du jour stable sur une journée", () => {
    const d = new Date(2026, 9, 21, 8);
    const e = new Date(2026, 9, 21, 22);
    expect(passageOfTheDay(pub.passages, d)?.id).toBe(passageOfTheDay(pub.passages, e)?.id);
  });
  it("tirage aléatoire différent du précédent", () => {
    for (let i = 0; i < 20; i++) {
      const p = randomPassage(pub.passages, "p-lc15-pere-misericordieux");
      expect(p?.id).not.toBe("p-lc15-pere-misericordieux");
    }
  });
});
