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

## 5bis. P1 démarches (partie 1) — exécuté le 2026-08-10 (commit à suivre)

- **Parcours Santé créé** (`sante`) au niveau du parcours pilote : 5 questions
  discriminantes (statut, cause, date de début, avis signé, durée prévisible),
  tâches conditionnelles (caisse selon le régime, volet employeur pour les
  salariés, déclarations accident du travail / maladie professionnelle,
  préparation de la reprise), correspondance avec la procédure bureau existante
  « Déclarer un arrêt de travail » pour la transmission, mots-clés de
  l'assistant. Règles métier testées directement (9 tâches et 3 échéances
  pour un accident de salarié agricole, 4 tâches pour un indépendant malade).
- **Échéances officielles générées par les règles** : `TaskRule.due`
  (délai sourcé, jamais inventé) matérialisé à la préparation du plan par
  `computeDueAt` — pour la santé, les transmissions à 48 heures depuis la
  date de début. Les autres parcours pourront suivre le même patron.
- **Notifications d'échéances de parcours** : à la visite de l'espace, toute
  échéance à moins de 7 jours (ou dépassée) produit une notification unique
  (anti-doublon vérifié : une seule notification après deux visites).
  Règles versionnées en `2026.10-c`.

## 5ter. P1 démarches (partie 2) — exécuté le 2026-08-10 (commit à suivre)

`famille`, `proche` et `quotidien` sont épaissis au niveau du pilote
(règles `2026.10-d`) : questions discriminantes (date d'événement, régime,
accord du proche, capacité à décider, équipement numérique, délai),
tâches conditionnelles, pièces, organismes sourcés. Points saillants :
- **famille** : la déclaration de naissance porte l'échéance officielle
  de 5 jours ; naissance distinguée de l'adoption ; congé parental et
  premier enfant conditionnent des étapes ; le décès reste au parcours dédié ;
- **proche** : l'accord du proche et sa capacité à décider pilotent les
  tâches (Point-justice, mesures de protection en dernier ressort),
  droits et répit de l'aidant systématiquement proposés ;
- **quotidien** : le numérique et l'absence d'équipement font l'objet
  d'étapes propres ; la carte d'entraide et France services sont reliées
  selon le besoin (délai signalé d'emblée quand il est serré).
Comportements vérifiés directement sur les règles (7 tâches et échéance
au 14/10 pour une naissance agricole du 09/10, protection prudente pour
un proche qui ne peut plus décider…). Tuiles vérifiées dans l'assistant
de création.

## 5quater. P1 démarches (partie 3) — exécuté le 2026-08-10 (commit 895cfb6)

Les quatre trous de couverture sont comblés (règles `2026.10-e`, **15 parcours**) :
- `transmission` — transmettre ou cesser une activité (repreneur trouvé ou
  cherché, cessation, arrêt progressif ; salariés sécurisés ; Guichet unique,
  MSA/Urssaf, point retraite) ;
- `recruteur` — premier salarié, saisonnier, remplacement (France Travail,
  DPAE MSA/Urssaf, Guso pour le spectacle ponctuel), correspondance avec la
  procédure bureau « Embaucher un salarié agricole » ;
- `invalidite` — handicap et travail pour soi (MDPH/RQTH, médecine du travail,
  Cap emploi, pension d'invalidité évaluée par la caisse, jamais par AIME®) ;
- `reversion` — droits du conjoint survivant (demande inter-régimes unique,
  cas Pacs/concubinage traités honnêtement, allocation veuvage avant 55 ans).
Vérifié sur les règles (plans conditionnels) et sur le routage de l'assistant,
sans régression : « je suis en arrêt de travail » mène toujours à Santé,
« un musicien pour la fête » toujours à l'événementiel.

Le P1 démarches est clos. Reste le chantier suivant : assistant niveau 2,
puis le fonds éditorial en continu.

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

## 6bis. Niveau 2 de l'assistant — exécuté le 2026-08-10 (commit à suivre)

L'assistant peut désormais **exécuter trois écritures, uniquement après
confirmation explicite** sur une carte dédiée dans la conversation (rien ne
part d'un simple message) :
- **créer un brouillon de parcours** quand une situation est reconnue avec
  confiance (dédupliqué : un brouillon ou un parcours existant est repris,
  jamais recréé) ;
- **poser un rappel personnel** sur la prochaine étape d'un parcours
  (demain, 3 jours, 1 semaine ; jamais sur une échéance officielle, que le
  serveur refuse de toute façon) ;
- **transmettre un parcours à son bureau d'accompagnement** (le cœur de la
  transmission a été extrait du formulaire de suivi et est partagé avec
  l'assistant ; idempotent, le dossier créé est ouvert dans la foulée).

Garde-fous, dans l'ordre : le widget ne propose ces actions qu'à un membre
réel (`canAct` calculé côté serveur ; la visite guidée reste en lecture
seule) ; chaque action revérifie le rôle, refuse la session de démonstration
et délègue aux actions serveur existantes, qui revérifient la propriété ;
chaque exécution est tracée au journal d'audit avec la provenance
`assistant_niveau_2`. Lignes rouges inchangées : aucune décision de droit,
aucun montant, aucun envoi à un organisme extérieur — la transmission vise
le bureau du membre uniquement. Après exécution, la conversation se
rafraîchit (`router.refresh`) : le résumé relu reflète la nouvelle réalité,
et une seconde demande identique obtient « déjà fait » plutôt qu'un doublon.
Vérifié : intentions d'écriture testées directement, résumé enrichi
(`nextTask`, `transmitted`, situations) présent dans le widget du membre,
absent chez le visiteur. Limite connue du banc d'essai (voir
SIMPLIFICATION.md) : l'exécution navigateur d'un POST ne se simule pas en
curl contre PGlite — le code suit le motif éprouvé des formulaires, avec
double revérification serveur.

## 6ter. Suite recommandée — exécutée le 2026-08-10 (commits à suivre)

Les deux directions validées après la clôture du niveau 2 sont en place :

**Questionnaire conversationnel avec relecture (assistant).** Après la
création du brouillon (ou sa reprise), l'assistant propose « Répondre avec
l'assistant, question par question » : il pose chaque question dans la
conversation (choix touchables pour les listes, formats guidés et vérifiés
pour les dates, heures et nombres — aucune interprétation libre), enregistre
chaque réponse dans le brouillon au fur et à mesure (`assistantSaveAnswer`,
journal d'audit sur la clé de la question, jamais sa valeur), permet
d'arrêter et de reprendre plus tard là où l'on s'était arrêté, puis **relit
l'ensemble des réponses** avant de proposer la préparation du plan
(`assistantFinalize`, carte de confirmation comme les autres écritures).
Aucune transmission au bureau n'en découle : elle reste une action séparée.
Vérifié : les 64 questions des 15 parcours sont toutes d'un type géré par
l'entretien ; `canAct` confirmé vrai pour un membre, faux pour la visite
guidée (qui ne verra jamais ces propositions).

**Poste de travail du bureau (gestionnaire).** Le tableau de bord ouvre sur
une **file prioritaire** — « qui est bloqué, depuis quand » : pièces
manquantes en attente du membre d'abord, dossiers à affecter ensuite,
dossiers sans mouvement depuis 14 jours enfin (ancienneté mesurée depuis
le dernier mouvement, libellé honnête). La **relance pièce manquante en
un clic** (`remindMissingDocuments`) notifie le membre avec la liste des
pièces, trace l'événement « Relance envoyée » dans l'historique et au
journal d'audit, et refuse toute seconde relance avant 7 jours. La liste
des dossiers affiche l'attente par dossier et le même bouton ; la page
détail le propose dans la carte de gestion. Vérifié sur le dossier réel
DOS-2026-100245 : bouton et bloc de relance rendus aux trois endroits.

## 6quater. Parcours « Mariage complet » — exécuté le 2026-08-10 (commit à suivre)

Direction validée : faire de l'application la référence du mariage en
profondeur, en capitalisant l'architecture existante plutôt qu'en ajoutant
une couche. La situation `mariage` (« Nous nous marions », 16e parcours,
règles `2026.10-f`) couvre le mariage de bout en bout :
- **dossier civil** : rendez-vous mairie, pièces (actes de naissance
  récents, témoins, certificat du notaire si contrat) et **publication des
  bans en échéance officielle sourcée à J-10** ;
- **rétroplanning daté** : chaque jalon (lieu J-270, photographe et
  traiteur J-180, faire-part J-60, convives J-21, déroulé du jour J-7) est
  une échéance calculée à rebours depuis la date du mariage — repères
  personnels notifiés comme les autres échéances, aucun délai inventé ;
- **fête** : projet partagé créé à la préparation (généralisation du
  parcours événementiel), musiciens ou DJ engageables depuis le suivi
  avec le même cycle demande → proposition → contrat et le cadre Guso
  rappelé, prestataires et ressources branchés sur la carte ;
- **après** : correspondance bureau « Déclarer une naissance ou un
  mariage », enchaînement vers le parcours Famille « union ».
Le questionnaire conversationnel y répond comme pour les autres parcours.
Routage affiné sans régression : « je déclare mon mariage aux impôts »
mène à Famille (24), « j'organise mon mariage » au Mariage (20), la fête
de village reste à l'événementiel. Vérifié sur les règles (24 tâches pour
un mariage de 120 invités) et dans l'assistant de création. Reportés à un
second temps, si l'usage le confirme : liste d'invités/RSVP et suivi de
budget dans le projet.

Restent ouverts : le fonds éditorial (12 contenus publics) en continu, et
les revues périodiques des règles et des liens d'organismes (section 3).

## 7. Ordre de chantier recommandé

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

### Addendum de fusion (2026-08-10)

L'arbre de travail restauré d'une session précédente portait une seconde
rédaction du chantier ; la version distante a été retenue comme base et
trois apports y ont été fusionnés : un **visuel dédié**
`public/images/hero-mariage.jpg` (la tuile « Nous nous marions » l'utilise
au lieu du visuel famille), les phrases de recherche de prestataires
« pour mon/notre mariage » dans le lexique d'orientation (une demande de
photographe « pour mon mariage » mène au parcours Mariage), et la
**vérification indépendante** de ce tour : 23 tâches pour un mariage de
120 invités (salle communale, traiteur, groupe, photographe), bans
officiels au 09/06/2027 pour un mariage le 19/06/2027, mariage simple
(domicile, fait maison, playlist) sans aucune tâche Guso, aucune
régression de routage (« je suis en arrêt de travail » reste santé).

## 6quinquies. Mariage, deuxième temps : invités et budget vivants — exécuté le 2026-08-10 (commit à suivre)

La direction « l'app la plus approfondie dans le monde du mariage » se
poursuit là où le rétroplanning devenait vivant : les réponses des invités
et les dépenses réelles, suivis dans le projet partagé du mariage.

- **Liste d'invités par foyer** (table `wedding_guests`) : nom, nombre de
  personnes, cercle (famille, amis, travail), réponse suivie (à inviter,
  invitation envoyée, confirmé, peut-être, décliné). Le compteur des
  **personnes confirmées** est le nombre qui part au traiteur au jalon
  J-21 ; l'estimation du parcours reste affichée en regard. AIME® n'envoie
  ni invitation ni relance : les réponses se notent, par les organisateurs.
- **Suivi de budget** (table `wedding_budget_items`, réglages dans
  `wedding_settings`) : poste par poste, montant estimé, montant du devis
  confirmé, case « réglé ». Enveloppe globale (reprise de la nouvelle
  question « Budget global envisagé » du parcours, ajustable) avec écart
  en direct. Aucun paiement ne transite par AIME® : c'est un carnet de
  bord, jamais un portefeuille.
- **Branchements** : sections « Invités du mariage » et « Budget du
  mariage » sur la page du projet (visibles des seuls participants
  acceptés, modifiables par les seuls organisateurs — vérifié : un
  non-membre ne voit ni nom ni montant) ; carte « en direct du projet »
  dans le suivi du parcours. Deux tâches du rétroplanning y renvoient
  (liste J-240, budget J-240) et le jalon « figer les convives » cite le
  compteur réel. Règles `2026.10-g`.
- **Gardes** : actions dédiées `lib/actions/wedding.ts`, mêmes patrons que
  le reste (rôle membre, organisateur accepté, projet ouvert né d'un
  parcours mariage) ; conversions d'euros strictement déterministes
  (`parseEuroToCents` : « quatre mille » ou 3 décimales sont refusés, pas
  interprétés) ; audit sans noms ni montants ; limites 600 foyers /
  120 postes.
- **Vérifié** : logique pure testée (compteurs, enveloppe, validateurs,
  26 tâches du parcours complet, bans officiels inchangés) ; migration
  `0002_wedding_workspace` appliquée ; rendu réel contrôlé sur un mariage
  de démonstration (4 confirmées sur 17 listées, budget estimé 8 100 €,
  enveloppe 15 000 € reprise du parcours, marge 6 900 €) ; refus serveur
  d'une écriture par une non-organisatrice exécuté de bout en bout.
  L'invocation manuelle répétée d'actions serveur reste intermittente
  dans ce bac à sable (constat préexistant, sans rapport avec ce code).
- **Restant, troisième temps possible** : plan de table assisté (places
  par foyer confirmé), export de la liste pour le traiteur, modèles de
  messages de relance à copier (jamais d'envoi par AIME®).

## 6sexies. Mariage, troisième temps : plan de table, export traiteur, relances à copier — exécuté le 2026-08-10 (commit à suivre)

La préparation se termine là où les autres outils s'arrêtent souvent :
placer les gens, transmettre le bon nombre, relancer sans y passer ses
soirées — toujours sans qu'AIME® parle à quiconque à la place des mariés.

- **Plan de table assisté** (table `wedding_tables`, colonne `table_id`) :
  tables nommées avec capacité indicative, foyers **confirmés seulement**
  placés un à un, compteurs placés / à placer par table et au global.
  Règles d'intégrité côté serveur : un foyer qui n'est plus confirmé
  quitte sa place, la suppression d'une table rend ses foyers « à
  placer » (jamais perdus), un dépassement de capacité s'affiche sans
  bloquer — c'est le plan des mariés, pas un règlement.
- **Résumé pour le traiteur** : texte généré déterministiquement depuis
  les confirmés et leurs notes (enfants, régimes, arrivées), avec la
  marge encore en attente et l'estimation de départ. Affiché à relire,
  copiable ou téléchargeable en .txt — l'envoi se fait par les moyens
  des mariés, AIME® ne contacte aucun prestataire.
- **Modèles de relance à copier** : trois tons (douce avant la date
  limite, courte SMS, dernière relance quand le nombre se fige), dates
  du mariage et limite de réponse (repère J-21 du rétroplanning)
  remplies automatiquement, prénoms laissés en crochets à personnaliser.
  AIME® n'envoie aucun message : le texte part par les canaux des mariés.
- **Branchements** : section « Plan de table » dans le projet entre
  invités et budget, blocs traiteur et relances dans la section invités
  (organisateurs), avancement du plan dans la carte du suivi, jalon
  « Dresser le plan de table » relié à l'outil. Règles `2026.10-h`.
- **Vérifié** : logique pure testée (placement réservé aux confirmés,
  dépassement signalé non bloquant, dates FR et J-21, résumé exact,
  messages sans jeton restant) ; migration `0003_wedding_tables`
  appliquée ; rendu réel contrôlé sur la démonstration (3 tables,
  4 personnes placées, résumé traiteur au convive près, modèles datés) ;
  confidentialité revérifiée en non-membre. Les écritures suivent les
  mêmes gardes que le deuxième temps.
- **Restant pour la profondeur mariage** : page jour J imprimable
  (déroulé + plan + contacts), remerciements d'après-mariage assistés,
  puis le fonds éditorial public pourra raconter tout cela.

## 6septies. Mariage, quatrième temps : page du jour J et remerciements — exécuté le 2026-08-10 (commit à suivre)

Le cycle se referme : la journée elle-même, puis les semaines qui suivent.

- **Page du jour J imprimable** (`/le-monde-aime/projets/[id]/jour-j`) :
  déroulé écrit dans le projet, plan de table par table, prestataires
  dont l'engagement est confirmé (devis accepté et au-delà), équipe
  d'organisation, notes utiles des invités confirmés. Une page à
  imprimer pour les témoins, avertissements « à compléter » visibles à
  l'écran seulement. Réservée aux participants acceptés : non-membres et
  anonymes reçoivent la page introuvable, sans un nom (vérifié).
- **Remerciements assistés** : après la date du mariage (ou projet
  terminé), la rubrique invités devient le suivi des remerciements —
  foyers confirmés à cocher au fil des envois (colonne `thanked`,
  migration `0004_wedding_thanked`), trois modèles à copier (tous les
  invités, proches qui ont aidé, court) et la liste des foyers à
  remercier en texte téléchargeable. Les relances, elles, disparaissent
  une fois le jour passé. Tâche « Remercier les invités » à J+21 dans le
  rétroplanning. Règles `2026.10-i`.
- **Vérifié** : logique pure testée (bascule avant/après, modèles datés
  sans jeton, liste exacte, échéance J+21 calculée au 10/07/2027, bans
  toujours seule échéance officielle) ; migration 0004 appliquée ;
  rendu réel de la page du jour J (déroulé en 5 moments, plan, compteurs)
  et du bloc remerciements en basculant la date de la démonstration dans
  le passé (puis restaurée). Écritures : mêmes gardes que les temps
  précédents, audit sans noms.
- La chaîne mariage est complète : orientation → dossier civil sourcé →
  rétroplanning → prestataires engagés → invités suivis → budget tenu →
  plan de table → jour J papier → remerciements → parcours Famille.
  Suite au carnet : le fonds éditorial public, qui peut raconter ce
  parcours ; parcours « je n'arrive pas à payer » (à reconfirmer).
