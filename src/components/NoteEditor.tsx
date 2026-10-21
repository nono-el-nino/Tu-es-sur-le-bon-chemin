import { PenLine, Trash2 } from "lucide-react";
import { useState } from "react";
import { deleteNote, upsertNote, type Note } from "../lib/store";
import { useUserData } from "../lib/useUserData";

const sameTarget = (a: Note["target"], b: Note["target"]) => JSON.stringify(a) === JSON.stringify(b);

/** Note privée rattachée à un passage ou à une étape. Stockée sur l'appareil uniquement. */
export function NoteEditor({ target, placeholder, label = "Ma réflexion" }: { target: Note["target"]; placeholder?: string; label?: string }) {
  const { data, update } = useUserData();
  const existing = data.notes.find((n) => sameTarget(n.target, target));
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(existing?.text ?? "");

  if (!editing) {
    return existing ? (
      <div className="card card-pad stack">
        <span className="eyebrow">{label}</span>
        <p style={{ whiteSpace: "pre-wrap" }}>{existing.text}</p>
        <div className="row">
          <button type="button" className="btn btn-ghost" onClick={() => (setText(existing.text), setEditing(true))}>
            <PenLine size={16} aria-hidden="true" /> Modifier
          </button>
          <button type="button" className="btn btn-quiet" onClick={() => update((d) => deleteNote(d, existing.id))}>
            <Trash2 size={16} aria-hidden="true" /> Supprimer
          </button>
        </div>
      </div>
    ) : (
      <button type="button" className="btn btn-ghost btn-block" onClick={() => setEditing(true)}>
        <PenLine size={16} aria-hidden="true" /> Écrire une note personnelle
      </button>
    );
  }

  return (
    <form
      className="stack"
      onSubmit={(e) => {
        e.preventDefault();
        update((d) => upsertNote(d, target, text, existing?.id));
        setEditing(false);
      }}
    >
      <label className="eyebrow" htmlFor="note">
        {label}
      </label>
      <textarea id="note" value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder ?? "Ce que ce passage éveille en moi…"} autoFocus />
      <p className="layer-note">Visible uniquement par toi, enregistrée sur cet appareil.</p>
      <div className="row">
        <button type="submit" className="btn btn-primary">
          Enregistrer
        </button>
        <button type="button" className="btn btn-quiet" onClick={() => setEditing(false)}>
          Annuler
        </button>
      </div>
    </form>
  );
}
