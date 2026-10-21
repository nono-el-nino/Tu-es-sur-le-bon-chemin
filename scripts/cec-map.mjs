/** Premier numéro cité : « 1716-1729 » → 1716 ; « 949, 2624 » → 949. */
export const firstParagraph = (paragraphs) => Number(String(paragraphs).match(/\d+/)[0]);

/** URL de la page vatican.va contenant le premier paragraphe cité. */
export function cecPageFor(pages, paragraphs) {
  const n = firstParagraph(paragraphs);
  return pages.find((p) => p.nums.includes(n))?.url;
}
