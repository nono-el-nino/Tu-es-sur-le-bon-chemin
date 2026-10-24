import { content } from "../content";
import type { Topic } from "../content";

export function topicsForPassage(passageId: string): Topic[] {
  return [...content.moods, ...content.themes].filter((t) => t.passageIds.includes(passageId));
}
