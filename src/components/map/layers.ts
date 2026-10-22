/** Couches historiques disponibles (fichiers de public/geo). Séparé d'AtlasMap pour ne charger Leaflet qu'avec la carte. */
export type MapMode = "today" | "ancient";
export type Era = "perse" | "herode" | "rome";

export const eras: { id: Era; label: string; detail: string; file: string }[] = [
  { id: "perse", label: "Empire perse", detail: "vers 500 av. J.-C.", file: "empire-perse.json" },
  { id: "herode", label: "Royaume d'Hérode", detail: "vers 4 av. J.-C.", file: "royaume-herode.json" },
  { id: "rome", label: "Empire romain", detail: "117 apr. J.-C.", file: "empire-romain-117.json" },
];
