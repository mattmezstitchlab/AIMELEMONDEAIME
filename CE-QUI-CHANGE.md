# Ce qui vient de changer — 14 octobre 2026

Trois décisions prises ensemble ce soir : **fond blanc**, **suppression de la carte
interactive**, **réécriture du récit**. Voici, en clair, ce qui est fait, comment ça
marche et ce qui reste ouvert.

---

## 1. Le fond blanc, et tout en encre et papier

Le site est redevenu **blanc**, et plus aucune couleur décorative ne subsiste :

- fond blanc, cartes blanches cerclées d'un filet gris très clair, **boutons noirs** ;
- les tuiles pastel ont disparu, y compris leurs couleurs dans le fichier de style ;
- le rose, l'ambre, le bleu ciel, le violet, le vert… ont été retirés **partout**,
  pas seulement sur l'accueil : Mon espace, back-office, administration, formulaires.
- là où la couleur servait à dire « c'est validé / c'est en attente / c'est refusé »,
  l'information passe maintenant par le **contraste** (fond noir = abouti, fond gris =
  neutre, contour noir = à traiter). Rien n'est perdu, seulement plus sobre.

Vérifié sur le site servi : dans la feuille de style finale, **zéro** couleur nommée,
zéro pastel, zéro « tuile ». Le blanc et l'encre ont remplacé l'ancien thème sombre.

## 2. La carte interactive est retirée — tout est en listes

La carte de France a été supprimée, et avec elle tout le code qui n'existait que pour
elle (marqueurs, regroupements de points, panneaux de détail, ancienne carte des
producteurs).

Ce qui reste, et qui reste accessible :

- **Propositions, besoins, projets, personnes, trajets, producteurs** : tout se parcourt
  dans « Le Monde Aime », en listes cartes par cartes ;
- les **filtres** sont devenus une barre de recherche normale : univers, type de
  publication, commune, mot-clé, date, « gratuit », distance ;
- le bouton **« Autour de moi »** fonctionne toujours (géolocalisation facultative) et
  la distance se règle au kilomètre.

## 3. Comment un lieu est situé, maintenant qu'il n'y a plus de carte

C'est le point technique important, et il faut l'assumer clairement : **le point n'est
plus choisi à la main, il est déduit**.

- on saisit la **commune** et le **code postal** (5 chiffres, France métropolitaine) ;
- le code postal donne le département, le nom de la commune donne un décalage stable
  dans ce département : deux publications du même village tombent au même endroit,
  deux villages voisins ne se superposent pas ;
- l'aperçu s'affiche sous les champs : « Point retenu : Chartres · Eure-et-Loir —
  48.38, 1.29. Position approximative, jamais une adresse. »

Conséquences honnêtes :

- **l'adresse n'est jamais demandée** : personne n'a besoin de la donner pour publier ;
- la précision est de l'ordre du **département pour l'affichage**, de la **commune pour
  les distances** — largement suffisant pour filtrer « dans les 40 km », insuffisant
  pour dire « c'est à 3 km de chez moi » ;
- la porte pour affiner plus tard reste ouverte : les actions du serveur acceptent
  toujours un point précis, et le code postal est conservé avec la commune
  (« Chartres (28000) ») — le jour où l'on voudra un vrai géocodage, rien à refaire.

## 4. Le récit : le fil s'était perdu, on le reprend

L'accueil ne parle plus d'abord de fonctionnalités, mais d'une situation :

> **Le fil s'était perdu. On le reprend.**
> Les familles se sont éclatées, les transmissions se sont arrêtées, les campagnes se
> sont vidées. AIME® prend les choses en main — et tout commence par un mariage, le
> moment où deux histoires décident de ce qu'elles se passent.

La page enchaîne ensuite, dans l'ordre :

1. **Pourquoi commencer par un mariage** : c'est le seul moment où une famille décide de
   ce qu'elle devient (un nom, une maison, parfois une exploitation, des savoir-faire) ;
2. **le parcours mariage** (dossier civil, fête, jour J, après l'union) avec ses aperçus ;
3. **ce qui se perd quand les familles se séparent** : fermes sans repreneur, ateliers
   qui ferment, gestes que personne n'a appris, aînés sans successeur. Un chiffre, têtu :
   en France, un tiers des exploitants agricoles n'ont pas identifié de repreneur dans
   les trois ans qui précèdent leur retraite ;
4. **ce qu'on remet en circulation** : les transmissions, en listes, commune par commune.

Sur l'organisme d'origine : **rien n'est nommé**. La mention reste « prototype
indépendant, non affilié à un organisme », comme avant — l'esprit rural et agricole est
présent dans les exemples et les chiffres, pas dans une signature.

## 5. Les circuits : sept cadres ouverts, écrits un par un

Sept circuits sont ouverts, et tous disent la même chose en clair : on se situe par sa
commune, on dit ce qu'on propose, et l'accord se fait entre les personnes. Ils se sont
écrits un par un, dans cet ordre, chacun sur les données et les gestes qui existaient
déjà :

- **Producteurs et produits locaux** : la ferme, l'atelier ou le jardin dépose sa fiche ;
  ce qui est disponible s'y ajoute, avec un prix indicatif et un stock. On réserve, le
  producteur confirme, on règle au retrait.
- **Coups de main et disponibilités** : on déclare ce qu'on sait faire et dans quelle
  commune, et un interrupteur suffit à se retirer de la liste immédiatement.
- **Associations et collectifs** : la même mécanique que les producteurs, avec les mots du
  monde associatif — adhésion, atelier, prêt de salle ou de matériel, participation
  indicative. Les besoins ponctuels (bénévoles, matériel, covoiturage) restent publiés
  dans Le Monde Aime, avec leur date : le circuit ne double pas cet affichage, il y
  renvoie.
- **Artisans et savoir-faire** : les métiers du secteur, avec un tarif indicatif et le
  règlement sur place.
- **Logements et hébergement** : les annonces du secteur — chambre, gîte, colocation,
  sous-location — sans adresse dans la liste, retirables en un geste.
- **Trajets et covoiturage** : les trajets proposés, avec les places restantes, les
  demandes rattachées au trajet, et rien de réservé avant l'accord explicite du
  conducteur.
- **Transmission et mémoire** *(nouveau)* : ce qu'une personne accepte de transmettre —
  un geste, un métier, une recette, une mémoire de famille ou de village — et dans quelle
  commune. Rien ne s'affiche sans son accord, et se retire en un geste.

Ce qui est **le même partout**, et vérifié par des tests : aucun paiement en ligne, rien
qui se conclut sans l'accord de la personne concernée, une fiche située par la commune et
le code postal — jamais une adresse —, et chaque circuit écrit ses propres mots (une
association ne parle pas de « retrait », un producteur ne parle pas de « mise en
relation »).

Et **plus aucun circuit « déclaré mais fermé »** : les sept sont ouverts parce que les
sept sont écrits et testés. Le prochain le sera de la même façon.

## 6. Ce qui reste ouvert

- **Les comptes** sont toujours fermés (page « Mon espace » explicative). Les rallumer
  se fera par un simple interrupteur, sans réécriture.
- **L'affinage du point** : prévu, pas encore fait. C'est la suite logique de la
  suppression de la carte, quand vous le voudrez.
- **Les contenus** : la démonstration utilise des exemples fictifs tant que la base de
  données n'est pas branchée ; les guides et articles viendront alimenter la page.
- **Les photos** : les deux portraits d'accueil (mariage, espace privé) sont conservés.
  Aucune photo n'est affichée sans crédit.

## 7. Où regarder

| Quoi | Où |
| --- | --- |
| Le récit et la mise en page | accueil du site |
| Les listes, filtres, publication | « Entraide » dans le menu |
| Les circuits (producteurs, coups de main, associations) | menu « Circuits », catalogue dans `lib/circuits.ts` |
| Le style (couleurs, rayons, typographie) | `app/globals.css` |
| Le calcul des points | `lib/point.ts` (et `lib/departements.ts`) |
| Le détail technique de la refonte | `README.md`, section « Design » |
| L'audit complet du site | `AUDIT-REFONTE.md` |
