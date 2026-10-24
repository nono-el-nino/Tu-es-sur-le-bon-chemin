import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/** Critères d'acceptation de la refonte : tokens centralisés, contrastes, mouvement réduit. */

const lister = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? lister(p) : [p];
  });

const fichiers = lister("src").filter((f) => /\.(tsx?|css)$/.test(f) && !f.endsWith("tokens.css") && !f.includes("/content/data/"));
const sansCommentaires = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

describe("tokens centralisés", () => {
  it("aucune couleur codée en dur hors de tokens.css", () => {
    const fautes: string[] = [];
    for (const f of fichiers) {
      const src = sansCommentaires(readFileSync(f, "utf8"));
      for (const m of src.matchAll(/#[0-9a-fA-F]{3,8}\b(?![\w-])|\b(?:rgba?|hsla?|oklch)\(/g)) {
        // #id d'éléments SVG (url(#…)) et ancres ne sont pas des couleurs
        const avant = src.slice(Math.max(0, m.index! - 5), m.index);
        if (/url\($|href=.$|`$/.test(avant)) continue;
        if (/^#[0-9a-fA-F]{3,8}$/.test(m[0]) && /[g-zG-Z]/.test(src.slice(m.index! + 1, m.index! + m[0].length))) continue;
        fautes.push(`${f}: ${m[0]}`);
      }
    }
    expect(fautes).toEqual([]);
  });

  it("aucune durée codée en dur hors de tokens.css", () => {
    const fautes: string[] = [];
    for (const f of fichiers) {
      const src = sansCommentaires(readFileSync(f, "utf8"));
      // « 300ms », « 1.2s », « 9s » dans du CSS ou des chaînes de style
      for (const m of src.matchAll(/(?<![\w.-])\d*\.?\d+(?:ms|s)(?![\w-])/g)) {
        if (/^0+(?:\.0+)?(?:ms|s)$/.test(m[0])) continue; // zéro
        fautes.push(`${f}: ${m[0]}`);
      }
      // setTimeout / durée numérique littérale
      for (const m of src.matchAll(/setTimeout\([^,]+,\s*(\d{2,})\s*\)|duration:\s*(\d+(?:\.\d+)?)/g)) fautes.push(`${f}: ${m[0]}`);
      // durées construites dans le code : « ${…}s »
      for (const m of src.matchAll(/\}(?:ms|s)[`"']/g)) fautes.push(`${f}: ${m[0]}`);
    }
    expect(fautes).toEqual([]);
  });
});

// --- Contrastes (WCAG 2.1) calculés à partir des tokens ---

const tokensCss = readFileSync("src/styles/tokens.css", "utf8").split("@supports")[0];
const tokens = Object.fromEntries([...tokensCss.matchAll(/--([\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));

function oklchVersRgb(L: number, C: number, h: number) {
  const a = C * Math.cos((h * Math.PI) / 180);
  const b = C * Math.sin((h * Math.PI) / 180);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s].map((x) => Math.min(1, Math.max(0, x)));
}
function luminance(nom: string): number {
  const v = tokens[nom];
  let lin: number[];
  const ok = v.match(/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)/);
  if (ok) lin = oklchVersRgb(+ok[1], +ok[2], +ok[3]);
  else {
    const hex = v.replace("#", "");
    lin = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  }
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}
const contraste = (a: string, b: string) => {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

describe("contrastes WCAG AA", () => {
  const texte: [string, string][] = [
    ["ecorce", "ciel"],
    ["ecorce", "nuage"],
    ["ecorce-claire", "ciel"],
    ["ecorce-claire", "nuage"],
    ["ecorce-claire", "brume"],
    ["ecorce-legende", "ciel"],
    ["ecorce-legende", "nuage"],
    ["ecorce-legende", "brume"],
    ["ecorce-legende", "ciel-profond"],
    ["source", "ciel"],
    ["source", "nuage"],
    ["source", "brume"],
    ["profondeur", "rosee"],
    ["sur-bleu", "source"],
    ["sur-bleu", "profondeur"],
    ["nuage", "ecorce"],
  ];
  for (const [t, f] of texte)
    it(`texte --${t} sur --${f} ≥ 4,5:1`, () => {
      expect(contraste(t, f)).toBeGreaterThanOrEqual(4.5);
    });

  it("les gouttes se voient sur le ciel (jamais la rosée)", () => {
    expect(contraste("bruine", "ciel")).toBeGreaterThan(1.4);
    // l'état d'une étape est aussi donné en texte (« Parcourue », « À venir ») : la couleur n'est pas le seul repère
    expect(contraste("averse", "ciel")).toBeGreaterThanOrEqual(2.5);
  });

  it("le nuage blanc se détache du fond de scène", () => {
    expect(luminance("nuage")).toBeGreaterThan(luminance("ciel-profond"));
    expect(luminance("nuage-ombre")).toBeLessThan(luminance("ciel-profond"));
  });
});

describe("mouvement réduit", () => {
  it("coupe la pluie, la respiration, l'oscillation, la croissance animée et la brume", () => {
    const css = readFileSync("src/styles/global.css", "utf8");
    const bloc = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"));
    for (const sel of [".pluie", ".goutte.vol", ".arbre .couronne", ".arbre .bulle", ".arbre .croit", ".brume-mot"]) expect(bloc, sel).toContain(sel);
    expect(bloc).toContain("var(--d-fondu)");
  });
});
