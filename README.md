# Tu es sur le bon chemin

Application mobile (PWA) pour découvrir, comprendre et approfondir la foi catholique :
un passage biblique selon ce que l'on ressent, des parcours pédagogiques courts et un carnet personnel.

- **Accueil** : découverte du jour, « De quoi as-tu besoin aujourd'hui ? », reprise du parcours en cours.
- **Explorer** : par humeur (10), « Surprends-moi » (tirage au hasard), par thème (8).
- **Parcours** : 3 itinéraires de 5 étapes (objectif, référence, explication, Catéchisme, réflexion, quiz, validation manuelle).
- **Carnet** : favoris, notes privées, parcours, thèmes explorés. Modification et suppression possibles.

Sans compte, sans backend, sans IA : tout est statique, et les données personnelles restent dans le `localStorage` de l'appareil.

## Démarrer

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # tests du contenu et du stockage local
npm run build      # build de production dans dist/
npm run preview    # sert dist/ en local
```

Node 20 ou plus récent.

## Fiabilité des contenus

### Trois niveaux, toujours distingués à l'écran

| Niveau | Source | Rendu |
| --- | --- | --- |
| **Écriture** | Bible AELF, traduction liturgique officielle | Cadre bleu, référence exacte et lien vers le chapitre sur aelf.org |
| **Enseignement officiel** | Catéchisme de l'Église catholique (CEC) | Encadré turquoise, numéros de paragraphes et lien vers vatican.va |
| **Explication pédagogique** | Rédaction de l'application | Encadré pointillé, avec la mention « ce n'est pas un texte officiel de l'Église » |

### Droits de reproduction : le texte biblique n'est pas affiché

La traduction AELF (© AELF) et le Catéchisme (© Libreria Editrice Vaticana) sont protégés.
Sans autorisation écrite, **l'application n'en reproduit aucun extrait** : elle affiche la référence
(livre, chapitre, versets, traduction) et un bouton « Lire le texte sur AELF » qui ouvre le chapitre.

Si une autorisation est obtenue, le champ `text` d'un passage peut recevoir
`{ "content": "…", "authorization": "réf. de l'accord AELF, date" }`. Les tests refusent un texte sans autorisation documentée.

Les titres des fiches sont descriptifs (« Le père et ses deux fils »), jamais des citations.
Un test vérifie qu'aucune citation entre guillemets de plus de 6 mots n'apparaît dans les textes éditoriaux.

### Statut éditorial

Chaque passage, humeur, thème, parcours et étape a un bloc `editorial` :

```json
"editorial": { "status": "valide", "updatedAt": "2026-10-21", "reviewer": "…", "notes": "…" }
```

- `brouillon` : jamais affiché.
- `a_verifier` : masqué en production, visible avec un badge en **aperçu éditorial**.
- `valide` : publié.

Les contenus non validés disparaissent aussi des humeurs, thèmes et parcours qui les citent.
Aperçu éditorial : `VITE_EDITORIAL_PREVIEW=true npm run dev`.

### État actuel du catalogue

- **35 passages validés**, plus 4 fiches non publiées : 3 psaumes `a_verifier` et 1 `brouillon`.
  - Les psaumes restent `a_verifier` parce que la numérotation dans les URL d'aelf.org (grecque ou hébraïque) n'a pas pu être confirmée.
- 10 humeurs, 8 thèmes publiés (« Marie » reste `a_verifier`), 3 parcours de 5 étapes.
- **Relecture** : les références et les explications ont été rédigées et relues lors de la création, à partir des sources citées.
  Il faut une **relecture humaine compétente** (prêtre, catéchiste, théologien) avant toute diffusion large.
  Indique-la dans le champ `reviewer`.
- **Liens** : les liens suivent le format `https://www.aelf.org/bible/{Livre}/{chapitre}`. Ils n'ont pas pu être testés depuis l'environnement de développement.
  Lance `npm run check-links`. Le workflow GitHub le fait aussi, à titre informatif. Vérifie ensuite à l'œil quelques pages.
- Les références au Catéchisme renvoient à l'index officiel (`vatican.va/archive/ccc/index_fr.htm`) avec le numéro de paragraphe.

## Modifier les contenus

Tout est dans `src/content/data/`, indépendamment de l'interface :

| Fichier | Contenu |
| --- | --- |
| `passages.json` | Fiches bibliques : référence, lien AELF, contexte, explication, renvois au CEC, statut |
| `topics.json` | Humeurs (`kind: "humeur"`) et thèmes (`kind: "theme"`), avec la liste ordonnée des passages associés |
| `parcours.json` | Parcours et étapes (objectif, passage, explication, CEC, réflexion, quiz) |
| `sources.json` | Sources et mentions de droits affichées dans « Sources et méthode » |

Le schéma est dans `src/content/schema.ts` (zod). Il est vérifié au démarrage de l'app et par `npm test`.

**Ajouter un passage :**

1. Ajoute une entrée dans `passages.json` avec `status: "a_verifier"`. `sourceUrl` doit valoir exactement `https://www.aelf.org/bible/{bookCode}/{chapter}`.
2. Ouvre le lien et vérifie le chapitre, les versets et le contexte. Fais relire l'explication.
3. Passe le statut à `valide`, puis renseigne `updatedAt` et `reviewer`.
4. Ajoute l'id du passage dans une humeur, un thème ou une étape de parcours.
5. Lance `npm test`.

**Valider un psaume :** ouvre `https://www.aelf.org/bible/Ps/22` et vérifie qu'il s'agit bien du psaume du berger.
Si oui, passe `p-ps23-berger`, `p-ps139-tu-me-connais` et `p-ps51-miserere` en `valide`, après avoir complété leurs explications.
Sinon, corrige `chapter` et `sourceUrl` avec la numérotation hébraïque.

## Déploiement sur GitHub Pages

1. Pousse sur `main` (ou `master`).
2. Dans le dépôt : **Settings → Pages → Source : GitHub Actions**.
3. Le workflow `.github/workflows/deploy.yml` lance les tests, construit l'app et la publie sur `https://<utilisateur>.github.io/<depot>/`.

Choix techniques pour GitHub Pages :

- `base: "./"` dans Vite : les ressources sont chargées en chemins relatifs. L'app marche à la racine comme dans un sous-dossier.
- Navigation en `HashRouter` (`#/parcours/...`) : pas de 404 au rechargement, et aucune réécriture serveur nécessaire.
- `public/.nojekyll` désactive le traitement Jekyll.

## PWA

- `public/manifest.webmanifest` et les icônes `public/icons/`. Pour les régénérer : `npm run icons`, avec Playwright et Chromium.
- `public/sw.js` :
  - les pages passent d'abord par le réseau, avec repli sur le cache ;
  - les ressources versionnées sont servies depuis le cache ;
  - l'app fonctionne hors ligne après la première visite.
- Sur iPhone : Safari → Partager → « Sur l'écran d'accueil ».

## Structure

```
src/
  content/      schéma, données JSON, filtrage du catalogue public
  lib/          stockage local (opérations pures + contexte React)
  components/   design system : cartes, niveaux de contenu, illustrations SVG, navigation
  screens/      Accueil, Explorer, Humeur/Thème/Passage, Parcours/Étape, Carnet, À propos
  styles/       global.css (palette « Atlas contemporain »)
tests/          contenu (schéma, sources, statuts, droits) et stockage (favoris, notes, progression)
```

## Direction artistique

« Atlas contemporain » : ivoire `#F8F5ED`, bleu profond `#233D56`, terracotta `#D87859`, turquoise `#59A99E`, sable `#EBCB79`.

- Les variantes plus foncées de ces couleurs (`--*-ink`) servent aux textes, pour garder un contraste AA.
- Polices : Fraunces (titres éditoriaux) et Inter (texte), embarquées, donc disponibles hors ligne.
- Illustrations SVG originales générées à partir de l'identifiant de chaque contenu : horizons, soleils, chemins pointillés, constellations.
- Pas de croix omniprésentes, de parchemins ni de dorures.
