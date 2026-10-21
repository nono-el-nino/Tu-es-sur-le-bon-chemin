import { Link } from "react-router-dom";
import { PageHeader } from "../components/Layout";

export function NotFound() {
  return (
    <div className="screen">
      <PageHeader />
      <div className="empty">
        <h2>Ce chemin n'existe pas (encore)</h2>
        <p className="muted">Le contenu demandé est introuvable ou n'a pas encore été validé.</p>
        <Link to="/" className="btn btn-primary">
          Revenir à l'accueil
        </Link>
      </div>
    </div>
  );
}
