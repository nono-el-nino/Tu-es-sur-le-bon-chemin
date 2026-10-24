/**
 * Lecture des tokens CSS depuis le code (couleurs et durées ne sont définies
 * que dans src/styles/tokens.css).
 */

export function token(name: string): string {
  if (typeof document === "undefined") return "";
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/** « 860ms » → 860 ; « 1.2s » → 1200. */
export function parseDuration(value: string): number {
  const v = value.trim();
  if (v.endsWith("ms")) return parseFloat(v);
  if (v.endsWith("s")) return parseFloat(v) * 1000;
  return parseFloat(v) || 0;
}

export const tokenMs = (name: string) => parseDuration(token(name));

export function reducedMotion(): boolean {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}
