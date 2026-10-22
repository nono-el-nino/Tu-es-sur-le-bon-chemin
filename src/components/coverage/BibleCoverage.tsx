import { Link } from "react-router-dom";
import structure from "../../content/data/bible-structure.json";
import { content, formatReference } from "../../content";
import { computeCoverage, percent, type BibleStructure, type BookCoverage } from "../../lib/coverage";

/** Noms courts usuels (le nom complet AELF reste lu par les lecteurs d'écran). */
const short: Record<string, string> = {
  Gn: "Genèse", Ex: "Exode", Lv: "Lévitique", Nb: "Nombres", Dt: "Deutéronome", Jos: "Josué", Jg: "Juges", Rt: "Ruth",
  "1S": "1 Samuel", "2S": "2 Samuel", "1R": "1 Rois", "2R": "2 Rois", "1Ch": "1 Chroniques", "2Ch": "2 Chroniques",
  Esd: "Esdras", Ne: "Néhémie", Tb: "Tobie", Jdt: "Judith", Est: "Esther", "1M": "1 Maccabées", "2M": "2 Maccabées",
  Jb: "Job", Ps: "Psaumes", Pr: "Proverbes", Qo: "Qohéleth", Ct: "Cantique", Sg: "Sagesse", Si: "Siracide", Is: "Isaïe",
  Jr: "Jérémie", Lm: "Lamentations", Ba: "Baruch", XXX: "Lettre de Jérémie", Ez: "Ézékiel", Dn: "Daniel", Os: "Osée",
  Jl: "Joël", Am: "Amos", Ab: "Abdias", Jon: "Jonas", Mi: "Michée", Na: "Nahum", Ha: "Habacuc", So: "Sophonie",
  Ag: "Aggée", Za: "Zacharie", Ml: "Malachie", Mt: "Matthieu", Mc: "Marc", Lc: "Luc", Jn: "Jean", Ac: "Actes",
  Rm: "Romains", "1Co": "1 Corinthiens", "2Co": "2 Corinthiens", Ga: "Galates", Ep: "Éphésiens", Ph: "Philippiens",
  Col: "Colossiens", "1Th": "1 Thessaloniciens", "2Th": "2 Thessaloniciens", "1Tm": "1 Timothée", "2Tm": "2 Timothée",
  Tt: "Tite", Phm: "Philémon", He: "Hébreux", Jc: "Jacques", "1P": "1 Pierre", "2P": "2 Pierre", "1Jn": "1 Jean",
  "2Jn": "2 Jean", "3Jn": "3 Jean", Jude: "Jude", Ap: "Apocalypse",
};

/** Représentation de la couverture des fiches au regard de toute la Bible. */
export default function BibleCoverage() {
  const refs = content.passages.map((p) => ({ id: p.id, title: p.title, bookCode: p.reference.bookCode, chapter: p.reference.chapter, verses: p.reference.verses }));
  const cov = computeCoverage(structure as BibleStructure, refs);
  const nf = (n: number) => n.toLocaleString("fr-FR");

  return (
    <div className="stack-lg">
      <div className="kpi-grid">
        <div className="kpi">
          <strong>{cov.passages}</strong>
          <span>fiches publiées</span>
        </div>
        <div className="kpi">
          <strong>{percent(cov.verses.covered, cov.verses.total)}</strong>
          <span>
            des versets ({nf(cov.verses.covered)} sur {nf(cov.verses.total)})
          </span>
        </div>
        <div className="kpi">
          <strong>
            {cov.chapters.touched} <small>/ {nf(cov.chapters.total)}</small>
          </strong>
          <span>chapitres abordés</span>
        </div>
        <div className="kpi">
          <strong>
            {cov.bookCount.touched} <small>/ {cov.bookCount.total}</small>
          </strong>
          <span>livres abordés</span>
        </div>
      </div>

      {(["AT", "NT"] as const).map((t) => {
        const s = cov.byTestament[t];
        const books = cov.books.filter((b) => b.testament === t);
        return (
          <section key={t} className="stack" aria-labelledby={`cov-${t}`}>
            <div className="spread">
              <h3 id={`cov-${t}`}>{t === "AT" ? "Ancien Testament" : "Nouveau Testament"}</h3>
              <span className="small muted">
                {s.touchedBooks}/{s.books} livres · {percent(s.covered, s.total)} des versets
              </span>
            </div>
            <div className="cov-books">
              {books.map((b) => (
                <BookRow key={b.code} book={b} />
              ))}
            </div>
          </section>
        );
      })}

      <div className="cov-legend small muted" aria-hidden="true">
        <span>
          <i className="cov-cell" /> chapitre sans fiche
        </span>
        <span>
          <i className="cov-cell on" style={{ opacity: 0.45 }} /> quelques versets
        </span>
        <span>
          <i className="cov-cell on" /> chapitre largement couvert
        </span>
      </div>
      <p className="layer-note">
        Un carré = un chapitre, selon le découpage de la Bible AELF ({structure.source}, relevé du {new Date(structure.retrievedAt).toLocaleDateString("fr-FR")}). Seules les fiches
        validées sont comptées. Touche un livre pour voir ses fiches.
      </p>
    </div>
  );
}

function BookRow({ book: b }: { book: BookCoverage }) {
  const label = `${b.name} : ${b.chapters.filter((c) => c.covered).length} chapitre(s) abordé(s) sur ${b.chapters.length}`;
  const cells = (
    <span className="cov-cells" aria-hidden="true">
      {b.chapters.map((c) => (
        <i key={c.id} className={`cov-cell ${c.covered ? "on" : ""}`} style={c.covered ? { opacity: 0.45 + 0.55 * Math.min(1, c.covered / c.total / 0.5) } : undefined} />
      ))}
    </span>
  );
  if (b.passages.length === 0)
    return (
      <div className="cov-book" aria-label={label}>
        <span className="cov-name">{short[b.code] ?? b.name}</span>
        {cells}
      </div>
    );
  return (
    <details className="cov-book has">
      <summary aria-label={label}>
        <span className="cov-name">{short[b.code] ?? b.name}</span>
        {cells}
        <span className="cov-count">{b.passages.length}</span>
      </summary>
      <ul className="cov-list">
        {b.passages.map((r) => {
          const p = content.passagesById.get(r.id)!;
          return (
            <li key={r.id}>
              <Link to={`/passage/${r.id}`}>
                <strong>{formatReference(p)}</strong> · {p.title}
              </Link>
            </li>
          );
        })}
      </ul>
    </details>
  );
}
