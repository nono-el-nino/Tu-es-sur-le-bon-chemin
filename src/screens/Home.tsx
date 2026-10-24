import { ArrowRight, Route as RouteIcon, Shuffle } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { content, passageOfTheDay } from "../content";
import { DiscoveryCard } from "../components/DiscoveryCard";
import { Arbre } from "../components/arbre/Arbre";
import { Brume } from "../components/arbre/Brume";
import { Gouttes } from "../components/Gouttes";
import { useUserData } from "../lib/useUserData";
import { croissance, lastActiveParcours } from "../lib/store";

export function Home() {
  const { data } = useUserData();
  const [averse, setAverse] = useState(0);
  const today = passageOfTheDay(content.passages);
  const hour = new Date().getHours();
  const hello = hour < 5 || hour >= 18 ? "Bonsoir" : "Bonjour";
  const dateLabel = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  const arbre = croissance(data, content.parcours);

  const counts = Object.fromEntries(content.parcours.map((p) => [p.id, p.steps.length]));
  const activeId = lastActiveParcours(data, counts);
  const active = content.parcours.find((p) => p.id === activeId);
  const activeDone = active ? active.steps.filter((s) => data.progress[active.id]?.completedStepIds.includes(s.id)).length : 0;
  const nextStep = active?.steps.find((s) => !data.progress[active.id]?.completedStepIds.includes(s.id));

  return (
    <div className="screen">
      <Arbre {...arbre} averse={averse} onToucher={() => setAverse((a) => a + 1)} />

      <header className="stack" style={{ gap: "var(--s3)" }}>
        <span className="eyebrow">
          {hello}
          {data.prenom ? ` ${data.prenom}` : ""} · {dateLabel}
        </span>
        <Brume as="h1" texte="De quoi as-tu besoin aujourd'hui ?" emphase={["aujourd'hui"]} />
      </header>

      <section className="stack" aria-label="Selon ce que tu ressens">
        <div className="pill-row">
          {content.moods.map((m) => (
            <Link key={m.id} to={`/explorer/humeur/${m.id}`} className="pill">
              {m.label}
            </Link>
          ))}
        </div>
      </section>

      {today && (
        <section className="stack" aria-labelledby="jour">
          <h2 id="jour">Le passage du jour</h2>
          <DiscoveryCard passage={today} etiquette="Aujourd'hui" />
        </section>
      )}

      {active && nextStep && (
        <Link to={`/parcours/${active.id}/etape/${nextStep.id}`} className="card card-pad card-link stack" style={{ gap: "var(--s2)" }}>
          <span className="eyebrow">Reprendre mon parcours</span>
          <h2 style={{ fontSize: "1.75rem" }}>{active.title}</h2>
          <span className="muted small">Étape suivante : {nextStep.title}</span>
          <div className="spread">
            <Gouttes faites={activeDone} total={active.steps.length} label={`${activeDone} étapes faites sur ${active.steps.length}`} />
            <ArrowRight size={20} aria-hidden="true" />
          </div>
        </Link>
      )}

      <section className="stack" aria-label="Accès rapides">
        <Link to="/explorer?mode=surprise" className="card card-pad card-link">
          <div className="row">
            <Shuffle size={22} aria-hidden="true" />
            <div style={{ flex: 1 }}>
              <h3>Surprends-moi</h3>
              <p className="small muted">Un passage tiré au hasard, qui tombe du nuage.</p>
            </div>
            <ArrowRight size={20} aria-hidden="true" />
          </div>
        </Link>
        <Link to="/parcours" className="card card-pad card-link">
          <div className="row">
            <RouteIcon size={22} aria-hidden="true" />
            <div style={{ flex: 1 }}>
              <h3>Les parcours</h3>
              <p className="small muted">Chaque parcours fait pousser une branche de ton arbre.</p>
            </div>
            <ArrowRight size={20} aria-hidden="true" />
          </div>
        </Link>
      </section>
    </div>
  );
}
