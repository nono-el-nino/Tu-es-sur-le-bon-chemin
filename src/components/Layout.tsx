import { ArrowLeft, BookHeart, Compass, Home, Route } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { editorialPreview } from "../content";
import { useUserData } from "../lib/useUserData";
import { tokenMs } from "../lib/tokens";
import { EVENEMENT_ARRIVEE } from "./arbre/vol";

const tabs = [
  { to: "/", label: "Accueil", icon: Home, end: true },
  { to: "/explorer", label: "Explorer", icon: Compass },
  { to: "/parcours", label: "Parcours", icon: Route },
  { to: "/carnet", label: "Carnet", icon: BookHeart },
];

export function Layout() {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo(0, 0), [pathname]);
  return (
    <>
      {editorialPreview && <div className="preview-banner">Aperçu éditorial : les contenus « à vérifier » sont visibles</div>}
      <main className="app">
        <Outlet />
      </main>
      <nav className="bottom-nav" aria-label="Navigation principale">
        <ul>
          {tabs.map(({ to, label, icon: I, end }) => (
            <li key={to}>
              <NavLink to={to} end={end} className={({ isActive }) => (isActive ? "active" : "")} {...(to === "/carnet" ? { "data-cible-carnet": "" } : {})}>
                <I size={22} aria-hidden="true" />
                {label}
                {to === "/carnet" && <CompteurCarnet />}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}

/** Nombre de passages gardés ; il s'incrémente à l'impact de la goutte, avec une onde. */
function CompteurCarnet() {
  const { data } = useUserData();
  const total = data.favorites.length;
  const [affiche, setAffiche] = useState(total);
  const [onde, setOnde] = useState(0);
  const cible = useRef(total);
  cible.current = total;

  useEffect(() => {
    if (total <= affiche) return setAffiche(total); // retrait : immédiat
    // ajout : on attend l'impact (ou la durée du vol, par sécurité)
    const t = window.setTimeout(() => setAffiche(cible.current), tokenMs("--d-garder") + 150);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);

  useEffect(() => {
    const arrivee = () => {
      setAffiche(cible.current);
      setOnde((n) => n + 1);
    };
    window.addEventListener(EVENEMENT_ARRIVEE, arrivee);
    return () => window.removeEventListener(EVENEMENT_ARRIVEE, arrivee);
  }, []);

  return (
    <>
      {onde > 0 && <span key={onde} className="nav-onde actif" aria-hidden="true" />}
      {affiche > 0 && (
        <span className="nav-compteur" aria-label={`${affiche} passage${affiche > 1 ? "s" : ""} gardé${affiche > 1 ? "s" : ""}`}>
          {affiche}
        </span>
      )}
    </>
  );
}

export function PageHeader({ title, back = true, actions }: { title?: string; back?: boolean; actions?: ReactNode }) {
  const navigate = useNavigate();
  return (
    <header className="page-header">
      {back && (
        <button type="button" className="icon-btn" aria-label="Retour" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/"))}>
          <ArrowLeft size={20} aria-hidden="true" />
        </button>
      )}
      <span className="title">{title}</span>
      {actions}
    </header>
  );
}
