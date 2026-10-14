# AIME® — Le Monde Aime

« Le fil s'était perdu. On le reprend. » Plateforme indépendante qui réunit les informations du quotidien,
l'accompagnement des démarches — à commencer par le mariage — et la mise en relation locale (personnes,
producteurs, artistes, associations, transmissions entre générations).
**Prototype — non affilié à un organisme public.**

Stack : Next.js 16 (App Router, Server Actions) · React 19 · TypeScript · PostgreSQL via Drizzle ORM · Tailwind CSS 4.

## Design — encre et papier, une seule surface

Le site est **monochrome** : aucune couleur décorative. Fond blanc, une seule colonne centrée
sur le site public, cartes blanches cerclées d'un filet, boutons noirs en pilule, capitales
minuscules pour la navigation. Le rythme vient des surfaces (`canvas`, `subtle`, `muted`) et
des contours (`line`, `line-soft`), jamais de la teinte. Cette règle vaut pour tout le site,
y compris les espaces de travail (Mon espace, back-office, administration).

Ce qui reste coloré est **sémantique** et réservé aux états qui en ont besoin ; partout ailleurs,
un avancement se lit au contraste (fond noir / fond gris / filet), pas à la couleur.

- **Palette.** Échelle de gris calibrée définie dans `app/globals.css` (`--color-canvas`,
  `--color-subtle`, `--color-muted`, `--color-ink`…`--color-ink-4`, `--color-line`).
  Aucune classe chromatique (`bg-rose-*`, `text-sky-*`, `bg-slate-*`…) ne subsiste dans le
  projet ; tout passe par ces jetons.
- **Deux familles typographiques.** *Cal Sans* (display, un seul poids) pour les titres,
  *Inter* pour tout le texte d'interface. Les deux sont **auto-hébergées** dans `public/fonts/`
  (aucune requête vers un tiers, compatible avec la CSP `font-src 'self'`). Cal Sans est
  distribuée sous SIL Open Font License — voir `public/fonts/CalSans-OFL.txt`.
- **Contenants.** Rayons 8 px (contrôles) et 12-16 px (conteneurs) ; les blocs sont délimités
  par un **anneau** discret et une ombre courte plutôt que par une bordure lourde. Les
  arguments marketing montrent de vrais fragments d'interface (`components/marketing/mocks.tsx`)
  plutôt que des illustrations.
- **Points d'entrée.** `app/globals.css` porte les jetons et les polices ; `components/ui.tsx`
  porte les primitives (boutons, cartes, champs, pastilles) ; `components/marketing/tiles.tsx`
  porte les briques du site public (`HeroCard`, `ActionRow`, `Panel`, `LinkRow`) ;
  `components/public-shell.tsx` porte l'en-tête et le pied de page.

### Pas de carte interactive : la commune suffit

La carte de France a été retirée. Tout se parcourt **en listes** (filtres par univers, type,
commune, distance, date) dans `/le-monde-aime`.

Le point d'une publication reste obligatoire en base (`lat`/`lng` `numeric(8,2)`), mais il
n'est plus choisi à la main : il est **déduit de la commune et du code postal** par
`lib/point.ts` (centre du département via `lib/departements.ts`, puis décalage stable calculé
sur le nom de la commune, borné à la France métropolitaine). Le code postal est conservé avec
le nom de la commune (« Chartres (28000) »), sans changement de schéma. Les actions serveur
acceptent toujours un point explicite : c'est la porte laissée ouverte pour un affinage
ultérieur (« affiner le point plus tard »).

Les préférences d'affichage (taille du texte, contraste, animations) sont posées
sur `<html>` (`data-text-scale`, `data-contrast`, `data-motion`) et lues par
`app/globals.css`.


## Démarrage

Prérequis : Node.js 22+, un PostgreSQL accessible.

```bash
npm install
cp .env.example .env          # adapter DATABASE_URL (et AUTH_SECRET en production)
npm run db:migrate            # crée les tables (migrations versionnées dans drizzle/)
npm run dev                   # http://localhost:3000
```

## Déploiement sur Vercel

Vercel détecte automatiquement Next.js : conserver la racine du dépôt et la commande de build `npm run build`. Le projet cible Node.js 22 ou plus (`engines` est déclaré dans `package.json`). Le build ne se connecte pas à PostgreSQL : le site public peut s'afficher même si la base n'est pas encore configurée, avec les contenus dynamiques et la création de compte désactivés.

Pour activer les comptes, les guides administrés, l'annuaire et les fonctions connectées :

1. Créer une base PostgreSQL accessible depuis Vercel (utiliser l'URL de connexion recommandée par le fournisseur, idéalement son endpoint poolé pour les fonctions serverless).
2. Ajouter `DATABASE_URL` et un `AUTH_SECRET` aléatoire d'au moins 32 caractères dans **Vercel → Settings → Environment Variables**. Définir les variables pour chaque environnement visé (Production, Preview et/ou Development), puis redéployer.
3. Appliquer les migrations (`npm run db:migrate`) à cette base avant d'ouvrir les fonctions connectées. Le build Vercel n'exécute volontairement pas de migration automatiquement.

Sans ces variables, les routes publiques restent consultables en mode dégradé ; les données en base restent indisponibles. Ne jamais publier de vrais identifiants ni committer un fichier `.env`.

### Comptes et connexion — interrupteur

**Les comptes sont fermés par défaut.** Tant que `AIME_AUTH_ENABLED` n'est pas à `1` :

- aucune inscription, aucun mot de passe, aucun formulaire de connexion ;
- toute session déjà présente dans un navigateur est ignorée (révocation immédiate) ;
- `/connexion` et `/inscription` renvoient vers `/mon-espace`, la page qui explique la situation ;
- les espaces `/espace`, `/back-office` et `/admin` renvoient vers `/mon-espace` ;
- seule la **visite guidée** reste ouverte quand une base est configurée : elle ne demande
  aucun identifiant et s'exécute en lecture seule (le proxy refuse toutes les écritures).

Pour rallumer les comptes, définir `AIME_AUTH_ENABLED=1` puis redéployer : les formulaires,
les rôles, les sessions et les trois espaces redeviennent disponibles sans modification de
code. Le code d'authentification n'a pas été supprimé.

> Suite de travail priorisée : voir `AUDIT-REFONTE.md` (audit complet du dépôt).

Pour afficher le site dans une iframe d'un domaine de prévisualisation, lister les origines
autorisées dans `PREVIEW_FRAME_ANCESTORS` (séparées par des virgules). Sans cette variable,
la politique reste stricte : `frame-ancestors 'self'` et `X-Frame-Options: SAMEORIGIN`.

### Accès mariage sans mot de passe

Après application de la migration (`npm run db:migrate`), une personne organisatrice peut générer des liens à copier et transmettre elle-même — aucun courriel n'est envoyé par AIME® :

- **RSVP individuel** : un foyer peut consulter et modifier uniquement sa propre réponse. Le jeton aléatoire est stocké sous forme hachée ; il reste valide au moins 90 jours, ou jusqu'à 14 jours après le mariage si cette date est plus éloignée (dans la limite d'un an), et peut être renouvelé ou révoqué par les organisateurs.
- **Proches qui aident** : lien de 7, 30 ou 90 jours, révocable depuis le projet. Le rôle « Coordination » peut consulter les noms, nombres de personnes et réponses des foyers, puis modifier les réponses et le programme ; le rôle « Témoin » consulte le programme et le plan de table en lecture seule. Aucun rôle ne donne accès au budget, aux notes privées, aux documents, aux échanges ou à un espace personnel.

Les liens sont des secrets de type « porteur » : ne les transmettez qu'à la personne concernée. Leur URL ne donne pas l'accès après révocation/expiration ; la session temporaire d'un proche est aussi vérifiée en base à chaque consultation et mutation.

### Données de démonstration (optionnel, développement uniquement)

```bash
npm run db:seed
```

Ce script **efface les données** et crée des comptes fictifs (mot de passe commun `Demo1234!`) :
`admin@aime-demo.fr` (administrateur), `agent.beauce@aime-demo.fr` (gestionnaire),
`jean.dupont@exemple.fr` (membre). Il est **refusé en production** (`NODE_ENV=production`)
sauf `ALLOW_DEMO_SEED=1` explicite — ne jamais l'utiliser sur des données réelles.

## Commandes

| Commande | Effet |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` / `npm start` | Build puis serveur de production |
| `npm run typecheck` | Vérification TypeScript |
| `npm run lint` | ESLint |
| `npm run check` | typecheck + lint + build (à lancer avant tout commit) |
| `npm run db:generate` | Génère une migration après modification de `db/schema.ts` |
| `npm run db:migrate` | Applique les migrations en attente |
| `npm run db:seed` | (Ré)amorce les données de démonstration |

Après toute modification de `db/schema.ts` : `npm run db:generate`, relire le SQL généré, committer le dossier `drizzle/`.

## Organisation

- `app/` — routes (site public, `/espace` membre, `/back-office`, `/admin`, `/le-monde-aime`, API dans `app/api/`)
- `components/` — composants partagés (coquilles, marketing, communauté, assistant local)
- `lib/` — logique serveur : `actions/` (Server Actions, **toujours authentifiées**), requêtes (`*-queries.ts`), auth, validation Zod
- `db/` — schéma Drizzle (`schema.ts`), scripts d'amorçage (`seed*.ts`)
- `lib/point.ts` — point d'une publication déduit de la commune et du code postal (sans carte)
- `drizzle/` — migrations SQL versionnées

## Sécurité — règles du projet

- Toute fonction exportée d'un fichier `"use server"` est un **endpoint public** : elle doit vérifier une session utilisateur (`requireUser`/`requireRole`) ou un droit d'accès explicite par capacité (jeton RSVP haché, session magique signée et vérifiée en base). Les helpers internes vivent hors de ces fichiers (ex. `lib/case-events.ts`).
- Les rôles sont toujours revérifiés en base, jamais lus depuis le jeton de session.
- Voir `AUDIT.md` pour l'audit de sécurité complet et l'historique des correctifs.
