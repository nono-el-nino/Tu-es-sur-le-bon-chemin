import { describe, expect, it } from "vitest";
import { frenchLabels, type StyleLayer } from "../src/components/map/frenchLabels";

// couleurs fournies par les tokens dans l'app ; valeurs fictives ici
const COULEURS = { texte: "var-texte", halo: "var-halo" };

describe("fond « Aujourd'hui » en français", () => {
  it("affiche le nom français, sinon la transcription latine, sinon le nom local", () => {
    const style = frenchLabels({
      layers: [
        { type: "symbol", layout: { "text-field": ["concat", ["get", "name:latin"], "\n", ["get", "name:nonlatin"]] } },
        { type: "symbol", layout: { "text-field": "{name}" } },
        { type: "symbol", layout: { "text-field": ["get", "ref"] } },
        { type: "line", layout: {} },
      ],
    }, COULEURS);
    const expected = ["coalesce", ["get", "name:fr"], ["get", "name:latin"], ["get", "name"]];
    expect(style.layers[0].layout!["text-field"]).toEqual(expected);
    expect(style.layers[1].layout!["text-field"]).toEqual(expected);
    // les numéros de routes ne sont pas modifiés
    expect(style.layers[2].layout!["text-field"]).toEqual(["get", "ref"]);
    // noms du fond éclaircis
    expect((style.layers[0] as StyleLayer).paint!["text-color"]).toBe(COULEURS.texte);
  });

  it("retire la mention de source anglaise du style", () => {
    const style = frenchLabels({ layers: [], sources: { openmaptiles: { attribution: "Data from OpenStreetMap" } } }, COULEURS);
    expect(style.sources!.openmaptiles.attribution).toBeUndefined();
  });
});
