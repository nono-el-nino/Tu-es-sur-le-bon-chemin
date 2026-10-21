import type { EditorialStatus } from "../content/schema";

/** N'apparaît qu'en mode aperçu éditorial, pour les contenus non validés. */
export function StatusBadge({ status }: { status: EditorialStatus }) {
  if (status === "valide") return null;
  return (
    <span className="badge badge-warn" style={{ alignSelf: "flex-start" }}>
      {status === "a_verifier" ? "À vérifier — aperçu éditorial" : "Brouillon"}
    </span>
  );
}
