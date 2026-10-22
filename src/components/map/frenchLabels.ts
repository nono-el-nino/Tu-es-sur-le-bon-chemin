/** Étiquettes en français pour un style MapLibre (schéma OpenMapTiles). Module pur, testable. */
export const FRENCH_NAME = ["coalesce", ["get", "name:fr"], ["get", "name:latin"], ["get", "name"]];

export type StyleLayer = { type: string; layout?: Record<string, unknown> };

/** Remplace le nom affiché par le nom français ; les numéros de routes (ref) ne sont pas touchés. */
export function frenchLabels<T extends { layers: StyleLayer[] }>(style: T): T {
  for (const layer of style.layers) {
    const field = layer.layout?.["text-field"];
    if (layer.type === "symbol" && field && JSON.stringify(field).includes("name")) layer.layout!["text-field"] = FRENCH_NAME;
  }
  return style;
}
