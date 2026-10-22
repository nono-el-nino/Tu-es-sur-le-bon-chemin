import { ExternalLink, Info, X } from "lucide-react";
import { lazy, Suspense, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { content, formatReference } from "../../content";
import {
  bookGroup,
  confidenceOf,
  formatOsis,
  groupLabels,
  passagesForPlace,
  placesById,
  placesForPassage,
  publishedPlaces,
  roleLabels,
  type BookGroup,
  type Place,
} from "../../content/places";
import { eras, type Era, type MapMode } from "./layers";

const AtlasMap = lazy(() => import("./AtlasMap"));

type Filter = "tout" | BookGroup;

/** Carte interactive des lieux liés aux fiches. `passageId` cible les lieux d'une fiche. */
export function MapPanel({ passageId, onClearPassage }: { passageId?: string; onClearPassage?: () => void }) {
  const [mode, setMode] = useState<MapMode>("today");
  const [era, setEra] = useState<Era | null>("herode");
  const [roads, setRoads] = useState(false);
  const [filter, setFilter] = useState<Filter>("tout");
  const [showUncertain, setShowUncertain] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const focus = passageId ? content.passagesById.get(passageId) : undefined;

  const visible = useMemo(() => {
    if (focus) return placesForPassage(focus.id).map((x) => x.place);
    return publishedPlaces().filter((p) => {
      const occ = passagesForPlace(p.id);
      if (filter !== "tout" && !occ.some((o) => bookGroup(o.passage.reference.bookCode) === filter)) return false;
      const level = confidenceOf(p).level;
      if (!showUncertain && (level === "debattue" || level === "incertaine")) return false;
      return true;
    });
  }, [focus, filter, showUncertain]);

  const selected = selectedId ? placesById.get(selectedId) : undefined;
  const fitKey = `${focus?.id ?? ""}|${filter}|${showUncertain}`;

  return (
    <section className="stack" aria-label="Carte des lieux">
      <div className="segmented" role="tablist" aria-label="Fond de carte">
        <button role="tab" aria-selected={mode === "today"} onClick={() => setMode("today")}>
          Aujourd'hui
        </button>
        <button role="tab" aria-selected={mode === "ancient"} onClick={() => setMode("ancient")}>
          À l'époque
        </button>
      </div>

      {focus && (
        <div className="focus-banner">
          <span className="small">
            Lieux de <strong>{formatReference(focus)}</strong> · {focus.title}
          </span>
          {onClearPassage && (
            <button type="button" className="btn btn-quiet" onClick={onClearPassage}>
              Tous les lieux
            </button>
          )}
        </div>
      )}

      <div className="map-frame">
        <Suspense fallback={<div className="atlas-map map-loading">Chargement de la carte…</div>}>
          <AtlasMap places={visible} mode={mode} era={era} roads={roads} selectedId={selectedId} onSelect={setSelectedId} fitKey={fitKey} />
        </Suspense>
      </div>

      {!focus && (
        <div className="chip-row" role="group" aria-label="Filtrer par partie de la Bible">
          {(["tout", "at", "evangiles", "lettres"] as const).map((f) => (
            <button key={f} type="button" className="filter-chip" aria-pressed={filter === f} onClick={() => setFilter(f)}>
              {f === "tout" ? "Tout" : groupLabels[f]}
            </button>
          ))}
          <button type="button" className="filter-chip" aria-pressed={showUncertain} onClick={() => setShowUncertain(!showUncertain)}>
            Localisations débattues
          </button>
        </div>
      )}

      {mode === "ancient" && (
        <div className="chip-row" role="group" aria-label="Période historique">
          {eras.map((e) => (
            <button key={e.id} type="button" className="filter-chip" aria-pressed={era === e.id} onClick={() => setEra(era === e.id ? null : e.id)}>
              {e.label} <span className="muted">· {e.detail}</span>
            </button>
          ))}
          <button type="button" className="filter-chip" aria-pressed={roads} onClick={() => setRoads(!roads)}>
            Voies romaines
          </button>
        </div>
      )}

      <Legend mode={mode} era={era} />

      {selected ? (
        <PlaceSheet place={selected} focusPassageId={focus?.id} onClose={() => setSelectedId(null)} />
      ) : (
        <PlaceList places={visible} onSelect={setSelectedId} />
      )}

      <p className="layer-note">
        Localisations : <a href="https://www.openbible.info/geo/">OpenBible.info</a> (CC BY 4.0), synthèse de plus de 70 atlas, dictionnaires et
        commentaires. Périodes et voies romaines : <a href="https://awmc.unc.edu/">Ancient World Mapping Center</a> (ODbL), d'après le Barrington Atlas.
        Fonds : OpenFreeMap, données © contributeurs OpenStreetMap (aujourd'hui, noms en français) ; Natural Earth (à l'époque). Les frontières actuelles sont indicatives.
      </p>
    </section>
  );
}

function Legend({ mode, era }: { mode: MapMode; era: Era | null }) {
  return (
    <div className="map-legend small" aria-label="Légende">
      <span>
        <i className="atlas-pin level-sure" /> Sûre
      </span>
      <span>
        <i className="atlas-pin level-probable" /> Probable
      </span>
      <span>
        <i className="atlas-pin level-debattue" /> Débattue
      </span>
      <span>
        <i className="legend-zone" /> Région (zone retenue par la majorité des sources)
      </span>
      {mode === "ancient" && era && (
        <span>
          <i className={`legend-era era-${era}`} /> {eras.find((e) => e.id === era)!.label}
        </span>
      )}
    </div>
  );
}

function PlaceList({ places, onSelect }: { places: Place[]; onSelect: (id: string) => void }) {
  if (places.length === 0)
    return (
      <div className="empty">
        <p className="muted">Aucun lieu ne correspond à ces filtres.</p>
      </div>
    );
  return (
    <div className="stack" style={{ gap: 8 }}>
      <span className="eyebrow">
        {places.length} lieu{places.length > 1 ? "x" : ""} · touche un repère ou un nom
      </span>
      <div className="chip-row">
        {[...places]
          .sort((a, b) => a.name.localeCompare(b.name, "fr"))
          .map((p) => (
            <button key={p.id} type="button" className="filter-chip" onClick={() => onSelect(p.id)}>
              <i className={`atlas-pin level-${confidenceOf(p).level} kind-${p.kind}`} /> {p.name}
            </button>
          ))}
      </div>
    </div>
  );
}

const kindLabels: Record<Place["kind"], string> = { ville: "Localité", region: "Région", fleuve: "Fleuve", montagne: "Montagne", mer: "Mer" };

function PlaceSheet({ place: p, focusPassageId, onClose }: { place: Place; focusPassageId?: string; onClose: () => void }) {
  const conf = confidenceOf(p);
  const occurrences = passagesForPlace(p.id);
  const showScore = p.kind === "ville" || p.kind === "montagne";
  return (
    <article className="card card-pad stack place-sheet discovery-pop" aria-live="polite">
      <div className="spread" style={{ alignItems: "flex-start" }}>
        <div className="stack" style={{ gap: 4 }}>
          <span className="eyebrow">{kindLabels[p.kind]}</span>
          <h2>{p.name}</h2>
        </div>
        <button type="button" className="icon-btn" aria-label="Fermer" onClick={onClose}>
          <X size={18} aria-hidden="true" />
        </button>
      </div>

      <dl className="place-facts">
        {showScore && (
          <>
            <dt>Site identifié aujourd'hui</dt>
            <dd>
              {p.identification.site ?? "—"}
              {p.identification.via && <span className="muted"> (via {p.identification.via === "Mount Sinai" ? "le mont Sinaï, dont Horeb est un autre nom" : p.identification.via})</span>}
            </dd>
          </>
        )}
        <dt>Fiabilité</dt>
        <dd>
          <span className={`badge conf-${conf.level}`}>{conf.label}</span>
          {showScore && conf.score !== null && (
            <span className="score-bar" aria-label={`Confiance ${conf.score} sur 1000`}>
              <span style={{ width: `${Math.max(0, conf.score) / 10}%` }} />
            </span>
          )}
          {showScore && conf.score !== null && <span className="small muted"> {conf.score}/1000 selon OpenBible</span>}
        </dd>
        {p.alternatives.length > 0 && (
          <>
            <dt>Autres localisations proposées</dt>
            <dd>{p.alternatives.map((a) => `${a.site ?? "?"} (${a.score}/1000)`).join(" · ")}</dd>
          </>
        )}
      </dl>

      {occurrences.length > 0 && (
        <div className="stack" style={{ gap: 6 }}>
          <span className="eyebrow">Dans les fiches</span>
          {occurrences.map(({ passage, link }) => (
            <Link key={passage.id + link.osis} to={`/passage/${passage.id}`} className={`place-occurrence ${passage.id === focusPassageId ? "current" : ""}`}>
              <span>
                <strong>{formatReference(passage)}</strong> · {passage.title}
              </span>
              <span className="small muted">
                {roleLabels[link.role]} ({formatOsis(link.osis)})
              </span>
              {link.note && <span className="small muted">{link.note}</span>}
            </Link>
          ))}
        </div>
      )}

      <div className="chip-row">
        <a className="chip" href={p.openbible.url} target="_blank" rel="noopener noreferrer">
          OpenBible <ExternalLink size={12} aria-hidden="true" />
        </a>
        {p.links.pleiades && (
          <a className="chip" href={p.links.pleiades} target="_blank" rel="noopener noreferrer">
            Pleiades <ExternalLink size={12} aria-hidden="true" />
          </a>
        )}
        {p.links.dare && (
          <a className="chip" href={p.links.dare} target="_blank" rel="noopener noreferrer">
            DARE <ExternalLink size={12} aria-hidden="true" />
          </a>
        )}
        {p.links.wikidata && (
          <a className="chip" href={p.links.wikidata} target="_blank" rel="noopener noreferrer">
            Wikidata <ExternalLink size={12} aria-hidden="true" />
          </a>
        )}
      </div>
      {(conf.level === "debattue" || conf.level === "incertaine") && (
        <p className="layer-note row" style={{ alignItems: "flex-start" }}>
          <Info size={14} aria-hidden="true" style={{ flex: "none", marginTop: 2 }} />
          Les spécialistes ne s'accordent pas sur ce lieu : le repère indique l'hypothèse la mieux notée, les autres sont affichées en gris.
        </p>
      )}
    </article>
  );
}
