import { useId, type CSSProperties } from "react";
import { Pluie } from "./Pluie";

/**
 * L'arbre : l'utilisateur. Seul élément sombre de l'écran.
 * - Le tronc s'allonge (90 → 260 sur une scène de 460 × 520) avec la progression.
 * - Trois branches (≈ −42°, +38°, −4°) s'allongent et apparaissent progressivement.
 * - Au bout de chacune, un amas de 7 bulles de nuage (la Parole) grandit.
 * Il remplace les barres de progression. Toutes les variations sont animées
 * (croissance), la couronne oscille et chaque bulle respire.
 */

const W = 460;
const SOL = 474;
const CX = W / 2;
const TRONC_MAX = 260;
const TRONC_MIN = 90;
const EPAISSEUR_TRONC = Math.round(W * 0.07); // 7 % de la largeur
const EPAISSEUR_BRANCHE = Math.round(W * 0.025); // 2,5 %

// Branches : angle, longueur maximale, point d'attache (part de la hauteur du tronc)
const BRANCHES = [
  { angle: -4, longueur: 112, attache: 1 },
  { angle: -42, longueur: 150, attache: 0.84 },
  { angle: 38, longueur: 140, attache: 0.74 },
];

// Amas de 7 bulles autour de l'extrémité : x, y, rayon (en unités de bulle)
const BULLES: [number, number, number][] = [
  [0, 0, 1],
  [-0.92, 0.28, 0.74],
  [0.92, 0.24, 0.78],
  [-0.46, -0.62, 0.8],
  [0.5, -0.56, 0.84],
  [-1.52, 0.5, 0.54],
  [1.5, 0.52, 0.56],
];
const UNITE = 40;

const clamp = (x: number) => Math.max(0, Math.min(1, x));

/** Croissance de chaque branche à partir d'une progression globale. */
export function croissanceBranches(p: number): number[] {
  return [clamp(p / 0.4), clamp((p - 0.18) / 0.42), clamp((p - 0.42) / 0.58)];
}

type Props = {
  /** Progression globale, de 0 (une pousse) à 1. */
  progression: number;
  /** Croissance de chaque branche (0..1), si on veut la piloter finement (une par parcours). */
  branches?: number[];
  /** Nombre de gouttes qui tombent en continu (météo). */
  pluie?: number;
  /** Token de teinte du dessous des nuages (ex. « --meteo-joie »). */
  teinte?: string;
  /** Change de valeur pour déclencher une averse brève. */
  averse?: number;
  /** Une goutte tombe sur l'arbre (leçon terminée) : change de valeur pour la déclencher. */
  goutteSurArbre?: number;
  onToucher?: () => void;
  label?: string;
  className?: string;
};

export function Arbre({ progression, branches, pluie = 0, teinte = "--nuage-ombre", averse, goutteSurArbre, onToucher, label, className = "" }: Props) {
  const id = useId().replace(/:/g, "");
  const p = clamp(progression);
  const g = branches ?? croissanceBranches(p);
  const hauteur = TRONC_MIN + (TRONC_MAX - TRONC_MIN) * p;

  const descr = label ?? `Ton arbre, à ${Math.round(p * 100)} % de sa croissance`;

  return (
    <div className={`scene ${className}`}>
      <svg className="arbre" viewBox={`0 0 ${W} 520`} role="img" aria-label={descr}>
        <defs>
          <linearGradient id={`ecorce-${id}`} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" style={{ stopColor: "var(--ecorce-lumiere)" }} />
            <stop offset="0.5" style={{ stopColor: "var(--ecorce)" }} />
            <stop offset="1" style={{ stopColor: "var(--ecorce-nuit)" }} />
          </linearGradient>
          <radialGradient id={`bulle-${id}`} cx="0.36" cy="0.3" r="0.78">
            <stop offset="0" style={{ stopColor: "var(--nuage)" }} />
            <stop offset="0.48" style={{ stopColor: "var(--nuage)" }} />
            <stop offset="1" style={{ stopColor: `var(${teinte})`, transition: "stop-color var(--d-croissance) var(--ease-croissance)" }} />
          </radialGradient>
          <filter id={`ombre-${id}`} x="-40%" y="-40%" width="180%" height="190%">
            <feDropShadow dx="0" dy="9" stdDeviation="9" style={{ floodColor: "var(--ombre-bulle)" }} />
          </filter>
          <filter id={`flou-${id}`} x="-20%" y="-200%" width="140%" height="500%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
        </defs>

        {/* Ombre au sol */}
        <ellipse cx={CX} cy={SOL + 2} rx={58 + 44 * p} ry={9} style={{ fill: "var(--ombre-sol)" }} filter={`url(#flou-${id})`} />

        <g className="couronne">
          {/* Tronc effilé, évasé au pied, qui s'allonge */}
          <path
            className="croit"
            d={`M${CX - EPAISSEUR_TRONC / 2 - 3} ${SOL} Q${CX - EPAISSEUR_TRONC / 2 + 3} ${SOL - TRONC_MAX * 0.45} ${CX - EPAISSEUR_TRONC * 0.3} ${SOL - TRONC_MAX} L${CX + EPAISSEUR_TRONC * 0.3} ${SOL - TRONC_MAX} Q${CX + EPAISSEUR_TRONC / 2 - 3} ${SOL - TRONC_MAX * 0.45} ${CX + EPAISSEUR_TRONC / 2 + 3} ${SOL} Z`}
            fill={`url(#ecorce-${id})`}
            style={{ transformBox: "fill-box", transformOrigin: "50% 100%", transform: `scaleY(${hauteur / TRONC_MAX})` }}
          />

          {BRANCHES.map((b, k) => {
            const gk = clamp(g[k] ?? 0);
            // une pousse a déjà deux départs de branche ; la troisième vient avec la progression.
            // Une branche visible a au moins la moitié de sa longueur : elle reste visible
            // jusqu'à l'entrée dans son nuage, qui grandit ensuite avec elle.
            const visible = k < 2 || gk > 0;
            const longueur = visible ? b.longueur * (0.5 + 0.5 * gk) : 0;
            const echelle = visible ? 0.3 + 0.7 * gk : 0;
            const attacheY = SOL - hauteur * b.attache + (k === 0 ? 4 : 0);
            return (
              <g key={k} className="croit" style={{ transform: `translate(${CX}px, ${attacheY}px)`, opacity: visible ? 1 : 0 }}>
                <g transform={`rotate(${b.angle})`}>
                  <rect
                    className="croit"
                    x={-EPAISSEUR_BRANCHE / 2}
                    y={-b.longueur}
                    width={EPAISSEUR_BRANCHE}
                    height={b.longueur}
                    rx={EPAISSEUR_BRANCHE / 2}
                    fill={`url(#ecorce-${id})`}
                    style={{ transformBox: "fill-box", transformOrigin: "50% 100%", transform: `scaleY(${Math.max(0.001, longueur / b.longueur)})` }}
                  />
                  {/* L'amas reste droit malgré l'inclinaison de la branche */}
                  <g className="croit" style={{ transform: `translate(0px, ${-longueur}px)` }}>
                    <g transform={`rotate(${-b.angle})`}>
                      <g className="croit" style={{ transform: `scale(${echelle})` }} filter={`url(#ombre-${id})`}>
                        {BULLES.map(([x, y, r], i) => (
                          <circle
                            key={i}
                            className="bulle"
                            cx={x * UNITE}
                            cy={y * UNITE - 10}
                            r={r * UNITE}
                            fill={`url(#bulle-${id})`}
                            style={
                              {
                                "--phase": `${-((k * 7 + i) * 1.13) % 8}s`,
                                "--duree": `${7 + ((k + i * 3) % 3)}s`,
                                "--dx": `${i % 2 ? 1 : -1}px`,
                              } as CSSProperties
                            }
                          />
                        ))}
                      </g>
                    </g>
                  </g>
                </g>
              </g>
            );
          })}
        </g>
      </svg>

      <Pluie gouttes={pluie} averse={averse} goutteSurArbre={goutteSurArbre} />
      {onToucher && <button type="button" className="toucher" aria-label="Faire pleuvoir sur l'arbre" onClick={onToucher} />}
    </div>
  );
}
