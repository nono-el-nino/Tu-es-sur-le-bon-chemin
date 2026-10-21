import { Link } from "react-router-dom";
import { formatReference, type Passage } from "../content";
import { toneForPassage, topicsForPassage } from "../lib/tones";
import { FavoriteButton } from "./DiscoveryCard";
import { Landscape } from "./Illustrations";
import { PedagogyBlock, ScriptureBlock, TeachingBlock } from "./Layers";
import { NoteEditor } from "./NoteEditor";
import { StatusBadge } from "./StatusBadge";
import { TopicIcon } from "./Icon";
import { useToast } from "./Toast";

const dateFr = (iso: string) => new Date(iso + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

/** Fiche complète d'un passage, en mode lecture. */
export function PassageView({ passage, eyebrow, animate }: { passage: Passage; eyebrow?: string; animate?: boolean }) {
  const tone = toneForPassage(passage.id);
  const topics = topicsForPassage(passage.id);
  const toast = useToast();

  return (
    <div className={`stack-lg ${animate ? "discovery-pop" : ""}`}>
      <div className={`card discovery tone-${tone}`}>
        <span className="art">
          <Landscape seed={passage.id} tone={tone} />
        </span>
        <div className="body">
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          <span className="ref">{formatReference(passage)}</span>
          <h1 style={{ fontSize: "1.7rem" }}>{passage.title}</h1>
          <p className="muted">{passage.summary}</p>
          <StatusBadge status={passage.editorial.status} />
        </div>
        <FavoriteButton passageId={passage.id} className="save" onToggle={(s) => toast.show(s ? "Gardé dans ton carnet" : "Retiré du carnet")} />
      </div>

      <ScriptureBlock passage={passage} />

      <PedagogyBlock>
        <h3>Le contexte</h3>
        <p>{passage.context}</p>
        <h3>Pour comprendre</h3>
        <p>{passage.explanation}</p>
      </PedagogyBlock>

      <TeachingBlock teaching={passage.teaching} />

      <NoteEditor target={{ type: "passage", id: passage.id }} />

      {topics.length > 0 && (
        <div className="stack">
          <span className="eyebrow">Ce passage dans</span>
          <div className="chip-row">
            {topics.map((t) => (
              <Link key={t.id} to={t.kind === "humeur" ? `/explorer/humeur/${t.id}` : `/explorer/theme/${t.id}`} className={`chip tone-${t.tone}`}>
                <TopicIcon name={t.icon} size={14} /> {t.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      <p className="layer-note">
        Fiche éditoriale · statut : {passage.editorial.status === "valide" ? "validée" : passage.editorial.status.replace("_", " ")} · mise à jour le{" "}
        {dateFr(passage.editorial.updatedAt)} · <Link to="/a-propos">sources et méthode</Link>
        {passage.editorial.notes && passage.editorial.status !== "valide" ? ` · ${passage.editorial.notes}` : ""}
      </p>
      {toast.node}
    </div>
  );
}
