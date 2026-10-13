# Audit de l'application AIME® — Le Monde Aime

**Date :** 13 octobre 2026 · **Périmètre :** tout le dépôt (`app/`, `components/`, `lib/`, `db/`, configuration)
**Méthode :** revue de code statique, `tsc`, ESLint, build de production, et **tests dynamiques sur l'application
réellement lancée** (balayage des 52 routes, matrice des rôles, tests d'IDOR, rejeu d'attaque, connexion réelle de bout en bout).

> Une faille **critique** a été trouvée, **exploitée pour preuve**, puis **corrigée** pendant cet audit (§1).
> Les correctifs minimaux nécessaires pour simplement démarrer l'app sont listés au §2.

---

## Synthèse

L'application est un prototype Next.js 16 / React 19 / PostgreSQL (Drizzle) étonnamment complet
(52 routes : site public, espace membre, back-office, administration, communauté « Le Monde Aime »).
Le modèle de sécurité applicatif est **globalement sain et réfléchi** (voir les points forts, §5) —
mais le code tel que téléversé **ne pouvait pas démarrer**, et une fonction auxiliaire mal placée
ouvrait **l'intégralité des documents des dossiers à n'importe quel visiteur anonyme**.

| Gravité | Nombre | Détail |
|---|---|---|
| 🔴 Critique | 1 (corrigée) | §1 — fuite de documents sans authentification |
| 🟠 Élevée | 3 (1 corrigée) | §2, §3.1, §3.2 |
| 🟡 Moyenne | 7 | §4.1 à §4.7 |
| 🔵 Faible / qualité | 6 | §5 (avec les points forts) |

**Vérifications automatiques après correctifs :** `tsc --noEmit` ✅ · `next build` ✅ (52 routes) ·
ESLint ❌ 51 erreurs / 10 avertissements (§4.4) · `npm audit` ❌ 12 vulnérabilités dont 1 critique (§3.2).

---

## 1. 🔴 CRITIQUE (corrigée) — Documents de tous les dossiers téléchargeables sans compte

Dans `lib/actions/cases.ts` (fichier `"use server"`), deux fonctions exportées n'avaient **aucun contrôle d'accès** :

- `listOfficeDocumentsForCase(caseId)` — renvoyait **toutes les lignes `documents` d'un dossier, contenu binaire (`content`) inclus** ;
- `linkDocumentEvent(caseId, documentName, actorId)` — permettait d'injecter un événement dans l'historique d'un dossier
  **en usurpant n'importe quel `actorId`**.

Or, dans Next.js, **chaque fonction exportée d'un fichier `"use server"` devient un endpoint public** (Server Action),
invoquable par POST avec l'en-tête `Next-Action`, que le code l'utilise côté client ou non.

**Preuve (avant correctif, sans aucun compte) :**

```
POST /espace/demarches/nouvelle   Next-Action: <id de listOfficeDocumentsForCase>   Body: [1]
→ renvoie le document du dossier n°1 avec l'intégralité de son contenu (octet par octet).
```

Même résultat avec la session d'un autre membre sur un dossier qui ne lui appartient pas.
L'ID d'action n'est pas un secret : il figure dans le manifeste des actions et les charges RSC des pages qui importent le module.

**Correctif appliqué :**
- `linkDocumentEvent` déplacée dans `lib/case-events.ts` (module `server-only`, **sans** `"use server"`) ;
  son seul appelant (`uploadDocument`) avait déjà vérifié les droits avant de l'appeler.
- `listOfficeDocumentsForCase`, inutilisée dans tout le code, **supprimée**.
- Rejeu de l'attaque après correctif : `Server action not found.` ✅ Manifeste de production : 0 occurrence. ✅

> **Règle à retenir pour toute l'équipe :** ne jamais exporter depuis un fichier `"use server"` une fonction
> qui ne commence pas par un contrôle d'authentification/autorisation (`requireUser`, `requireRole`, `assert…Access`).
> Revue exhaustive des 88 actions : toutes les autres sont gardées (ou publiques par conception : connexion/inscription/déconnexion).

## 2. 🟠 ÉLEVÉE (partiellement corrigée) — L'application ne démarrait pas en l'état téléversé

Le dépôt semble avoir été téléversé en « écrasant » un niveau de dossier `src/` :

| Problème | Effet | État |
|---|---|---|
| `tsconfig.json` : alias `@/*` → `./src/*`, alors qu'il n'y a **aucun dossier `src/`** (~400 imports `@/…`) | Compilation impossible | ✅ Corrigé → `./*` |
| `drizzle.config.json` : schéma `./src/db/schema.ts` (inexistant) | Migrations impossibles | ✅ Corrigé → `./db/schema.ts` |
| **Aucun dossier `public/`** : les 13 images `/images/*.jpg` référencées par le code sont absentes | Toutes les photos d'en-tête en 404 | ⚠️ Visuels d'attente générés localement (dégradés, `public/images/`) — **retrouver les originales** |
| **Aucune migration versionnée, aucun amorçage automatique** : `seedIfEmpty` existe mais n'est **jamais appelée** ; base vide = tables inexistantes = toutes les pages en erreur | App inutilisable sans manipulations manuelles (génération du schéma + `npx tsx db/seed.ts`, dont le commentaire cite aussi l'ancien chemin `src/db/seed.ts`) | ❌ À faire : commiter les migrations Drizzle (`drizzle-kit generate`) et documenter/scriptiser la mise en route |
| Pas de `README`, pas de `.gitignore`, pas de `package-lock.json`, `DATABASE_URL` obligatoire non documentée | Mise en route au hasard ; risque de committer secrets/dépendances (le fichier `.auth-secret`, généré à la racine par l'app, n'était protégé par rien) | ✅ `.gitignore` créé, `package-lock.json` généré. ❌ README à écrire |

## 3. Autres constats élevés

### 3.1 🟠 Comptes de démonstration à mot de passe public — dont un administrateur
`db/seed.ts` crée `admin@aime-demo.fr`, deux gestionnaires et cinq membres, **tous avec le mot de passe `Demo1234!`,
affiché en clair dans les logs du seed**. Si ce seed est un jour exécuté sur un environnement réel,
n'importe qui devient administrateur. → Le seed doit refuser `NODE_ENV=production` (sauf verrou explicite),
et ces comptes doivent être désactivables/supprimables après démonstration.

### 3.2 🟠 Dépendances vulnérables : Next.js 16.2.6 contient des failles critiques corrigées depuis
`npm audit` : **12 vulnérabilités (1 critique, 7 hautes)** — contournements et dénis de service touchant
les Server Actions de Next (`GHSA-6gpp-xcg3-4w24`, `GHSA-m99w-x7hq-7vfj`, `GHSA-89xv-2m56-2m9x`, …),
plus `postcss` et `sharp`. L'app n'utilise pas de middleware, mais les failles « Server Actions » la concernent directement.
→ Mettre à jour Next vers la dernière version corrigée de la branche, puis ré-auditer.

### 3.3 🟡→🟠 Aucune protection contre le bourrage d'identifiants
Ni `loginAction` ni `registerAction` n'ont de limitation de débit, de délai progressif ou de CAPTCHA ;
le mot de passe n'exige que 8 caractères. Avec §3.1, la surface est réelle. → Ajouter un rate-limit
(par IP + par compte) et un mot de passe de 12 caractères minimum (ou vérification de compromission).

## 4. Constats moyens

### 4.1 En-têtes de sécurité HTTP absents
Réponse d'accueil observée : uniquement `X-Powered-By: Next.js`. Aucun `Content-Security-Policy`,
`X-Content-Type-Options`, `X-Frame-Options`/`frame-ancestors`, `Referrer-Policy`, `Strict-Transport-Security`.
→ Les ajouter dans `next.config.ts` (`async headers()`), au minimum `nosniff` + anti-clickjacking + CSP adaptée.

### 4.2 Téléchargement de documents : `inline` sans `nosniff`
`/api/documents/[id]` sert le fichier avec `Content-Disposition: inline` et le type MIME **fourni par l'utilisateur à l'upload**,
sans `X-Content-Type-Options: nosniff` (les autres routes photos le mettent, elles). Les types admis incluent `text/plain`
et Word selon le chemin d'upload. Risque faible mais réel de sniffing/XSS stocké selon le navigateur.
→ `attachment` par défaut (ou `inline` réservé aux images/PDF), `nosniff` partout, revalider le type côté serveur (magic bytes).

### 4.3 Deux politiques d'upload incohérentes
`lib/actions/documents.ts` (PDF/Word/images, 8 Mo) vs `lib/uploads.ts` (images/PDF/texte selon appelant) vs limite
globale d'actions à 10 Mo (`next.config.ts`). → Unifier dans `lib/uploads.ts`.

### 4.4 ESLint rouge : 51 erreurs, 10 avertissements
Détail : `react-hooks/refs` ×27, `react/no-unescaped-entities` ×19, `react-hooks/set-state-in-effect` ×4,
`@next/next/no-img-element` ×5, divers. Les erreurs `react-hooks/refs`/`set-state-in-effect` peuvent cacher
de vrais bugs de rendu. → La CI doit lancer `lint` + `typecheck` (il n'y a ni CI ni tests dans le dépôt).

### 4.5 Aucune page d'erreur/de repli globale ; panne base = 500 généralisées
Pas de `app/error.tsx`, `app/not-found.tsx` ni `app/global-error.tsx` : les erreurs affichent les pages par défaut de Next (en anglais).
Et `getCurrentUser()` (appelé par le layout racine) ne protège pas sa requête : si la base tombe, **même les pages publiques
deviennent des 500 pour tout utilisateur connecté**. → Ajouter les pages d'erreur en français et rendre `getCurrentUser` défensif (session invalide → visiteur).

### 4.6 Performance et passage à l'échelle
- **Toutes les routes sont dynamiques** (`force-dynamic`) : aucune page publique (articles, guides, annuaire) n'est mise en cache/ISR,
  chaque visite tape la base.
- **Requêtes sans limite/pagination** fréquentes (83 `select` pour 28 `limit` dans les couches de requêtes) : listes complètes chargées en mémoire.
- Les fichiers sont stockés en `bytea` **dans PostgreSQL** et certaines requêtes sélectionnent `photoData` juste pour calculer un booléen `hasPhoto`.
  → Sélectionner `id`/existence, paginer, envisager un stockage objet pour les fichiers, `loading="lazy"`/next-image (actuellement des `<img>` bruts).

### 4.7 Métadonnées et référencement
Seules **5 pages sur 41** définissent leurs `metadata` : la plupart des pages publiques partagent le titre générique de la racine
(constaté au balayage : `/connexion`, `/annuaire`, `/informations`… affichent le même `<title>`). → Définir titre/description par page, plus Open Graph.

## 5. Constats faibles — et points forts à conserver

**Faible :**
- `drizzle.config.json` contient des identifiants par défaut codés en dur (`postgres:postgres@127.0.0.1:5432/app_db`) — acceptable en local, à surcharger par `DATABASE_URL` partout.
- L'API REST `/api/le-monde-aime/*` réutilise les Server Actions (bonne factorisation) mais déduit ses codes HTTP en cherchant
  des sous-chaînes dans les messages d'erreur français (`error.includes("Connectez-vous")`…) : fragile à la moindre reformulation.
  Elle n'a pas non plus de protection CSRF propre (atténué par `SameSite=lax`).
- Code mort : page `app/le-monde-aime/profil` rendue inaccessible par la redirection de `next.config.ts`, redirection `/carte` vers une page, `void item;` dans `assignCaseToSelf`, exports inutilisés.
- Secret de session auto-généré dans `.auth-secret` à la racine du projet : pratique en démo (protégé désormais par `.gitignore`),
  mais en production il faut `AUTH_SECRET` géré par l'hébergeur ; les JWT de 30 jours ne sont pas révocables individuellement.
- À l'inscription, « Un compte existe déjà avec cette adresse e-mail » permet l'énumération des comptes (classique, faible).

**✅ Points forts (vérifiés en test dynamique, pas seulement en lecture) :**
- **Matrice des rôles étanche** : membre ↔ `/espace`, gestionnaire ↔ `/back-office`, administrateur ↔ les deux hors `/espace` ; chaque accès croisé redirige vers `/connexion`.
- **Anti-IDOR effectif** : un membre ne peut ni télécharger le document d'un autre (403), ni exporter le récapitulatif d'une démarche d'un autre (404) ; les gestionnaires sont cloisonnés à leur bureau.
- **Le rôle n'est jamais lu depuis le JWT** : chaque requête revérifie l'utilisateur en base (`isActive` compris) — un compte désactivé perd l'accès immédiatement.
- **Aucun** `dangerouslySetInnerHTML`, aucune interpolation SQL (tout est paramétré via Drizzle), aucun fetch externe, aucune donnée envoyée à un tiers ; l'assistant est 100 % local (mots-clés), ce qui est cohérent avec le discours vie privée du produit.
- **Vie privée bien pensée sur la carte** : opt-in explicite (`profileVisible`), nom réduit au prénom/nom d'affichage,
  coordonnées stockées arrondies (~1 km, `numeric(8,2)`), ni e-mail ni téléphone jamais exposés publiquement.
- Validation Zod systématique, mots de passe bcrypt, cookie `Secure; HttpOnly; SameSite=lax`, destination post-connexion
  protégée contre les redirections ouvertes (`safeDestination`), journal d'audit des actions sensibles, téléversements contrôlés en taille/type.

---

## Correctifs appliqués pendant l'audit

1. **`tsconfig.json`** — alias `@/*` : `./src/*` → `./*` (débloque toute compilation).
2. **`drizzle.config.json`** — chemin du schéma → `./db/schema.ts`.
3. **Faille critique §1** — `lib/case-events.ts` créé ; `lib/actions/cases.ts` et `lib/actions/documents.ts` mis à jour ; fonction exposée inutilisée supprimée.
4. **`.gitignore`** — `node_modules`, `.next`, `.env*`, `.auth-secret`, etc.
5. **`package-lock.json`** généré (installations reproductibles).
6. **`public/images/`** — 13 visuels d'attente générés (dégradés) pour remplacer les photos absentes du dépôt.
   ⚠️ Ce ne sont **pas** les visuels du produit : retrouver et commiter les photos originales.

Non corrigés volontairement (à traiter par l'équipe, par ordre de priorité) : §3.1 verrou du seed en production,
§3.2 mise à jour de Next, §3.3/§4.1 rate-limit + en-têtes de sécurité, migrations versionnées + README (§2), lint (§4.4).

## Comment relancer cet aperçu

```bash
npm install
# Base PostgreSQL requise (DATABASE_URL) ; schéma initial :
npx drizzle-kit generate --dialect=postgresql --schema=./db/schema.ts --out=/tmp/mig  # ou migrations à commiter
# puis appliquer le SQL, puis amorcer les données de démo :
DATABASE_URL=postgresql://… npx tsx db/seed.ts
DATABASE_URL=postgresql://… npm run dev   # ou npm run build && npm start
```

Comptes de démonstration (base amorcée par `db/seed.ts`, mot de passe commun `Demo1234!`) :
`admin@aime-demo.fr` (administrateur) · `agent.beauce@aime-demo.fr` (gestionnaire) · `jean.dupont@exemple.fr` (membre).

*Note d'environnement d'audit : faute de serveur PostgreSQL disponible dans le bac à sable, l'audit a tourné sur
PGlite (PostgreSQL compilé en WASM, hors dépôt) exposé sur `127.0.0.1:5432`. Deux incidents transitoires observés
pendant les tests (« Connection terminated » avec `maxConnections=1`, rotation des IDs d'actions en mode dev Turbopack)
venaient de cette infrastructure d'aperçu, **pas de l'application** — vérifié en build de production, où la connexion
réelle, la matrice des rôles et les protections IDOR fonctionnent.*

---

## Addendum — achèvement de l'application (13 octobre 2026, même journée)

Tous les constats de l'audit ont été traités ; vérifié par `npm run check` (typecheck + lint + build) et une
nouvelle batterie de tests dynamiques sur le build de production, base réinitialisée via les migrations.

| Constat | Traitement |
|---|---|
| §1 Faille critique Server Actions | Corrigée pendant l'audit ; rejeu sur le nouveau build : `Server Action unavailable` ✅ |
| §2 Démarrage impossible | Alias/Drizzle corrigés ; **migrations versionnées** commitées (`drizzle/`, `npm run db:migrate` testé sur base vierge) ; `README.md`, `.env.example`, scripts `db:*` ; `drizzle.config.ts` lit `DATABASE_URL` |
| §3.1 Seed dangereux en production | `db/seed.ts` **refuse** `NODE_ENV=production` sans `ALLOW_DEMO_SEED=1` (testé : exit 1, message explicite) |
| §3.2 Next.js vulnérable (1 critique, 7 hautes) | **Next 16.4.0** + `eslint-config-next` 16.4.0, PostCSS à jour : la critique a disparu. Restent 9 alertes **uniquement dans l'outillage de dev** (ESLint `braces/micromatch`, drizzle-kit `esbuild`) — aucun impact runtime |
| §3.3 Bourrage d'identifiants | `lib/rate-limit.ts` : 10 tentatives/15 min par IP+compte à la connexion (testé : blocage à la 11ᵉ), 10 inscriptions/heure/IP ; mot de passe **12 caractères** minimum (inscription + création de comptes par l'admin) |
| §4.1 En-têtes de sécurité | CSP, `nosniff`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` sur toutes les réponses ; `X-Powered-By` supprimé (vérifiés par `curl`) |
| §4.2 Documents servis `inline` | `inline` réservé aux images/PDF, `attachment` sinon, `nosniff` systématique |
| §4.3 Uploads incohérents | Politique unifiée dans `lib/uploads.ts` (types + taille), utilisée par les documents, projets, cercles et profils |
| §4.4 ESLint rouge (51 erreurs) | **0 erreur, 0 avertissement** : hook formulaire sans ref, apostrophes JSX, effets `setState` refactorés (initialisation paresseuse, état dérivé, synchronisation URL pendant le rendu), `<img>` d'API justifiés, lien `<a>` → `<Link>` |
| §4.5 Erreurs génériques | `app/error.tsx` + `app/not-found.tsx` en français ; `getCurrentUser` dégrade en visiteur si la base tombe |
| §4.6 Performance | Les requêtes « y a-t-il une photo ? » ne chargent plus les `bytea` (via `photoMime`) ; le reste (pagination, ISR, stockage objet) reste un chantier d'industrialisation, pas un bloqueur |
| §4.7 Métadonnées | Titres/descriptions sur **toutes** les pages, `generateMetadata` pour les guides et thématiques |
| §5 Divers | Ancien lien `/le-monde-aime/profil` : vraie redirection 307 préservant `?bienvenue=1` ; page-relais supprimée ; `void item` mort supprimé ; statuts HTTP de l'API REST centralisés dans `lib/api-status.ts` |
| Visuels absents | **13 photos générées** (accueil, santé, famille, logement, retraite, cotisations, emploi, campagne, conseiller, espace, univers terre/arts/savoirs) |
| Bandeau « Prototype » | Supprimé de toutes les pages (composant `PrototypeBanner` retiré des 3 coquilles) ; la mention légale subsiste une fois, dans le pied de page |
| Portes « s'informer » en quadruple exemplaire | **Chantier 1 de `SIMPLIFICATION.md` exécuté** : `/informations` unique (explorateur riche déplacé, `?vue=guides`, `?theme=`), redirections 308 depuis `/s-informer`, `/guides`, `/univers/*`, liens internes et assistant mis à jour — aucune fonctionnalité perdue (recherche, filtres public/thématique, lecture, détails de guides) |

**État final vérifié :** build de production ✅ · routes publiques et privées ✅ · matrice des rôles ✅ ·
anti-IDOR ✅ (403/404) · connexion réelle ✅ · rate-limit ✅ · en-têtes ✅ · page 404 de marque ✅.
