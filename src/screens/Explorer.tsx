import { Shuffle } from "lucide-react";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { content, randomPassage, type Passage } from "../content";
import { DiscoveryCard } from "../components/DiscoveryCard";
import { useUserData } from "../lib/useUserData";
import { MapPanel } from "../components/map/MapPanel";
import { Arbre } from "../components/arbre/Arbre";
import { croissance } from "../lib/store";
import { reducedMotion, tokenMs } from "../lib/tokens";

const modes = [
  { id: "humeur", label: "Mon humeur" },
  { id: "surprise", label: "Surprends-moi" },
  { id: "theme", label: "Thèmes" },
  { id: "carte", label: "Carte" },
] as const;
type Mode = (typeof modes)[number]["id"];

export function Explorer() {
  const [params, setParams] = useSearchParams();
  const mode: Mode = (modes.find((m) => m.id === params.get("mode"))?.id ?? "humeur") as Mode;

  return (
    <div className="screen">
      <header className="stack" style={{ gap: 6 }}>
        <span className="eyebrow">Explorer</span>
        <h1>
          Les Écritures au <em>quotidien</em>
        </h1>
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
      {mode === "carte" && (
        <MapPanel passageId={params.get("passage") ?? undefined} onClearPassage={() => setParams({ mode: "carte" }, { replace: true })} />
      )}
    </div>
  );
}

function MoodGrid() {
  const { data } = useUserData();
  return (
    <section className="stack">
      <p className="muted">Choisis ce qui te ressemble aujourd'hui : un passage t'attend, avec son contexte.</p>
      <div className="pill-row">
        {content.moods.map((m) => (
          <Link key={m.id} to={`/explorer/humeur/${m.id}`} className="pill" aria-label={data.explored[m.id] ? `${m.label} (déjà exploré)` : m.label}>
            {m.label}
          </Link>
        ))}
      </div>
    </section>
  );
}

function Surprise() {
  const { data } = useUserData();
  const [p, setP] = useState<Passage | undefined>(() => randomPassage(content.passages));
  const [averse, setAverse] = useState(0);
  if (!p) return <p className="muted">Aucun passage disponible pour l'instant.</p>;
  // « Nouveau passage » : averse brève de 8 gouttes, puis le passage apparaît en brume
  const relancer = () => {
    setAverse((a) => a + 1);
    window.setTimeout(() => setP((cur) => randomPassage(content.passages, cur?.id)), reducedMotion() ? 0 : tokenMs("--d-averse") / 2);
  };
  return (
    <section className="stack-lg">
      <Arbre {...croissance(data, content.parcours)} averse={averse} className="inline" label="Ton arbre ; touche-le pour faire pleuvoir un passage" onToucher={relancer} />
      <p className="muted">Un passage tiré au hasard parmi {content.passages.length} fiches vérifiées.</p>
      <DiscoveryCard key={p.id} passage={p} animate />
      <button type="button" className="btn btn-primary btn-block" onClick={relancer}>
        <Shuffle size={18} aria-hidden="true" /> Nouveau passage
      </button>
    </section>
  );
}

function ThemeList() {
  return (
    <section className="stack">
      {content.themes.map((t) => (
        <Link key={t.id} to={`/explorer/theme/${t.id}`} className="card card-pad card-link">
          <div className="spread" style={{ alignItems: "flex-start" }}>
            <div className="stack" style={{ gap: "var(--s1)" }}>
              <h2 style={{ fontSize: "1.75rem" }}>{t.label}</h2>
              <p className="small muted">{t.description}</p>
            </div>
            <span className="ref">{t.passageIds.length}</span>
          </div>
        </Link>
      ))}
    </section>
  );
}
