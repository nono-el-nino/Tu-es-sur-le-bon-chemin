import { BookOpen, ExternalLink, Landmark, Lightbulb } from "lucide-react";
import type { ReactNode } from "react";
import { formatReference, type Passage, type Step } from "../content";

/**
 * Les trois niveaux de contenu, toujours distingués visuellement :
 *  1. Écriture (texte biblique, AELF)
 *  2. Enseignement officiel (Catéchisme de l'Église catholique)
 *  3. Explication pédagogique (rédaction de l'application, non officielle)
 */

export function ScriptureBlock({ passage }: { passage: Passage }) {
  return (
    <section className="layer layer-ecriture" aria-label="Écriture">
      <span className="layer-label">
        <BookOpen size={14} aria-hidden="true" /> Écriture · Bible AELF
      </span>
      <p className="big-ref">{formatReference(passage)}</p>
      {passage.text ? (
        <blockquote className="reading" style={{ margin: 0 }}>
          {passage.text.content}
        </blockquote>
      ) : (
        <p className="layer-note">
          Le texte de la traduction liturgique officielle est protégé : nous ne le reproduisons pas. Lis-le directement sur
          le site de l'AELF, au chapitre {passage.reference.chapterLabel ?? passage.reference.chapter}, versets {passage.reference.verses}.
        </p>
      )}
      <a className="btn btn-primary" href={passage.sourceUrl} target="_blank" rel="noopener noreferrer">
        Lire le texte sur AELF <ExternalLink size={16} aria-hidden="true" />
      </a>
    </section>
  );
}

export function TeachingBlock({ teaching }: { teaching: Passage["teaching"] | Step["teaching"] }) {
  if (teaching.length === 0) return null;
  return (
    <section className="layer layer-enseignement" aria-label="Enseignement officiel de l'Église">
      <span className="layer-label">
        <Landmark size={14} aria-hidden="true" /> Enseignement de l'Église · Catéchisme
      </span>
      <div>
        {teaching.map((t) => (
          <a key={t.paragraphs + t.label} className="teaching-item" href={t.url} target="_blank" rel="noopener noreferrer">
            <span>
              <strong>CEC § {t.paragraphs}</strong>
              <br />
              <span className="small">{t.label}</span>
            </span>
            <ExternalLink size={16} aria-hidden="true" />
          </a>
        ))}
      </div>
      <p className="layer-note">Catéchisme de l'Église catholique, sur le site du Saint-Siège (vatican.va).</p>
    </section>
  );
}

export function PedagogyBlock({ title = "Pour comprendre", children }: { title?: string; children: ReactNode }) {
  return (
    <section className="layer layer-pedagogie" aria-label="Explication pédagogique">
      <span className="layer-label">
        <Lightbulb size={14} aria-hidden="true" /> {title} · Explication pédagogique
      </span>
      <div className="reading stack">{children}</div>
      <p className="layer-note">
        Rédigée par l'équipe de l'application à partir des sources citées. Ce n'est pas un texte officiel de l'Église.
      </p>
    </section>
  );
}
