# AIME® — Le Monde Aime

« La terre, les arts et les générations. » Plateforme indépendante qui réunit informations du quotidien,
accompagnement des démarches, et mise en relation locale (personnes, producteurs, artistes, associations).
**Prototype — non affilié à un organisme public.**

Stack : Next.js 16 (App Router, Server Actions) · React 19 · TypeScript · PostgreSQL via Drizzle ORM · Tailwind CSS 4.

## Démarrage

Prérequis : Node.js 22+, un PostgreSQL accessible.

```bash
npm install
cp .env.example .env          # adapter DATABASE_URL (et AUTH_SECRET en production)
npm run db:migrate            # crée les tables (migrations versionnées dans drizzle/)
npm run dev                   # http://localhost:3000
```

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

- Toute fonction exportée d'un fichier `"use server"` est un **endpoint public** : elle doit commencer par
  `requireUser`/`requireRole`/un garde d'accès. Les helpers internes vivent hors de ces fichiers (ex. `lib/case-events.ts`).
- Les rôles sont toujours revérifiés en base, jamais lus depuis le jeton de session.
- Voir `AUDIT.md` pour l'audit de sécurité complet et l'historique des correctifs.
