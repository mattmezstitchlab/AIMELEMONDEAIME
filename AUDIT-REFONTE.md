# Audit du site AIME® — ce qu'il faut revoir, réorganiser, et l'état après refonte

Date : 14 octobre 2026 · Périmètre : dépôt complet (`app/`, `components/`, `lib/`, `db/`, `public/`, configuration)
Méthode : lecture du code et des routes, `npm run typecheck` / `lint` / `build`, inspection du HTML et du CSS générés, appels HTTP réels sur les 42 pages et 11 routes API, sondage automatique de chaque classe CSS utilisée.

---

## 1. Résumé exécutif

Le dépôt contient un produit **fonctionnel mais très large** : 42 pages, 11 routes API, 15 fichiers de Server Actions, 3 espaces de travail et un assistant de navigation de près de 1 000 lignes. La dette n'est pas dans la qualité du code — le typage, le lint et le build sont propres — mais dans **la dispersion** : beaucoup d'écrans visent des publics différents (membre, équipe, administration) alors que le site public n'a pas encore de comptes ouverts.

Deux décisions structurent cette étape :

1. **Le site public est réorganisé autour d'une seule colonne et d'un seul parcours** (le mariage), avec des accès secondaires rangés en lignes de texte. Il est passé au **thème sombre à tuiles pastel** du modèle fourni.
2. **L'authentification est suspendue** par un interrupteur documenté : plus d'inscription, plus de mot de passe, plus de page de connexion. Le code des comptes reste en place et se rallume par une variable d'environnement.

Ce qui reste à faire est listé en §11, par priorité.

---

## 2. Architecture des routes — ce qui est à réorganiser

### Constat

| Sujet | État |
|---|---|
| Pages publiques | 18 routes, dont 6 doublons historiques redirigés |
| Espaces connectés | `/espace` (7 écrans), `/back-office` (5 écrans), `/admin` (6 écrans) |
| Redirections | 12 règles dans `next.config.ts`, dont 9 pour d'anciennes portes (`/s-informer`, `/guides`, `/univers/*`) |
| Accès sans session | Toutes les routes connectées redirigent vers `/connexion` — désormais vers `/mon-espace` |

### Points à revoir

1. **`/accompagnement` portait deux fois la section « Organismes de référence »**, avec deux blocs `id="organismes"` : identifiant dupliqué (HTML invalide) et lecteurs d'écran perturbés. **Corrigé** — un seul bloc subsiste (`app/accompagnement/page.tsx:212`), à ne pas réintroduire.
2. **Trois coquilles concurrentes** cohabitaient (publique, authentification, espaces connectés) avec trois styles de bandeau. Réduit à **deux** : `public-shell` (thème sombre) et `app-shell` (surface claire dense). La coquille d'authentification est isolée dans `components/auth-shell.tsx` et n'est plus montée tant que les comptes sont fermés.
3. **Navigation publique pléthorique** : l'ancien en-tête exposait 12 liens plus un menu « autres services » de 12 entrées. Ramené à **3 entrées** (Parcours, Guides, Carte) + « Mon espace », le reste vivant en pied de page.
4. **`/carte` et `/le-monde-aime`** font doublon : `/carte` redirige vers `/le-monde-aime`. À fusionner dans les redirections à terme (garder une seule URL canonique) — **à faire**.
5. **`/informations?vue=guides`** déguise une page dans une autre via un paramètre. Fonctionne, mais l'URL ne dit pas ce qu'elle montre : prévoir `/guides` (liste) et `/guides/[slug]` (détail) comme deux routes réelles — **à faire**.

---

## 3. Comptes et authentification — suspendus

### Ce qui change

- `lib/auth-mode.ts` introduit `AUTH_ENABLED` (variable `AIME_AUTH_ENABLED`, **absente = comptes fermés**).
- `getSession()` ne reconnaît plus aucune session quand les comptes sont fermés : un cookie encore présent dans un navigateur est **immédiatement ignoré** (révocation sans déploiement de code).
- `/connexion` et `/inscription` redirigent vers `/mon-espace`, une page publique qui explique la situation et propose les contenus ouverts.
- Les Server Actions `loginAction` / `registerAction` refusent explicitement toute tentative, même par appel direct.
- **Seule exception conservée** : la visite guidée (`/decouvrir` → `loginAsDemo`), qui ne demande aucun identifiant, reste ouverte quand une base est configurée. Elle est en lecture seule (le proxy bloque toutes les écritures d'une session marquée `demo`).

### Ce qui reste intact et testé

Les comptes, rôles, jetons RSVP, sessions de proches, hachage `bcrypt`, limitation de débit et journal d'audit sont **conservés**. Réactivation :

```bash
AIME_AUTH_ENABLED=1   # dans .env ou dans les variables de l'hébergeur
```

Les pages `/connexion` et `/inscription` reprennent leur formulaire, la coquille `AuthSplit` se remonte. Aucune ligne à réécrire.

### À décider

- Faut-il **conserver la visite guidée** tant que les comptes sont fermés ? (Recommandation : oui, c'est le seul moyen de montrer le produit fini.)
- Faut-il **supprimer** à terme les espaces `/back-office` et `/admin` du dépôt public, ou les déplacer dans un second déploiement ? Ils ne sont pas atteignables aujourd'hui, mais ils alourdissent le build.

---

## 4. Design system — ce qui a été refait et ce qui reste fragile

### Deux registres assumés

| Registre | Où | Fond | Usage |
|---|---|---|---|
| **Public** | `public-shell.tsx` + `theme-night` | presque noir (`#0a0a0a`) | raconter, orienter, donner envie |
| **Application** | `app-shell.tsx` + thème clair | papier (`#fff`) | lire des données, saisir, trier |

Le basculement est **porté par les variables CSS** : `.theme-night` redéfinit `--color-*` et `--cal-*`, donc toutes les utilitaires existantes (`bg-canvas`, `text-ink-2`, `ring-line`…) s'inversent sans réécriture. `.theme-light` fait l'inverse pour les cartes blanches et les aperçus d'interface posés sur une tuile pastel.

### Ce qui a été fait

- Colonne unique de **736 px** pour le site public, comme le modèle : hero pastel, cartes d'action blanches à bouton pilule, tuiles pastel contenant des **aperçus d'interface réels** (`components/marketing/mocks.tsx`), lignes de texte sobres pour les listes.
- Palette de tuiles : `--color-tile-sky / coral / amber / sand / sage / lilac`.
- Typographie conservée : **Cal Sans** pour les titres, **Inter** pour le texte, auto-hébergées dans `public/fonts/` (236 Ko, licence OFL incluse).
- Les échelles héritées (`slate-*`, couleurs d'état) sont **retournées dans le thème sombre** : les composants écrits avant la refonte restent lisibles sans être réécrits.
- `bg-white` → `bg-canvas` et `text-white` → `text-canvas` partout : une carte et un bouton s'inversent correctement dans les deux thèmes.

### Ce qui reste fragile

1. **Le texte des tuiles pastel** repose sur `--color-tile-ink` (#12100e). Les combinaisons pastel/texte sont à faire valider par un audit de contraste (le ratio dépend de la tuile).
2. **Les images** (`public/images/`, 4 Mo de JPEG) ne sont pas optimisées et ne passent pas par `next/image` (rendu `img` direct, volontaire pour la CSP `img-src 'self' data: blob:`). À reprendre : conversion en AVIF/WebP et variantes de taille — **à faire**.

   > **Décision à prendre :** deux visuels sont utilisés dans le hero (`/images/hero-mariage.jpg`, `/images/hero-espace.jpg`) alors que ces deux pages sont des démonstrations d'interface. Si l'audience le justifie, l'audit recommandera un **portrait du couple fondateur** à la place du premier, comme dans le modèle fourni — c'est le seul point du modèle qui n'est pas transposable directement, AIME® n'étant pas une personne.
3. **Les aperçus d'interface** (`.product-window`) simulent des écrans avec des données fictives en dur. Ils sont `aria-hidden` et ne doivent **jamais** contenir de donnée réelle : règle à rappeler dans `components/marketing/mocks.tsx`.
4. **Aucun jeton de mouvement** n'est partagé entre les composants : les durées sont écrites à la main. À centraliser si les animations se multiplient.

---

## 5. Accessibilité

### Traité

- Lien d'évitement présent partout, `#contenu-principal` sur chaque page.
- Focus visible global (anneau 2 px), `prefers-reduced-motion` respecté **et** préférence explicite « Animations réduites ».
- Préférences d'affichage (taille du texte, contraste renforcé, mouvement) posées sur `<html>` et réellement lues par le CSS.
- Contrastes des textes secondaires relevés : `--cal-text-muted`/`--color-ink-4` passés de `#a3a29e` à `#7a7873` (clair) et `#807f7b` (sombre) ; opacités du pied de page remontées à 55–60 %.

### À faire

1. **Audit RGAA/WCAG complet** avec des personnes concernées — toujours pas réalisé, et c'est un préalable à toute revendication de conformité (le site l'annonce déjà dans `/vision`).
2. **Contrastes des tuiles pastel** : à mesurer tuile par tuile, texte et chaîne de caractères inclus.
3. **Carte de France** : vérifier que marqueurs, filtres et panneaux restent utilisables au clavier et à 200 % de zoom (le code prévoit une liste textuelle alternative, à confirmer).
4. **Alternance de thème** : les pages à jeton (RSVP, espace partagé, invitation) sont forcées en clair. Vérifier que le contraste du texte autour d'elles reste suffisant.
5. **Formulaires** : les messages d'erreur remontent via `Notice` (rôle `alert`) — vérifier l'annonce par lecteur d'écran sur tous les formulaires d'action.
6. **Navigation du haut** : le menu mobile repose sur `<details>`/`<summary>` (pas de piège à focus, fermeture au clic extérieur non gérée). À remplacer par un composant accessible si le nombre d'entrées augmente.

---

## 6. Contenu et éditorial

| Constat | Action |
|---|---|
| Les guides viennent d'une base ; sans base, le site n'affiche plus rien dans « Guides pratiques » | **Fait** : l'accueil retombe sur trois guides d'entrée éditorialisés dans le code |
| Les thèmes (santé, famille, logement…) affichent « Aucun contenu publié » sans base | À revoir : prévoir un contenu de repli par thème, ou masquer la page |
| Les fiches d'organismes disparaissent sans base | **Fait** : état vide explicite renvoyant vers les sites officiels. À compléter : prévoir une liste d'organismes embarquée (mairies, services publics) pour que la section reste utile sans base |
| Les dates de revue réglementaire (`RULES_REVIEWED_AT`) sont affichées | Garder, et **les mettre à jour à chaque revue** — un affichage périmé est pire que rien |
| Aucun contenu ne mentionne de courriel de contact | Assumé : AIME® n'envoie pas de courriel. À confirmer si un contact devient nécessaire |

---

## 7. Données, dégradation et observabilité

1. **`GET /api/health` renvoie 500 sans base configurée.** C'est volontaire (réconciliation d'infrastructure), mais cela déclenchera des alertes sur un déploiement de démonstration. Recommandation : renvoyer `200` avec `{ ok: false, reason: "database_not_configured" }`, ou protéger la route par un jeton. — **à décider**
2. **37 pages sur 42 sont en `force-dynamic`.** Justifié pour les pages qui lisent une session ou une base, coûteux ailleurs (accueil, `/vision`, `/mon-espace`, `/annuaire` sans paramètre). Passer les pages purement statiques en rendu statique réduirait la charge et améliorerait le TTFB. — **à faire**
3. **Aucun test automatisé** (ni unitaire, ni end-to-end) alors que 15 fichiers d'actions serveur manipulent des droits. Recommandation : commencer par un test d'intégration des actions sensibles (jetons RSVP, rôles, écritures de la visite guidée).
4. **Journal d'audit** alimenté (`auditLogs`) mais sans purge ni consultation filtrée hors administration : prévoir rétention et export.

---

## 8. Performance

- Polices : 236 Ko au total, deux familles, préchargement à ajouter (`<link rel="preload">`) — **à faire**.
- Images : voir §4.2 (4 Mo de JPEG non optimisés).
- CSS : une seule feuille, 73 Ko minifiée pour deux thèmes et l'échelle complète — correct, mais le thème sombre double les définitions de variables. Acceptable.
- JavaScript : `assistant.tsx` (948 lignes) est monté sur **toutes** les pages, y compris celles sans interaction. À charger à la demande (import dynamique au premier clic sur la bulle) — **à faire**, gain mesurable.
- `@paper-design/shaders-react` (dégradé animé) a été **retiré** : dépendance supprimée, un WebGL en moins.

---

## 9. Sécurité

- **Comptes suspendus** : la surface d'attaque liée à la connexion disparaît (plus de formulaire, plus de mot de passe, plus de limitation de débit à exercer). Les jetons RSVP et sessions de proches continuent de fonctionner et restent hachés, expirants et révocables.
- **CSP** : `default-src 'self'`, polices locales, aucune ressource tierce. `frame-ancestors` reste `'self'` par défaut ; `PREVIEW_FRAME_ANCESTORS` permet d'ouvrir une prévisualisation encadrée sans affaiblir la production.
- **Écritures** : le proxy bloque toute méthode d'écriture pour une session de visite guidée, y compris les routes API.
- À faire : vérifier que les routes API (`/api/documents/[id]`, `/api/projets/[id]/documents/[docId]`, `/api/demarches/[id]/recapitulatif`) revérifient bien l'appartenance côté serveur — la logique existe, elle mérite un test dédié.

---

## 10. Qualité de code

| Fichier | Taille | Recommandation |
|---|---|---|
| `components/assistant/assistant.tsx` | 948 lignes | Découper (panneau, transcript, actions) et charger à la demande |
| `components/community/wedding-panels.tsx` | 497 lignes | Séparer budget / programme / plan de table |
| `components/carte/carte-client.tsx` | 455 lignes | Extraire l'état de filtres |
| `components/ui.tsx` | 486 lignes | Stable : c'est le point d'entrée du design system, à garder centralisé |

Aucun `TODO`/`FIXME` résiduel : le dépôt ne contient pas de dette signalée en commentaire, ce qui rend ces priorisations d'autant plus nécessaires.

---

## 11. Feuille de route priorisée

### P0 — à faire avant toute mise en ligne publique

1. Audit RGAA/WCAG avec des personnes concernées + mesures de contraste des tuiles pastel.
2. Tests d'intégration sur les actions sensibles (jetons, rôles, lecture seule).
3. Décision sur `/api/health` (dégradation explicite plutôt que 500).
4. Vérification manuelle des parcours sur mobile réel (Safari iOS et Chrome Android).

### P1 — qualité perçue

5. Optimiser les images (AVIF/WebP, variantes, `preload` des polices).
6. Charger l'assistant à la demande.
7. Réduire le `force-dynamic` aux pages qui en ont besoin.
8. Contenu de repli pour les guides et les thèmes quand la base n'est pas configurée.
9. Fusionner `/carte` et `/le-monde-aime`, rendre `/guides` explicite dans l'URL.

### P2 — structure

10. Trancher le sort du back-office et de l'administration (second déploiement ?).
11. Découper les quatre composants les plus volumineux.
12. Politique de rétention du journal d'audit.

---

## 12. Ce que cette étape a livré

- Site public reconstruit sur le modèle fourni : thème sombre, colonne unique, hero pastel, cartes d'action à bouton pilule, tuiles pastel contenant des aperçus d'interface réels.
- Authentification suspendue par interrupteur documenté (`AIME_AUTH_ENABLED`), avec page d'explication `/mon-espace` et visite guidée conservée.
- Correction de la section « Organismes » dupliquée dans `/accompagnement`.
- Navigation publique réduite à 3 entrées ; pied de page en liens typographiques.
- États de repli sans base de données pour l'accueil, les guides et les organismes.
- Retrait du dégradé animé `@paper-design/shaders-react`.
- Typographie française homogène (apostrophes typographiques) et lint sans avertissement.

---

## 13. Vérifications exécutées

```
npm run typecheck   ✓ aucune erreur
npm run lint        ✓ aucune erreur, aucun avertissement
npm run build       ✓ 42 pages, 11 routes API
```

Pages appelées réellement (mode dégradé, sans base de données) :

```
200  /                             200  /informations
200  /mon-espace                   200  /informations/mariage
200  /decouvrir                    200  /annuaire
200  /accompagnement               200  /vision
200  /accompagnement?besoin=mariage200  /le-monde-aime
307  /connexion → /mon-espace      307  /inscription → /mon-espace
404  /rsvp/<jeton inconnu>         404  /guides/<slug inconnu>
```

Contrôles supplémentaires : chaque classe CSS utilisée existe dans la feuille générée ; les jetons du thème sombre et les utilitaires de tuiles sont présents ; les polices se servent en local ; les aperçus d'interface sont bien rendus dans un contexte clair à l'intérieur d'une tuile pastel.
