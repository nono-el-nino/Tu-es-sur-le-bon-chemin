import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import raw from "../src/content/data/places.json";
import passages from "../src/content/data/passages.json";
import versesIndex from "../scripts/data/places-verses.json";
import { confidenceOf, formatOsis, osisToAelf, placesFileSchema } from "../src/content/places";

const data = placesFileSchema.parse(raw);
const byId = new Map(data.places.map((p) => [p.id, p]));
const passagesById = new Map(passages.map((p) => [p.id, p]));
const verses = versesIndex as Record<string, string[]>;

describe("lieux : données", () => {
  it("respectent le schéma et ont des identifiants uniques", () => {
    expect(new Set(data.places.map((p) => p.id)).size).toBe(data.places.length);
  });

  it("chaque lieu renvoie à sa fiche OpenBible", () => {
    data.places.forEach((p) => expect(p.openbible.url).toBe(`https://www.openbible.info/geo/ancient/${p.openbible.id}/`));
  });

  it("les coordonnées restent dans le monde biblique (Méditerranée et Proche-Orient)", () => {
    data.places.forEach((p) => {
      expect(p.lat, p.id).toBeGreaterThan(14);
      expect(p.lat, p.id).toBeLessThan(43);
      expect(p.lon, p.id).toBeGreaterThan(11);
      expect(p.lon, p.id).toBeLessThan(50);
    });
  });

  it("repères de contrôle : quelques sites bien connus sont au bon endroit (± 0,05°)", () => {
    const near = (id: string, lat: number, lon: number) => {
      const p = byId.get(id)!;
      expect(Math.abs(p.lat - lat), id).toBeLessThan(0.05);
      expect(Math.abs(p.lon - lon), id).toBeLessThan(0.05);
    };
    near("jerusalem", 31.777, 35.234);
    near("capharnaum", 32.881, 35.575);
    near("rome", 41.892, 12.485);
    near("corinthe", 37.906, 22.879);
  });

  it("les identifications débattues sont signalées comme telles", () => {
    expect(confidenceOf(byId.get("emmaus")!).level).toBe("debattue");
    expect(confidenceOf(byId.get("horeb")!).level).toBe("debattue");
    expect(byId.get("emmaus")!.alternatives.length).toBeGreaterThan(0);
    expect(confidenceOf(byId.get("jerusalem")!).level).toBe("sure");
  });
});

describe("lieux : liens avec les fiches", () => {
  const all = Object.entries(data.links).flatMap(([passageId, links]) => links.map((l) => ({ passageId, ...l })));

  it("relient des fiches et des lieux existants", () => {
    expect(all.length).toBeGreaterThan(20);
    all.forEach((l) => {
      expect(passagesById.has(l.passageId), l.passageId).toBe(true);
      expect(byId.has(l.place), l.place).toBe(true);
    });
  });

  it("chaque lien cite un verset où le lieu est effectivement nommé (index OpenBible)", () => {
    all.forEach((l) => expect(verses[l.place], `${l.passageId} → ${l.place} (${l.osis})`).toContain(l.osis));
  });

  it("le verset cité appartient au même livre que la fiche", () => {
    all.forEach((l) => {
      const book = osisToAelf[l.osis.split(".")[0]];
      expect(book, l.osis).toBe(passagesById.get(l.passageId)!.reference.bookCode);
    });
  });

  it("un lieu « nommé dans le passage » est bien dans les versets de la fiche", () => {
    all
      .filter((l) => l.role === "nomme")
      .forEach((l) => {
        const p = passagesById.get(l.passageId)!;
        const [, ch, v] = l.osis.split(".").map(Number);
        const [a, z] = p.reference.verses.split("-").map((x) => parseInt(x, 10));
        expect(ch, l.passageId).toBe(p.reference.chapter);
        expect(v, l.passageId).toBeGreaterThanOrEqual(a);
        expect(v, l.passageId).toBeLessThanOrEqual(z ?? a);
      });
  });

  it("formate les références à la française", () => {
    expect(formatOsis("Matt.17.24")).toBe("Mt 17, 24");
    expect(formatOsis("1Cor.16.8")).toBe("1Co 16, 8");
  });
});

describe("couches cartographiques", () => {
  for (const f of ["fond-naturel", "lieux-contours", "empire-perse", "royaume-herode", "empire-romain-117", "voies-romaines"]) {
    it(`${f}.json est une collection GeoJSON valide`, () => {
      const path = `public/geo/${f}.json`;
      expect(existsSync(path)).toBe(true);
      const fc = JSON.parse(readFileSync(path, "utf8"));
      expect(fc.type).toBe("FeatureCollection");
      expect(fc.features.length).toBeGreaterThan(0);
      fc.features.forEach((ft: { geometry: { type: string } }) => expect(["Polygon", "MultiPolygon", "LineString", "MultiLineString"]).toContain(ft.geometry.type));
    });
  }
});
