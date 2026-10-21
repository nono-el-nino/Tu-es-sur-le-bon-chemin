import { Shuffle, ArrowRight } from "lucide-react";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { content, randomPassage, type Passage } from "../content";
import { DiscoveryCard } from "../components/DiscoveryCard";
import { TopicIcon } from "../components/Icon";
import { useUserData } from "../lib/useUserData";

const modes = [
  { id: "humeur", label: "Mon humeur" },
  { id: "surprise", label: "Surprends-moi" },
  { id: "theme", label: "Thèmes" },
] as const;
type Mode = (typeof modes)[number]["id"];

export function Explorer() {
  const [params, setParams] = useSearchParams();
  const mode: Mode = (modes.find((m) => m.id === params.get("mode"))?.id ?? "humeur") as Mode;

  return (
    <div className="screen">
      <header className="stack" style={{ gap: 6 }}>
        <span className="eyebrow">Explorer</span>
        <h1>Les Écritures au quotidien</h1>
      </header>

      <div className="segmented" role="tablist" aria-label="Mode de découverte">
        {modes.map((m) => (
          <button key={m.id} role="tab" aria-selected={mode === m.id} onClick={() => setParams({ mode: m.id }, { replace: true })}>
            {m.label}
          </button>
        ))}
      </div>

      {mode === "humeur" && <MoodGrid />}
      {mode === "surprise" && <Surprise />}
      {mode === "theme" && <ThemeList />}
    </div>
  );
}

function MoodGrid() {
  const { data } = useUserData();
  return (
    <section className="stack">
      <p className="muted">Choisis ce qui te ressemble aujourd'hui : un passage t'attend, avec son contexte.</p>
      <div className="mood-grid">
        {content.moods.map((m) => (
          <Link key={m.id} to={`/explorer/humeur/${m.id}`} className={`mood tone-${m.tone} ${data.explored[m.id] ? "explored" : ""}`}>
            <span className="dot">
              <TopicIcon name={m.icon} />
            </span>
            {m.label}
          </Link>
        ))}
      </div>
    </section>
  );
}

function Surprise() {
  const [p, setP] = useState<Passage | undefined>(() => randomPassage(content.passages));
  const [k, setK] = useState(0);
  if (!p) return <p className="muted">Aucun passage disponible pour l'instant.</p>;
  return (
    <section className="stack-lg">
      <p className="muted">Un passage tiré au hasard parmi {content.passages.length} fiches vérifiées.</p>
      <div key={k}>
        <DiscoveryCard passage={p} animate />
      </div>
      <div className="row">
        <button
          type="button"
          className="btn btn-primary"
          style={{ flex: 1 }}
          onClick={() => {
            setP(randomPassage(content.passages, p.id));
            setK((x) => x + 1);
          }}
        >
          <Shuffle size={18} aria-hidden="true" /> Relancer
        </button>
        <Link to={`/passage/${p.id}`} className="btn btn-ghost" style={{ flex: 1 }}>
          Approfondir <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}

function ThemeList() {
  return (
    <section className="stack">
      {content.themes.map((t) => (
        <Link key={t.id} to={`/explorer/theme/${t.id}`} className={`card card-pad card-link tone-${t.tone}`}>
          <div className="row">
            <span className="mood" style={{ border: 0, padding: 0, minHeight: 0, background: "none" }}>
              <span className="dot">
                <TopicIcon name={t.icon} />
              </span>
            </span>
            <div style={{ flex: 1 }}>
              <h3>{t.label}</h3>
              <p className="small muted">{t.description}</p>
            </div>
            <span className="badge">{t.passageIds.length}</span>
          </div>
        </Link>
      ))}
    </section>
  );
}
