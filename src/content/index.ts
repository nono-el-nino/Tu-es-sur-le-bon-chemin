import passages from "./data/passages.json";
import topics from "./data/topics.json";
import parcours from "./data/parcours.json";
import sources from "./data/sources.json";
import { catalog as catalogSchema } from "./schema";
import { buildPublicCatalog } from "./catalog";

export const rawCatalog = catalogSchema.parse({ passages, topics, parcours, sources });

export const editorialPreview = import.meta.env.VITE_EDITORIAL_PREVIEW === "true";

export const content = buildPublicCatalog(rawCatalog, { preview: editorialPreview });

export { formatReference, passageOfTheDay, randomPassage } from "./catalog";
export type { Passage, Topic, Parcours, Step } from "./schema";
