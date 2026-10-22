import { BookOpen, ExternalLink, Landmark, Lightbulb } from "lucide-react";
import { lazy, Suspense } from "react";
import { content } from "../content";
import { PageHeader } from "../components/Layout";

const BibleCoverage = lazy(() => import("../components/coverage/BibleCoverage"));

export function About() {
  return (
    <div className="screen">
      <PageHeader title="Sources et méthode" />
      <header className="stack" style={{ gap: 6 }}>
        <span className="eyebrow">À propos</span>
        <h1>Des contenus fiables, clairement sourcés</h1>
      </header>

      <section className="stack">
        <h2>Trois niveaux, toujours distingués</h2>
        <div className="layer layer-ecriture">
          <span className="layer-label">
            <BookOpen size={14} aria-hidden="true" /> Écriture
          </span>
          <p className="small">La Bible, dans la traduction liturgique officielle de l'AELF. Chaque fiche indique le livre, le chapitre et les versets, avec un lien vers le texte.</p>
        </div>
        <div className="layer layer-enseignement">
          <span className="layer-label">
            <Landmark size={14} aria-hidden="true" /> Enseignement officiel
          </span>
          <p className="small">Les paragraphes du Catéchisme de l'Église catholique (CEC) en lien avec le passage, consultables sur le site du Saint-Siège.</p>
        </div>
        <div className="layer layer-pedagogie">
          <span className="layer-label">
            <Lightbulb size={14} aria-hidden="true" /> Explication pédagogique
          </span>
          <p className="small">Le contexte et les explications rédigés par l'équipe de l'application. Ils aident à comprendre, mais ne sont pas un enseignement officiel de l'Église.</p>
        </div>
      </section>

      <section className="stack">
        <h2>Pourquoi le texte biblique n'est pas affiché</h2>
        <p>
          La traduction liturgique de l'AELF est protégée par le droit d'auteur. Sans autorisation écrite, nous n'en reproduisons aucun extrait : l'application donne
          la référence exacte et t'emmène au bon chapitre sur aelf.org, où le texte est librement consultable.
        </p>
      </section>

      <section className="stack">
        <h2>Statut éditorial</h2>
        <p>
          Chaque fiche porte un statut : <em>brouillon</em>, <em>à vérifier</em> ou <em>validée</em>. Seules les fiches validées sont visibles. Les associations entre
          humeurs et passages sont choisies à la main, jamais générées automatiquement.
        </p>
        <p className="small muted">
          Catalogue actuel : {content.passages.length} passages, {content.moods.length} humeurs, {content.themes.length} thèmes, {content.parcours.length} parcours.
        </p>
      </section>

      <section className="stack" aria-labelledby="couverture">
        <h2 id="couverture">Ce que couvrent les fiches</h2>
        <p>
          La Bible compte 73 livres. Chaque fiche est relue avant publication : le catalogue reste donc volontairement réduit pour l'instant. La couverture
          s'élargira à chaque nouvelle version de l'application.
        </p>
        <Suspense fallback={<p className="muted small">Chargement…</p>}>
          <BibleCoverage />
        </Suspense>
      </section>

      <section className="stack">
        <h2>Sources</h2>
        <div className="card">
          {content.sources.map((s) => (
            <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer" className="list-row">
              <span style={{ flex: 1 }}>
                <strong>{s.name}</strong>
                <br />
                <span className="small muted">{s.role}</span>
                <br />
                <span className="small">{s.rights}</span>
              </span>
              <ExternalLink size={16} aria-hidden="true" />
            </a>
          ))}
        </div>
      </section>

      <section className="stack">
        <h2>Confidentialité</h2>
        <p>Pas de compte, pas de publicité, pas de mesure d'audience. Tes favoris, notes et progression restent sur ton appareil et peuvent être effacés depuis le Carnet.</p>
      </section>
    </div>
  );
}
