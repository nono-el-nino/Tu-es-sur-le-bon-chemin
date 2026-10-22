# Tu es sur le bon chemin

Application mobile (PWA) pour découvrir, comprendre et approfondir la foi catholique :
un passage biblique selon ce que l'on ressent, des parcours pédagogiques courts et un carnet personnel.

- **Accueil** : découverte du jour, « De quoi as-tu besoin aujourd'hui ? », reprise du parcours en cours.
- **Explorer** : par humeur (10), « Surprends-moi » (tirage au hasard), par thème (8), et **carte** des lieux bibliques.
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
  - La numérotation des psaumes est confirmée : `aelf.org/bible/Ps/22` est bien le psaume du berger (numérotation liturgique). Les fiches psaumes restent `a_verifier` en attendant que leurs explications soient complétées et relues.
- 10 humeurs, 8 thèmes publiés (« Marie » reste `a_verifier`), 3 parcours de 5 étapes.
- **Relecture** : les références et les explications ont été rédigées et relues lors de la création, à partir des sources citées.
  Il faut une **relecture humaine compétente** (prêtre, catéchiste, théologien) avant toute diffusion large.
  Indique-la dans le champ `reviewer`.
- **Liens** : les liens suivent le format `https://www.aelf.org/bible/{Livre}/{chapitre}`. Le workflow GitHub les vérifie à chaque déploiement (`npm run check-links`).
- **Références** : un test confronte chaque fiche à la structure de la Bible AELF : le chapitre doit exister et les versets ne doivent pas dépasser sa fin.
- **Liens vers le Catéchisme** : chaque référence ouvre la page de vatican.va qui contient le premier paragraphe cité.
  - Exemple : CEC § 1716 → `…/archive/FRA0013/__P5C.HTM#:~:text=1716`.
  - Le fragment `#:~:text=` fait défiler la page jusqu'au paragraphe et le surligne (Safari 16.1+, Chrome). Les autres navigateurs ouvrent simplement la bonne page.
  - La correspondance paragraphe → page est dans `scripts/data/cec-pages.json`. Elle a été relevée sur vatican.va et couvre les 2865 paragraphes.

## Carte des lieux

Dans Explorer → Carte, et depuis chaque fiche (« Voir sur la carte »).

- **Deux fonds**, via le sélecteur « Aujourd'hui / À l'époque » :
  - *Aujourd'hui* : villes et frontières actuelles (OpenStreetMap / CARTO). Les frontières sont indicatives.
  - *À l'époque* : le même relief, sans les noms modernes, avec au choix l'Empire perse (vers 500 av. J.-C.), le royaume d'Hérode (vers 4 av. J.-C.), l'Empire romain (117 apr. J.-C.) et les voies romaines.
- **Filtres** : Ancien Testament, Évangiles, Actes et lettres ; masquer ou afficher les localisations débattues.
- **Fiche d'un lieu** :
  - le site identifié aujourd'hui (ex. Capharnaüm → Tell Hum) ;
  - le niveau de confiance des spécialistes (score OpenBible sur 1000) ;
  - les autres localisations proposées, dessinées en gris sur la carte ;
  - les fiches concernées, avec le rôle du lieu et le verset de référence ;
  - les liens vers OpenBible, Pleiades, DARE et Wikidata.

### Sources et fiabilité

| Donnée | Source | Licence |
| --- | --- | --- |
| Localisations, scores de confiance, contours des régions, tracés des fleuves | [OpenBible.info Bible Geocoding Data](https://github.com/openbibleinfo/Bible-Geocoding-Data), synthèse de plus de 70 atlas, dictionnaires et commentaires | CC BY 4.0 (géométries OSM : ODbL) |
| Empires perse et romain, royaume d'Hérode, voies romaines | [Ancient World Mapping Center](https://github.com/AWMC/geodata), d'après le *Barrington Atlas of the Greek and Roman World* | ODbL 1.0 |
| Fonds de carte | © OpenStreetMap, © CARTO | ODbL / conditions CARTO |

Niveaux affichés, d'après le score de l'identification la mieux notée :
- **sûre** : 800 ou plus ;
- **probable** : de 500 à 799 ;
- **débattue** : de 250 à 499 ;
- **très incertaine** : moins de 250.

Quand un lieu est un autre nom d'un autre (Horeb = Sinaï), les deux confiances sont multipliées.

**Règles éditoriales** (`scripts/places-config.json`) :
- Un lieu n'est relié à une fiche que si un verset le nomme : dans le passage (« nommé ») ou dans son contexte proche (« lieu de la scène », « destinataires de la lettre », « lieu de rédaction »…).
- Les tests vérifient que ce verset nomme bien le lieu dans l'index d'OpenBible et qu'il appartient au même livre.
- Les localisations purement traditionnelles, non nommées par le texte, ne sont pas cartographiées.
- Seba (Is 43, 3) n'est pas cartographiée, son identification étant discutée.

**Régénérer les données** :

```bash
git clone --depth 1 https://github.com/openbibleinfo/Bible-Geocoding-Data /tmp/openbible
python3 scripts/build-places.py /tmp/openbible        # → src/content/data/places.json, public/geo/lieux-contours.json
git clone --depth 1 https://github.com/AWMC/geodata /tmp/awmc
python3 scripts/build-geo-layers.py /tmp/awmc         # → public/geo/empire-*.json, royaume-herode.json, voies-romaines.json
```

Les fichiers de `public/geo/` dérivés d'AWMC et d'OpenStreetMap restent sous licence ODbL.

## Couverture de la Bible

La page « Sources et méthode » montre ce que couvrent les fiches publiées :
- chaque livre de la Bible (73) est une ligne, chaque chapitre un carré ;
- un carré est coloré selon la part de ses versets couverte ;
- des indicateurs donnent les fiches, versets, chapitres et livres couverts.

Les comptages viennent de la structure de la Bible AELF (`src/content/data/bible-structure.json`) :
- livres, chapitres, nombre de versets ;
- dernier numéro de verset et numéros absents (ex. Mt 18, 11, non traduit).

Ce fichier a été relevé sur aelf.org avec `node scripts/crawl-aelf-structure.mjs` (aucun texte n'est conservé). La Lettre de Jérémie, présentée à part par AELF, est comptée avec Baruch.

## Modifier les contenus

Tout est dans `src/content/data/`, indépendamment de l'interface :

| Fichier | Contenu |
| --- | --- |
| `passages.json` | Fiches bibliques : référence, lien AELF, contexte, explication, renvois au CEC, statut |
| `topics.json` | Humeurs (`kind: "humeur"`) et thèmes (`kind: "theme"`), avec la liste ordonnée des passages associés |
| `parcours.json` | Parcours et étapes (objectif, passage, explication, CEC, réflexion, quiz) |
| `sources.json` | Sources et mentions de droits affichées dans « Sources et méthode » |
| `places.json` | Lieux et liens fiche → lieu (généré ; modifier `scripts/places-config.json` puis relancer `build-places.py`) |
| `bible-structure.json` | Structure de la Bible AELF pour la couverture (généré) |

Le schéma est dans `src/content/schema.ts` (zod). Il est vérifié au démarrage de l'app et par `npm test`.

**Ajouter une référence au Catéchisme :** renseigne `paragraphs` (ex. `"1822-1829"`) et `label`, puis lance `node scripts/apply-cec-links.mjs`. Le script remplit `url` avec la bonne page. `npm test` vérifie que chaque lien correspond à son paragraphe.

Si vatican.va réorganise ses pages, relance le relevé avec `node scripts/crawl-cec.mjs` (accès Internet nécessaire), puis `apply-cec-links`.

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

Site en ligne : https://nono-el-nino.github.io/Tu-es-sur-le-bon-chemin/

À chaque push sur `main` ou `master`, le workflow `.github/workflows/deploy.yml` :

1. lance les tests ;
2. construit l'app ;
3. publie `dist/` sur la branche `gh-pages`.

GitHub Pages sert cette branche (Settings → Pages → *Deploy from a branch* → `gh-pages`).

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
