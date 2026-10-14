# Audit du soir — 14 octobre 2026

**Verdict : tout est sain.** Rien de cassé, les contrôles passent, le site tourne sur la
version que vous venez de voir. Il reste **deux décisions à prendre** et quelques finitions
avant une mise en ligne publique. Le détail ci-dessous, sans jargon.

---

## 1. Ce que j'ai vérifié moi-même — et qui est bon

| Contrôle | Résultat |
| --- | --- |
| Typage TypeScript | **0 erreur** |
| ESLint (`npm run lint`) | **0 erreur, 0 avertissement** |
| Tests automatiques (`npm run test`) | **8/8** — le calcul de point (nouveau ce soir) |
| Build de production | **réussi** |
| Routes publiques testées | 11 sur 11 répondent **200** |
| Routes protégées (`/espace`, `/admin`, `/connexion`, `/carte`) | **redirection 307**, comme prévu |
| Liens internes depuis les pages publiques | 19 testés, **aucun cassé** |
| Couleur dans la feuille de style servie | **0** classe de couleur, 0 pastel, 0 thème sombre, 0 couleur d'état |
| Poids de la feuille de style | 55 Ko (contre 71 Ko avant : le code mort est parti) |
| Contrastes (WCAG AA) | **conformes** — même le gris le plus clair (4,6:1 minimum) |
| Titres et images | **1 seul titre principal par page**, toutes les images ont un texte de remplacement |
| Clavier et accessibilité de base | lien « aller au contenu », focus visible, mouvement réduit respecté |
| En-têtes de sécurité | CSP stricte (`default-src 'self'`), `nosniff`, politique de référent, géolocalisation limitée au site |
| Partage social | image d'aperçu 1200×630, `og:image`, `og:title`, `twitter:card` déclarés |
| Indexation | `robots.txt` (espaces privés exclus) + `sitemap.xml` (8 pages publiques) |

## 2. Ce que j'ai corrigé pendant l'audit

Tout est dans le dépôt, vérifié, et poussé sur la branche.

- **La dernière couleur restante.** Les encarts (information, succès, attention, erreur)
  étaient encore bleus, verts, orange et rouges. Ils sont passés au contraste : fond gris,
  filet encre, icône différente. Il n'y a plus une seule couleur sur le site.
- **Les copies qui parlaient encore de « la carte ».** Menu de l'espace membre, page
  d'erreur du Monde Aime, page 404, assistant, page « Notre méthode ». Tout dit désormais
  « les listes », « Le Monde Aime », « l'annuaire ».
- **Les contrastes trop faibles.** Le gris le plus clair (dates, mentions secondaires)
  était à 4,0:1 sur fond gris — juste sous le seuil d'accessibilité. Ramené à 4,6:1, et le
  gris moyen assombri pour garder quatre niveaux bien distincts.
- **Le partage et l'indexation, qui n'existaient pas.** Image d'aperçu créée
  (`public/og.png`), `sitemap.xml`, `robots.txt`, adresse de référence.
- **Les premiers tests automatiques du projet** (8 tests) sur le calcul de point : bornes
  France métropolitaine, stabilité, refus des codes postaux hors métropole, relecture de
  « Chartres (28000) ».
- **Le nettoyage du code mort** : tracés SVG de la carte supprimés (413 lignes), 8 règles
  CSS et 28 jetons de couleur jamais utilisés retirés, code de la carte retiré.
- **La documentation** : `README.md` (design, point sans carte, circuits, tests, partage) et
  `.env.example` (adresse du site) à jour.
- **Les circuits (14 octobre, soir).** Le circuit des producteurs est ouvert :
  `/circuits`, `/circuits/producteurs` (fiches, produits, réservation en retrait sur place,
  « Mon atelier » pour le producteur) et `/circuits/coups-de-main` (savoirs-faire déclarés,
  disponibilité qu'on suspend d'un interrupteur). Un circuit « associations » est **déclaré
  et décrit, pas ouvert** : il refuse toute écriture et indique ce qu'il reste à construire.
  Les huit actions serveur qui dormaient depuis le retrait de la carte sont toutes
  rebranchées (vérifié : chacune a un écran). `lib/actions/local.ts` a disparu au profit de
  `lib/actions/circuits.ts`, qui sert tous les circuits. Seize tests passent, dont huit
  nouveaux sur les invariants d'un circuit (clé d'adresse, étapes, garanties, limites,
  absence de promesse de paiement en ligne, aucun retour du mot « carte »).

## 3. Ce qui manque — par ordre d'importance

### À décider (produit)

1. ~~**Le circuit « producteur » n'a plus d'écran.**~~ **Réglé le 14 octobre au soir, à
   votre demande** : les huit actions serveur sont rebranchées dans un vrai circuit, en
   listes (voir la section 2). Le même moule sert déjà à un deuxième circuit et attend les
   suivants.
2. **« Affiner le point plus tard ».** Aujourd'hui le point vient de la commune et du code
   postal : c'est approximatif (échelle de la commune, pas de la rue). Le serveur accepte
   déjà un point précis, mais rien n'est proposé à l'utilisateur. À faire quand vous voudrez.
3. **Les comptes sont toujours fermés** (décision précédente, réversible par une variable).
   Les écrans de connexion et d'inscription n'ont donc pas été exercés de bout en bout.

### Avant une mise en ligne publique

4. **Les pages légales n'existent pas** : mentions légales, politique de confidentialité,
   et une page accessibilité. Pour un site qui reçoit des comptes, des photos et des liens
   d'invitation, c'est la vraie lacune.
5. **L'adresse du site doit être renseignée** (`NEXT_PUBLIC_SITE_URL`), sinon le sitemap,
   le robots.txt et l'aperçu de partage pointent vers l'adresse locale.
6. **La base de données n'est pas branchée ici** : les guides et annonces s'affichent avec
   des exemples de repli. À vérifier sur l'environnement réel.

### Finitions

7. **Assistant** : sur 23 cibles d'aide, **8 ne trouvaient aucun élément** dans les pages.
   Rien de cassé — le panneau écrit alors honnêtement « élément absent de cette page » — mais
   l'aide était muette. **J'en ai reconnecté 5** (choix du motif d'une démarche, pièces à
   préparer, bouton d'envoi d'un dossier, pièces jointes d'un dossier, formulaire d'article
   en administration). Les formulaires du Monde Aime, eux, étaient déjà branchés (mon
   détecteur les avait signalés à tort, vérification faite).
   Il reste **3 cibles** : elles décrivent une **recherche et des filtres de dossiers** et une
   **section d'attestations d'exemple** qui **n'ont jamais existé** dans cette version
   (vérifié dans l'historique du dépôt, ce n'est pas venu de la refonte). À construire ou à
   reformuler — c'est votre choix, ce n'est pas un défaut.

8. **Pas de HSTS** dans les en-têtes (à activer chez l'hébergeur), **pas d'adresse
   canonique** par page (SEO fin), **pas de tests** au-delà du calcul de point.

## 4. Ce que je recommande de faire ensuite, dans cet ordre

1. **Trancher le sort du point de production** (rebrancher en listes ou retirer) — c'est la
   seule fonctionnalité réellement orpheline.
2. **Brancher la base réelle** et dérouler un parcours complet : publier une annonce,
   recevoir une demande, l'accepter, proposer un trajet, créer un projet.
3. **Écrire les trois pages légales** et renseigner l'adresse du site — avant toute
   ouverture au public.

## 5. Limites honnêtes de cet audit

- **Pas de navigateur dans mon environnement** : j'ai tout vérifié par le code, les pages
  servies, la feuille de style et les tests — mais **je n'ai pas cliqué** dans les
  formulaires, ni regardé le rendu sur un téléphone réel.
- **Pas de base de données** : les parcours qui écrivent (publier, demander, accepter) n'ont
  pas pu être exécutés de bout en bout ici.
- **Pas de test avec un lecteur d'écran** ni avec des personnes en situation de handicap :
  l'accessibilité est conforme sur les points mesurables, pas certifiée.
- **Liens externes non testés** (hors des domaines autorisés dans mon environnement).
- Le point déduit de la commune est **approximatif par construction** : il ne dit jamais
  « à 3 km de chez vous », seulement « dans le secteur ».
