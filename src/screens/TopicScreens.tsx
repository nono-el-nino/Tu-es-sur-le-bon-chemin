import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { content } from "../content";
import { DiscoveryCard } from "../components/DiscoveryCard";
import { PageHeader } from "../components/Layout";
import { PassageView } from "../components/PassageView";
import { useUserData } from "../lib/useUserData";
import { croissance, markExplored } from "../lib/store";
import { meteoDe } from "../lib/meteo";
import { reducedMotion, tokenMs } from "../lib/tokens";
import { Arbre } from "../components/arbre/Arbre";
import { NotFound } from "./NotFound";

export function MoodScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const mood = content.moods.find((m) => m.id === id);
  const { data, update } = useUserData();
  const [index, setIndex] = useState(0);
  const [averse, setAverse] = useState(0);

  useEffect(() => {
    if (mood) update((d) => markExplored(d, mood.id));
    setIndex(0);
  }, [mood, update]);

  if (!mood) return <NotFound />;
  const meteo = meteoDe(mood.id);
  const passage = content.passagesById.get(mood.passageIds[index % mood.passageIds.length])!;
  const many = mood.passageIds.length > 1;

  // « Un autre passage » : averse brève, puis le nouveau passage apparaît en brume
  const autre = () => {
    setAverse((a) => a + 1);
    window.setTimeout(() => setIndex((i) => i + 1), reducedMotion() ? 0 : tokenMs("--d-averse") / 2);
  };

  return (
    <div className="screen">
      <Arbre {...croissance(data, content.parcours)} teinte={meteo.teinte} pluie={meteo.gouttes} averse={averse} label={`Ton arbre, sous un ciel « ${mood.label.toLowerCase()} »`} />
      <PageHeader title="Ce que je ressens" />
      <div className="pill-row" role="group" aria-label="Changer d'humeur">
        {content.moods.map((m) => (
          <button key={m.id} type="button" className="pill small" aria-pressed={m.id === mood.id} onClick={() => navigate(`/explorer/humeur/${m.id}`, { replace: true })}>
            {m.label}
          </button>
        ))}
      </div>
      <p className="muted">{mood.description}</p>
      <PassageView key={passage.id} passage={passage} eyebrow={mood.prompt} humeur={mood.id} />
      {many && (
        <button type="button" className="btn btn-doux btn-block" onClick={autre}>
          <RefreshCw size={18} aria-hidden="true" /> Découvrir un autre passage
        </button>
      )}
    </div>
  );
}

export function ThemeScreen() {
  const { id } = useParams();
  const theme = content.themes.find((t) => t.id === id);
  const { update } = useUserData();
  useEffect(() => {
    if (theme) update((d) => markExplored(d, theme.id));
  }, [theme, update]);
  if (!theme) return <NotFound />;
  return (
    <div className="screen">
      <PageHeader title="Thème" />
      <header className="stack" style={{ gap: 6 }}>
        <span className="eyebrow">{theme.prompt}</span>
        <h1>{theme.label}</h1>
        <p className="muted">{theme.description}</p>
      </header>
      <div className="stack">
        {theme.passageIds.map((pid) => (
          <DiscoveryCard key={pid} passage={content.passagesById.get(pid)!} compact />
        ))}
      </div>
    </div>
  );
}

export function PassageScreen() {
  const { id } = useParams();
  const passage = id ? content.passagesById.get(id) : undefined;
  if (!passage) return <NotFound />;
  return (
    <div className="screen">
      <PageHeader title="Lecture" />
      <PassageView passage={passage} />
    </div>
  );
}
