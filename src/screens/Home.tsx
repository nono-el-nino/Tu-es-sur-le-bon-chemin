import { ArrowRight, Shuffle, Route as RouteIcon, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { content, passageOfTheDay } from "../content";
import { DiscoveryCard } from "../components/DiscoveryCard";
import { HeroArt } from "../components/Illustrations";
import { TopicIcon } from "../components/Icon";
import { useUserData } from "../lib/useUserData";
import { lastActiveParcours } from "../lib/store";

export function Home() {
  const { data } = useUserData();
  const today = passageOfTheDay(content.passages);
  const hour = new Date().getHours();
  const hello = hour < 5 || hour >= 18 ? "Bonsoir" : "Bonjour";
  const dateLabel = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

  const counts = Object.fromEntries(content.parcours.map((p) => [p.id, p.steps.length]));
  const activeId = lastActiveParcours(data, counts);
  const active = content.parcours.find((p) => p.id === activeId);
  const activeProgress = active ? data.progress[active.id] : undefined;
  const nextStep = active?.steps.find((s) => !activeProgress?.completedStepIds.includes(s.id));

  return (
    <div className="screen">
      <section className="hero">
        <HeroArt className="hero-art" />
        <div className="hero-content">
          <span className="eyebrow">
            {hello} · {dateLabel}
          </span>
          <h1>De quoi as-tu besoin aujourd'hui&nbsp;?</h1>
        </div>
      </section>

      <section className="stack" aria-labelledby="humeurs">
        <div className="section-title">
          <h2 id="humeurs">Selon ce que tu ressens</h2>
          <Link to="/explorer">Tout voir</Link>
        </div>
        <div className="mood-grid">
          {content.moods.slice(0, 6).map((m) => (
            <Link key={m.id} to={`/explorer/humeur/${m.id}`} className={`mood tone-${m.tone}`}>
              <span className="dot">
                <TopicIcon name={m.icon} />
              </span>
              {m.label}
            </Link>
          ))}
        </div>
      </section>

      {active && nextStep && (
        <Link to={`/parcours/${active.id}/etape/${nextStep.id}`} className={`card card-pad card-link tone-${active.tone}`}>
          <div className="spread">
            <div className="stack" style={{ gap: 6, flex: 1 }}>
              <span className="eyebrow">Reprendre mon parcours</span>
              <h3>{active.title}</h3>
              <span className="small muted">
                Étape suivante : {nextStep.title} · {activeProgress?.completedStepIds.length ?? 0}/{active.steps.length}
              </span>
              <div className="progress" aria-hidden="true">
                <span style={{ width: `${((activeProgress?.completedStepIds.length ?? 0) / active.steps.length) * 100}%` }} />
              </div>
            </div>
            <ChevronRight aria-hidden="true" />
          </div>
        </Link>
      )}

      {today && (
        <section className="stack" aria-labelledby="jour">
          <h2 id="jour">La découverte du jour</h2>
          <DiscoveryCard passage={today} />
        </section>
      )}

      <section className="stack" aria-label="Accès rapides">
        <Link to="/explorer?mode=surprise" className="card card-pad card-link">
          <div className="row">
            <span className="mood tone-sable" style={{ border: 0, padding: 0, minHeight: 0, background: "none" }}>
              <span className="dot">
                <Shuffle size={18} aria-hidden="true" />
              </span>
            </span>
            <div style={{ flex: 1 }}>
              <h3>Surprends-moi</h3>
              <p className="small muted">Un passage tiré au hasard dans le catalogue.</p>
            </div>
            <ArrowRight size={18} aria-hidden="true" />
          </div>
        </Link>
        <Link to="/parcours" className="card card-pad card-link">
          <div className="row">
            <span className="mood tone-turquoise" style={{ border: 0, padding: 0, minHeight: 0, background: "none" }}>
              <span className="dot">
                <RouteIcon size={18} aria-hidden="true" />
              </span>
            </span>
            <div style={{ flex: 1 }}>
              <h3>Les parcours</h3>
              <p className="small muted">Des itinéraires courts pour approfondir, à ton rythme.</p>
            </div>
            <ArrowRight size={18} aria-hidden="true" />
          </div>
        </Link>
      </section>
    </div>
  );
}
