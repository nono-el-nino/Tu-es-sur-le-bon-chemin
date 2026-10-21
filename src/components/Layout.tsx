import { BookHeart, Compass, Home, Route } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { editorialPreview } from "../content";

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
              <NavLink to={to} end={end} className={({ isActive }) => (isActive ? "active" : "")}>
                <I size={22} strokeWidth={2} aria-hidden="true" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
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
