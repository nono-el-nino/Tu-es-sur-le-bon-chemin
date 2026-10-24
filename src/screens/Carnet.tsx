import { Check, PenLine, Plus, Trash2, X } from "lucide-react";
import { useState, type CSSProperties } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { content, formatReference } from "../content";
import { GarderButton } from "../components/DiscoveryCard";
import { Gouttes } from "../components/Gouttes";
import { couleurGoutte } from "../lib/meteo";
import { useUserData } from "../lib/useUserData";
import { deleteNote, forgetExplored, resetParcours, setPrenom, upsertNote, type Note } from "../lib/store";

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
        <h1>
          Mes <em>découvertes</em>
        </h1>
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

      <Prenom />

      <section className="stack" style={{ marginTop: "var(--s3)" }}>
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
  const items = data.favorites.flatMap((f) => {
    const p = content.passagesById.get(f.passageId);
    return p ? [{ f, p }] : [];
  });
  if (items.length === 0) return <Empty text="Aucun passage gardé pour l'instant. Touche « Garder » sur un passage : une goutte tombera ici." cta="Explorer" to="/explorer" />;
  return (
    <div className="card">
      {items.map(({ f, p }) => (
        <div key={p.id} className="list-row">
          <span className="goutte goutte-carnet" aria-hidden="true" style={{ "--goutte-couleur": `var(${couleurGoutte(f.humeur)})` } as CSSProperties} />
          <Link to={`/passage/${p.id}`} style={{ flex: 1, textDecoration: "none", color: "inherit", minHeight: 44 }} className="stack">
            <span style={{ gap: 2, display: "flex", flexDirection: "column" }}>
              <span className="ref-plain">{formatReference(p)}</span>
              <span style={{ fontWeight: 600 }}>{p.title}</span>
              <span className="legende">
                <span className="mono">{new Date(f.savedAt).toLocaleDateString("fr-FR")}</span>
                {f.humeur ? ` · ${content.moods.find((m) => m.id === f.humeur)?.label ?? ""}` : ""}
              </span>
            </span>
          </Link>
          <GarderButton passageId={p.id} variant="icone" />
        </div>
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
              <span className="mono legende">{new Date(n.updatedAt).toLocaleDateString("fr-FR")}</span>
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
          <article key={p.id} className="card card-pad stack" style={{ gap: "var(--s3)" }}>
            <div className="spread">
              <Link to={`/parcours/${p.id}`} style={{ textDecoration: "none" }}>
                <h3>{p.title}</h3>
              </Link>
              <span className="badge mono">{finished ? "Terminé" : `${done}/${p.steps.length}`}</span>
            </div>
            <Gouttes faites={done} total={p.steps.length} label={`${done} étapes faites sur ${p.steps.length}`} />
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
        <span key={t.id} className="chip">
          <Link to={t.kind === "humeur" ? `/explorer/humeur/${t.id}` : `/explorer/theme/${t.id}`} className="row" style={{ gap: 6, textDecoration: "none" }}>
            {t.label}
          </Link>
          <button type="button" aria-label={`Retirer ${t.label}`} onClick={() => update((d) => forgetExplored(d, t.id))} style={{ border: 0, background: "none", padding: 4, cursor: "pointer", display: "grid" }}>
            <X size={14} aria-hidden="true" />
          </button>
        </span>
      ))}
    </div>
  );
}

function Prenom() {
  const { data, update } = useUserData();
  const [edit, setEdit] = useState(false);
  const [val, setVal] = useState(data.prenom ?? "");
  if (!edit)
    return (
      <div className="spread">
        <span className="small muted">Prénom : {data.prenom ?? "non renseigné"}</span>
        <button type="button" className="btn btn-quiet" onClick={() => (setVal(data.prenom ?? ""), setEdit(true))}>
          Modifier
        </button>
      </div>
    );
  return (
    <form
      className="stack"
      onSubmit={(e) => {
        e.preventDefault();
        update((d) => setPrenom(d, val));
        setEdit(false);
      }}
    >
      <label htmlFor="prenom-carnet" className="eyebrow">
        Mon prénom · facultatif
      </label>
      <input id="prenom-carnet" type="text" maxLength={40} value={val} onChange={(e) => setVal(e.target.value)} autoFocus />
      <div className="row">
        <button type="submit" className="btn btn-primary">
          Enregistrer
        </button>
        <button type="button" className="btn btn-quiet" onClick={() => setEdit(false)}>
          Annuler
        </button>
      </div>
    </form>
  );
}
