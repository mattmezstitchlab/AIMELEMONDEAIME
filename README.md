# AIME® — Le Monde Aime

« Le fil s'était perdu. On le reprend. » Plateforme indépendante qui réunit les informations du quotidien,
l'accompagnement des démarches — à commencer par le mariage — et la mise en relation locale (personnes,
producteurs, artistes, associations, transmissions entre générations).
**Prototype — non affilié à un organisme public.**

Stack : Next.js 16 (App Router, Server Actions) · React 19 · TypeScript · PostgreSQL via Drizzle ORM · Tailwind CSS 4.

## Design — encre et papier, une seule surface

Le site est **monochrome** : aucune couleur décorative. Fond blanc, sections publiques fluides jusqu’à 80 rem, grands paysages monochromes
pleine largeur, boutons noirs en pilule et navigation structurée par rubrique. Le rythme vient des surfaces (`canvas`, `subtle`, `muted`) et
des contours (`line`, `line-soft`), jamais de la teinte. Cette règle vaut pour tout le site,
y compris les espaces de travail (Mon espace, back-office, administration).

Aucune couleur ne subsiste, y compris pour les états : un avancement, une alerte ou une
information se lisent au **contraste** (fond encre, fond gris, filet) et à l'icône
(`components/ui.tsx`, encarts `Notice` : les tons `info`, `success`, `warning`, `danger`,
`neutral` expriment une intention, plus une teinte).

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
- **Partage et indexation.** `public/og.png` sert d'aperçu de partage (image générée, encre
  sur papier), déclarée dans `app/layout.tsx` avec `metadataBase`. `app/sitemap.ts` liste les
  pages publiques, `app/robots.ts` écarte les espaces privés et les liens à jeton. Les deux
  s'appuient sur `NEXT_PUBLIC_SITE_URL` (voir `.env.example`), à définir en production.
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

### Les circuits — un cadre réutilisable

Un **circuit** est un cadre de confiance autour d'un même geste : on dépose une fiche située
par sa commune, on dit ce qu'on propose, et l'accord se fait entre les personnes. Le
catalogue vit dans `lib/circuits.ts` : chaque entrée porte ses mots (fiche, produit,
réservation), ses étapes, ses garanties, ses limites et **son tableau** (`structures` —
fiches et propositions —, `hands` — disponibilités —, `annonces`, `trajets` ou `personnes`).
Les pages sont génériques : `app/circuits/page.tsx` (index) et `app/circuits/[key]/page.tsx`
(un circuit, en listes). Un tableau = un composant : `components/circuits/circuit-board.tsx`
(structures et coups de main), `circuit-listings.tsx` (annonces), `circuit-trips.tsx`
(trajets), `circuit-people.tsx` (personnes), plus `circuit-forms.tsx` (dépôt d'une fiche,
ajout d'une ligne, réservation, statuts, disponibilité). Les actions correspondantes vivent
dans `lib/actions/circuits.ts` et servent tous les circuits : le circuit visé arrive en clair
dans le formulaire.

Circuits ouverts aujourd'hui : **producteurs** (`local_points.kind = "producteur"`, avec
`local_products` et `local_orders`), **coups de main** (`worker_availabilities`),
**associations et collectifs** (`local_points.kind = "association"`), **artisans**
(`local_points.kind = "artisan"`), **logements** (`community_listings`, catégorie
`logements`), **trajets** (`community_trips` + `community_transport_requests`) et
**transmission** (`users.transmit_text`, un tableau de personnes et non de fiches). Rien
n'est « prévu mais fermé » aujourd'hui : un circuit est ouvert quand il est écrit, testé et
relu.

**Ajouter un circuit** demande donc trois choses : une entrée dans `lib/circuits.ts` (avec
`status: "ouvert"`, ses `words`, et son `catalogue` si le circuit a des fiches), son tableau
dans `components/circuits/`, et le type de fiche correspondant — rien d'autre n'est à
recopier. Les tests de `lib/circuits.test.ts` vérifient les invariants à respecter : clé
d'adresse valide, trois étapes et trois garanties au minimum, limites écrites, mots et
statuts écrits pour chaque circuit ouvert, un catalogue dès qu'il y a des fiches (et aucun
sinon), un seul circuit par type de fiche, un tableau qui existe vraiment, pas de promesse de paiement en ligne ni de
messagerie, et aucun retour du vocabulaire de la carte.


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
| `npm run test` | Tests du calcul de point (`lib/point.test.ts`) |
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
- `lib/circuits.ts` — le catalogue des circuits (mots, étapes, garanties, limites, tableau) ; `lib/actions/circuits.ts` — les actions partagées par tous les circuits
- `app/circuits/` + `components/circuits/` — l'index des circuits, un circuit par adresse, tableau et formulaires
- `drizzle/` — migrations SQL versionnées

## Sécurité — règles du projet

- Toute fonction exportée d'un fichier `"use server"` est un **endpoint public** : elle doit vérifier une session utilisateur (`requireUser`/`requireRole`) ou un droit d'accès explicite par capacité (jeton RSVP haché, session magique signée et vérifiée en base). Les helpers internes vivent hors de ces fichiers (ex. `lib/case-events.ts`).
- Les rôles sont toujours revérifiés en base, jamais lus depuis le jeton de session.
- Voir `AUDIT.md` pour l'audit de sécurité complet et l'historique des correctifs.


### Architecture publique responsive

L’accueil présente trois portes d’entrée (parcours, circuits, guides), puis les
sept circuits et les accès complémentaires. Les photographies existantes sont
servies localement via `next/image`, en niveaux de gris ; aucun service média
externe n’est ajouté. Le visuel d’ouverture est prioritaire, les autres différés.
Les titres et actions restent du HTML sur surface opaque, pas du texte dans les images.

Les bandeaux des parcours, circuits et guides sont panoramiques. Le cadre public
s’étend jusqu’à 80 rem ; les formulaires et conteneurs des espaces de travail
conservent leurs largeurs. Les liens longs peuvent revenir à la ligne. La
navigation mobile expose accueil, parcours, circuits, guides et espace.

Avant fusion, vérifier à 320, 375, 768 et 1440 px : absence de débordement,
retour à la ligne des titres, menu mobile, liens du sommaire, navigation basse,
clavier et zoom 200 %. Les modifications de l’assistant restent dans la PR séparée.

### Portails prestataires et invités — lot initial

- `/prestataires/espace` : tableau de bord membre filtré sur ses prestations et
  les demandes reçues dont il est propriétaire. Les réponses réutilisent les
  contrôles serveur existants ; les engagements artistiques restent séparés.
- `/prestataires` : brouillon de demande structuré, uniquement en mémoire dans
  la page, à copier après relecture ; aucun envoi automatique.
- Projet mariage, organisateurs : rubrique d’informations pratiques distincte
  du programme interne. Publication explicite vers les seuls liens RSVP valides,
  révocable en décochant et enregistrant. Ne pas y recopier des notes privées.
- RSVP : export calendrier local, informations pratiques publiées, précisions
  facultatives adultes/enfants et présence par moment. Les précisions sont
  déclaratives, pas une invitation supplémentaire. Aucun champ de santé ajouté.

**Avant de fusionner/déployer les fonctions connectées :** sauvegarder la base,
valider puis appliquer `npm run db:migrate` sur la base de Preview, et seulement
après tests sur la base de Production selon votre procédure. La migration
`0006_guest_portal.sql` ajoute deux colonnes JSONB nullables ; elle ne supprime
aucune donnée. Elle n’est pas exécutée par le build. Les anciens RSVP conservent
leur fonctionnement sans détails renseignés. Ne pas utiliser `db:seed` sur une
base réelle. Ne pas activer les comptes pour simplement consulter l’aperçu.

L’historique utilise des migrations SQL personnalisées à partir de 0002 : les
snapshots Drizzle ne représentent pas toutes les tables déjà créées. Continuer
avec une migration personnalisée contrôlée plutôt qu’appliquer aveuglément un
`db:generate` qui proposerait de recréer les tables mariage existantes.

À valider sur une base de test migrée : organisateur autorisé/refus non-membre,
publication puis retrait des informations, lien RSVP valide/expiré/révoqué,
totaux adultes/enfants, réponse négative, modification et retrait des précisions,
export calendrier sans jeton, et isolation des demandes de deux prestataires.
Le suivi multiservice des devis, les signatures, paiements, portfolios et
calendriers de disponibilité restent des lots ultérieurs.
### Assistant de navigation — conversation

Le widget reste local et déterministe, **sans IA générative** ni service tiers.
Une salutation peut précéder un besoin (« Bonjour, je voudrais organiser mon
mariage »). Les commandes « suivant », « précédent », « je suis perdu », « stop »
et « reprendre » aident à continuer un guide ou retrouver les brouillons.
Elles ne confirment jamais une transmission : les cartes explicites restent
obligatoires. Lorsqu'il y a plusieurs parcours, le membre choisit le suivi
concerné avant de demander un rappel ou une transmission.

Les circuits publics sont accessibles depuis la conversation. L'assistant ne
contourne ni les rôles ni la fermeture des comptes. La fin d'un guide signifie
que les explications ont été parcourues, **pas** qu'un formulaire a été envoyé.
La conversation n'est pas stockée dans le navigateur : un rechargement l'efface ;
les réponses déjà sauvegardées restent dans les brouillons du membre.

Vérification manuelle avant ouverture : sur mobile et ordinateur, essayer une
salutation suivie d'un besoin, une demande ambiguë, le passage entre deux pages,
« je suis perdu », et la reprise d'un brouillon ; vérifier aussi qu'un visiteur
n'accède pas aux actions privées et qu'une transmission demande toujours sa
confirmation sur la carte. Ne pas activer les comptes pour tester le guide.

### Carte des liens — premier périmètre

`/carte-des-liens` est accessible depuis le pictogramme réseau du header et le
pied de page. Catalogue sans compte et sans base, construit à partir de
`SITUATIONS` et `ORGANISMS_SEED` : pas de nouvelle promesse institutionnelle.
Les relations sont des exemples d’orientation issus de variantes des questions
existantes (valeurs par défaut puis une réponse modifiée à la fois). Ce n’est
ni une évaluation personnelle ni une couverture exhaustive des combinaisons.
Chaque lien affiche ses tâches justificatives et la version des règles internes ;
le contenu du catalogue reste à vérifier auprès des sources de référence.

Le graphe centré se parcourt de proche en proche, avec filtre par nature du lien,
recherche, choix manuel du moment de vie et liste HTML équivalente. Les choix
restent en mémoire, sans profil enregistré. Aucune donnée personnelle n’est lue,
aucune affiliation ni causalité automatique n’est déduite. Les liens de transfert,
les relations institutionnelles et les relations personnelles réelles ne sont
pas représentés dans ce premier lot. « Ma situation » est un choix manuel, pas
une personnalisation sur la base des droits ou du régime de l’utilisateur.

### Voix éditoriale et ancrage Mont Noir

Les textes de découverte privilégient une voix originale : sobriété, mémoire des
lieux, attention aux gestes transmis et aux liens humains. Ils ne sont ni un
pastiche ni des citations de Marguerite Yourcenar. Les formulaires, confirmations,
permissions et textes réglementaires conservent leur langage fonctionnel.

`/territoire` situe l’intention autour de Bailleul, Saint-Jans-Cappel et du Mont
Noir, avec une source officielle sur la résidence d’écriture et un lien CLEISS
sur les soins des frontaliers. Aucun partenariat n’est annoncé. Aucune photo
existante n’est présentée comme une photographie locale du Mont Noir.

Ce lot est éditorial : il n’ajoute ni géocodage belge, ni règles transfrontalières,
ni réseau professionnel local, ni droits calculés selon résidence/travail. Les
limitations sont affichées sur la page et dans le bandeau territorial d’accueil.

### Grille responsive partagée

Les primitives `.layout-container`, `.layout-grid` et `.layout-section` centralisent
largeurs, marges, gouttières et rythme vertical. La grille utilise 4 colonnes sous
768 px, 8 à partir de 768 px et 12 à partir de 1024 px, avec `minmax(0, 1fr)`.
Les rangées `.layout-halves`, `.layout-thirds` et `.layout-quarters` répartissent
les blocs de l’accueil ; les enfants occupent toute la rangée sur petit écran.

`PageColumn`, l’en-tête, le pied de page, les héros et `Container` partagent les
mêmes marges. Les variantes lecture (46 rem) et travail (56 rem) restent étroites.
Les fonds et images pleine largeur restent hors du conteneur. Le graphe et les
formulaires conservent leurs dispositions métier ; toutes les grilles internes
historiques ne sont pas migrées vers les nouvelles primitives dans ce lot.

À vérifier visuellement avant fusion : 320/375/768/1024/1440 px, zoom 200 %, header,
retours à la ligne, colonnes de cartes et formulaires. Aucun changement métier,
base, permission ou production dans ce lot.
