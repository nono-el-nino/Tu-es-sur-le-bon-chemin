import { content } from "../content";
import type { Topic } from "../content";

const order: Topic["tone"][] = ["terracotta", "turquoise", "sable", "bleu"];

/** Couleur d'ambiance d'un passage : celle de sa première humeur, sinon dérivée de l'id. */
export function toneForPassage(passageId: string): Topic["tone"] {
  const t = [...content.moods, ...content.themes].find((t) => t.passageIds.includes(passageId));
  if (t) return t.tone;
  let h = 0;
  for (const ch of passageId) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return order[Math.abs(h) % order.length];
}

export function topicsForPassage(passageId: string): Topic[] {
  return [...content.moods, ...content.themes].filter((t) => t.passageIds.includes(passageId));
}
