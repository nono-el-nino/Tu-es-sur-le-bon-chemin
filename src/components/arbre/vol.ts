import { reducedMotion, token, tokenMs } from "../../lib/tokens";

/**
 * « Garder une goutte » : une goutte se détache du bouton et tombe vers l'onglet Carnet,
 * qui répond par une onde à l'impact (événement « goutte-arrivee »).
 */
export const EVENEMENT_ARRIVEE = "goutte-arrivee";

export function lancerGoutte(depuis: HTMLElement | null, couleur = "--source") {
  const cible = document.querySelector<HTMLElement>("[data-cible-carnet]");
  const fin = () => window.dispatchEvent(new CustomEvent(EVENEMENT_ARRIVEE));
  if (!depuis || !cible || reducedMotion() || typeof document.body.animate !== "function") {
    fin();
    return;
  }
  const a = depuis.getBoundingClientRect();
  const b = cible.getBoundingClientRect();
  const taille = 14;
  const x0 = a.left + a.width / 2 - taille / 2;
  const y0 = a.top + a.height / 2 - taille / 2;
  const dx = b.left + b.width / 2 - taille / 2 - x0;
  const dy = b.top + 12 - y0;

  const g = document.createElement("span");
  g.className = "goutte vol";
  g.style.cssText = `left:${x0}px;top:${y0}px;--g:${taille}px;--goutte-couleur:var(${couleur})`;
  document.body.appendChild(g);
  const anim = g.animate(
    [
      { transform: "translate(0,0) rotate(45deg) scale(.4)", opacity: 0 },
      { transform: "translate(0,-6px) rotate(45deg) scale(1)", opacity: 1, offset: 0.12 },
      { transform: `translate(${dx}px,${dy}px) rotate(45deg) scale(1)`, opacity: 1, offset: 0.94 },
      { transform: `translate(${dx}px,${dy}px) rotate(45deg) scale(1.3,.5)`, opacity: 0 },
    ],
    { duration: tokenMs("--d-garder"), easing: token("--ease-gravite") || "ease-in", fill: "forwards" },
  );
  anim.onfinish = () => {
    g.remove();
    fin();
  };
}
