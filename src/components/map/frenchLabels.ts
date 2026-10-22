/** Étiquettes en français pour un style MapLibre (schéma OpenMapTiles). Module pur, testable. */
export const FRENCH_NAME = ["coalesce", ["get", "name:fr"], ["get", "name:latin"], ["get", "name"]];

export type StyleLayer = { type: string; layout?: Record<string, unknown>; paint?: Record<string, unknown> };
type Style = { layers: StyleLayer[]; sources?: Record<string, { attribution?: string }> };

/**
 * Remplace le nom affiché par le nom français ; les numéros de routes (ref) ne sont pas touchés.
 * Les noms du fond sont éclaircis pour laisser les lieux bibliques au premier plan,
 * et la mention de source anglaise du style est retirée (l'app affiche la sienne, en français).
 */
export function frenchLabels<T extends Style>(style: T): T {
  for (const layer of style.layers) {
    const field = layer.layout?.["text-field"];
    if (layer.type === "symbol" && field && JSON.stringify(field).includes("name")) {
      layer.layout!["text-field"] = FRENCH_NAME;
      layer.paint = { ...layer.paint, "text-color": "#7a8794", "text-halo-color": "#ffffff", "text-halo-width": 1.2 };
    }
  }
  for (const src of Object.values(style.sources ?? {})) delete src.attribution;
  return style;
}
