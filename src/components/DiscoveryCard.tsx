import { Bookmark, BookmarkCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { formatReference, type Passage } from "../content";
import { useUserData } from "../lib/useUserData";
import { isFavorite, toggleFavorite } from "../lib/store";
import { toneForPassage } from "../lib/tones";
import { Landscape } from "./Illustrations";
import { StatusBadge } from "./StatusBadge";

/** Carte « de collection » pour une découverte biblique. */
export function DiscoveryCard({ passage, compact, animate }: { passage: Passage; compact?: boolean; animate?: boolean }) {
  const tone = toneForPassage(passage.id);
  return (
    <article className={`card discovery tone-${tone} ${compact ? "compact" : ""} ${animate ? "discovery-pop" : ""}`}>
      <Link to={`/passage/${passage.id}`} className="card-link" aria-label={`${passage.title} — ${formatReference(passage)}`}>
        <span className="art">
          <Landscape seed={passage.id} tone={tone} />
        </span>
        <div className="body">
          <span className="ref">{formatReference(passage)}</span>
          <h3>{passage.title}</h3>
          {!compact && <p className="muted small">{passage.summary}</p>}
          <StatusBadge status={passage.editorial.status} />
        </div>
      </Link>
      <FavoriteButton passageId={passage.id} className="save" />
    </article>
  );
}

export function FavoriteButton({ passageId, className = "", onToggle }: { passageId: string; className?: string; onToggle?: (saved: boolean) => void }) {
  const { data, update } = useUserData();
  const saved = isFavorite(data, passageId);
  return (
    <button
      type="button"
      className={`icon-btn ${className}`}
      aria-pressed={saved}
      aria-label={saved ? "Retirer de mon carnet" : "Garder dans mon carnet"}
      onClick={() => {
        update((d) => toggleFavorite(d, passageId));
        onToggle?.(!saved);
      }}
    >
      {saved ? <BookmarkCheck size={20} aria-hidden="true" /> : <Bookmark size={20} aria-hidden="true" />}
    </button>
  );
}
