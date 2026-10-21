import { Check, PenLine, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { content, formatReference } from "../content";
import { DiscoveryCard } from "../components/DiscoveryCard";
import { TopicIcon } from "../components/Icon";
import { useUserData } from "../lib/useUserData";
import { deleteNote, forgetExplored, resetParcours, upsertNote, type Note } from "../lib/store";

const tabs = [
  { id: "favoris", label: "Favoris" },
  { id: "notes", label: "Notes" },
  { id: "parcours", label: "Parcours" },
  { id: "themes", label: "Thèmes" },
] as const;

export function Carnet() {
  const [params, setParams] = useSearchParams();
  const tab = tabs.find((t) => t.id === params.get("tab"))?.id ?? "favoris";
  const { data, reset } = useUserData();

  return (
    <div className="screen">
      <header className="stack" style={{ gap: 6 }}>
        <span className="eyebrow">Carnet</span>
        <h1>Mes découvertes</h1>
        <p className="small muted">Tout reste sur cet appareil. Aucun compte, aucune donnée envoyée.</p>
      </header>

      <div className="segmented" role="tablist" aria-label="Sections du carnet">
        {tabs.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setParams({ tab: t.id }, { replace: true })}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "favoris" && <Favorites />}
      {tab === "notes" && <Notes />}
      {tab === "parcours" && <MyParcours />}
      {tab === "themes" && <Explored />}

      <section className="stack" style={{ marginTop: 12 }}>
        <Link to="/a-propos" className="btn btn-ghost btn-block">
          Sources, méthode et confidentialité
        </Link>
        {(data.favorites.length > 0 || data.notes.length > 0 || Object.keys(data.progress).length > 0 || Object.keys(data.explored).length > 0) && (
          <button
            type="button"
            className="btn btn-quiet"
            onClick={() => {
              if (window.confirm("Effacer toutes tes données (favoris, notes, progression) de cet appareil ? Cette action est définitive.")) reset();
            }}
          >
            <Trash2 size={16} aria-hidden="true" /> Effacer toutes mes données
          </button>
        )}
      </section>
    </div>
  );
}

function Empty({ text, cta, to }: { text: string; cta: string; to: string }) {
  return (
    <div className="empty">
      <p className="muted">{text}</p>
      <Link to={to} className="btn btn-primary">
        {cta}
      </Link>
    </div>
  );
}

function Favorites() {
  const { data } = useUserData();
  const items = data.favorites.map((f) => content.passagesById.get(f.passageId)).filter((p) => p !== undefined);
  if (items.length === 0) return <Empty text="Aucun passage gardé pour l'instant. Touche le marque-page d'une carte pour la garder ici." cta="Explorer" to="/explorer" />;
  return (
    <div className="stack">
      {items.map((p) => (
        <DiscoveryCard key={p.id} passage={p} compact />
      ))}
    </div>
  );
}

function noteTargetLabel(n: Note): { label: string; to?: string } {
  if (n.target.type === "passage") {
    const p = content.passagesById.get(n.target.id);
    return p ? { label: formatReference(p), to: `/passage/${p.id}` } : { label: "Passage retiré du catalogue" };
  }
  if (n.target.type === "step") {
    const { parcoursId, stepId } = n.target;
    const pc = content.parcours.find((x) => x.id === parcoursId);
    const s = pc?.steps.find((x) => x.id === stepId);
    return pc && s ? { label: `${pc.title} · ${s.title}`, to: `/parcours/${pc.id}/etape/${s.id}` } : { label: "Étape retirée" };
  }
  return { label: "Note libre" };
}

function Notes() {
  const { data, update } = useUserData();
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [text, setText] = useState("");

  const startEdit = (n?: Note) => {
    setEditing(n ? n.id : "new");
    setText(n?.text ?? "");
  };
  const submit = () => {
    update((d) => (editing === "new" ? upsertNote(d, { type: "libre" }, text) : upsertNote(d, { type: "libre" }, text, editing ?? undefined)));
    setEditing(null);
  };

  const editor = (
    <div className="stack">
      <textarea aria-label="Texte de la note" value={text} onChange={(e) => setText(e.target.value)} autoFocus />
      <div className="row">
        <button type="button" className="btn btn-primary" onClick={submit}>
          <Check size={16} aria-hidden="true" /> Enregistrer
        </button>
        <button type="button" className="btn btn-quiet" onClick={() => setEditing(null)}>
          Annuler
        </button>
      </div>
    </div>
  );

  return (
    <div className="stack">
      {editing === "new" ? (
        <div className="card card-pad">{editor}</div>
      ) : (
        <button type="button" className="btn btn-ghost btn-block" onClick={() => startEdit()}>
          <Plus size={16} aria-hidden="true" /> Nouvelle note libre
        </button>
      )}
      {data.notes.length === 0 && editing !== "new" && <p className="muted small" style={{ textAlign: "center" }}>Tes réflexions personnelles apparaîtront ici.</p>}
      {data.notes.map((n) => {
        const t = noteTargetLabel(n);
        return (
          <article key={n.id} className="card card-pad stack">
            <div className="spread">
              {t.to ? (
                <Link to={t.to} className="eyebrow" style={{ textDecoration: "none" }}>
                  {t.label} →
                </Link>
              ) : (
                <span className="eyebrow">{t.label}</span>
              )}
              <span className="small muted">{new Date(n.updatedAt).toLocaleDateString("fr-FR")}</span>
            </div>
            {editing === n.id ? (
              editor
            ) : (
              <>
                <p style={{ whiteSpace: "pre-wrap" }}>{n.text}</p>
                <div className="row">
                  <button type="button" className="btn btn-quiet" onClick={() => startEdit(n)}>
                    <PenLine size={16} aria-hidden="true" /> Modifier
                  </button>
                  <button type="button" className="btn btn-quiet" onClick={() => update((d) => deleteNote(d, n.id))}>
                    <Trash2 size={16} aria-hidden="true" /> Supprimer
                  </button>
                </div>
              </>
            )}
          </article>
        );
      })}
    </div>
  );
}

function MyParcours() {
  const { data, update } = useUserData();
  const started = content.parcours.filter((p) => p.id in data.progress);
  if (started.length === 0) return <Empty text="Tu n'as pas encore commencé de parcours." cta="Voir les parcours" to="/parcours" />;
  return (
    <div className="stack">
      {started.map((p) => {
        const done = p.steps.filter((s) => data.progress[p.id].completedStepIds.includes(s.id)).length;
        const finished = done === p.steps.length;
        return (
          <article key={p.id} className={`card card-pad stack tone-${p.tone}`} style={{ gap: 8 }}>
            <div className="spread">
              <Link to={`/parcours/${p.id}`} style={{ textDecoration: "none" }}>
                <h3>{p.title}</h3>
              </Link>
              <span className={`badge ${finished ? "badge-ok" : ""}`}>{finished ? "Terminé" : `${done}/${p.steps.length}`}</span>
            </div>
            <div className="progress" aria-hidden="true">
              <span style={{ width: `${(done / p.steps.length) * 100}%` }} />
            </div>
            <button
              type="button"
              className="btn btn-quiet"
              style={{ alignSelf: "flex-start" }}
              onClick={() => {
                if (window.confirm(`Effacer ta progression dans « ${p.title} » ?`)) update((d) => resetParcours(d, p.id));
              }}
            >
              <X size={16} aria-hidden="true" /> Effacer la progression
            </button>
          </article>
        );
      })}
    </div>
  );
}

function Explored() {
  const { data, update } = useUserData();
  const topics = [...content.moods, ...content.themes].filter((t) => t.id in data.explored);
  if (topics.length === 0) return <Empty text="Les humeurs et thèmes que tu explores apparaîtront ici." cta="Explorer" to="/explorer" />;
  return (
    <div className="chip-row">
      {topics.map((t) => (
        <span key={t.id} className={`chip tone-${t.tone}`}>
          <Link to={t.kind === "humeur" ? `/explorer/humeur/${t.id}` : `/explorer/theme/${t.id}`} className="row" style={{ gap: 6, textDecoration: "none" }}>
            <TopicIcon name={t.icon} size={14} /> {t.label}
          </Link>
          <button type="button" aria-label={`Retirer ${t.label}`} onClick={() => update((d) => forgetExplored(d, t.id))} style={{ border: 0, background: "none", padding: 4, cursor: "pointer", display: "grid" }}>
            <X size={14} aria-hidden="true" />
          </button>
        </span>
      ))}
    </div>
  );
}
