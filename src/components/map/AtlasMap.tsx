import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import { confidenceOf, type Place } from "../../content/places";

import { eras, type Era, type MapMode } from "./layers";

// Terre sainte au sens large : de la Galilée au Néguev.
const HOLY_LAND = L.latLngBounds([30.8, 34.2], [33.5, 36.0]);

const OSM_ATTRIB = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
const NE_ATTRIB = '<a href="https://www.naturalearthdata.com/">Natural Earth</a>';
const AWMC_ATTRIB = '<a href="https://awmc.unc.edu/">AWMC</a> (ODbL)';
const OPENBIBLE_ATTRIB = '<a href="https://www.openbible.info/geo/">OpenBible.info</a> (CC BY 4.0)';

// « Aujourd'hui » : tuiles OpenStreetMap (villes et frontières actuelles), adoucies en CSS.
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
  const base = useRef<L.TileLayer | null>(null);
  const natural = useRef<L.GeoJSON | null>(null);
  const eraLayer = useRef<L.GeoJSON | null>(null);
  const roadLayer = useRef<L.GeoJSON | null>(null);
  const contourLayer = useRef<L.GeoJSON | null>(null);
  const markerLayer = useRef<L.LayerGroup | null>(null);
  const altLayer = useRef<L.LayerGroup | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

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
              ? { stroke: true, color: "#C9BFA6", weight: 0.8, fillColor: "#F4EFE2", fillOpacity: 1 }
              : f?.properties?.t === "lac"
                ? { color: "#A9C6CB", weight: 0.8, fillColor: "#D7E6E8", fillOpacity: 1 }
                : { color: "#9DBFC4", weight: 1.2, opacity: 0.9 },
          attribution: NE_ATTRIB,
        }).addTo(m);
      })
      .catch(() => {});
    markerLayer.current = L.layerGroup().addTo(m);
    altLayer.current = L.layerGroup().addTo(m);
    m.on("click", () => onSelectRef.current(null));
    const syncZoom = () => el.current?.setAttribute("data-zoom", String(m.getZoom()));
    m.on("zoomend", syncZoom);
    syncZoom();
    map.current = m;
    return () => {
      m.remove();
      map.current = null;
    };
  }, []);

  // Fond de carte : tuiles actuelles seulement en mode « Aujourd'hui »
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    base.current?.remove();
    base.current = null;
    el.current?.setAttribute("data-mode", mode);
    if (mode === "today") {
      base.current = L.tileLayer(OSM_TILES, { attribution: OSM_ATTRIB, maxZoom: 19, className: "tiles-today" }).addTo(m);
    }
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
              ? { color: "#2B7369", weight: 3, opacity: 0.75 }
              : { color: "#2B7369", weight: 1.5, dashArray: "4 4", fillColor: "#59A99E", fillOpacity: 0.1 },
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
          style: { color: era === "herode" ? "#B0533A" : "#8A6A1F", weight: 1.5, fillColor: era === "herode" ? "#D87859" : "#EBCB79", fillOpacity: 0.22 },
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
        roadLayer.current = L.geoJSON(fc, { style: { color: "#233D56", weight: 1.2, opacity: 0.55, dashArray: "3 3" }, interactive: false, attribution: AWMC_ATTRIB }).addTo(m);
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
    for (const p of places) {
      const label = mode === "today" && p.identification.site && p.kind === "ville" && p.identification.site !== p.openbible.name ? `${p.name} <em>· ${p.identification.site}</em>` : p.name;
      const marker = L.marker([p.lat, p.lon], {
        icon: pinIcon(p, p.id === selectedId, label),
        keyboard: true,
        title: p.name,
        alt: p.name,
        riseOnHover: true,
        zIndexOffset: p.id === selectedId ? 1000 : 0,
      });
      marker.on("click", (e) => {
        L.DomEvent.stopPropagation(e);
        onSelectRef.current(p.id);
      });
      marker.on("keypress", () => onSelectRef.current(p.id));
      layer.addLayer(marker);
    }
  }, [places, selectedId, mode]);

  // Autres localisations proposées pour le lieu sélectionné
  useEffect(() => {
    const layer = altLayer.current;
    if (!layer) return;
    layer.clearLayers();
    const p = places.find((x) => x.id === selectedId);
    if (!p) return;
    for (const a of p.alternatives) {
      L.polyline([[p.lat, p.lon], [a.lat, a.lon]], { color: "#56677A", weight: 1, dashArray: "2 4", interactive: false }).addTo(layer);
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
