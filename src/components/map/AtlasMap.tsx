import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import { confidenceOf, passagesForPlace, type Place } from "../../content/places";

import { eras, type Era, type MapMode } from "./layers";
import { token } from "../../lib/tokens";

// Terre sainte au sens large : de la Galilée au Néguev.
const HOLY_LAND = L.latLngBounds([30.8, 34.2], [33.5, 36.0]);

const OSM_ATTRIB = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
const NE_ATTRIB = '<a href="https://www.naturalearthdata.com/">Natural Earth</a>';
const AWMC_ATTRIB = '<a href="https://awmc.unc.edu/">AWMC</a> (ODbL)';
const OPENBIBLE_ATTRIB = '<a href="https://www.openbible.info/geo/">OpenBible.info</a> (CC BY 4.0)';

// « Aujourd'hui » : carte vectorielle OpenFreeMap aux noms français (voir frenchBase.ts) ;
// repli sur les tuiles OpenStreetMap (noms locaux) si WebGL manque.
// « À l'époque » : fond Natural Earth intégré à l'app (terres, lacs, fleuves), sans aucun nom moderne.
const OSM_TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

// Les couches sont des fichiers statiques de public/geo, chargés à la demande puis gardés en mémoire.
const cache = new Map<string, Promise<GeoJSON.FeatureCollection>>();
function loadGeo(file: string) {
  if (!cache.has(file)) {
    cache.set(
      file,
      fetch(`${import.meta.env.BASE_URL}geo/${file}`).then((r) => {
        if (!r.ok) throw new Error(file);
        return r.json();
      }),
    );
  }
  return cache.get(file)!;
}

const pinIcon = (p: Place, selected: boolean, label: string) =>
  L.divIcon({
    className: "atlas-marker",
    html: `<span class="atlas-pin level-${confidenceOf(p).level} kind-${p.kind}${selected ? " selected" : ""}"></span><span class="atlas-label">${label}</span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });

const altIcon = (label: string) =>
  L.divIcon({
    className: "atlas-marker",
    html: `<span class="atlas-pin alt"></span><span class="atlas-label alt">${label}</span>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });

/** Rang d'affichage des étiquettes : localités sûres d'abord, régions ensuite ; à égalité, le lieu le plus cité. */
const rank = (p: Place) => {
  const lvl = confidenceOf(p).level;
  const kind = p.kind === "ville" ? 0 : p.kind === "region" ? 2 : 1;
  return (kind * 10 + (lvl === "sure" ? 0 : lvl === "probable" ? 1 : 2)) * 1000 - passagesForPlace(p.id).length;
};

/**
 * Évite les étiquettes qui se chevauchent : on les place dans l'ordre de priorité
 * (lieu sélectionné, puis localités les plus sûres) et on masque celles qui gênent.
 * Elles réapparaissent en zoomant.
 */
function declutter(m: L.Map, items: { place: Place; marker: L.Marker }[], selectedId?: string | null) {
  const placed: { x0: number; y0: number; x1: number; y1: number }[] = [];
  const sorted = items
    .map((it) => ({ ...it, pt: m.latLngToContainerPoint([it.place.lat, it.place.lon]) }))
    .sort((a, b) => (a.place.id === selectedId ? -1 : b.place.id === selectedId ? 1 : rank(a.place) - rank(b.place)));
  const before: L.Point[] = []; // repères des lieux plus prioritaires
  for (const { place, marker, pt } of sorted) {
    const label = marker.getElement()?.querySelector<HTMLElement>(".atlas-label");
    if (!label) continue;
    const w = label.offsetWidth || place.name.length * 7;
    const box = { x0: pt.x + 10, y0: pt.y - 10, x1: pt.x + 14 + w, y1: pt.y + 8 };
    const hitsLabel = placed.some((b) => box.x0 < b.x1 && box.x1 > b.x0 && box.y0 < b.y1 && box.y1 > b.y0);
    const hitsPin = before.some((q) => q.x > box.x0 - 6 && q.x < box.x1 && q.y > box.y0 - 2 && q.y < box.y1 + 2);
    const show = place.id === selectedId || (!hitsLabel && !hitsPin);
    label.style.visibility = show ? "visible" : "hidden";
    if (show) placed.push(box);
    before.push(pt);
  }
}

type Props = {
  places: Place[];
  mode: MapMode;
  era: Era | null;
  roads: boolean;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  /** Change quand il faut recadrer la carte (nouveau filtre, fiche ciblée). */
  fitKey: string;
};

export default function AtlasMap({ places, mode, era, roads, selectedId, onSelect, fitKey }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const base = useRef<L.Layer | null>(null);
  const natural = useRef<L.GeoJSON | null>(null);
  const eraLayer = useRef<L.GeoJSON | null>(null);
  const roadLayer = useRef<L.GeoJSON | null>(null);
  const contourLayer = useRef<L.GeoJSON | null>(null);
  const markerLayer = useRef<L.LayerGroup | null>(null);
  const altLayer = useRef<L.LayerGroup | null>(null);
  const markers = useRef<{ place: Place; marker: L.Marker }[]>([]);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const selectedRef = useRef(selectedId);
  selectedRef.current = selectedId;

  // Création de la carte
  useEffect(() => {
    if (!el.current) return;
    const m = L.map(el.current, { zoomControl: false, minZoom: 3, maxZoom: 12, worldCopyJump: true, tapTolerance: 20 });
    m.setView([31.8, 35.2], 7);
    L.control.zoom({ position: "bottomright", zoomInTitle: "Zoomer", zoomOutTitle: "Dézoomer" }).addTo(m);
    m.attributionControl.setPrefix(false);
    m.attributionControl.addAttribution(OPENBIBLE_ATTRIB);
    // Le fond naturel est sous les tuiles : il reste visible hors ligne ou si les tuiles ne chargent pas.
    m.createPane("naturel").style.zIndex = "150";
    loadGeo("fond-naturel.json")
      .then((fc) => {
        if (map.current !== m) return;
        natural.current = L.geoJSON(fc, {
          pane: "naturel",
          interactive: false,
          style: (f) =>
            f?.properties?.t === "terre"
              ? { stroke: true, color: token("--carte-trait-terre"), weight: 0.8, fillColor: token("--carte-terre"), fillOpacity: 1 }
              : f?.properties?.t === "lac"
                ? { color: token("--carte-trait-terre"), weight: 0.8, fillColor: token("--carte-lac"), fillOpacity: 1 }
                : { color: token("--carte-fleuve"), weight: 1.2, opacity: 0.9 },
          attribution: NE_ATTRIB,
        }).addTo(m);
      })
      .catch(() => {});
    markerLayer.current = L.layerGroup().addTo(m);
    altLayer.current = L.layerGroup().addTo(m);
    m.on("click", () => onSelectRef.current(null));
    const syncZoom = () => el.current?.setAttribute("data-zoom", String(m.getZoom()));
    m.on("zoomend", syncZoom);
    m.on("zoomend moveend", () => declutter(m, markers.current, selectedRef.current));
    syncZoom();
    map.current = m;
    return () => {
      m.remove();
      map.current = null;
    };
  }, []);

  // Fond « Aujourd'hui » : carte vectorielle aux noms français (OpenFreeMap).
  // Repli sur les tuiles OpenStreetMap si WebGL ou OpenFreeMap sont indisponibles.
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    base.current?.remove();
    base.current = null;
    el.current?.setAttribute("data-mode", mode);
    if (mode !== "today") return;
    let cancelled = false;
    const fallback = () => {
      if (cancelled || map.current !== m) return;
      base.current = L.tileLayer(OSM_TILES, { attribution: OSM_ATTRIB, maxZoom: 19, className: "tiles-today" }).addTo(m);
    };
    import("./frenchBase")
      .then(async ({ frenchBaseLayer, webglAvailable }) => {
        if (!webglAvailable()) return fallback();
        const layer = await frenchBaseLayer();
        if (cancelled || map.current !== m) return;
        base.current = layer.addTo(m);
      })
      .catch(fallback);
    return () => {
      cancelled = true;
    };
  }, [mode]);

  // Contours des régions et tracés des fleuves (OpenBible)
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    let cancelled = false;
    const visible = new Set(places.map((p) => p.id));
    loadGeo("lieux-contours.json")
      .then((fc) => {
        if (cancelled) return;
        contourLayer.current?.remove();
        contourLayer.current = L.geoJSON(fc, {
          filter: (f) => visible.has(f.properties?.id),
          style: (f) =>
            f?.geometry.type.includes("Line")
              ? { color: token("--averse"), weight: 3, opacity: 0.8 }
              : { color: token("--carte-region"), weight: 1.5, dashArray: "4 4", fillColor: token("--rosee"), fillOpacity: 0.3 },
          interactive: false,
        }).addTo(m);
        contourLayer.current.bringToBack();
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [places]);

  // Couche historique
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    eraLayer.current?.remove();
    eraLayer.current = null;
    if (mode !== "ancient" || !era) return;
    let cancelled = false;
    const def = eras.find((e) => e.id === era)!;
    loadGeo(def.file)
      .then((fc) => {
        if (cancelled) return;
        eraLayer.current = L.geoJSON(fc, {
          style: { color: token("--carte-epoque-trait"), weight: 1.5, fillColor: token("--carte-epoque"), fillOpacity: 0.45 },
          interactive: false,
          attribution: AWMC_ATTRIB,
        }).addTo(m);
        eraLayer.current.bringToBack();
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      eraLayer.current?.remove();
    };
  }, [mode, era]);

  // Voies romaines
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    roadLayer.current?.remove();
    roadLayer.current = null;
    if (mode !== "ancient" || !roads) return;
    let cancelled = false;
    loadGeo("voies-romaines.json")
      .then((fc) => {
        if (cancelled) return;
        roadLayer.current = L.geoJSON(fc, { style: { color: token("--carte-voie"), weight: 1.2, opacity: 0.6, dashArray: "3 3" }, interactive: false, attribution: AWMC_ATTRIB }).addTo(m);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      roadLayer.current?.remove();
    };
  }, [mode, roads]);

  // Repères des lieux
  useEffect(() => {
    const layer = markerLayer.current;
    if (!layer) return;
    layer.clearLayers();
    markers.current = [];
    for (const p of places) {
      const label = p.name;
      const marker = L.marker([p.lat, p.lon], {
        icon: pinIcon(p, p.id === selectedId, label),
        keyboard: true,
        title: p.name,
        alt: p.name,
        riseOnHover: true,
        // les lieux prioritaires passent au premier plan (leur étiquette n'est pas recouverte)
        zIndexOffset: p.id === selectedId ? 1_000_000 : 500_000 - rank(p) * 20,
      });
      marker.on("click", (e) => {
        L.DomEvent.stopPropagation(e);
        onSelectRef.current(p.id);
      });
      marker.on("keypress", () => onSelectRef.current(p.id));
      layer.addLayer(marker);
      markers.current.push({ place: p, marker });
    }
    if (map.current) declutter(map.current, markers.current, selectedId);
  }, [places, selectedId, mode]);

  // Autres localisations proposées pour le lieu sélectionné
  useEffect(() => {
    const layer = altLayer.current;
    if (!layer) return;
    layer.clearLayers();
    const p = places.find((x) => x.id === selectedId);
    if (!p) return;
    for (const a of p.alternatives) {
      L.polyline([[p.lat, p.lon], [a.lat, a.lon]], { color: token("--carte-hypothese"), weight: 1, dashArray: "2 4", interactive: false }).addTo(layer);
      L.marker([a.lat, a.lon], { icon: altIcon(a.site ?? "?"), interactive: false }).addTo(layer);
    }
  }, [places, selectedId]);

  // Recadrage : si la plupart des lieux sont en Terre sainte, on la montre d'abord
  // (les lieux lointains restent accessibles en dézoomant).
  useEffect(() => {
    const m = map.current;
    if (!m || places.length === 0) return;
    const all = L.latLngBounds(places.map((p) => [p.lat, p.lon] as [number, number]));
    const core = places.filter((p) => HOLY_LAND.contains([p.lat, p.lon]));
    const target = core.length >= 3 && core.length / places.length >= 0.5 ? L.latLngBounds(core.map((p) => [p.lat, p.lon] as [number, number])) : all;
    if (places.length === 1) m.setView(all.getCenter(), 8);
    else m.fitBounds(target, { padding: [28, 28], maxZoom: 9 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey]);

  // Lieu choisi : on le montre avec ses autres localisations proposées
  useEffect(() => {
    const m = map.current;
    const p = places.find((x) => x.id === selectedId);
    if (!m || !p) return;
    if (p.alternatives.length > 0) {
      const b = L.latLngBounds([[p.lat, p.lon], ...p.alternatives.map((a) => [a.lat, a.lon] as [number, number])]);
      m.flyToBounds(b, { padding: [60, 60], maxZoom: 11, duration: 0.6 });
    } else if (!m.getBounds().pad(-0.15).contains([p.lat, p.lon])) {
      m.flyTo([p.lat, p.lon], Math.max(m.getZoom(), 7), { duration: 0.6 });
    }
  }, [selectedId, places]);

  return <div ref={el} className="atlas-map" role="application" aria-label="Carte des lieux bibliques" />;
}
