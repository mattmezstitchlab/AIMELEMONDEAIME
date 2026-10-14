# Audit du jour — AIME®

*Vérifié sur la version en ligne de travail : sept circuits ouverts, site public en encre et
papier, carte supprimée, comptes suspendus. Toutes les lignes ci-dessous ont été mesurées,
pas supposées.*

---

## 1. Ce qui est vérifié bon

**Le fond blanc et l'absence de couleur.** Le style servi au navigateur ne contient plus
aucune couleur décorative : ni jeton de nuit, ni palette pastel, ni couleur d'état. Les
textes passent le contraste AA partout — le plus discret d'entre eux (le gris des mentions)
atteint 4,62:1 sur le gris clair, au-dessus du minimum de 4,5.

**La carte n'existe plus.** Plus une seule occurrence du mot « carte » sur les pages
publiques, aucune bibliothèque ni fichier de cartographie dans le projet, et l'ancienne
adresse `/carte` renvoie vers Le Monde Aime. Le point se déduit toujours de la commune et
du code postal, et rien ne sort de France métropolitaine.

**Rien ne remplace l'adresse.** L'adresse exacte n'est ni demandée, ni publiée : une fiche
dit « dans ce secteur », jamais une porte. Ce qui reste à finir côté produit, c'est
« affiner le point » (recentrer sur sa commune), prévu mais pas fait.

**Les comptes sont bien fermés, et réversiblement.** `/espace`, `/back-office` et `/admin`
redirigent toutes vers la page « Mon espace » qui explique la situation. Un interrupteur
(`AIME_AUTH_ENABLED`) les rallume sans réécriture.

**Sept circuits, tous ouverts, tous testés.** Chaque circuit porte ses propres mots, ses
étapes, ses garanties et ses limites ; le catalogue refuse un circuit ouvert sans tableau,
un mot vide, une promesse de paiement en ligne ou un vocabulaire emprunté au voisin. Le
test interdit aussi le retour du vocabulaire de la carte.

**Partage et référencement.** `robots.txt`, `sitemap.xml` avec les huit pages publiques,
image de partage 1200×630 (`og.png`), adresse du site et aperçus correctement déclarés.

**Sécurité et promesses.** En-têtes en place (politique de contenu, `nosniff`,
référent, permissions caméra/micro/géolocalisation). Aucune bibliothèque d'envoi de
courriel n'est installée : la phrase du pied de page (« aucun courriel n'est envoyé ») est
exacte, et aucune transaction n'a lieu.

**L'accueil, critère par critère.** Titre à taille auto-réductrice (jamais plus de deux
lignes), portrait compact, et les deux actions — « Commencer par mon mariage » puis
« Créer un espace privé » — placées juste sous la carte. Le logo n'apparaît que dans les
barres, jamais sur les cartes. Sept circuits nommés, chacun avec sa phrase.

**Qualité.** 22 tests passent (8 sur le calcul du point, 14 sur le catalogue des circuits) ;
vérification de types et analyse de code propres ; build réussi.

---

## 2. Ce qui manque

**Les écrans connectés n'ont pas pu être vérifiés ici.** Cet environnement n'a ni base de
données ni navigateur : tout ce qui demande un compte (déposer une fiche, publier un
produit, envoyer une demande, suivre un dossier) reste à valider sur une base réelle. Les
tests couvrent la logique du point et le catalogue, pas les enregistrements.

**Aucune vérification automatique à chaque poussée — écrit, à déposer.** Le fichier
`outils/check.yml` enchaîne les types, l'analyse, les tests et le build ; il suffit de le
déplacer dans `.github/workflows/` du dépôt. L'outil de publication utilisé d'ici n'a pas
la permission d'écrire dans ce dossier — c'est la seule raison pour laquelle il attend à
côté.

**Les actions destructrices se confondaient avec l'action principale — corrigé aujourd'hui.**
Depuis le passage au monochrome, « supprimer » et « confirmer » avaient le même bouton noir.
Elles sont désormais cerclées d'encre, pour se distinguer au premier regard.

**Il reste, quand vous voudrez :**
- brancher la base de données, pour que la démonstration devienne réelle ;
- écrire les pages légales (mentions, confidentialité, cookies) ;
- ajouter les URL canoniques et HSTS sur le domaine final ;
- donner à « Entraide » sa place dans les onglets du bas sur téléphone (elle est
  aujourd'hui dans le menu) ;
- reprendre « affiner le point », la suite naturelle de la suppression de la carte.

---

## 3. Ce que je propose ensuite

1. **Brancher la base** : la démonstration devient réelle, les circuits se remplissent,
   les profils existent. C'est le prochain grand pas.
2. **Les pages légales** : courtes, claires, en français — mentions, confidentialité,
   et « ce que nous ne faisons pas ».
3. **Affiner le point** : chacun peut recentrer sa fiche sur sa commune, sans jamais
   donner son adresse.
