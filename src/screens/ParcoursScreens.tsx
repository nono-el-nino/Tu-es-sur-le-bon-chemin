import { Check, ChevronLeft, ChevronRight, Flag, RotateCcw, Target } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { content, type Parcours, type Step } from "../content";
import { ParcoursArt } from "../components/Illustrations";
import { PageHeader } from "../components/Layout";
import { PedagogyBlock, ScriptureBlock, TeachingBlock } from "../components/Layers";
import { NoteEditor } from "../components/NoteEditor";
import { FavoriteButton } from "../components/DiscoveryCard";
import { useUserData } from "../lib/useUserData";
import { resetParcours, setStepDone, visitStep } from "../lib/store";
import { NotFound } from "./NotFound";

function useProgress(p: Parcours) {
  const { data } = useUserData();
  const done = data.progress[p.id]?.completedStepIds ?? [];
  const doneCount = p.steps.filter((s) => done.includes(s.id)).length;
  const next = p.steps.find((s) => !done.includes(s.id));
  return { done, doneCount, next, started: p.id in data.progress, finished: doneCount === p.steps.length };
}

export function ParcoursList() {
  return (
    <div className="screen">
      <header className="stack" style={{ gap: 6 }}>
        <span className="eyebrow">Parcours</span>
        <h1>Grandir dans sa foi</h1>
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
    <Link to={`/parcours/${p.id}`} className={`card card-link parcours-card tone-${p.tone}`}>
      <div className="art">
        <ParcoursArt kind={p.illustration} tone={p.tone} />
      </div>
      <div className="card-pad stack" style={{ gap: 8 }}>
        <span className="eyebrow">{p.subtitle}</span>
        <h2>{p.title}</h2>
        <p className="small muted">{p.description}</p>
        <div className="spread small">
          <span>{finished ? "Parcours terminé" : started ? `${doneCount} étape${doneCount > 1 ? "s" : ""} sur ${p.steps.length}` : `${p.steps.length} étapes`}</span>
          <span style={{ fontWeight: 600, color: "var(--terracotta-ink)" }}>{finished ? "Revoir" : started ? "Continuer" : "Commencer"} →</span>
        </div>
        <div className="progress" aria-hidden="true">
          <span style={{ width: `${(doneCount / p.steps.length) * 100}%` }} />
        </div>
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
  const { done, doneCount, next, finished } = useProgress(p);
  return (
    <div className="screen">
      <PageHeader title="Parcours" />
      <div className={`card parcours-card tone-${p.tone}`}>
        <div className="art">
          <ParcoursArt kind={p.illustration} tone={p.tone} />
        </div>
        <div className="card-pad stack" style={{ gap: 8 }}>
          <span className="eyebrow">{p.subtitle}</span>
          <h1 style={{ fontSize: "1.6rem" }}>{p.title}</h1>
          <p className="muted">{p.description}</p>
          <div className="progress" aria-label={`${doneCount} étapes parcourues sur ${p.steps.length}`}>
            <span style={{ width: `${(doneCount / p.steps.length) * 100}%` }} />
          </div>
        </div>
      </div>

      <section className="itinerary" aria-label="Itinéraire">
        <Trail count={p.steps.length} />
        <ol>
          {p.steps.map((s, i) => {
            const isDone = done.includes(s.id);
            const isCurrent = next?.id === s.id;
            return (
              <li key={s.id}>
                <Link to={`/parcours/${p.id}/etape/${s.id}`} className={`stop ${isDone ? "done" : ""} ${isCurrent ? "current" : ""}`}>
                  <span className="marker" aria-hidden="true">
                    {isDone ? <Check size={18} /> : i + 1}
                  </span>
                  <span className="stack" style={{ gap: 2 }}>
                    <span className="stop-title">{s.title}</span>
                    <span className="small muted">{isDone ? "Parcourue" : isCurrent ? "Prochaine halte" : `Étape ${i + 1}`}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </section>

      {finished ? (
        <div className="finish-flag stack" style={{ alignItems: "center" }}>
          <Flag aria-hidden="true" />
          <h3>Itinéraire parcouru</h3>
          <p className="small">Merci pour ta curiosité. Tu peux revenir sur chaque étape quand tu veux.</p>
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

/** Chemin pointillé reliant les étapes, en zigzag. */
function Trail({ count }: { count: number }) {
  const pts = Array.from({ length: count }, (_, i) => [i % 2 === 0 ? 18 : 82, ((i + 0.5) / count) * 100]);
  const d = pts.reduce((acc, [x, y], i) => {
    if (i === 0) return `M${x} ${y}`;
    const [px, py] = pts[i - 1];
    const my = (py + y) / 2;
    return `${acc} C ${px} ${my} ${x} ${my} ${x} ${y}`;
  }, "");
  return (
    <svg className="trail" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <path d={d} fill="none" stroke="#D87859" strokeWidth="1.4" strokeDasharray="0.5 3" strokeLinecap="round" vectorEffect="non-scaling-stroke" style={{ strokeWidth: 3 }} />
    </svg>
  );
}

export function StepScreen() {
  const { id, stepId } = useParams();
  const p = content.parcours.find((x) => x.id === id);
  const index = p?.steps.findIndex((s) => s.id === stepId) ?? -1;
  const { data, update } = useUserData();
  const navigate = useNavigate();

  useEffect(() => {
    if (p && index >= 0) update((d) => visitStep(d, p.id, p.steps[index].id));
  }, [p, index, update]);

  if (!p || index < 0) return <NotFound />;
  const step = p.steps[index];
  const passage = content.passagesById.get(step.passageId)!;
  const isDone = data.progress[p.id]?.completedStepIds.includes(step.id) ?? false;
  const prev = p.steps[index - 1];
  const next = p.steps[index + 1];

  return (
    <div className="screen">
      <PageHeader title={p.title} />
      <header className="stack" style={{ gap: 8 }}>
        <span className="eyebrow">
          Étape {index + 1} sur {p.steps.length}
        </span>
        <h1>{step.title}</h1>
        <div className="row small" style={{ alignItems: "flex-start" }}>
          <Target size={18} aria-hidden="true" style={{ flex: "none", marginTop: 2, color: "var(--turquoise-ink)" }} />
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
        <FavoriteButton passageId={passage.id} />
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
          <p className="reading lead">{step.reflection}</p>
          <NoteEditor target={{ type: "step", parcoursId: p.id, stepId: step.id }} placeholder="Quelques mots, pour toi seul·e…" />
        </section>
      )}

      <button
        type="button"
        className={`btn btn-block ${isDone ? "btn-ghost" : "btn-primary"}`}
        aria-pressed={isDone}
        onClick={() => {
          update((d) => setStepDone(d, p.id, step.id, !isDone));
          if (!isDone) navigate(next ? `/parcours/${p.id}/etape/${next.id}` : `/parcours/${p.id}`);
        }}
      >
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
