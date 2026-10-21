import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Base relative : l'app fonctionne aussi bien à la racine d'un domaine
// que dans un sous-dossier GitHub Pages (/<nom-du-depot>/).
// La navigation utilise des URL en « #/ » : aucune réécriture serveur nécessaire.
export default defineConfig({
  base: process.env.BASE_PATH ?? "./",
  plugins: [react()],
  build: { target: "es2019" },
  test: { environment: "node", include: ["tests/**/*.test.ts"] },
});
