import { Bookmark, BookmarkCheck } from "lucide-react";
import { useRef } from "react";
import { Link } from "react-router-dom";
import { formatReference, type Passage } from "../content";
import { useUserData } from "../lib/useUserData";
import { isFavorite, toggleFavorite } from "../lib/store";
import { topicsForPassage } from "../lib/tones";
import { couleurGoutte } from "../lib/meteo";
import { Brume } from "./arbre/Brume";
import { lancerGoutte } from "./arbre/vol";
import { StatusBadge } from "./StatusBadge";

/** Carte nuage d'un passage : référence et étiquette, titre, actions. */
export function DiscoveryCard({
  passage,
  compact,
  animate,
  etiquette,
  humeur,
}: {
  passage: Passage;
  compact?: boolean;
  /** Le titre apparaît en brume (nouveau passage). */
  animate?: boolean;
  etiquette?: string;
  /** Humeur active : teinte la goutte gardée au carnet. */
  humeur?: string;
}) {
  const label = etiquette ?? topicsForPassage(passage.id)[0]?.label;
  return (
    <article className={`card card-pad discovery ${compact ? "compact" : ""}`}>
      <Link to={`/passage/${passage.id}`} className="card-link" aria-label={`${passage.title} — ${formatReference(passage)}`}>
        <div className="disc-head">
          <span className="ref-plain">{formatReference(passage)}</span>
          {label && <span className="etiquette">{label}</span>}
        </div>
        {animate ? <Brume as="h3" className="disc-title" texte={passage.title} cle={passage.id} /> : <h3 className="disc-title">{passage.title}</h3>}
        {!compact && <p className="muted">{passage.summary}</p>}
        <StatusBadge status={passage.editorial.status} />
      </Link>
      <div className="disc-actions">
        <GarderButton passageId={passage.id} humeur={humeur} />
        <Link to={`/passage/${passage.id}`} className="btn btn-quiet">
          Lire
        </Link>
      </div>
    </article>
  );
}

/**
 * « Garder » : le bouton se comprime, une goutte se détache et tombe vers l'onglet Carnet.
 * `variant="icone"` pour les en-têtes.
 */
export function GarderButton({ passageId, humeur, variant = "plein", onToggle }: { passageId: string; humeur?: string; variant?: "plein" | "icone"; onToggle?: (saved: boolean) => void }) {
  const { data, update } = useUserData();
  const ref = useRef<HTMLButtonElement>(null);
  const saved = isFavorite(data, passageId);
  const toggle = () => {
    update((d) => toggleFavorite(d, passageId, humeur));
    if (!saved) lancerGoutte(ref.current, couleurGoutte(humeur));
    onToggle?.(!saved);
  };
  const Icon = saved ? BookmarkCheck : Bookmark;
  if (variant === "icone")
    return (
      <button ref={ref} type="button" className="icon-btn" aria-pressed={saved} aria-label={saved ? "Retirer de mon carnet" : "Garder dans mon carnet"} onClick={toggle}>
        <Icon size={20} aria-hidden="true" />
      </button>
    );
  return (
    <button ref={ref} type="button" className={`btn ${saved ? "btn-primary" : "btn-doux"}`} aria-pressed={saved} onClick={toggle}>
      <Icon size={18} aria-hidden="true" /> {saved ? "Gardé" : "Garder"}
    </button>
  );
}

/** Compatibilité : ancien nom du bouton icône. */
export const FavoriteButton = ({ passageId, onToggle }: { passageId: string; className?: string; onToggle?: (saved: boolean) => void }) => (
  <GarderButton passageId={passageId} variant="icone" onToggle={onToggle} />
);
