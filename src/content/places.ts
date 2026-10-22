import { z } from "zod";
import raw from "./data/places.json";
import { content } from "./index";
import type { Passage } from "./schema";

/**
 * Lieux bibliques et liens avec les passages.
 * Coordonnées, scores et identifications : OpenBible.info (CC BY 4.0).
 * Chaque lien cite un verset où le lieu est nommé (contrôlé par les tests).
 */

export const placeRoles = ["nomme", "scene", "contexte", "destinataires", "redaction", "origine"] as const;
export type PlaceRole = (typeof placeRoles)[number];

export const roleLabels: Record<PlaceRole, string> = {
  nomme: "Nommé dans le passage",
  scene: "Lieu de la scène",
  contexte: "Mentionné dans le contexte",
  destinataires: "Destinataires de la lettre",
  redaction: "Lieu de rédaction",
  origine: "Lieu d'origine",
};

const site = z.object({ site: z.string().nullable().optional(), score: z.number().nullable(), lat: z.number(), lon: z.number() });

export const placeSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(2),
  openbible: z.object({ id: z.string(), name: z.string(), url: z.string().url().startsWith("https://www.openbible.info/geo/ancient/") }),
  kind: z.enum(["ville", "region", "fleuve", "montagne", "mer"]),
  lat: z.number().min(10).max(50),
  lon: z.number().min(5).max(60),
  identification: z.object({ site: z.string().nullable().optional(), score: z.number().nullable(), via: z.string().nullable().optional() }),
  alternatives: z.array(site),
  links: z.object({ pleiades: z.string().url().optional(), wikidata: z.string().url().optional(), dare: z.string().url().optional() }),
});
export type Place = z.infer<typeof placeSchema>;

export const placeLinkSchema = z.object({
  place: z.string(),
  role: z.enum(placeRoles),
  osis: z.string().regex(/^[1-3]?[A-Za-z]+\.\d+\.\d+$/),
  note: z.string().optional(),
});
export type PlaceLink = z.infer<typeof placeLinkSchema>;

export const placesFileSchema = z.object({
  _source: z.string(),
  places: z.array(placeSchema),
  links: z.record(z.array(placeLinkSchema)),
});

const data = placesFileSchema.parse(raw);
export const places = data.places;
export const placesById = new Map(places.map((p) => [p.id, p]));
export const placeLinks = data.links;

// --- Références : OSIS → abréviations AELF ---

export const osisToAelf: Record<string, string> = {
  Gen: "Gn", Exod: "Ex", Lev: "Lv", Num: "Nb", Deut: "Dt", Josh: "Jos", Judg: "Jg", Ruth: "Rt", "1Sam": "1S", "2Sam": "2S",
  "1Kgs": "1R", "2Kgs": "2R", "1Chr": "1Ch", "2Chr": "2Ch", Ezra: "Esd", Neh: "Ne", Esth: "Est", Job: "Jb", Ps: "Ps",
  Prov: "Pr", Eccl: "Qo", Song: "Ct", Isa: "Is", Jer: "Jr", Lam: "Lm", Ezek: "Ez", Dan: "Dn", Hos: "Os", Joel: "Jl",
  Amos: "Am", Obad: "Ab", Jonah: "Jon", Mic: "Mi", Nah: "Na", Hab: "Ha", Zeph: "So", Hag: "Ag", Zech: "Za", Mal: "Ml",
  Matt: "Mt", Mark: "Mc", Luke: "Lc", John: "Jn", Acts: "Ac", Rom: "Rm", "1Cor": "1Co", "2Cor": "2Co", Gal: "Ga",
  Eph: "Ep", Phil: "Ph", Col: "Col", "1Thess": "1Th", "2Thess": "2Th", "1Tim": "1Tm", "2Tim": "2Tm", Titus: "Tt",
  Phlm: "Phm", Heb: "He", Jas: "Jc", "1Pet": "1P", "2Pet": "2P", "1John": "1Jn", "2John": "2Jn", "3John": "3Jn",
  Jude: "Jude", Rev: "Ap",
};

/** « Matt.17.24 » → « Mt 17, 24 » */
export function formatOsis(osis: string): string {
  const [book, ch, v] = osis.split(".");
  return `${osisToAelf[book] ?? book} ${ch}, ${v}`;
}

// --- Confiance ---

export type Confidence = { level: "sure" | "probable" | "debattue" | "incertaine" | "zone"; label: string; score: number | null };

export function confidenceOf(p: Place): Confidence {
  const score = p.identification.score;
  if (p.kind === "region") return { level: "zone", label: "Région · contour approximatif", score };
  if (p.kind === "fleuve" || p.kind === "mer") return { level: "sure", label: p.kind === "fleuve" ? "Fleuve" : "Mer", score };
  if (score === null) return { level: "incertaine", label: "Localisation inconnue", score };
  if (score >= 800) return { level: "sure", label: "Localisation sûre", score };
  if (score >= 500) return { level: "probable", label: "Localisation probable", score };
  if (score >= 250) return { level: "debattue", label: "Localisation débattue", score };
  return { level: "incertaine", label: "Localisation très incertaine", score };
}

// --- Groupes de livres (filtres) ---

export type BookGroup = "at" | "evangiles" | "lettres";
const GOSPELS = new Set(["Mt", "Mc", "Lc", "Jn"]);
const NT = new Set("Mt Mc Lc Jn Ac Rm 1Co 2Co Ga Ep Ph Col 1Th 2Th 1Tm 2Tm Tt Phm He Jc 1P 2P 1Jn 2Jn 3Jn Jude Ap".split(" "));
export function bookGroup(bookCode: string): BookGroup {
  if (GOSPELS.has(bookCode)) return "evangiles";
  return NT.has(bookCode) ? "lettres" : "at";
}
export const groupLabels: Record<BookGroup, string> = { at: "Ancien Testament", evangiles: "Évangiles", lettres: "Actes et lettres" };

// --- Croisements avec les fiches publiées ---

export type PlaceOccurrence = { passage: Passage; link: PlaceLink };

/** Lieux d'un passage publié. */
export function placesForPassage(passageId: string): { place: Place; link: PlaceLink }[] {
  return (placeLinks[passageId] ?? []).flatMap((link) => {
    const place = placesById.get(link.place);
    return place ? [{ place, link }] : [];
  });
}

/** Fiches publiées qui mentionnent un lieu. */
export function passagesForPlace(placeId: string): PlaceOccurrence[] {
  return Object.entries(placeLinks).flatMap(([pid, links]) => {
    const passage = content.passagesById.get(pid);
    if (!passage) return [];
    return links.filter((l) => l.place === placeId).map((link) => ({ passage, link }));
  });
}

/** Lieux reliés à au moins une fiche publiée. */
export function publishedPlaces(): Place[] {
  return places.filter((p) => passagesForPlace(p.id).length > 0);
}
