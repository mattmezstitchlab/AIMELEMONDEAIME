# Recherche : sites primés dans le monde et enseignements pour AIME® · Le Monde Aime

**Date :** 13 octobre 2026 · **Objet :** comparer AIME® aux meilleurs sites récompensés (Awwwards, CSS Design Awards,
Webby, WebAward, GOV.UK) et dégager ce qui est transposable, ce qui ne l'est pas.
**Nature :** note de réflexion, pas une spécification. Aucune ligne de code n'a été modifiée.

---

## 1. Synthèse en dix lignes

1. Les jurys récompensent **l'équilibre**, pas le spectaculaire. Chez Awwwards, le design compte 40 %, l'ergonomie 30 %, la créativité 20 %, le contenu 10 % ([1](https://www.utsubo.com/blog/award-winning-website-design-guide)).
2. Les sites qui échouent sont souvent ceux qui soignent le visuel et négligent la performance ou la cohérence entre pages ([1](https://www.utsubo.com/blog/award-winning-website-design-guide)).
3. La référence **civique** la plus citée reste **GOV.UK** : « Do the hard work to make it simple », « Do less », questionnaires guidés plutôt que pages de texte ([2](https://www.uxmatters.com/mt/archives/2016/01/how-focusing-on-user-experience-helped-govuk-win-design-of-the-year.php)).
4. Les sites d'associations primés misent sur la **clarté**, les **chiffres d'impact**, la **mobilité** et l'**accessibilité** ([3](https://elevationweb.org/blog/9-nonprofit-web-design-trends-to-watch-in-2025/), [4](https://www.educowebdesign.com/news/13-non-profit-web-design-trends-2025)).
5. Le **parcours par situation** d'AIME® est la même idée que le questionnaire GOV.UK : c'est un atout à renforcer, pas à remplacer.
6. Les expériences immersives (WebGL, scroll cinématique) gagnent des prix, mais **ne sont pas transposables** à un service d'accompagnement pour des personnes qui cherchent une démarche.
7. Le sujet **accessibilité du mouvement** (WCAG 2.3.3) est déjà traité dans l'app (règle `prefers-reduced-motion`). C'est à vérifier, pas à reconstruire.
8. Le **système de couleurs** actuel est volontairement sobre, mais son nommage (« emerald ») ne correspond plus à la réalité (gris quasi noirs). À trancher.
9. Les **visuels** sont générés, pas photographiés. Les sites primés pour le civique et l'associatif s'appuient sur de vraies photos et de vrais témoignages.
10. Recommandation : rester **sobre et civique** (la voie GOV.UK / OpenSecrets), en gardant **un seul geste expressif** (la carte, ou le parcours) plutôt que plusieurs effets.

---

## 2. Ce que mesurent les jurys

| Concours | Critères | Ce que ça dit pour AIME® |
|---|---|---|
| **Awwwards** | Design 40 %, Ergonomie 30 %, Créativité 20 %, Contenu 10 %, avec au moins 18 jurés par site ([1](https://www.utsubo.com/blog/award-winning-website-design-guide)) | Le jury pèse surtout l'esthétique et l'usage ; l'originalité seule ne suffit pas. |
| **CSS Design Awards** | Trois notes sur 10 : UI, UX, Innovation ([5](https://www.cssdesignawards.com/blog/2025-website-of-the-year-winners/430/)) | Dans les deux cas cités (Dropbox Brand, Lacoste), la note UX est au même niveau que la note UI : la qualité d'usage pèse autant que le visuel. |
| **Webby — catégorie Government & Associations** | Sites qui permettent l'action citoyenne, l'auto-information, la publication de documents et l'accès aux services ([6](https://www.opensecrets.org/news/2026/04/opensecrets-wins-webby-award/)) | C'est **la catégorie la plus proche d'AIME®**. Elle récompense exactement ce que fait l'app. |
| **WebAward — Government** | Design, facilité d'usage, rédaction, interactivité, technologie, innovation, contenu ([7](https://www.webaward.org/category/Government/best-government-websites.html)) | Un critère « rédaction » explicite : la qualité des textes compte autant que l'écran. |

**Lecture :** pour un site d'accompagnement, le bon repère n'est pas Awwwards mais la catégorie *services publics et associations* des Webby et le design de service de l'État.

---

## 3. Les sites de référence, par pertinence

### 3.1 Référence majeure — GOV.UK (Royaume-Uni)

- Lauréat du *Design of the Year* en 2013, choisi parmi 98 candidatures. Le jury le juge au design « bien pensé, mais sobre », et estime qu'il « crée un référentiel » auquel les sites gouvernementaux peuvent être comparés ([8](https://www.bbc.co.uk/news/entertainment-arts-22164715)).
- Dix principes publics, dont « Start with users' needs », « Do less », « Do the hard work to make it simple » ([2](https://www.uxmatters.com/mt/archives/2016/01/how-focusing-on-user-experience-helped-govuk-win-design-of-the-year.php), [9](https://www.vsourz.com/ca/blog/what-are-the-government-design-principles/)).
- Exemple clé : le **quiz de visa**, qui pose des questions selon la situation et ne laisse pas l'usager lire des pages entières. Les réponses précédentes restent visibles pour revenir en arrière ([2](https://www.uxmatters.com/mt/archives/2016/01/how-focusing-on-user-experience-helped-govuk-win-design-of-the-year.php)).
- Le principe « **Do less — and check your ego** » : si un outil externe fait mieux, on le recommande au lieu de le remplacer ([2](https://www.uxmatters.com/mt/archives/2016/01/how-focusing-on-user-experience-helped-govuk-win-design-of-the-year.php)).

**Pour AIME® :** c'est la référence à suivre. L'entrée « par situation » de l'accueil et de l'assistant correspond à ce modèle. À renforcer : une réponse claire (« voici votre démarche, voici l'étape suivante ») plutôt qu'une liste de liens.

### 3.2 Référence institutionnelle française — Système de Design de l'État (DSFR)

- Système de composants obligatoire pour les sites de l'État, avec « Marianne » comme typographie et un accent sur l'accessibilité ([10](https://www.systeme-de-design.gouv.fr/version-courante/fr)).
- Le DSFR est **réservé aux services de l'État** ([10](https://www.systeme-de-design.gouv.fr/version-courante/fr)). AIME® se présente comme « indépendante et non affiliée à un organisme public » : **il ne peut pas l'utiliser**.
- Mais ses règles sont une bonne grille de lecture : des composants identiques, une navigation à deux clics maximum, une documentation accessible ([11](https://www.systeme-de-design.gouv.fr/version-courante/fr/a-propos/articles-et-actualites/decouvrez-la-nouvelle-version-de-notre-site)).

**Pour AIME® :** on peut s'inspirer des **principes** (cohérence, accessibilité par défaut, peu de niveaux) sans reprendre le **système** ni son identité visuelle.

### 3.3 Référence civique américaine — OpenSecrets (Webby 2026) et NASA.gov

- **OpenSecrets** : organisation de recherche nonpartisane, lauréate du Webby 2026 en « Government & Associations » ([6](https://www.opensecrets.org/news/2026/04/opensecrets-wins-webby-award/)). Son sujet (l'argent en politique) est complexe ; le site doit donc le rendre lisible (mon appréciation, la source ne détaille pas la mise en page).
- **NASA.gov** : lauréat Webby 2024 et 2025 dans la même catégorie, pour un site très riche en contenus ([12](https://www.nasa.gov/reference/nasa-webby-award-winners/)).

**Pour AIME® :** la **confiance par la source** (d'où vient l'information, à quelle date, qui la maintient). L'app a déjà un journal et des mentions ; il faut les rendre visibles sur les pages d'information.

### 3.4 Associations et organismes à but non lucratif

Les tendances 2025 pour les associations convergent ([3](https://www.elevationweb.org/blog/9-nonprofit-web-design-trends-to-watch-in-2025/), [4](https://www.educowebdesign.com/news/13-non-profit-web-design-trends-2025), [13](https://www.glueup.com/blog/association-website-design)) :

- **Accessibilité prioritaire** : contrastes, clavier, sous-titres, lecteurs d'écran.
- **Mobile d'abord** : environ 52 % du trafic des associations vient du mobile ([3](https://www.elevationweb.org/blog/9-nonprofit-web-design-trends-to-watch-in-2025/)).
- **Chiffres d'impact** en gros caractères : besoin, résultat, objectif ([4](https://www.educowebdesign.com/news/13-non-profit-web-design-trends-2025)).
- **Espaces communautaires** : forums, agendas partagés, membres mis en avant ([3](https://www.elevationweb.org/blog/9-nonprofit-web-design-trends-to-watch-in-2025/)).
- **Sites par antenne locale** : une page par territoire, un agenda central qui agrège tout ([14](https://redefineweb.com/blog/association-nonprofit-web-design-wins-members/)).

Exemples cités : National Education Association, United Spinal Association ([13](https://www.glueup.com/blog/association-website-design)), Human Rights Campaign ([15](https://midnay.com/blog/best-nonprofit-websites/)), Environmental Defense Fund ([4](https://www.educowebdesign.com/news/13-non-profit-web-design-trends-2025)).

**Pour AIME® :** la **carte par territoire** et l'**annuaire** vont dans ce sens. Attention aux « big stats » : elles ne doivent afficher que des données réelles (les comptes et projets de démonstration sont marqués « fictifs » dans l'app).

### 3.5 Design expressif primé — Dropbox Brand et Lacoste Members Experience

- **Dropbox Brand** (Daybreak Studio), Website of the Month CSS Design Awards en janvier 2025 (note 8,92) : charte graphique transformée en terrain de jeu interactif. Outils de manipulation (typographie, couleurs, animations), 404 soignée, structure « très ordonnée » assumée ([16](https://www.commarts.com/webpicks/dropbox-brand-guidelines), [17](https://www.cssdesignawards.com/wotm/dropbox-brand/46960/)).
- **Lacoste Members Experience** (Merci-Michel), site de co-création pour membres d'un programme de fidélité, Website of the Day CSS Design Awards (note 9,15) ([18](https://www.cssdesignawards.com/sites/lacoste-members-experience/46965)). Les concepteurs ont dit : prêt à l'emploi **en deux clics**, et une version mobile **pensée comme un produit distinct** ([19](https://www.commarts.com/webpicks/lacoste-members-experience)).

**Pour AIME® :**
- Dropbox : transformer un **guide** (les guides pratiques de `/informations`) en parcours exploratoire, en gardant la structure.
- Lacoste : le **flux de création** (publier un projet, une prestation, un don) doit tenir en deux clics ; le mobile mérite un parcours adapté, pas une version réduite.

### 3.6 Référence sobre et juridique — Kümmerlein (cabinet d'avocats, Awwwards 2025)

- Site d'un cabinet juridique, nominé 2025 : « Make it simple, but significant » ([20](https://www.spinxdigital.com/blog/best-website-design/)).
- Un secteur où la complexité est souvent un signe de sérieux, et où le site choisit la clarté.

**Pour AIME® :** c'est le ton visé pour les pages démarches : sérieux sans jargon.

### 3.7 À ne pas copier — expériences immersives

- **Messenger** (Awwwards Site of the Year 2025, catégorie développeurs) : une planète WebGL en 3D, avec sons et physique ([20](https://www.spinxdigital.com/blog/best-website-design/)).
- **Lando Norris** (Site of the Year 2025) : scroll cinématique, casque 3D qui suit la lecture ([21](https://metabole.studio/en/blog/immersive-website-examples)).

Ces sites sont remarquables, mais pour un **service d'accompagnement** : (a) ils demandent une machine puissante ; (b) ils ralentissent la tâche ; (c) ils sont très coûteux à maintenir. Un autre cas révèle le risque : même Lacoste a dû optimiser le rendu pour que le dessin ne « perde » pas d'images sur les machines modestes ([19](https://www.commarts.com/webpicks/lacoste-members-experience)).

---

## 4. Ce qui est déjà bien dans AIME®

| Point | Constat (vérifié dans le dépôt) |
|---|---|
| Accessibilité du mouvement | `prefers-reduced-motion` est en place dans `app/globals.css` (animations et transitions réduites à 0,01 ms). C'est la base recommandée ([22](https://accessibility.build/wcag/2-3-3)). |
| Pas de bibliothèque d'animation lourde | Aucune dépendance type GSAP ou Framer Motion dans `package.json` : le site reste léger. |
| Parcours par situation | L'accueil et l'assistant orientent par besoin, comme le modèle GOV.UK. |
| Sécurité et vie privée | Accès par rôle, carte avec coordonnées arrondies, assistant 100 % local : des arguments de confiance rares dans le secteur. |
| Hiérarchie typographique | Titres forts, sections bien séparées sur l'accueil. |

---

## 5. Écarts et points de vigilance

### 5.1 Nommage des couleurs
Les jetons de couleur s'appellent `emerald-*`, mais `emerald-800` vaut `#171715`, un noir quasi pur, et toute la palette est grise (`app/globals.css`). Le nom ne décrit donc pas la couleur réelle, et certains écrans (communauté en orange, espace échanges en rose) ne suivent pas cette palette.
**Proposition :** choisir **une** couleur d'accent (par exemple un vert sauge ou un bleu-vert sobre) pour les boutons principaux, la garder pour les actions, et renommer les jetons.

### 5.2 Visuels
Les images d'en-tête sont des visuels générés (voir `AUDIT.md`, §Correctifs). Les sites civiques primés utilisent de vraies photographies de personnes et de lieux ([2](https://www.uxmatters.com/mt/archives/2016/01/how-focusing-on-user-experience-helped-govuk-win-design-of-the-year.php), [4](https://www.educowebdesign.com/news/13-non-profit-web-design-trends-2025)).
**Proposition :** prévoir une campagne photo avec de vrais membres et producteurs locaux, avec consentement, avant toute mise en production.

### 5.3 Cohérence entre pages
Le jury Awwwards pénalise les sites dont la page d'accueil est soignée mais dont les pages intérieures semblent d'un autre site ([1](https://www.utsubo.com/blog/award-winning-website-design-guide)). Les simplifications de `SIMPLIFICATION.md` (coquilles, portes d'entrée) vont dans le bon sens.
**Proposition :** un contrôle visuel systématique des pages intérieures (démarches, carte, communauté) après chaque chantier.

### 5.4 Performance
Pour l'Awwwards, la performance est un critère d'ergonomie à part entière ([1](https://www.utsubo.com/blog/award-winning-website-design-guide)). La carte (`components/carte/france-map.tsx`) est, à mon avis, le point à surveiller en premier sur mobile (non mesuré).
**Proposition :** mesurer les Core Web Vitals sur `/le-monde-aime` et `/espace` avant d'ajouter tout effet visuel.

### 5.5 Mouvement JavaScript
Je n'ai pas trouvé d'animation JavaScript dans l'app (ni GSAP, ni Framer Motion dans les dépendances). Les transitions CSS sont couvertes par la règle globale. **À vérifier :** les composants de carte (zoom, survol) et l'assistant ouvert en transition.
Le critère WCAG 2.3.3 demande que le mouvement déclenché par l'utilisateur puisse être désactivé ; il est bien couvert pour le CSS, moins sûrement pour le JS ([22](https://accessibility.build/wcag/2-3-3)).

---

## 6. Pistes concrètes

Classées par rapport gain / effort, pour un site d'accompagnement.

| # | Piste | Inspiration | Gain | Effort |
|---|---|---|---|---|
| 1 | Garder une **seule** couleur d'action et renommer les jetons | Lignes directrices GOV.UK / DSFR | Élevé | Faible |
| 2 | Vérifier que tout mouvement JS respecte `prefers-reduced-motion` | WCAG 2.3.3 | Élevé (accessibilité) | Faible |
| 3 | Ajouter une **source et une date** sur chaque page d'information | OpenSecrets (Webby 2026) | Élevé (confiance) | Faible |
| 4 | Transformer un guide en **parcours** (étapes, « vous êtes ici ») | Dropbox Brand, GOV.UK visa | Élevé | Moyen |
| 5 | Mesurer les Core Web Vitals, corriger la carte | Awwwards (performance) | Élevé | Moyen |
| 6 | Remplacer les visuels générés par des **photos réelles** avec consentement | Associations primées | Élevé | Moyen (hors code) |
| 7 | Flux de création en **deux clics**, version mobile dédiée | Lacoste Members Experience | Moyen | Moyen |
| 8 | Chiffres d'impact **réels** en tête de l'accueil | Associations 2025 | Moyen | Faible, à condition d'avoir des données |
| 9 | Un **geste expressif unique** (animation de la carte ou du parcours) | Dropbox, Messenger | Moyen | Moyen |
| 10 | Pages « Méthode et sources » par thématique | GOV.UK, OpenSecrets | Moyen | Faible |

**Ce que je déconseille :** les effets 3D, le scroll cinématique, les curseurs personnalisés et les transitions de page longues. Ils sont primés pour les agences, pas pour un service d'accompagnement.

---

## 7. Questions ouvertes pour l'équipe

1. **Ton visuel :** voulez-vous une identité **sobre et institutionnelle** (GOV.UK, OpenSecrets), **chaleureuse et communautaire** (associations, Lacoste), ou **expressive** (Dropbox) ? Cela change la palette, les photos et le niveau de mouvement.
2. **Photos :** disposez-vous de photos réelles (avec consentement) des membres, producteurs et lieux de Hauts-de-France ?
3. **Chiffres d'impact :** existe-t-il des données réelles (nombre de membres actifs, de démarches accompagnées) à afficher, avec leur méthode de calcul ?
4. **Périmètre :** AIME® reste-t-elle **non affiliée** à un organisme public ? Si oui, le DSFR est exclu, et il faut définir sa propre charte.

---

## 8. Sources

1. [Award-Winning Web Design: Judging Criteria Decoded — Utsubo](https://www.utsubo.com/blog/award-winning-website-design-guide)
2. [How Focusing on User Experience Helped GOV.UK Win Design of the Year — UXmatters](https://www.uxmatters.com/mt/archives/2016/01/how-focusing-on-user-experience-helped-govuk-win-design-of-the-year.php)
3. [9 Nonprofit Web Design Trends to Watch in 2025 — Elevation](https://www.elevationweb.org/blog/9-nonprofit-web-design-trends-to-watch-in-2025/)
4. [13 Non-Profit Web Design Trends 2025 — EDUCO](https://www.educowebdesign.com/news/13-non-profit-web-design-trends-2025)
5. [2025 Website of the Year Winners — CSS Design Awards](https://www.cssdesignawards.com/blog/2025-website-of-the-year-winners/430/)
6. [OpenSecrets wins Webby Award — OpenSecrets, 2026](https://www.opensecrets.org/news/2026/04/opensecrets-wins-webby-award/)
7. [Best Government Website Awards — WebAward](https://www.webaward.org/category/Government/best-government-websites.html)
8. [Gov.uk wins Design of the Year award — BBC News](https://www.bbc.co.uk/news/entertainment-arts-22164715)
9. [What are Government Design Principles — Vsourz](https://www.vsourz.com/ca/blog/what-are-the-government-design-principles/)
10. [Système de Design de l'État (DSFR)](https://www.systeme-de-design.gouv.fr/version-courante/fr)
11. [Découvrez la nouvelle version de notre site — Système de Design de l'État](https://www.systeme-de-design.gouv.fr/version-courante/fr/a-propos/articles-et-actualites/decouvrez-la-nouvelle-version-de-notre-site)
12. [NASA Webby Award Winners — NASA](https://www.nasa.gov/reference/nasa-webby-award-winners/)
13. [The 18 Best Association Website Designs in 2025 — Glue Up](https://www.glueup.com/blog/association-website-design)
14. [Association and Nonprofit Web Design That Wins Members — Redefine Web](https://redefineweb.com/blog/association-nonprofit-web-design-wins-members/)
15. [51+ Best Nonprofit Websites to Get Inspired in 2025 — Midnay](https://midnay.com/blog/best-nonprofit-websites/)
16. [Dropbox Brand Guidelines — Common Arts](https://www.commarts.com/webpicks/dropbox-brand-guidelines)
17. [Website Of The Month — Dropbox Brand — CSS Design Awards](https://www.cssdesignawards.com/wotm/dropbox-brand/46960/)
18. [Lacoste Members Experience — CSS Design Awards](https://www.cssdesignawards.com/sites/lacoste-members-experience/46965)
19. [Lacoste - Members Experience — Common Arts](https://www.commarts.com/webpicks/lacoste-members-experience)
20. [59 Award-Winning Best Website Designs in 2026 — SpinX Digital](https://www.spinxdigital.com/blog/best-website-design/)
21. [Immersive Website Examples in 2026 — Metabole](https://metabole.studio/en/blog/immersive-website-examples)
22. [WCAG 2.3.3 Animation from Interactions — Accessibility.build](https://accessibility.build/wcag/2-3-3)

**Limites de la recherche :** la plupart des sources sont des blogs d'agences ou des sites de concours, et les notes des jurys sont publiques mais partielles. Le chiffre « 52 % de trafic mobile » provient d'une publication commerciale (une agence de web pour associations) et n'est pas vérifié de façon indépendante. Les lauréats cités sont en majorité des agences du web, pas des services publics : la référence civique repose surtout sur GOV.UK et les Webby *Government & Associations*.
