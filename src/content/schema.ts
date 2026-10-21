import { z } from "zod";

/**
 * Schéma des contenus éditoriaux.
 * Toute la fiabilité de l'application repose sur ces règles :
 * un contenu n'est visible que si son statut est « valide ».
 */

export const editorialStatus = z.enum(["brouillon", "a_verifier", "valide"]);
export type EditorialStatus = z.infer<typeof editorialStatus>;

export const editorial = z.object({
  status: editorialStatus,
  updatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  /** Qui a vérifié, et quoi. */
  reviewer: z.string().min(2),
  notes: z.string().optional(),
});

/** Référence à un ou plusieurs paragraphes du Catéchisme de l'Église catholique. */
export const teachingRef = z.object({
  source: z.literal("CEC"),
  paragraphs: z.string().regex(/^\d+(-\d+)?(, ?\d+(-\d+)?)*$/, "ex. « 2559 » ou « 1822-1829 »"),
  /** Intitulé descriptif rédigé par l'équipe (pas une citation). */
  label: z.string().min(3),
  url: z.string().url().startsWith("https://www.vatican.va/"),
});

export const AELF_BIBLE_BASE = "https://www.aelf.org/bible/";

export const passage = z
  .object({
    id: z.string().regex(/^p-[a-z0-9-]+$/),
    reference: z.object({
      /** Code du livre dans les URL d'aelf.org (ex. « Mt », « 1Co »). */
      bookCode: z.string().min(1),
      bookName: z.string().min(2),
      chapter: z.number().int().positive(),
      /** Libellé du chapitre si différent (psaumes : « 22 (23) »). */
      chapterLabel: z.string().optional(),
      verses: z.string().regex(/^\d+[a-z]?(-\d+[a-z]?)?(\.\d+(-\d+)?)*$/),
    }),
    translation: z.literal("AELF"),
    sourceUrl: z.string().url().startsWith(AELF_BIBLE_BASE),
    /** Titre descriptif rédigé par l'équipe, jamais une citation. */
    title: z.string().min(3).max(60),
    summary: z.string().min(10).max(160),
    context: z.string().min(40),
    explanation: z.string().min(40),
    teaching: z.array(teachingRef),
    /**
     * Texte biblique reproduit. Le texte AELF est protégé :
     * il reste `null` tant qu'une autorisation écrite n'est pas documentée.
     */
    text: z
      .object({
        content: z.string().min(1),
        authorization: z.string().min(10),
      })
      .nullable(),
    editorial,
  })
  .superRefine((p, ctx) => {
    const expected = `${AELF_BIBLE_BASE}${p.reference.bookCode}/${p.reference.chapter}`;
    if (p.sourceUrl !== expected) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `sourceUrl doit pointer vers le chapitre : ${expected}`,
      });
    }
  });
export type Passage = z.infer<typeof passage>;

export const toneNames = ["terracotta", "turquoise", "sable", "bleu"] as const;
export const iconNames = [
  "sun",
  "cloud-fog",
  "user",
  "heart-handshake",
  "flame",
  "wind",
  "sunrise",
  "undo-2",
  "mountain",
  "battery-low",
  "heart",
  "scale",
  "anchor",
  "hand",
  "sparkles",
  "compass",
  "message-circle",
  "feather",
] as const;

export const topic = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  kind: z.enum(["humeur", "theme"]),
  label: z.string().min(2),
  /** Formulation à la première personne (humeurs) ou accroche (thèmes). */
  prompt: z.string().min(3),
  description: z.string().min(10),
  icon: z.enum(iconNames),
  tone: z.enum(toneNames),
  passageIds: z.array(z.string()),
  editorial,
});
export type Topic = z.infer<typeof topic>;

export const quiz = z
  .object({
    question: z.string().min(5),
    options: z.array(z.string().min(1)).min(2).max(4),
    answerIndex: z.number().int().nonnegative(),
    feedback: z.string().min(5),
  })
  .refine((q) => q.answerIndex < q.options.length, "answerIndex hors limites");

export const step = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(3),
  objective: z.string().min(10),
  passageId: z.string(),
  explanation: z.string().min(40),
  teaching: z.array(teachingRef),
  reflection: z.string().min(10).optional(),
  quiz: quiz.optional(),
  editorial,
});
export type Step = z.infer<typeof step>;

export const parcours = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(3),
  subtitle: z.string().min(3),
  description: z.string().min(20),
  illustration: z.enum(["sunrise", "path", "constellation"]),
  tone: z.enum(toneNames),
  steps: z.array(step).min(5).max(7),
  editorial,
});
export type Parcours = z.infer<typeof parcours>;

export const source = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string().url(),
  role: z.string(),
  rights: z.string(),
});
export type Source = z.infer<typeof source>;

export const catalog = z.object({
  passages: z.array(passage),
  topics: z.array(topic),
  parcours: z.array(parcours),
  sources: z.array(source),
});
export type Catalog = z.infer<typeof catalog>;
