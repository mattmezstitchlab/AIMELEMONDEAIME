# Audit — démarches et assistant · AIME® / Le Monde Aime

**Demande traitée :** (1) supprimer le bloc « Comptes de démonstration » de la page de
connexion ; (2) auditer ce qui manque pour compléter l'application **en termes de
démarches** ; (3) identifier **tout ce qui pourrait être automatisé depuis
l'assistant**.

---

## 1. Corrigé immédiatement

### 1.1 Bloc « Comptes de démonstration » supprimé de `/connexion`
La page de connexion affichait publiquement 7 adresses de comptes fictifs et leur mot
de passe commun. Même fictifs, des identifiants publiés sur l'écran de connexion sont
une mauvaise pratique (ils survivent aux copier-coller, aux captures, aux moteurs).
**Supprimé**, remplacé par un renvoi discret vers `/decouvrir` — la visite guidée en
lecture seule créée au chantier 5, qui est la bonne porte d'entrée pour découvrir
l'espace. Vérifié sur le build de production : 0 occurrence, page en 200.

### 1.2 Trou du seed découvert et réparé
L'audit a mis au jour un manque plus profond : les contenus de démonstration créés par
les anciens fichiers `seed-aime.ts` / `seed-lma.ts` (supprimés au chantier 5 car jamais
appelés) n'avaient **jamais été repris par le seed principal**. Toute base créée par
`npm run db:seed` était donc incomplète. Ces contenus sont maintenant réintégrés à
`db/seed-data.ts` et créés à chaque seed :

| Contenu | Avant | Après |
|---|---|---|
| Organismes référencés | **0** (annuaire vide) | **31** |
| Projets de démonstration | 0 | 1 (+ membres, besoins, demandes) |
| Parcours de démonstration | 0 | 1 (événement, avec engagement artiste) |
| Cercles privés d'exemple | 0 | 1 |
| Annonces de la carte | 4 | 11 |
| Comptes fictifs (Tom, Odette…) | absents | 12 utilisateurs au total |

Validé par un seed complet sur base jetable, puis base d'aperçu régénérée.

---

## 2. Démarches — état des lieux chiffré

- **10 parcours guidés** (situations) : `evenement`, `activite`, `emploi`, `famille`,
  `logement`, `quotidien`, `proche`, `retraite`, `demenagement`, `deces_proche`.
- **Profondeur très inégale** : seul `evenement` est un parcours complet
  (11 questions, ~13 tâches conditionnelles, lien à la carte et aux artistes).
  Les 9 autres comptent **1 à 5 questions** et 4 à 9 tâches ; `quotidien` et
  `proche` n'ont qu'**une seule question**. L'interface l'annonce honnêtement
  (« Orientation sourcée et liste d'actions »), mais l'écart avec le pilote est le
  principal chantier de complétude.
- **9 procédures côté bureau** (dossiers instruits), dont la générique
  « parcours-transmis ». Correspondance parcours → procédure : **3 situations sur
  10** seulement (famille, logement, retraite) ; les autres transmissions passent
  par la procédure générique — correct, mais moins guidé.
- **12 contenus publics** : exactement 1 article + 1 guide par thème (6 thèmes).
  C'est une coquille de démonstration, pas un fonds éditorial.
- **31 organismes** référencés avec statuts de vérification de liens — **datés du
  2026-10-11**, donc à re-vérifier.
- Le modèle de tâche sait porter des **échéances officielles sourcées**
  (`dueKind: "officielle"`, `dueSource`) et l'aperçu membre sait les afficher,
  mais **aucune règle n'en génère** : le fil ne se branche jamais.
- Les **notifications** existent (23 points de création) pour la messagerie, les
  dossiers et la carte, mais **rien ne signale une échéance de parcours** qui
  approche.

## 3. Démarches — ce qui manque, par priorité

### P1 — Trous de couverture (besoins fréquents sans aucun parcours)
1. **Santé / arrêt de travail / accident** : la procédure bureau « Déclarer un arrêt
   de travail » existe, mais **aucun parcours membre** n'y mène. Pour le public visé,
   c'est probablement le besoin n° 1 absent (arrêt, accident du travail, maladie
   professionnelle, reprise).
2. **Invalidité / handicap pour soi** : `proche` couvre l'aidant, jamais la personne
   concernée (MDPH, pension d'invalidité, aménagement du poste ou de l'activité).
3. **Transmission / cessation d'activité** : `activite` couvre créer et développer,
   pas **transmettre, céder ou cesser** — moment de vie majeur du monde agricole et
   artisanal (retraite de l'exploitant = souvent les deux à la fois).
4. **Droits du conjoint survivant** : `deces_proche` couvre les premières semaines ;
   la **réversion, les droits dans la durée** ne sont traités nulle part.
5. **Je recrute / j'emploie** : la procédure « Déclarer l'embauche d'un salarié
   agricole » existe sans parcours employeur (l'exploitant qui embauche n'a que le
   dossier brut).

### P1 — Profondeur des parcours existants
6. **Épaissir les 9 situations minces** au niveau du pilote : questions qui
   discriminent vraiment les cas (comme `evenement`), tâches conditionnelles,
   pièces précises. Priorité interne : `famille` (2 questions pour naissance,
   mariage, séparation, adoption…), `proche` et `quotidien` (1 question).
7. **Générer les échéances officielles sourcées** quand une règle connaît un délai
   (le modèle et l'affichage sont prêts ; il ne manque que les données et leur
   revue datée, comme les liens d'organismes).
8. **Notifier les échéances de parcours** (7 jours avant, le jour même) en
   réutilisant l'infrastructure de notifications existante.

### P2 — Compléments à valeur nette
9. **Fonds éditorial** : passer de 1+1 par thème à un vrai socle (les questions
   fréquentes de chaque procédure méritent un guide ; l'assistant et la recherche
   s'appuient dessus).
10. **Brancher la carte dans `quotidien` et `proche`** : entraide, trajets,
    réservations et artistes existent côté carte ; ces deux parcours n'y renvoient
    que par les organismes.
11. **Parcours « je n'arrive pas à payer »** (cotisations, loyer) : la procédure
    « Déclarer mes revenus » existe ; le besoin réel commence par la difficulté,
    pas par la déclaration.
12. **Revue annuelle des règles et des liens** : `RULES_VERSION` existe ; les
    vérifications d'organismes datent d'octobre 2026 et vieilliront — en faire une
    tâche d'administration visible (statuts « à vérifier » déjà en base).

### Garde-fous (à conserver tels quels)
L'orientation ne doit jamais devenir une décision ni promettre un droit : sources
officielles datées, « effectué selon vous » déclaratif, aucune connexion à un
organisme réel sans cadrage. Les manques ci-dessus se comblent **dans** ce cadre,
pas en le relâchant.

---

## 4. Assistant — ce qu'il sait faire aujourd'hui

L'assistant est un **guide**, pas un opérateur : 21 scénarios pas-à-pas
(navigation entre pages + surbrillance des éléments), un moteur d'orientation par
mots-clés partagé avec la recherche par situation, des réponses différenciées par
rôle (membre, gestionnaire, administrateur) et des liens profonds pré-remplis
(`?situation=`, `?q=`…). Il est 100 % local, sans appel externe. En revanche, il
**ne lit aucune donnée du membre** (ses réponses sont identiques pour tous) et
**n'exécute aucune action** : il montre où cliquer, puis s'arrête.

## 5. Assistant — ce qui peut être automatisé

### Niveau 1 — Personnaliser sans écrire (aucun risque, valeur immédiate)
Ces automatisations ne font que **lire les données du membre connecté** et
répondre avec ; elles transforment l'assistant générique en assistant personnel :
- **« Où en sont mes démarches ? »** : synthèse en direct — dossiers par statut,
  prochaine action de chaque parcours, avancement. (Aujourd'hui, le scénario
  `suivre-demande` explique où cliquer sans rien montrer.)
- **« Qu'est-ce qui m'attend ? »** : échéances proches, pièces manquantes
  (le scénario `pieces-manquantes` deviendrait une réponse, pas un mode
  d'emploi), demandes reçues à traiter, invitations en attente.
- **Reconnaissance des références** : coller « DOS-2026-… » ouvre directement le
  bon dossier ; même logique pour un projet ou une annonce.
- **Réponses situées** : sur la page d'un dossier, répondre d'abord pour **ce**
  dossier (son statut, son historique), avant le générique.

### Niveau 2 — Exécuter avec confirmation (l'assistant prépare, l'humain valide)
Chaque action ci-dessous **existe déjà côté serveur** ; l'assistant devient un
lanceur conversationnel, avec une confirmation explicite avant toute écriture et
une trace au journal d'audit (déjà en place) :
- **Créer le brouillon d'un parcours** depuis la conversation (« Je déménage »
  → brouillon créé et ouvert, au lieu d'un simple lien).
- **Transmettre un parcours au bureau** au bon moment (l'action du chantier 2
  temps 2) : « Votre parcours est prêt, je le transmets ? » — un clic de
  confirmation, puis le dossier s'ouvre.
- **Poser un rappel** sur une étape, **marquer une étape « effectuée selon
  moi »**, **rattacher un document existant** à une pièce demandée (ou guider
  son dépôt).
- **Préparer un message au bureau** (pré-rédigé à partir du contexte — pièce
  manquante, retard, question) : toujours **relu et envoyé par le membre**,
  jamais envoyé seul.
- **Demander un rendez-vous** : proposer les créneaux du bureau et créer la
  demande après confirmation.
- Côté équipe : **trier les dossiers en attente d'une pièce**, préparer une
  réponse à partir des modèles existants (`modele-reponse`), guider
  l'affectation d'un dossier.

### Niveau 3 — À ne jamais automatiser (ligne rouge actuelle, à conserver)
- Toute **décision d'instruction** (statuts d'un dossier côté bureau).
- Tout **envoi définitif sans relecture** (message, transmission, déclaration).
- Toute déclaration **« transmise » ou « confirmée par l'organisme »** : aucune
  connexion officielle n'existe ; l'assistant ne doit pas la simuler.
- Tout ce qui touche à **l'argent** (paiements, engagements financiers) et aux
  **droits** (montants, éligibilité) : l'assistant oriente vers la source
  officielle et l'humain compétent.

### Conditions techniques
- Le widget actuel est côté client et local : les niveaux 1–2 demandent d'appeler
  les **actions serveur existantes** (rôle revérifié en base à chaque appel — le
  modèle de sécurité actuel s'y prête sans changement).
- **Confirmation systématique** avant écriture, résultat affiché dans la
  conversation, échec expliqué sans jargon.
- Le **mode visite guidée** doit rester en lecture seule : le proxy bloque déjà
  les écritures des sessions `demo` — l'assistant hérite de ce garde-fou sans
  code supplémentaire.
- Aucune IA externe n'est requise : règles explicables, dans la continuité de la
  promesse « sans IA générative » affichée au membre.

---

## 6. Niveau 1 de l'assistant — exécuté le 2026-08-10 (commit à suivre)

Le niveau 1 est en place, sans aucune écriture :
- le layout charge un **résumé personnel** du membre (`getAssistantSummary`) et le
  transmet au widget ; en cas de base injoignable, l'assistant reste générique ;
- **« Faire le point sur mes démarches »** (bouton dédié + question libre) répond
  depuis les vraies données : parcours en cours et leur prochaine action,
  questionnaires à terminer, dossiers par statut, alertes pièces manquantes ;
- **« Qu'est-ce qui m'attend ? »** : pièces attendues, échéances proches,
  demandes reçues et engagements en attente ;
- **« Quelles pièces me manquent ? »** : les dossiers concernés, avec liens
  directs ;
- **référence citée** (`DOS-2026-…`, ancien format `MSA-…` accepté) : le dossier
  s'ouvre directement, ou l'assistant dit honnêtement qu'il ne le retrouve pas
  parmi ceux du membre ;
- **réponses situées** : sur la page d'un dossier ou d'un parcours, le point
  commence par l'élément ouvert.

Vérifié sur le build de production : résumé du membre présent dans le widget
(parcours, dossiers et références réels), résumé vide et cohérent pour la visite
guidée, aucun résumé pour les visiteurs. Vigilance notée : le résumé est chargé
à chaque page pour les membres (une poignée de lectures) — à mettre en cache si
le trafic le justifie. Restent ouverts : niveau 2 (exécution avec confirmation),
P1 démarches (parcours Santé, échéances officielles + notifications).

## 6. Ordre de chantier recommandé

1. **Assistant niveau 1** (synthèse personnelle, échéances, références) — le
   meilleur rapport valeur/risque : aucune écriture, l'assistant devient
   personnel.
2. **Échéances officielles + notifications de parcours** et **parcours Santé**
   (P1 démarches) — la donnée et le besoin sont prêts.
3. **Épaississement `famille`, `proche`, `quotidien`** (P1 profondeur), puis
   trous de couverture restants (invalidité, transmission, réversion, recruteur).
4. **Assistant niveau 2**, action par action, en commençant par « créer le
   brouillon » et « transmettre au bureau » — chaque automatisation livrée avec
   sa confirmation et son test.
5. **Fonds éditorial** en continu (guides des procédures), qui nourrit à la fois
   la recherche, les parcours et l'assistant.
