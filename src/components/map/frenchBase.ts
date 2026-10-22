/**
 * Fond « Aujourd'hui » en français : tuiles vectorielles OpenFreeMap (données OpenStreetMap,
 * gratuites, sans clé), style « Positron ». Chaque étiquette affiche le nom français
 * (name:fr) quand OpenStreetMap le connaît, sinon sa transcription latine.
 * Chargé seulement à l'ouverture de la carte (MapLibre est volumineux).
 */
import L from "leaflet";
import "maplibre-gl/dist/maplibre-gl.css";
import "@maplibre/maplibre-gl-leaflet";
import { frenchLabels, type StyleLayer } from "./frenchLabels";

const STYLE_URL = "https://tiles.openfreemap.org/styles/positron";

export const OPENFREEMAP_ATTRIB =
  '<a href="https://openfreemap.org">OpenFreeMap</a> © <a href="https://www.openmaptiles.org/">OpenMapTiles</a>, données © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

export function webglAvailable() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

let stylePromise: Promise<{ layers: StyleLayer[]; sources?: Record<string, { attribution?: string }> }> | null = null;

export async function frenchBaseLayer(): Promise<L.Layer> {
  stylePromise ??= fetch(STYLE_URL).then((r) => {
    if (!r.ok) throw new Error("style");
    return r.json();
  });
  const style = frenchLabels(structuredClone(await stylePromise));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (L as any).maplibreGL({ style, attribution: OPENFREEMAP_ATTRIB, interactive: false });
}
