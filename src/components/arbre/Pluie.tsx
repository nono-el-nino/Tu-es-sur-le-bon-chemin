import { useEffect, useState, type CSSProperties } from "react";
import { tokenMs } from "../../lib/tokens";

/**
 * La pluie (loi de gravité) : chaque goutte tombe du nuage, accélère, se pose avec une onde.
 * - `gouttes` : pluie continue (météo), 24 gouttes au maximum à l'écran.
 * - `averse` : change de valeur → averse brève de 8 gouttes.
 * - `goutteSurArbre` : change de valeur → une goutte tombe sur la couronne.
 * En mouvement réduit, la pluie est masquée (voir global.css).
 */

const COULEURS = ["--averse", "--source", "--bruine", "--averse", "--source"];
const MAX = 24;

/** Zone de pluie, en % de la scène : sous les nuages jusqu'au sol ; sommet = haut de la couronne. */
export type ZonePluie = { haut: number; hauteur: number; gauche: number; largeur: number; sommet: { x: number; y: number } };
const ZONE_DEFAUT: ZonePluie = { haut: 34, hauteur: 52, gauche: 24, largeur: 52, sommet: { x: 50, y: 30 } };

type Chute = { id: string; x: number; top: number; hauteur: number; taille: number; couleur: string; delai: string; repete: string };

// Positions pseudo-aléatoires mais stables (pas de saut à chaque rendu)
const hasard = (n: number) => {
  const s = Math.sin(n * 12.9898) * 43758.5453;
  return s - Math.floor(s);
};

function continue_(n: number, z: ZonePluie): Chute[] {
  return Array.from({ length: Math.min(MAX, n) }, (_, i) => ({
    id: `c${i}`,
    x: z.gauche + hasard(i + 1) * z.largeur,
    top: z.haut,
    hauteur: z.hauteur,
    taille: 9 + Math.round(hasard(i + 3) * 7),
    couleur: COULEURS[i % COULEURS.length],
    // décalées sur toute la durée d'une chute, plus une pause variable
    delai: `calc(var(--d-goutte) * ${(-(i / Math.max(1, n)) - hasard(i + 11) * 0.35).toFixed(3)})`,
    repete: "infinite",
  }));
}

function averse_(cle: number, z: ZonePluie): Chute[] {
  return Array.from({ length: 8 }, (_, i) => ({
    id: `a${cle}-${i}`,
    x: z.gauche + hasard(cle * 10 + i) * z.largeur,
    top: z.haut,
    hauteur: z.hauteur,
    taille: 10 + Math.round(hasard(cle + i) * 6),
    couleur: COULEURS[(i + cle) % COULEURS.length],
    delai: `calc(var(--d-averse) * ${(i / 8).toFixed(3)})`,
    repete: "1",
  }));
}

function surArbre(cle: number, z: ZonePluie): Chute[] {
  return [{ id: `s${cle}`, x: z.sommet.x, top: 0, hauteur: Math.max(8, z.sommet.y), taille: 15, couleur: "--source", delai: "0s", repete: "1" }];
}

export function Pluie({ gouttes = 0, averse, goutteSurArbre, zone = ZONE_DEFAUT }: { gouttes?: number; averse?: number; goutteSurArbre?: number; zone?: ZonePluie }) {
  const [bref, setBref] = useState<Chute[]>([]);

  useEffect(() => {
    if (!averse) return;
    setBref((b) => [...b, ...averse_(averse, zone)].slice(-MAX));
    const t = window.setTimeout(() => setBref((b) => b.filter((c) => !c.id.startsWith(`a${averse}-`))), tokenMs("--d-averse") + tokenMs("--d-goutte") + 100);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [averse]);

  useEffect(() => {
    if (!goutteSurArbre) return;
    setBref((b) => [...b, ...surArbre(goutteSurArbre, zone)]);
    const t = window.setTimeout(() => setBref((b) => b.filter((c) => c.id !== `s${goutteSurArbre}`)), tokenMs("--d-goutte") + 100);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goutteSurArbre]);

  const chutes = [...continue_(gouttes, zone), ...bref].slice(0, MAX);
  if (chutes.length === 0) return null;
  return (
    <div className="pluie" aria-hidden="true">
      {chutes.map((c) => (
        <span
          key={c.id}
          className="chute"
          style={
            {
              "--x": `${c.x}%`,
              top: `${c.top}%`,
              "--hauteur": `${c.hauteur}%`,
              "--g": `${c.taille}px`,
              "--goutte-couleur": `var(${c.couleur})`,
              "--delai": c.delai,
              "--repete": c.repete,
            } as CSSProperties
          }
        >
          <span className="goutte" />
          <span className="onde" />
        </span>
      ))}
    </div>
  );
}
