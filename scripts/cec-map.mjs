/** Premier numéro cité : « 1716-1729 » → 1716 ; « 949, 2624 » → 949. */
export const firstParagraph = (paragraphs) => Number(String(paragraphs).match(/\d+/)[0]);

/**
 * Lien vers la page vatican.va qui contient le premier paragraphe cité.
 * Le fragment « #:~:text=1716 » fait défiler la page jusqu'au paragraphe
 * (Safari 16.1+, Chrome, Edge) ; ailleurs, la bonne page s'ouvre simplement.
 * Il n'est ajouté que si le numéro n'apparaît pas plus haut dans la page.
 */
export function cecPageFor(pages, paragraphs) {
  const n = firstParagraph(paragraphs);
  const page = pages.find((p) => n >= p.first && n <= p.last);
  if (!page) return undefined;
  return page.textFragmentUnsafe.includes(n) ? page.url : `${page.url}#:~:text=${n}`;
}
