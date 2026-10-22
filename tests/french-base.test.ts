import { describe, expect, it } from "vitest";
import { frenchLabels } from "../src/components/map/frenchLabels";

describe("fond « Aujourd'hui » en français", () => {
  it("affiche le nom français, sinon la transcription latine, sinon le nom local", () => {
    const style = frenchLabels({
      layers: [
        { type: "symbol", layout: { "text-field": ["concat", ["get", "name:latin"], "\n", ["get", "name:nonlatin"]] } },
        { type: "symbol", layout: { "text-field": "{name}" } },
        { type: "symbol", layout: { "text-field": ["get", "ref"] } },
        { type: "line", layout: {} },
      ],
    });
    const expected = ["coalesce", ["get", "name:fr"], ["get", "name:latin"], ["get", "name"]];
    expect(style.layers[0].layout!["text-field"]).toEqual(expected);
    expect(style.layers[1].layout!["text-field"]).toEqual(expected);
    // les numéros de routes ne sont pas modifiés
    expect(style.layers[2].layout!["text-field"]).toEqual(["get", "ref"]);
  });
});
