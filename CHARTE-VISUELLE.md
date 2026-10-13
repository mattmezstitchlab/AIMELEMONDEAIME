# Charte visuelle AIME® · Le Monde Aime

**Date :** 13 octobre 2026 · **Statut :** première version appliquée aux héros publics.
**Référence de contenu :** RECHERCHE-SITES-PRIMES.md. Les tokens sont dans `app/globals.css`, la logique des familles dans `lib/constants.ts`.

---

## 1. Principe directeur

Le site ne cherche pas à impressionner : il doit **réduire l'effort cognitif** et être **lisible par tous**.
La typographie porte la hiérarchie, la couleur porte le sens, l'image vient en complément.

Deux traditions guident la mise en page :

- **Style typographique suisse** : grille stricte, texte aligné à gauche (fer à gauche), grand titre en sans-serif
  grotesque, hiérarchie par la taille et le poids plutôt que par les effets, photographie objective.
- **Design norvégien** : espace généreux, tons naturels, lumière, fonctionnalité calme, ton humain et sans ostentation.

Ce qu'on ne fait pas : effets 3D, défilement cinématique, dégradés décoratifs, animations qui ne servent pas la lecture.

> Sur GOV.UK : c'est une référence de **clarté du contenu**, pas de style. Ses principes de rédaction et de parcours
> sont repris ; le visuel, volontairement sobre, ne l'est pas. AIME® garde la clarté et prend la main sur la forme.

---

## 2. Code couleur

Une couleur = un sens fixe, partout dans l'app. Quatre familles et une encre neutre. Pas de cinquième couleur de famille.

| Token | Hex | Sens | Texte sur cette couleur | Contraste |
|---|---|---|---|---|
| `demarche` | `#1F4E8C` | Démarches, droits, administration, santé, famille, argent, logement, retraite, emploi, cotisations | blanc | **8,31:1** |
| `terre` | `#2F6B3E` | Terre & quotidien : produits locaux, dons, prêts, trajets, jardins | blanc | **6,38:1** |
| `arts` | `#B8381F` | Arts & rencontres : artistes, ateliers, événements, mariage | blanc | **5,80:1** |
| `savoirs` | `#E9B038` | Savoirs & générations : transmission, cuisine, couture, mémoire locale | **encre** | **8,60:1** |
| `encre` | `#1D1D1F` | Texte, actions principales, information générale | blanc | **16,83:1** |

Contraste calculé selon WCAG 2.x. Seuils visés : **4,5:1** pour le texte normal, **3:1** pour le grand texte et les éléments d'interface.

### Règles d'usage

1. **Jamais la couleur seule.** Chaque famille est accompagnée d'un libellé, d'une icône ou d'une forme.
2. **Texte blanc** sur `demarche`, `terre`, `arts` et `encre` ; **texte encre** sur `savoirs`. Le blanc sur ocre (1,96:1) est interdit.
3. **Pas de couleur de famille en petit texte de corps** : elles servent aux bandeaux, aux héros, aux repères et aux pastilles.
4. **Le neutre domine** (blanc, papier `#FAFAF9`, encre) : une page n'utilise qu'une famille à la fois, plus une touche de la famille voisine si besoin.
5. Les couleurs historiques de la carte (violet, orange, bleu, jaune) **ne sont pas encore migrées** : voir section 6.

### Affectation des thématiques

| Thématique | Famille |
|---|---|
| Famille, santé, argent et difficultés, logement, retraite, emploi, activité et cotisations | `demarche` |
| Mariage | `arts` |
| Accompagnement, annuaire des points d'accueil | `demarche` (accompagnement), `terre` (points d'accueil de proximité) |
| Accueil, informations générales | `encre` |

L'accueil reprend les trois familles de sa promesse : **la terre** (`terre`), **les arts** (`arts`), **les générations** (`savoirs`). Une bande de trois couleurs sous le héros rend ce code visible dès la première page.

---

## 3. Typographie

- **Police :** Inter Variable (licence ouverte, grotesque proche de l'esprit suisse). Auto-hébergée via `@fontsource-variable/inter`, donc sans appel à un service tiers.
- **Titre de héros :** `clamp(2.75rem, 7vw, 6.25rem)`, graisse 700, interlignage 0,95, crénage −0,035em.
- **Titres de section :** graisse 700, crénage serré.
- **Texte de corps :** 16 à 20 px, interlignage 1,6 ; longueur de ligne 60 à 75 caractères.
- **Surtitres (eyebrow) :** 12 px, capitales, espacement 0,16em, précédés d'un filet horizontal : c'est la signature suisse du site.
- **Alignement :** toujours à gauche, jamais centré pour un paragraphe.

---

## 4. Grille et mise en page

- Grille de **12 colonnes** à partir de `lg` (1024 px), largeur maximale 1280 px, marges 24 px (mobile) à 32 px.
- Héros : texte sur **7 colonnes**, image sur **5 colonnes** en format 4:5 ; sur mobile, la pile est : texte, puis image.
- Un élément dominant par écran. L'espace blanc n'est pas du vide : il sépare les niveaux de lecture.
- Filets fins (1 px) pour structurer, pas de bordures épaisses ni d'ombres portées décoratives.

---

## 5. Héros : état actuel

Composant `Hero` (`components/ui.tsx`) : prop `tone` (famille), `image` optionnelle en colonne, `footer` optionnel (bande de couleurs).

| Page | Famille | Image |
|---|---|---|
| Accueil `/` | `encre` + bande terre / arts / savoirs | `hero-accueil.jpg` |
| Information `/informations` | `encre` | `hero-campagne.jpg` |
| Thématique `/informations/[theme]` | selon `THEME_TONE` | image de la thématique |
| Guide `/guides/[slug]` | selon la thématique de l'article | image de la thématique |
| Accompagnement `/accompagnement` | `demarche` | `hero-conseiller.jpg` |
| Annuaire `/annuaire` | `terre` | `hero-conseiller.jpg` |

**Non modifiés pour l'instant :** les bandeaux des espaces connectés (`SectionTitle`, 21 emplacements). Ils gardent la photo de fond. Leur passage en couleur est la phase suivante, une fois le rendu validé sur le site public.

---

## 6. Reste à faire

1. **Carte et communauté** : migrer les marqueurs (aujourd'hui violet, orange, bleu, jaune, dont le jaune échoue en texte) vers le code de familles. Proposition : la couleur indique l'univers, la **forme** indique le type (personne, offre, besoin, projet). Décision à valider.
2. **Bandeaux des espaces connectés** : appliquer le même système.
3. **Photographie** : les images actuelles sont générées. Remplacer par des photos réelles, avec consentement, en cohérence avec le style objectif.
4. **Accessibilité** : contrôle au lecteur d'écran et au zoom 200 % sur les héros, vérification des couleurs pour les daltoniens (protanopie, deutéranopie) sur la carte.
5. **Validation visuelle** : les héros ont été contrôlés par typecheck, lint, build et calcul de contrastes. Un relevé visuel sur navigateur reste à faire.

---

## 7. Vérification

- Contrastes des cinq couleurs : calculés (section 2).
- `npm run typecheck`, `npm run lint` : passent.
- Build de production : voir le journal du commit.
- Rendu visuel : **non vérifié à l'œil** dans cette session (pas de navigateur disponible, et la page d'accueil nécessite une base de données).
