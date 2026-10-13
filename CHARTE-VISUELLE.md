# Charte visuelle AIME® · Le Monde Aime

**Date :** 13 octobre 2026 · **Version :** 2 (sans image, composition typographique).
**Références de contenu :** RECHERCHE-SITES-PRIMES.md. Tokens : `app/globals.css`. Familles et libellés : `lib/constants.ts`. Composants : `components/ui.tsx`.

---

## 1. Principe directeur

Le site se lit d'abord par la **typographie**. Il n'a pas de photos : la forme, le texte et la grille portent l'information.
La couleur de fond sert à **ouvrir une section**, jamais à porter seule une information.

Deux traditions guident la composition :

- **Style typographique suisse** : grille stricte, texte aligné à gauche, grand titre en grotesque, hiérarchie par la taille et le poids, filets fins, asymétrie maîtrisée.
- **Design norvégien** : espace généreux, tons calmes, fonctionnalité, ton humain, pas d'ornement.

**Ce qu'on ne fait pas :** photographies décoratives, dégradés, ombres portées, effets 3D, défilement cinématique, animations qui ne servent pas la lecture.

> GOV.UK reste une référence de **clarté du contenu** ; la forme est ici pensée autrement.

---

## 2. Repérer une catégorie sans la couleur

Une catégorie est identifiée par **trois repères redondants**, dont la couleur n'est qu'un quatrième :

1. **Un numéro** (01, 02, 03, 04), qui donne l'ordre de la légende.
2. **Une forme** (carré, cercle, triangle, losange), propre à chaque famille.
3. **Un libellé en texte** (« Démarches et droits », « Terre et quotidien »…), toujours présent.

| Famille | Numéro | Forme | Libellé | Fond (quand la famille ouvre une section) |
|---|---|---|---|---|
| Démarches et droits | 01 | ■ carré | Démarches et droits | bleu `#1F4E8C` · texte blanc (8,3:1) |
| Terre et quotidien | 02 | ● cercle | Terre et quotidien | vert `#2F6B3E` · texte blanc (6,4:1) |
| Arts et rencontres | 03 | ▲ triangle | Arts et rencontres | vermillon `#B8381F` · texte blanc (5,8:1) |
| Savoirs et générations | 04 | ◆ losange | Savoirs et générations | ocre `#E9B038` · texte encre (8,6:1) |
| Information générale | — | ▬ barre | Information générale | encre `#1D1D1F` · texte blanc (16,8:1) |

**Règles d'usage**

- Une catégorie n'est jamais représentée par une couleur seule : la forme et le libellé doivent suffire à la reconnaître. Un test : passer le site en niveaux de gris ou en daltonisme (protanopie) ne doit rien faire perdre.
- Le blanc sur ocre (2:1) est interdit. Le texte sur ocre est toujours encre.
- Les couleurs de famille ne servent jamais au corps de texte, seulement aux bandeaux, aux repères et aux pastilles.
- Les seuils visés : **4,5:1** pour le texte, **3:1** pour les éléments graphiques porteurs d'information.

### Affectation

| Thématique | Famille |
|---|---|
| Famille, santé, argent et difficultés, logement, retraite, emploi, activité et cotisations, accompagnement d'un proche | Démarches et droits |
| Mariage, arts et rencontres, événements et artistes | Arts et rencontres |
| Terre & quotidien (produits, dons, prêts, trajets, jardins) | Terre et quotidien |
| Savoirs & générations (transmission, cuisine, couture, mémoire) | Savoirs et générations |
| Vie administrative, accueil | Information générale |

La **légende** (`CategoryLegend`) affiche les quatre familles avec leur forme, leur numéro, leur libellé et leur périmètre. Elle est affichée sur l'accueil.

---

## 3. Typographie

- **Police :** Inter Variable, auto-hébergée (`@fontsource-variable/inter`). Grotesque ouverte, proche de l'esprit suisse. Aucun appel à un service tiers.
- **Titre de héros :** `clamp(3rem, 9vw, 8.5rem)`, graisse 700, interlignage 0,92, crénage −0,04em.
- **Titres de section :** graisse 700, crénage serré.
- **Surtitre :** 12 px, capitales, espacement 0,16em, précédé d'un filet et de la forme de famille.
- **Corps :** 16 à 20 px, interlignage 1,6, 60 à 75 caractères par ligne.
- **Alignement :** à gauche, toujours. Pas de paragraphe centré.

---

## 4. Grille et composition

- Grille de **12 colonnes** à partir de `lg` (1024 px), largeur maximale 1280 px, marges 24 à 32 px.
- **Héros :** titre pleine largeur ; sous-titre et actions dans les colonnes 7 à 12 (décalage suisse) ; pied du héros optionnel, en trois colonnes numérotées.
- **Index** (thématiques de l'accueil) : une ligne par sujet, numéro, forme et libellé, description, flèche. Filets de 1 px entre les lignes.
- Un élément dominant par écran. L'espace blanc sépare les niveaux de lecture.
- Filets fins pour structurer ; pas de bordures épaisses, pas d'ombres décoratives.

---

## 5. Composants

| Composant | Rôle |
|---|---|
| `Hero` | Héros typographique : prop `tone` (famille), `eyebrow`, `title`, `subtitle`, `actions`, `footer`, `children`. Aucune image. |
| `SectionTitle` | Bandeau des espaces connectés. Même principe, prop `tone` (défaut : encre). |
| `FamilyMark` | Forme de famille. Variante `chip` (pastille colorée) ou nue (couleur du texte). |
| `CategoryLegend` | Légende des quatre familles, à afficher là où l'on lit les catégories. |
| `AuthSplit` | Connexion et inscription : panneau encre, titre en typographie, pas d'image. |

**Héros actuels**

| Page | Famille |
|---|---|
| Accueil | Information générale · pied : terre, arts, générations |
| Informations | Information générale |
| Thématique `/informations/[theme]` | Selon `THEME_TONE` |
| Guide `/guides/[slug]` | Selon la thématique de l'article |
| Accompagnement | Démarches et droits |
| Annuaire | Terre et quotidien |
| Espaces connectés | Information générale (défaut) |

---

## 6. Ce qui a été retiré

- **Toutes les images de l'application** (`public/images/`, 15 fichiers générés) et leurs références : héros, mosaïque, cartes de guides, bandeaux, écrans de connexion. Les fichiers restent récupérables dans l'historique git.
- Les superpositions d'image et l'animation de zoom associée (CSS).
- Les champs `image` des thématiques, des univers, des situations et des démarches.

---

## 7. Reste à faire

1. **Carte et communauté** : les marqueurs gardent les couleurs historiques (violet, orange, bleu, jaune). Proposition : la couleur pour l'univers, la forme pour le type (personne, offre, besoin, projet). À valider puis à migrer.
2. **Légende sur les pages Informations** : à ajouter, même composant.
3. **Accessibilité** : relecture au lecteur d'écran, zoom 200 %, vérification en niveaux de gris et en daltonisme sur les pages réelles.
4. **Rendu visuel** : à contrôler sur navigateur. Les contrôles automatiques (typecheck, lint, build, contrastes) ne suffisent pas à juger la composition.

---

## 8. Vérification

- Contrastes : calculés (section 2).
- `npm run typecheck` et `npm run lint` : passent.
- Build de production : voir le journal du commit.
- Rendu : non vérifié à l'œil dans cette session.
