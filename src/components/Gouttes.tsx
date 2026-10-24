import type { CSSProperties } from "react";

/** Progression en gouttes (remplace les barres) : pleines = faites, contour = à venir. */
export function Gouttes({ faites, total, label }: { faites: number; total: number; label?: string }) {
  return (
    <span className="gouttes" role="img" aria-label={label ?? `${faites} sur ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={`goutte ${i < faites ? "" : "vide"}`} style={i < faites ? ({ "--goutte-couleur": "var(--averse)" } as CSSProperties) : undefined} />
      ))}
    </span>
  );
}
