import { Check, ChevronLeft, ChevronRight, RotateCcw, Target } from "lucide-react";
import { useEffect, useState, type CSSProperties } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { content, type Parcours, type Step } from "../content";
import { PageHeader } from "../components/Layout";
import { PedagogyBlock, ScriptureBlock, TeachingBlock } from "../components/Layers";
import { NoteEditor } from "../components/NoteEditor";
import { GarderButton } from "../components/DiscoveryCard";
import { Arbre } from "../components/arbre/Arbre";
import { Brume } from "../components/arbre/Brume";
import { Gouttes } from "../components/Gouttes";
import { useUserData } from "../lib/useUserData";
import { croissance, resetParcours, setStepDone, visitStep } from "../lib/store";
import { reducedMotion, tokenMs } from "../lib/tokens";
import { NotFound } from "./NotFound";

function useProgress(p: Parcours) {
  const { data } = useUserData();
  const done = data.progress[p.id]?.completedStepIds ?? [];
  const doneCount = p.steps.filter((s) => done.includes(s.id)).length;
  const next = p.steps.find((s) => !done.includes(s.id));
  return { done, doneCount, next, started: p.id in data.progress, finished: doneCount === p.steps.length };
}

/** Chaque parcours est une branche de l'arbre ; chaque leçon terminée ajoute du nuage. */
export function ParcoursList() {
  const { data } = useUserData();
  return (
    <div className="screen">
      <Arbre {...croissance(data, content.parcours)} label="Ton arbre : une branche par parcours, un peu de nuage par leçon" />
      <header className="stack" style={{ gap: "var(--s2)" }}>
        <span className="eyebrow">Parcours</span>
        <h1>
          Grandir dans sa <em>foi</em>
        </h1>
        <p className="muted">Des itinéraires de cinq étapes, à suivre à ton rythme. Chaque étape se parcourt en quelques minutes.</p>
      </header>
      <div className="stack-lg">
        {content.parcours.map((p) => (
          <ParcoursCard key={p.id} parcours={p} />
        ))}
      </div>
    </div>
  );
}

function ParcoursCard({ parcours: p }: { parcours: Parcours }) {
  const { doneCount, started, finished } = useProgress(p);
  return (
    <Link to={`/parcours/${p.id}`} className="card card-pad card-link stack" style={{ gap: "var(--s3)" }}>
      <span className="eyebrow">{p.subtitle}</span>
      <h2 style={{ fontSize: "1.875rem" }}>{p.title}</h2>
      <p className="small muted">{p.description}</p>
      <div className="spread">
        <Gouttes faites={doneCount} total={p.steps.length} label={`${doneCount} étapes faites sur ${p.steps.length}`} />
        <span className="btn btn-quiet" style={{ padding: 0 }}>
          {finished ? "Revoir" : started ? "Continuer" : "Commencer"} →
        </span>
      </div>
    </Link>
  );
}

export function ParcoursDetail() {
  const { id } = useParams();
  const p = content.parcours.find((x) => x.id === id);
  const { update } = useUserData();
  if (!p) return <NotFound />;
  return <ParcoursDetailInner p={p} onReset={() => update((d) => resetParcours(d, p.id))} />;
}

function ParcoursDetailInner({ p, onReset }: { p: Parcours; onReset: () => void }) {
  const { data } = useUserData();
  const { done, doneCount, next, finished } = useProgress(p);
  return (
    <div className="screen">
      <Arbre {...croissance(data, content.parcours)} label={`Ton arbre : ${doneCount} leçon(s) faite(s) sur ${p.steps.length} dans ce parcours`} />
      <PageHeader title="Parcours" />
      <header className="stack" style={{ gap: "var(--s2)" }}>
        <span className="eyebrow">{p.subtitle}</span>
        <Brume as="h1" texte={p.title} cle={p.id} />
        <p className="muted">{p.description}</p>
      </header>

      <ol className="chemin" aria-label="Les étapes du parcours">
        {p.steps.map((s, i) => {
          const isDone = done.includes(s.id);
          const isCurrent = next?.id === s.id;
          return (
            <li key={s.id}>
              <Link to={`/parcours/${p.id}/etape/${s.id}`} className={`etape ${isDone ? "faite" : ""} ${isCurrent ? "courante" : ""}`}>
                <span className="repere" aria-hidden="true">
                  <span className="goutte" style={{ "--g": "16px" } as CSSProperties} />
                </span>
                <span className="stack" style={{ gap: 2 }}>
                  <span className="num">Étape {String(i + 1).padStart(2, "0")}</span>
                  <span className="etape-titre">{s.title}</span>
                  <span className="legende">{isDone ? "Parcourue" : isCurrent ? "Prochaine halte" : "À venir"}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>

      {finished ? (
        <div className="card card-pad stack" style={{ alignItems: "flex-start" }}>
          <h2 style={{ fontSize: "1.75rem" }}>Itinéraire parcouru</h2>
          <p className="muted">Merci pour ta curiosité. Tu peux revenir sur chaque étape quand tu veux.</p>
          <button type="button" className="btn btn-quiet" onClick={onReset}>
            <RotateCcw size={16} aria-hidden="true" /> Recommencer le parcours
          </button>
        </div>
      ) : (
        next && (
          <Link to={`/parcours/${p.id}/etape/${next.id}`} className="btn btn-primary btn-block">
            {doneCount === 0 ? "Commencer le parcours" : `Continuer : ${next.title}`}
          </Link>
        )
      )}
    </div>
  );
}

export function StepScreen() {
  const { id, stepId } = useParams();
  const p = content.parcours.find((x) => x.id === id);
  const index = p?.steps.findIndex((s) => s.id === stepId) ?? -1;
  const { data, update } = useUserData();
  const navigate = useNavigate();
  const [goutte, setGoutte] = useState(0);

  useEffect(() => {
    if (p && index >= 0) update((d) => visitStep(d, p.id, p.steps[index].id));
  }, [p, index, update]);

  if (!p || index < 0) return <NotFound />;
  const step = p.steps[index];
  const passage = content.passagesById.get(step.passageId)!;
  const isDone = data.progress[p.id]?.completedStepIds.includes(step.id) ?? false;
  const prev = p.steps[index - 1];
  const next = p.steps[index + 1];

  // Leçon terminée : une goutte tombe sur l'arbre, qui grandit d'un cran, puis on avance.
  const valider = () => {
    update((d) => setStepDone(d, p.id, step.id, !isDone));
    if (isDone) return;
    setGoutte((g) => g + 1);
    const suite = next ? `/parcours/${p.id}/etape/${next.id}` : `/parcours/${p.id}`;
    window.setTimeout(() => navigate(suite), reducedMotion() ? 0 : tokenMs("--d-croissance"));
  };

  return (
    <div className="screen">
      <PageHeader title={p.title} />
      <header className="stack" style={{ gap: "var(--s3)" }}>
        <span className="num mono legende">
          Étape {String(index + 1).padStart(2, "0")} / {String(p.steps.length).padStart(2, "0")}
        </span>
        <Brume as="h1" texte={step.title} cle={step.id} />
        <div className="row small" style={{ alignItems: "flex-start" }}>
          <Target size={18} aria-hidden="true" style={{ flex: "none", marginTop: 2 }} />
          <span>
            <strong>Objectif :</strong> {step.objective}
          </span>
        </div>
      </header>

      <ScriptureBlock passage={passage} />
      <div className="spread">
        <Link to={`/passage/${passage.id}`} className="btn btn-quiet">
          Fiche complète : {passage.title}
        </Link>
        <GarderButton passageId={passage.id} variant="icone" />
      </div>

      <PedagogyBlock>
        <h3>Le contexte</h3>
        <p>{passage.context}</p>
        <h3>Pour avancer</h3>
        <p>{step.explanation}</p>
      </PedagogyBlock>

      <TeachingBlock teaching={step.teaching} />

      {step.quiz && <Quiz key={step.id} quiz={step.quiz} />}

      {step.reflection && (
        <section className="card card-pad stack">
          <span className="eyebrow">Question de réflexion · facultative</span>
          <p className="lead">{step.reflection}</p>
          <NoteEditor target={{ type: "step", parcoursId: p.id, stepId: step.id }} placeholder="Quelques mots, pour toi seul·e…" />
        </section>
      )}

      <Arbre {...croissance(data, content.parcours)} goutteSurArbre={goutte} className="inline" label="Ton arbre, qui grandit à chaque étape" />

      <button type="button" className={`btn btn-block ${isDone ? "btn-doux" : "btn-primary"}`} aria-pressed={isDone} onClick={valider}>
        {isDone ? (
          <>
            <Check size={18} aria-hidden="true" /> Étape parcourue (annuler)
          </>
        ) : next ? (
          "J'ai parcouru cette étape · suivante"
        ) : (
          "J'ai parcouru cette étape · terminer"
        )}
      </button>

      <nav className="spread" aria-label="Étapes">
        {prev ? (
          <Link to={`/parcours/${p.id}/etape/${prev.id}`} className="btn btn-quiet">
            <ChevronLeft size={18} aria-hidden="true" /> Précédente
          </Link>
        ) : (
          <span />
        )}
        <Link to={`/parcours/${p.id}`} className="btn btn-quiet">
          Itinéraire
        </Link>
        {next ? (
          <Link to={`/parcours/${p.id}/etape/${next.id}`} className="btn btn-quiet">
            Suivante <ChevronRight size={18} aria-hidden="true" />
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </div>
  );
}

function Quiz({ quiz }: { quiz: NonNullable<Step["quiz"]> }) {
  const [picked, setPicked] = useState<number | null>(null);
  const answered = picked !== null;
  return (
    <section className="card card-pad stack" aria-labelledby="quiz-q">
      <span className="eyebrow">Petit quiz de compréhension</span>
      <p id="quiz-q" style={{ fontWeight: 600 }}>
        {quiz.question}
      </p>
      <div className="stack" style={{ gap: 8 }}>
        {quiz.options.map((o, i) => {
          const state = !answered ? undefined : i === quiz.answerIndex ? "right" : i === picked ? "wrong" : undefined;
          return (
            <button key={o} type="button" className="quiz-option" data-state={state} onClick={() => setPicked(i)} disabled={answered && i !== picked && i !== quiz.answerIndex}>
              {o}
              {state === "right" && " ✓"}
            </button>
          );
        })}
      </div>
      {answered && (
        <p className="small" role="status">
          {picked === quiz.answerIndex ? "Bien vu ! " : "Pas tout à fait. "}
          {quiz.feedback}
        </p>
      )}
      {answered && (
        <button type="button" className="btn btn-quiet" style={{ alignSelf: "flex-start" }} onClick={() => setPicked(null)}>
          Réessayer
        </button>
      )}
    </section>
  );
}
