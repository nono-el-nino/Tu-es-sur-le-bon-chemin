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

type Chute = { id: string; x: number; top: number; hauteur: number; taille: number; couleur: string; delai: string; repete: string };

// Positions pseudo-aléatoires mais stables (pas de saut à chaque rendu)
const hasard = (n: number) => {
  const s = Math.sin(n * 12.9898) * 43758.5453;
  return s - Math.floor(s);
};

function continue_(n: number): Chute[] {
  return Array.from({ length: Math.min(MAX, n) }, (_, i) => ({
    id: `c${i}`,
    x: 24 + hasard(i + 1) * 52,
    top: 34 + hasard(i + 7) * 8,
    hauteur: 52,
    taille: 9 + Math.round(hasard(i + 3) * 7),
    couleur: COULEURS[i % COULEURS.length],
    // décalées sur toute la durée d'une chute, plus une pause variable
    delai: `calc(var(--d-goutte) * ${-(i / Math.max(1, n)).toFixed(3)} - ${(hasard(i + 11) * 0.4).toFixed(2)}s)`,
    repete: "infinite",
  }));
}

function averse_(cle: number): Chute[] {
  return Array.from({ length: 8 }, (_, i) => ({
    id: `a${cle}-${i}`,
    x: 20 + hasard(cle * 10 + i) * 60,
    top: 26 + hasard(cle + i * 3) * 12,
    hauteur: 58,
    taille: 10 + Math.round(hasard(cle + i) * 6),
    couleur: COULEURS[(i + cle) % COULEURS.length],
    delai: `calc(var(--d-averse) * ${(i / 8).toFixed(3)})`,
    repete: "1",
  }));
}

function surArbre(cle: number): Chute[] {
  return [{ id: `s${cle}`, x: 50, top: 0, hauteur: 34, taille: 15, couleur: "--source", delai: "0s", repete: "1" }];
}

export function Pluie({ gouttes = 0, averse, goutteSurArbre }: { gouttes?: number; averse?: number; goutteSurArbre?: number }) {
  const [bref, setBref] = useState<Chute[]>([]);

  useEffect(() => {
    if (!averse) return;
    setBref((b) => [...b, ...averse_(averse)].slice(-MAX));
    const t = window.setTimeout(() => setBref((b) => b.filter((c) => !c.id.startsWith(`a${averse}-`))), tokenMs("--d-averse") + tokenMs("--d-goutte") + 100);
    return () => window.clearTimeout(t);
  }, [averse]);

  useEffect(() => {
    if (!goutteSurArbre) return;
    setBref((b) => [...b, ...surArbre(goutteSurArbre)]);
    const t = window.setTimeout(() => setBref((b) => b.filter((c) => c.id !== `s${goutteSurArbre}`)), tokenMs("--d-goutte") + 100);
    return () => window.clearTimeout(t);
  }, [goutteSurArbre]);

  const chutes = [...continue_(gouttes), ...bref].slice(0, MAX);
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
