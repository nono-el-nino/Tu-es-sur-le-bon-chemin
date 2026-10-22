import { MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { confidenceOf, formatOsis, placesForPassage, roleLabels } from "../content/places";

/** Lieux liés à une fiche, avec accès à la carte. */
export function PlacesBlock({ passageId }: { passageId: string }) {
  const items = placesForPassage(passageId);
  return (
    <section className="card card-pad stack" aria-labelledby={`lieux-${passageId}`}>
      <span className="eyebrow row" id={`lieux-${passageId}`} style={{ gap: 6 }}>
        <MapPin size={14} aria-hidden="true" /> Les lieux
      </span>
      {items.length === 0 ? (
        <p className="small muted">Le texte et son contexte immédiat ne précisent pas de lieu.</p>
      ) : (
        <>
          <div>
            {items.map(({ place, link }) => {
              const conf = confidenceOf(place);
              return (
                <div key={place.id + link.osis} className="place-row">
                  <i className={`atlas-pin level-${conf.level} kind-${place.kind}`} aria-hidden="true" />
                  <span style={{ flex: 1 }}>
                    <strong>{place.name}</strong>
                    <br />
                    <span className="small muted">
                      {roleLabels[link.role]} · {formatOsis(link.osis)}
                    </span>
                  </span>
                  <span className={`badge conf-${conf.level}`}>{conf.level === "zone" ? "Région" : conf.label.replace("Localisation ", "")}</span>
                </div>
              );
            })}
          </div>
          <Link to={`/explorer?mode=carte&passage=${passageId}`} className="btn btn-ghost btn-block">
            <MapPin size={16} aria-hidden="true" /> Voir sur la carte
          </Link>
        </>
      )}
    </section>
  );
}
