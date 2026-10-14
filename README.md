# AIME® — Le Monde Aime

« La terre, les arts et les générations. » Plateforme indépendante qui réunit informations du quotidien,
accompagnement des démarches, et mise en relation locale (personnes, producteurs, artistes, associations).
**Prototype — non affilié à un organisme public.**

Stack : Next.js 16 (App Router, Server Actions) · React 19 · TypeScript · PostgreSQL via Drizzle ORM · Tailwind CSS 4.

## Design — système « encre et papier »

La refonte s'inspire du système de **Cal.com** et le transpose au service public :

- **Palette monochrome.** Les surfaces, textes et contours suivent une échelle de gris
  calibrée (`bg`, `bg-subtle`, `bg-muted`, `text-emphasis`, `text-subtle`, `border`,
  `border-subtle`). La couleur est réservée aux **états** (information, succès,
  attention, erreur) et aux **marqueurs de la carte** : jamais décorative.
- **Deux familles typographiques.** *Cal Sans* (display, un seul poids) pour les
  titres, *Inter* pour tout le texte d'interface. Les deux sont **auto-hébergées**
  dans `public/fonts/` (aucune requête vers un tiers, compatible avec la CSP
  `font-src 'self'`). Cal Sans est distribuée sous SIL Open Font License — voir
  `public/fonts/CalSans-OFL.txt`.
- **Contenants.** Rayons 8 px (contrôles) et 12-16 px (conteneurs) ; les blocs sont
  délimités par un **anneau** discret et une ombre courte plutôt que par une bordure
  lourde. Les arguments marketing montrent de vrais fragments d'interface
  (`components/marketing/mocks.tsx`) plutôt que des illustrations.
- **Points d'entrée.** `app/globals.css` porte les jetons et les polices ;
  `components/ui.tsx` porte les primitives (boutons, cartes, champs, pastilles) ;
  `components/public-shell.tsx` porte l'en-tête et le pied de page sombre.

Les anciennes palettes `emerald-*` et `slate-*` sont remappées dans `globals.css`
afin que les composants historiques héritent du même langage sans réécriture.

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

Sans ces variables, les routes publiques restent consultables en mode dégradé ; connexion, inscription et données en base restent indisponibles. Ne jamais publier de vrais identifiants ni committer un fichier `.env`.

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
- `components/` — composants partagés (coquilles, carte, communauté, assistant local)
- `lib/` — logique serveur : `actions/` (Server Actions, **toujours authentifiées**), requêtes (`*-queries.ts`), auth, validation Zod
- `db/` — schéma Drizzle (`schema.ts`), scripts d'amorçage (`seed*.ts`)
- `drizzle/` — migrations SQL versionnées

## Sécurité — règles du projet

- Toute fonction exportée d'un fichier `"use server"` est un **endpoint public** : elle doit vérifier une session utilisateur (`requireUser`/`requireRole`) ou un droit d'accès explicite par capacité (jeton RSVP haché, session magique signée et vérifiée en base). Les helpers internes vivent hors de ces fichiers (ex. `lib/case-events.ts`).
- Les rôles sont toujours revérifiés en base, jamais lus depuis le jeton de session.
- Voir `AUDIT.md` pour l'audit de sécurité complet et l'historique des correctifs.
