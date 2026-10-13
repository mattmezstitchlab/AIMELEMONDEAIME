# Audit de simplification — AIME® · Le Monde Aime

**Question posée :** la bande « Prototype de démonstration… » est supprimée (voir plus bas).
Et comment simplifierais-je l'application elle-même ?

**Réponse courte :** l'app n'est pas mal construite, elle est **trop riche** : presque chaque besoin
a deux ou trois portes d'entrée. Je la simplifierais en appliquant une règle unique —
**« un besoin = une seule porte »** — sans toucher au modèle de sécurité, qui est la partie la plus saine.

Chiffres actuels : 40 pages + 11 routes API · 42 tables · 86 actions serveur · ~16 100 lignes · 3 coquilles de mise en page.

---

## Fait : suppression de la bande du haut

`PrototypeBanner` (dans `components/ui.tsx`) était affichée par les trois coquilles —
publique, authentification et espaces connectés — donc sur **toutes** les pages.
Composant et ses 3 usages supprimés, rebuild et contrôle effectués : 0 occurrence sur `/`, `/connexion`, `/espace`.

Il reste **une** mention, une seule fois, dans le pied de page public (texte légal complet) :
c'est l'endroit où ce type d'information doit vivre — visible, mais sans s'imposer à chaque écran.
Si vous voulez aussi l'y retirer, c'est une ligne à enlever dans `components/public-shell.tsx` ;
je conseille de la garder, ou de la déplacer vers une page « Méthode et limites » déjà existante (`/vision`).

## ✅ Chantier 1 exécuté (voir détail ci-dessous)

`/informations` est devenue la porte unique : l'explorateur riche (recherche, filtres thématique/public,
lecture intégrée) y a été déplacé, `?vue=guides` filtre les guides pratiques, `?theme=` et `?q=` fonctionnent.
Redirections permanentes 308 depuis `/s-informer`, `/guides`, `/univers/terre|arts|savoirs|evenements|aidants|administratif`,
liens internes (accueil, en-tête, pied de page, assistant, orientation) mis à jour, pages supprimées.
Le détail des guides reste sur `/guides/[slug]`. **Aucune fonctionnalité perdue**, vérifié sur le build de production.
Routes publiques supprimées : 3 (`/s-informer`, `/guides`, `/univers/[slug]`) + 2 fichiers.

## Les 5 chantiers, par ordre de rentabilité

### 1. Fusionner les 4 portes « s'informer » (gain : élevé · effort : faible à moyen)
Aujourd'hui, le même contenu (la table `articles`) est servi par **quatre arborescences parallèles** :
`/informations` + `/informations/[theme]` (6 thématiques), `/s-informer` (les mêmes thématiques en ancres `#theme-sante`…),
`/guides` + `/guides/[slug]` (les mêmes articles, triés par `kind`), et `/univers/[slug]` (pages éditoriales codées en dur).
L'en-tête pointe vers `s-informer`, la mosaïque de l'accueil vers `informations` et `univers` : l'utilisateur ne peut pas deviner la différence.

**Je garderais** `/informations/[theme]` comme porte unique (URL propres, bonnes pour le référencement),
les guides devenant un filtre de cette même page, et je redirigerais le reste :

| Ancien | Nouveau |
|---|---|
| `/s-informer`, `/s-informer#theme-X` | `/informations/X` (redirection 308) |
| `/guides`, `/guides/[slug]` | `/informations?vue=guides`, `/guides/[slug]` conservé pour le détail |
| `/univers/terre`, `/univers/arts`, `/univers/savoirs` | Thématiques de la carte `/le-monde-aime?univers=X` |
| `/univers/evenements`, `/univers/aidants`, `/univers/administratif` | Pages thématiques `/informations/...` ou sections de `/accompagnement` |

L'accueil passerait de 12 tuiles mosaïque à 6 thématiques + 3 univers carte, ce qui rend aussi la page d'accueil plus courte.

### 2. Unifier les deux systèmes de « démarches » (gain : élevé · effort : moyen à élevé)

> **Temps 1 (façade unique) exécuté le 2026-08-10 (commit à suivre).** Le membre ne voit plus qu'un
> seul objet « démarche » : `/espace/demarches` fusionne parcours guidés et dossiers dans **une seule
> liste triée par date de mise à jour**, avec le même design de carte, un vocabulaire membre unifié
> (« Parcours guidé » / « Dossier suivi par l'équipe » ; « Questionnaire à terminer », « Pièce manquante
> à fournir », « En cours d'instruction »…) et une barre de progression pour les parcours. L'assistant
> de création est unique lui aussi : l'entrée par la situation reste la porte principale, et les
> démarches de bureau — auparavant reléguées dans un bloc replié « dossier de démonstration » — sont
> présentées dans le même flux, filtrables par la même recherche. Les deux pages de détail gardent
> leurs routes (aucun lien cassé, back-office inchangé) mais partagent le même fil d'Ariane.
> Vérifié sur le build de production avec les deux familles de données réelles.
> **Reste le temps 2 (fusion des données)** : faire « devenir » dossier un parcours transmis à un
> bureau (lien `journeys → cases`, reprise des tâches et des pièces), au lieu de deux objets parallèles.

C'est le doublon le plus coûteux. Deux modèles cohabitent et s'affichent **mélangés dans la même liste** `/espace/demarches` :
les `cases` (dossiers formels instruits par le back-office : statuts, pièces, affectation) et les `journeys`
(parcours guidés par situation : tâches, rappels, engagements d'artistes). Même la création est double :
`/espace/demarches/nouvelle` démarre à la fois des procédures (`startProcedure`) et des situations.

**Je ferais :** en façade, **un seul objet « démarche »** pour le membre — une seule liste, un seul assistant de création
(entrée par la situation, qui est la bonne idée produit du site). En coulisses, le parcours guidé reste le mode par défaut ;
quand le membre transmet à un bureau, le parcours « devient » un dossier instruit au lieu d'en créer un second.
C'est le chantier le plus structurant : à faire en deux temps (d'abord l'interface unifiée, ensuite la fusion des données),
après les chantiers 1 et 3 qui ne demandent que des redirections.

### 3. Regrouper les espaces du membre (gain : moyen · effort : faible)
Trois endroits racontent la même vie relationnelle : `/espace/echanges` (mes demandes), l'onglet « Mes liens » de la carte
(projets, cercles, invitations), et `/espace/projets`. **Je garderais un seul « Mes échanges & projets »** dans l'espace,
la carte ne conservant que « Explorer » et « Publier ». La navigation de l'espace passerait de 7 entrées à 5 :
Aperçu · Démarches · Échanges & projets · Documents · Profil (la carte sort de la navigation membre, elle est dans l'en-tête public).

### 4. Ne garder qu'un seul système d'aide (gain : moyen · effort : faible)
Trois couches se recouvrent : le champ d'orientation de l'accueil (`OrientationEntry` + moteur `orientation.ts`),
le widget assistant (445 lignes + registre de 537 lignes) et le moteur de situations.
**Je garderais l'assistant** (il est local, sans appel externe, cohérent avec la promesse vie privée) et je transformerais
le champ de l'accueil en simple déclencheur : on tape son besoin → l'assistant s'ouvre avec la question pré-remplie.
On supprime une implémentation entière de recherche par mots-clés, il n'en reste qu'une à maintenir.

### 5. Simplifier les fondations visibles par l'équipe (gain : moyen · effort : faible)
- **3 coquilles → 2** : `auth-split` (connexion/inscription) devient une variante de la coquille publique ; `app-shell` reste pour les espaces connectés.
- **4 fichiers de seed → 1** : `seed.ts`, `seed-aime.ts`, `seed-lma.ts` et le seed communautaire dans `seed-data.ts` racontent une seule histoire de données de démo.
- **La démo `/decouvrir`** rejoue l'espace avec une coquille factice (`demo-shell`) qui vieillira séparément de la vraie :
  la remplacer par un **compte de démonstration en lecture seule** dans la vraie interface (un bouton « Voir la démo » qui connecte `demo@aime-demo.fr`) supprime toute une copie d'UI à maintenir.

## Ce que je ne simplifierais pas
Le modèle d'autorisation (rôle revérifié en base à chaque requête, anti-IDOR testé), la vie privée de la carte
(opt-in, coordonnées arrondies), le journal d'audit, la validation Zod et l'assistant 100 % local.
Simplifier là-dessus serait perdre ce qui rend le produit défendable.

## En une phrase
Passer de « beaucoup de portes » à « une porte évidente par besoin » ferait passer le site
d'environ **51 routes à ~38**, supprimerait **2 moteurs de recherche interne sur 3**, **1 système de suivi sur 2**,
et rendrait l'accueil, l'en-tête et l'espace membre lisibles en un coup d'œil —
sans retirer une seule fonctionnalité aux utilisateurs.
