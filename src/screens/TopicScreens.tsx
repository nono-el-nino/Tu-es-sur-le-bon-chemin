import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { content } from "../content";
import { DiscoveryCard } from "../components/DiscoveryCard";
import { PageHeader } from "../components/Layout";
import { PassageView } from "../components/PassageView";
import { useUserData } from "../lib/useUserData";
import { markExplored } from "../lib/store";
import { NotFound } from "./NotFound";

export function MoodScreen() {
  const { id } = useParams();
  const mood = content.moods.find((m) => m.id === id);
  const { update } = useUserData();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (mood) update((d) => markExplored(d, mood.id));
  }, [mood, update]);

  if (!mood) return <NotFound />;
  const passage = content.passagesById.get(mood.passageIds[index % mood.passageIds.length])!;
  const many = mood.passageIds.length > 1;

  return (
    <div className="screen">
      <PageHeader title={mood.label} />
      <p className="muted">{mood.description}</p>
      <PassageView key={passage.id} passage={passage} eyebrow={mood.prompt} animate />
      {many && (
        <button type="button" className="btn btn-primary btn-block" onClick={() => setIndex((i) => i + 1)}>
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
