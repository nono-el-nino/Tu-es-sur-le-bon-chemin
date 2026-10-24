import { Link } from "react-router-dom";
import { formatReference, type Passage } from "../content";
import { topicsForPassage } from "../lib/tones";
import { GarderButton } from "./DiscoveryCard";
import { PedagogyBlock, ScriptureBlock, TeachingBlock } from "./Layers";
import { NoteEditor } from "./NoteEditor";
import { StatusBadge } from "./StatusBadge";
import { PlacesBlock } from "./PlacesBlock";
import { Brume, BrumeAuDefilement } from "./arbre/Brume";
import { useToast } from "./Toast";

const dateFr = (iso: string) => new Date(iso + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

/** Fiche d'un passage, en lecture : fond Ciel, aucun décor, aucune pluie. */
export function PassageView({ passage, eyebrow, humeur }: { passage: Passage; eyebrow?: string; humeur?: string; animate?: boolean }) {
  const topics = topicsForPassage(passage.id);
  const toast = useToast();

  return (
    <div className="stack-lg lecture">
      <header className="stack" style={{ gap: "var(--s3)" }}>
        <div className="spread">
          <span className="ref">{formatReference(passage)}</span>
          {eyebrow && <span className="etiquette">{eyebrow}</span>}
        </div>
        <Brume as="h1" texte={passage.title} cle={passage.id} />
        <Brume as="p" className="lead" texte={passage.summary} cle={`${passage.id}-r`} />
        <StatusBadge status={passage.editorial.status} />
        <div className="row">
          <GarderButton passageId={passage.id} humeur={humeur} onToggle={(s) => toast.show(s ? "Gardé dans ton carnet" : "Retiré du carnet")} />
        </div>
      </header>

      <BrumeAuDefilement>
        <ScriptureBlock passage={passage} />
      </BrumeAuDefilement>

      <BrumeAuDefilement>
        <PedagogyBlock>
          <h3>Le contexte</h3>
          <p>{passage.context}</p>
          <h3>Pour comprendre</h3>
          <p>{passage.explanation}</p>
        </PedagogyBlock>
      </BrumeAuDefilement>

      <BrumeAuDefilement>
        <TeachingBlock teaching={passage.teaching} />
      </BrumeAuDefilement>

      <BrumeAuDefilement>
        <PlacesBlock passageId={passage.id} />
      </BrumeAuDefilement>

      <NoteEditor target={{ type: "passage", id: passage.id }} />

      {topics.length > 0 && (
        <div className="stack">
          <span className="eyebrow">Ce passage dans</span>
          <div className="chip-row">
            {topics.map((t) => (
              <Link key={t.id} to={t.kind === "humeur" ? `/explorer/humeur/${t.id}` : `/explorer/theme/${t.id}`} className="chip">
                {t.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      <p className="layer-note">
        Fiche éditoriale · statut : {passage.editorial.status === "valide" ? "validée" : passage.editorial.status.replace("_", " ")} · mise à jour le{" "}
        <span className="mono">{dateFr(passage.editorial.updatedAt)}</span> · <Link to="/a-propos">sources et méthode</Link>
        {passage.editorial.notes && passage.editorial.status !== "valide" ? ` · ${passage.editorial.notes}` : ""}
      </p>
      {toast.node}
    </div>
  );
}
