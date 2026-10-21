import type { Catalog, EditorialStatus, Parcours, Passage, Topic } from "./schema";

export type PublicCatalog = {
  passages: Passage[];
  passagesById: Map<string, Passage>;
  moods: Topic[];
  themes: Topic[];
  parcours: Parcours[];
  sources: Catalog["sources"];
};

/**
 * Construit le catalogue public : seuls les contenus « valide » sont gardés.
 * En mode aperçu éditorial, les contenus « a_verifier » sont aussi montrés
 * (avec un badge), jamais les brouillons.
 */
export function buildPublicCatalog(raw: Catalog, opts: { preview?: boolean } = {}): PublicCatalog {
  const allowed = (s: EditorialStatus) => s === "valide" || (opts.preview === true && s === "a_verifier");

  const passages = raw.passages.filter((p) => allowed(p.editorial.status));
  const passagesById = new Map(passages.map((p) => [p.id, p]));

  const topics = raw.topics
    .filter((t) => allowed(t.editorial.status))
    .map((t) => ({ ...t, passageIds: t.passageIds.filter((id) => passagesById.has(id)) }))
    .filter((t) => t.passageIds.length > 0);

  const parcours = raw.parcours
    .filter((pc) => allowed(pc.editorial.status))
    .map((pc) => ({
      ...pc,
      steps: pc.steps.filter((s) => allowed(s.editorial.status) && passagesById.has(s.passageId)),
    }))
    .filter((pc) => pc.steps.length > 0);

  return {
    passages,
    passagesById,
    moods: topics.filter((t) => t.kind === "humeur"),
    themes: topics.filter((t) => t.kind === "theme"),
    parcours,
    sources: raw.sources,
  };
}

/** « Matthieu 5, 1-12 » ; « Psaume 22 (23), 1-6 ». */
export function formatReference(p: Passage): string {
  const r = p.reference;
  return `${r.bookName} ${r.chapterLabel ?? r.chapter}, ${r.verses}`;
}

/** Passage du jour : déterministe selon la date (même passage toute la journée). */
export function passageOfTheDay(passages: Passage[], date = new Date()): Passage | undefined {
  if (passages.length === 0) return undefined;
  const key = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
  // petit hachage pour éviter de suivre l'ordre du fichier
  let h = key;
  h = ((h >>> 16) ^ h) * 0x45d9f3b;
  h = ((h >>> 16) ^ h) * 0x45d9f3b;
  h = (h >>> 16) ^ h;
  return passages[Math.abs(h) % passages.length];
}

/** Tire un passage au hasard, différent de `excludeId` quand c'est possible. */
export function randomPassage(passages: Passage[], excludeId?: string, rnd = Math.random): Passage | undefined {
  const pool = passages.length > 1 ? passages.filter((p) => p.id !== excludeId) : passages;
  if (pool.length === 0) return undefined;
  return pool[Math.floor(rnd() * pool.length)];
}
