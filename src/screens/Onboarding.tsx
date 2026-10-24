import { useState, type CSSProperties } from "react";
import { Arbre } from "../components/arbre/Arbre";
import { Brume } from "../components/arbre/Brume";
import { useUserData } from "../lib/useUserData";
import { finishOnboarding } from "../lib/store";

/**
 * Premier lancement : l'arbre n'est qu'une pousse ; à chaque écran une goutte tombe
 * et il grandit un peu. Le prénom (facultatif) apparaît en brume à la fin.
 */
const ecrans = [
  {
    titre: "Tu es sur le bon chemin",
    texte: "Une app pour découvrir la Bible et la foi catholique, à ton rythme, sans pression.",
  },
  {
    titre: "La Parole est le ciel",
    texte: "Chaque jour, dis ce que tu ressens : un passage de la Bible t'attend, avec son contexte et des repères pour le comprendre.",
  },
  {
    titre: "Chaque passage te fait grandir",
    texte: "Garde ceux qui te touchent, suis des parcours courts. Ton arbre grandit avec toi.",
  },
];
const croissance = [0, 0.22, 0.46, 0.6];

export function Onboarding() {
  const { update } = useUserData();
  const [etape, setEtape] = useState(0);
  const [prenom, setPrenom] = useState("");
  const [bienvenue, setBienvenue] = useState(false);
  const [goutte, setGoutte] = useState(0);
  const terminer = (p?: string) => update((d) => finishOnboarding(d, p));

  const suivant = () => {
    setGoutte((g) => g + 1);
    setEtape((e) => e + 1);
  };

  const e = ecrans[Math.min(etape, ecrans.length - 1)];
  return (
    <div className="onboarding">
      <Arbre progression={croissance[bienvenue ? 3 : etape]} goutteSurArbre={goutte} label="Ton arbre, qui commence à pousser" />
      <div className="contenu">
        <div className="spread">
          <div className="points" aria-label={`Étape ${etape + 1} sur ${ecrans.length}`}>
            {ecrans.map((_, i) => (
              <span key={i} className={`goutte ${i <= etape ? "on" : ""}`} style={{ "--g": "9px" } as CSSProperties} />
            ))}
          </div>
          {!bienvenue && (
            <button type="button" className="btn btn-quiet" onClick={() => terminer()}>
              Passer
            </button>
          )}
        </div>

        {bienvenue ? (
          <div className="stack-lg">
            <Brume as="h1" texte={`Bienvenue, ${prenom.trim()}.`} />
            <Brume as="p" className="lead" texte="Ton chemin commence ici." cle="b" />
            <button type="button" className="btn btn-primary btn-block" onClick={() => terminer(prenom)}>
              Entrer
            </button>
          </div>
        ) : (
          <div className="stack-lg" key={etape}>
            <Brume as="h1" texte={e.titre} />
            <p className="muted brume-bloc" style={{ fontSize: "1.0625rem" }}>
              {e.texte}
            </p>
            {etape < ecrans.length - 1 ? (
              <button type="button" className="btn btn-primary btn-block" onClick={suivant}>
                Continuer
              </button>
            ) : (
              <form
                className="stack"
                onSubmit={(ev) => {
                  ev.preventDefault();
                  if (prenom.trim()) {
                    setGoutte((g) => g + 1);
                    setBienvenue(true);
                  } else terminer();
                }}
              >
                <label htmlFor="prenom" className="eyebrow">
                  Ton prénom · facultatif
                </label>
                <input id="prenom" type="text" autoComplete="given-name" maxLength={40} value={prenom} onChange={(ev) => setPrenom(ev.target.value)} placeholder="Pour te saluer, rien de plus" />
                <p className="legende">Il reste sur ton téléphone, comme tout le reste.</p>
                <button type="submit" className="btn btn-primary btn-block">
                  Commencer
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
