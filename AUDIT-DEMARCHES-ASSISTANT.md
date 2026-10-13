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

## 6octies. Fonds éditorial public : le mariage raconté — exécuté le 2026-08-10 (commit à suivre)

Le fonds public (articles et guides des pages /informations et
/guides/[slug], alimenté par le seed) ne racontait rien du produit le
plus profond de l'application. Il compte désormais une thématique
**Mariage** à part entière (constantes, visuel dédié) et **12 contenus**
— 24 au total en base — qui racontent le parcours de bout en bout :

- entrer : « Se marier : par où commencer ? », le dossier de mairie
  (pièces, témoins, **bans affichés 10 jours, sourcés
  service-public.fr** — le seul délai présenté comme officiel), le
  rétroplanning présenté en repères assumés, jamais en obligations ;
- décider : le contrat de mariage chez le notaire (sans conseil
  personnalisé : le guide renvoie au notaire), le lieu de réception ;
- tenir : le budget en trois chiffres (estimé, devis confirmé, réglé),
  les invités et le bon nombre, l'engagement des musiciens et son cadre
  à vérifier (L7121-3, Guso), le photographe, le plan de table ;
- vivre et refermer : le déroulé du jour J, l'après-mariage
  (remerciements, livret de famille, parcours Famille).

Chaque contenu recoupe exactement ce que le produit fait — mêmes
repères, mêmes lignes rouges (rien d'inventé, aucun délai présenté
comme officiel hors bans sourcés, aucun envoi par AIME®) — et renvoie au
parcours « Nous nous marions ». Surfaces : carte thématique du hub
/informations, page /informations/mariage, et l'accueil, dont les
« Derniers guides » ouvrent sur la trilogie d'entrée du mariage.
Vérifié : 12 pages guides en 200, fond en base (24 contenus), tsc et
build propres, démonstration mariage intacte après réensemencement.
Restant au carnet : parcours « je n'arrive pas à payer » (à reconfirmer
avant tout chantier).

## 6nonies. Parcours « Je n'arrive pas à payer » — 17e situation (2026-10-13)

**Demande** : ouvrir le parcours des difficultés de paiement, le sujet où une
application peut le plus facilement faire du mal (promettre une aide, inventer
un délai, décourager d'agir). Traitement : même rigueur que pour le reste, et
lignes rouges doublées.

**La situation** (clé `paiement`, insérée dans le bloc « vie quotidienne »
avant « activité », visuel `hero-difficultes.jpg` généré — table de cuisine,
factures et carnet, lumière du jour : la dignité plutôt que la misère).
5 questions : ce qui devient difficile (loyer / factures / quotidien / crédit /
impôts / plusieurs / autre, requis), depuis quand, l'événement déclencheur, les
relances ou la procédure en cours (requis), les aides déjà demandées.

**Les plans** — ordre volontairement défensif : (1) si une procédure est
engagée, la première action traite les documents officiels (point-justice,
**rappel personnel J+2**, aucun délai légal chiffré : seuls les textes en
contiennent) ; (2) le point complet rentrées/sorties/retards (J+3), base de
tous les interlocuteurs ; (3) réponse écrite aux relances ; (4) vérification
des droits non réclamés (mes-droits-sociaux + CAF, J+7) ; (5) branches par
nature : bailleur avant l'installation du retard, aide au logement, ADIL,
Action Logement salarié ; fournisseurs et échéanciers, chèque énergie, FSL via
CCAS ; entraide de la carte pour le quotidien ; crédit : liste complète,
interdiction nommée du nouveau crédit pour rembourser, commission de
surendettement de la Banque de France présentée **en texte** (elle n'est pas
un slug du référentiel des 31 organismes — rien d'inventé, renvoi au
point-justice gratuit), banque et frais ; impôts : délai/échéancier/remise
gracieuse, « la décision appartient à l'administration » ; cumul : triage
logement-énergie d'abord ; (6) branches de l'événement (CAF, France Travail,
parcours Famille en séparation, complémentaire santé solidaire en maladie) ;
(7) branches des aides déjà tentées (relance écrite, recours point-justice,
rendez-vous CCAS/France Services) ; (8) pièces (avis d'imposition, revenus,
factures et relances, + bail / contrats de crédit / avis d'impôts selon le
cas) ; (9) point d'étape J+30. Aucune échéance `official`, aucun montant,
aucun droit présenté comme acquis ; chaque tâche explique son pourquoi.

**Orientation et bureau** : lexique `paiement` dans l'assistant (« je
n'arrive plus a payer », « dettes », « surendettement »…) — le match-phrase
(12+ points) fait gagner « payer mon loyer » contre le parcours logement,
sans voler « chercher un logement » (comportement faible pré-existant
vérifié inchangé par `git stash`) ; type de démarche bureau
`difficultes-paiement` (catégorie `parcours`, champs nature/depuis/relances/
attente, pièces du plan) créé au seed et dans `SITUATION_PROCEDURE_SLUG`.

**Vérifié** : profils de 6 combinaisons en test pur (invariants : zéro
échéance officielle, zéro organisme hors référentiel, ≥ 3 pièces, raison
partout) ; matérialisation en base d'aperçu d'un parcours « loyer +
procédure + perte d'emploi » : 15 tâches, tâche urgente en tête, rappels
personnels calculés (J+2 → 15/10), page de suivi rendue ; tuile présente dans
le questionnaire ; build de production ; typecheck et ESLint verts. Règles
`2026.10-j`.

## 6decies. Fonds éditorial « difficultés de paiement » (2026-10-13)

**Demande** : raconter le parcours « Je n'arrive pas à payer » en public, avec
la même recette que le fonds mariage (thématique de hub + contenus seedés).

**La thématique** : catégorie `argent` — libellé « Argent et difficultés »
(`ARTICLE_CATEGORY_LABELS`), thème de hub (`THEME_META` : visuel
`hero-difficultes.jpg` déjà livré avec le parcours, icône `paiements` ajoutée
à l'union des icônes de thème, tagline « Quand payer devient difficile,
reprendre la main sans rester seul. »). Sous-titre du hub étendu. La
catégorie alimente automatiquement le sélecteur du formulaire d'administration
des articles.

**Les 4 contenus** (audience « Foyers en difficulté », 3 guides + 1 article,
troisième insert dédié du seed — donc « Derniers guides » de l'accueil ouverts
sur ce fonds, comme la trilogie mariage avant lui) :
`ne-plus-arriver-a-payer-par-ou-commencer` (les premiers gestes dans l'ordre :
point écrit, triage logement-énergie, contact précoce et par écrit, droits non
réclamés) ; `loyer-en-retard-parler-au-bailleur` (bailleur prévenu tôt,
échéancier écrit réaliste, signalement CAF, ADIL gratuit, Action Logement,
document d'huissier) ; `surendettement-explique-simplement` (article : la
commission de surendettement, le dépôt **gratuit** à la Banque de France,
l'avertissement contre les intermédiaires payants, le piège du nouveau crédit
pour rembourser) ; `demander-un-delai-impots-factures` (délai/échéancier/
remise gracieuse avec décision réservée à l'administration, fournisseurs avant
coupure, chèque énergie, aides CCAS selon les départements).

**Discipline éditoriale** — les lignes rouges du produit, mot pour mot :
aucun montant, aucun seuil, aucun délai chiffré, aucun droit présenté comme
acquis ; l'estimation « Mes droits sociaux » jamais confondue avec une
décision ; chaque contenu renvoie au parcours de l'espace, jamais à une
promesse de l'application. Faits institutionnels stables uniquement (gratuité
du dépôt de surendettement, ADIL, CCAS, France Services, points-justice).

**Vérifié** : insertion ciblée en base d'aperçu (28 contenus dont 4 `argent`,
sans raz — fixtures mariage et paiement préservées) ; hub avec la tuile,
`/informations/argent`, les 4 pages `/guides/<slug>` et l'accueil en 200, fil
d'Ariane « Argent et difficultés » ; build de production ; typecheck et
ESLint verts.

## 6undecies. « Mon année à préparer » — l'année de l'utilisateur d'un coup d'œil (2026-10-13)

**Demande** : le chantier d'assemblage — transformer les dates déjà présentes
dans l'espace en une année pré-remplie consultable d'un coup d'œil.

**Principe** : la page `/espace/annee` n'invente aucune date. Elle agrège ce
qui existe déjà, en gardant visibles la nature et la source de chaque date :
les étapes datées des parcours en cours (tâches non terminées des parcours ni
en questionnaire ni clos) — **échéances officielles avec leur source**,
toujours distinctes des **rappels personnels** ; les rendez-vous demandés ou
confirmés (heure, bureau, état) ; les projets ouverts dont l'utilisateur est
organisateur ou participant accepté ; ses événements communautaires et ses
trajets proposés ; et son anniversaire, seule projection calculée (récurrence
annuelle depuis la date de naissance du profil, 29 février fêté le 28 les
années non bissextiles).

**Présentation** : bloc « En retard — à traiter d'abord » (échéances, rappels
et rendez-vous passés non terminés — un projet passé, lui, disparaît : ce
n'est pas un retard), puis 12 mois glissants, mois creux affichés comme tels,
chaque date avec son badge de nature, son origine et son délai relatif
(« dans 30 jours », « il y a 3 jours »). Note de lecture explicite en pied :
seules les échéances officielles engagent un organisme. Bouton d'impression
réutilisé. Entrée par la navigation de l'espace (bureau et mobile) et par la
carte « Échéances proches » de l'accueil. Logique pure isolée dans
`lib/annee.ts`, page sans aucune écriture.

**Vérifié** : tests purs (projection d'anniversaire y compris 29 février et
dates impossibles, fenêtre glissante à borne exclusive, tri, retards) ; en
aperçu, l'année de Jean le 13/10/2026 : rappels du parcours paiement (J+2,
J+3, J+30), un vrai retard de démonstration détecté, mariage du 19/06/2027,
anniversaire projeté au 12/04/2027 (« dans 181 jours ») ; compte sans date de
naissance : aucun anniversaire fabriqué ; sans session : redirection vers la
connexion ; build de production, typecheck et ESLint verts.

## 6duodecies. L'assistant raconte l'année du membre (2026-10-13)

**Demande** : brancher l'assistant sur « Mon année à préparer » — répondre aux
questions d'année et de mois depuis les mêmes données que la page, et donner
une date de naissance au compte de visite guidée.

**Source unique** : la collecte des événements d'année sort de la page vers
`lib/annee-queries.ts` (`getYearEvents`) ; la page et l'assistant consomment
exactement la même fonction — impossible que l'assistant raconte une autre
année que celle affichée. Le layout racine charge ces événements (sérialisés)
pour les membres et les passe au widget, comme il charge déjà le résumé
personnel.

**L'intention « annee »** (assistant niveau 1, lecture seule) : détectée avant
l'agenda, avec un lexique volontairement étroit — « mon annee », « mon
planning », « mon calendrier », « a preparer ce mois », « a traiter ce mois »…
Les formulations ambiguës ont été écartées et testées : « on se marie
l'année prochaine » et « nous préparons notre mariage dans les prochains
mois » ne sont **pas** détournées (elles continuent vers le parcours mariage).
La réponse (`buildAnnee`) réutilise `buildYear` : retards en premier, mois
courant détaillé (4 dates max), rythme des mois suivants avec le compte des
échéances officielles, phrase de distinction systématique (« les échéances
officielles sont les seules qui engagent un organisme ; les rappels
personnels sont vos repères »), chips vers la page et vers les étapes.
L'agenda existant gagne le chip « Mon année à préparer » dans ses deux
sorties. Aucune écriture, aucune donnée inventée : si l'année est vierge,
l'assistant le dit.

**Visite guidée** : le compte `demo@aime-demo.fr` naît désormais le
14 mai 1985 au seed (et en base d'aperçu) — la démonstration montre
l'anniversaire projeté en mai 2027, comme pour un vrai membre.

**Vérifié** : tests purs du routage (10 questions, dont les deux pièges
mariage), du texte généré (retard nommé « rappel personnel », officielles
comptées par mois, source dans la réponse) et du pont agenda ; en aperçu :
page année inchangée après extraction (compte Jean), anniversaire visible
en visite guidée, charge utile de l'assistant peuplée des événements de
Jean ; build de production, typecheck et ESLint verts.

## 6terdecies. Visite guidée : le compte de démonstration enfin vivant (2026-10-13)

**Demande** : passe de vérification complète de la visite guidée, comme un
visiteur — et correction de ce qui cloche.

**Le crawl** : pages publiques et membre parcourues avec le compte de visite
(200 partout, aucun NaN ni erreur dans les corps) et 55 liens internes
uniques testés : aucun lien mort. Pièges de mesure documentés : le gabarit
« page n'existe pas » est embarqué dans le payload RSC de **chaque** page
(faux positifs si on le cherche dans le HTML brut — il faut le titre
visible) ; le 500 ponctuel de `/deconnexion` sous charge concurrente ne se
reproduit pas en séquentiel (307 correct, avec et sans session — fragilité
connue de la base d'aperçu, pas un bug).

**Le vrai problème** : le compte de visite guidée était **vide** — zéro
parcours, dossier, rendez-vous, projet, document. La page `/decouvrir`
promettait des « données fictives à parcourir » dans la vraie interface ; le
visiteur ne trouvait que des états vides, et l'assistant lui répondait qu'il
n'avait rien. Corrigé par `seedVisiteGuideeIfEmpty` (idempotent, appelé avec
les autres blocs de démonstration, données explicitement fictives et datées
par rapport au jour du seed) : un parcours « difficultés de paiement »
(quelques étapes faites, les suivantes datées), transmis au bureau —
dossier `DOS-…` « pièce manquante » demandant l'avis d'imposition, avec fil
d'événements des deux côtés ; un rendez-vous confirmé à 9 jours ; un
document d'exemple marqué fictif ; et un parcours mariage complet avec son
projet (Camille et Simon, samedi dans ~8 mois) : 5 foyers d'invités, 2
tables placées, 4 postes de budget, enveloppe, déroulé du jour J. L'année
de la visite montre alors rappels d'octobre, échéance officielle des bans
et anniversaire en mai ; l'assistant a de vraies choses à raconter.

**Vérifié** : en base d'aperçu (fixture équivalente, sans raz), le parcours
visiteur couvre /espace (bannière prochaine action, pièce attendue),
/espace/annee, les suivis des deux parcours, la page dossier, le projet
mariage (invités, tables, budget) et sa page jour J en tant qu'organisatrice,
les documents et les échanges (rendez-vous confirmé) ; charges utiles de
l'assistant peuplées. Typecheck et ESLint verts sur le seed.

## 6quaterdecies. Fonds éditorial « Ma famille change » (2026-10-13)

**Demande** : raconter en public les moments de famille — naissance,
séparation, deuil — avec la même discipline que les fonds mariage et argent.
La catégorie `famille` existait déjà (hub, icône, visuel) : aucun changement
de code, un troisième insert dédié au seed (33 contenus en base, l'accueil
s'ouvre désormais sur ce fonds).

**Les 5 contenus** : `naissance-premieres-demarches` (guide : la déclaration
en mairie **dans les 5 jours**, seul délai cité car officiel et sourcé
service-public.fr — c'est celui que le parcours pose déjà comme échéance
officielle ; acte et livret de famille, caisse CAF ou MSA selon le régime,
rattachement Vitale, congé aux délais variables donc « cadre à vérifier ») ;
`se-separer-les-demarches` (jugement ou convention, documents annotés,
point-justice gratuit avant de signer, caisse et impôts, renvoi croisé vers
le parcours difficultés de paiement pour la transition financière) ;
`deces-dun-proche-premieres-demarches` (déclaration selon le lieu —
établissement, domicile, étranger — sans délai inventé, comme le parcours ;
acte de décès en copies, organismes un par un faute de service unique,
logement via l'ADIL, notaire pour la succession, France Services et le
droit d'aller à son rythme) ; `conjoint-survivant-pension-de-reversion`
(article : la réversion **ne vient jamais toute seule**, dossier unique
inter-régimes, mariage/divorce vs Pacs/concubinage, allocation veuvage,
simulateur — tout « sous conditions », aucune éligibilité affirmée) ;
`se-pacser-ce-que-ca-change` (convention et déclaration en mairie ou chez
le notaire, et la différence la plus lourde avec le mariage : pas de
réversion dans la plupart des régimes de base).

**Méthode** : chaque fait cité vient du socle déjà sourcé des parcours
(famille, deces_proche, reversion relus ligne à ligne avant rédaction) —
aucun fait nouveau introduit par l'éditorial, aucun montant, aucun délai
ajouté, chaque contenu renvoyant à son parcours de l'espace.

**Vérifié** : insertion ciblée en aperçu sans raz (33 contenus, dont 7
famille), page thématique et 5 pages guides en 200 avec renvois aux
parcours, accueil ouvert sur le fonds ; typecheck et ESLint verts (seed
seul modifié, aucun rebuild applicatif requis).

## 6quindecies. Fonds éditorial « Santé et arrêt de travail » (2026-10-13)

**Demande** : le troisième pilier des moments de vie — santé, arrêt, handicap —
raconté en public avec la même méthode que les fonds mariage, argent et
famille : relire les parcours (`sante`, `invalidite`) ligne à ligne et
n'écrire que ce que leur socle sourcé contient déjà. Catégorie `sante`
existante : insert dédié au seed (38 contenus en base, accueil ouvert sur
ce fonds), aucun changement de code.

**Les 5 contenus** : `accident-du-travail-les-bons-reflexes` (déclaration
par l'employeur **sous 48 heures** — officiel, service-public.fr, déjà
l'échéance du parcours — feuille d'accident contre l'avance de frais,
certificat initial) ; `arret-long-preparer-la-reprise` (visite de
pré-reprise, secret médical de la médecine du travail, inaptitude /
invalidité / MDPH ouvertes pendant l'arrêt plutôt qu'au pied du mur) ;
`maladie-professionnelle-la-faire-reconnaitre` (le certificat qui relie la
maladie au travail, la caisse qui instruit — tableaux « vérifiés par la
caisse », aucun tableau reproduit) ; `handicap-travailler-autrement`
(dossier MDPH et ses délais longs dits simplement, aménagements et Agefiph,
Cap emploi et reconversion, pension d'invalidité évaluée par le
médecin-conseil — jamais un taux, jamais une éligibilité) ;
`ne-pas-renoncer-aux-soins` (le pont santé × argent : complémentaire santé
solidaire instruite par la caisse, simulateur = estimation, renvoi au
parcours difficultés de paiement).

**Discipline** : aucun montant d'indemnité, aucun taux, aucune durée chiffrée
hors les 48 heures officielles ; les deux articles santé du seed d'origine
(génériques, teintés démonstration) ne sont pas dupliqués — le fonds vise
les branches (accident, reprise, maladie professionnelle, handicap, soins).

**Vérifié** : insertion ciblée sans raz (38 contenus, 7 santé), page
thématique et 5 guides en 200 avec renvois aux parcours, accueil ouvert sur
le fonds ; typecheck et ESLint verts.

## 6sedecies. Fonds éditorial « Préparer ma retraite » (2026-10-13)

**Demande** : le quatrième pilier des moments de vie — la retraite — raconté
en public avec la méthode des fonds précédents : parcours relu, socle
sourcé uniquement, ce sujet étant celui où les estimations fantaisistes
font le plus de dégâts. Catégorie `retraite` existante : insert dédié au
seed (42 contenus en base, accueil ouvert sur ce fonds), aucun code modifié.

**Les 4 contenus** : `releve-de-carriere-verifier-tot` (le document unique
inter-régimes sur Info Retraite, les périodes qui manquent presque toujours,
des corrections à faire des années avant le départ) ;
`retraite-de-base-complementaire-qui-paye-quoi` (les deux étages en deux
logiques — durée d'assurance et revenus pour la base Assurance retraite ou
MSA, points Agirc-Arrco pour la complémentaire des salariés du privé — et
pourquoi « une estimation n'est jamais une promesse ») ;
`carrieres-mixtes-retraite` (saisonnier, exploitant, salarié, indépendant :
chaque période compte quelque part, chaque caisse confirme sa part,
l'utilisateur fait la jonction par sa vérification) ;
`demander-sa-retraite-une-seule-demande` (la demande en ligne inter-régimes
que le parcours propose à moins d'un an du départ, pièces listées au fil de
la demande, choix de la date en connaissance de cause, estimations tenues
pour des ordres de grandeur).

**Discipline** : aucun montant, aucun âge légal, aucun taux de remplacement,
aucune durée chiffrée ajoutée ; les deux articles retraite du seed
d'origine (étapes agricoles, cumul emploi-retraite) ne sont pas dupliqués.

**Vérifié** : insertion ciblée sans raz (42 contenus, 6 retraite), page
thématique et 4 guides en 200 avec renvois au parcours, accueil ouvert sur
le fonds ; typecheck et ESLint verts.

## 6septdecies. Fonds éditorial « Se loger sans se faire piéger » (2026-10-13)

**Demande** : le récit public du parcours logement, pour boucler la symétrie
parcours ↔ éditorial des grands thèmes. Le parcours `logement` est un
parcours d'orientation (socle mince : ADIL, estimation d'aide CAF/MSA, CCAS
pour l'urgence, Action Logement pour les salariés) — le fonds reste dans ce
socle, complété uniquement de protections locatives stables et écrites
dans la loi. Catégorie `logement` existante : insert dédié (47 contenus en
base, accueil ouvert sur ce fonds), aucun code modifié.

**Les 5 contenus** : `aide-au-logement-estimer-sans-se-tromper` (estimation
sur simulateur officiel ≠ décision de la caisse, changements à signaler
pour éviter les trop-perçus, pont explicite vers le guide « loyer en
retard » du fonds argent) ; `dossier-de-location-solide-sans-trop-en-donner`
(la liste fermée des pièces demandables et celle des pièces interdites —
photo, carte d'assuré social, relevé de compte, dossier médical, casier —
le dossier qui se prépare une fois et ne se diffuse pas partout) ;
`bail-et-etat-des-lieux-ce-quil-faut-lire` (dépôt de garantie encadré — un
mois hors charges en logement vide, dit comme un plafond légal et non comme
un montant d'aide — relecture gratuite par l'ADIL, état des lieux gratuit à
l'amiable et photos datées) ; `logement-urgence-qui-appeler` (le 115 en
urgence immédiate, le CCAS comme porte durable, « aucune promesse de
place », les délais d'attente dits longs et donc les portes à ouvrir tôt) ;
`pas-de-garant-piste-visale-action-logement` (Visale gratuite sous
conditions, éligibilité vérifiable uniquement chez Action Logement, accord
du bailleur à obtenir avant le dossier).

**Discipline** : aucun montant d'aide, aucun délai d'attente chiffré, aucune
éligibilité affirmée ; les deux articles logement du seed d'origine
(aide exploitants, logement de fonction) ne sont pas dupliqués.

**Vérifié** : insertion ciblée sans raz (47 contenus, 7 logement), page
thématique et 5 guides en 200 avec renvois aux parcours et entre fonds,
accueil ouvert sur le fonds ; typecheck et ESLint verts.

## 6octodecies. Consolidation du hub : « Guides à la une » épinglés (2026-10-13)

**Demande** : l'accueil affichait les « Derniers guides » par date de
publication — il a donc changé d'identité à chacun des six fonds publiés
(mariage, argent, famille, santé, retraite, logement). Stabiliser la vitrine.

**À la une épinglée** : `FEATURED_GUIDE_SLUGS` dans `lib/constants.ts` — un
guide d'entrée par grande thématique, choisi durablement et ordonné comme un
récit : le mariage d'abord (la profondeur historique du produit), puis
naissance, accident du travail, difficultés de paiement, aide au logement,
relevé de carrière. L'accueil gagne une section « Guides à la une. » (six
cartes, composant de carte factorisé) au-dessus des « Derniers guides », qui
excluent désormais les épinglés pour éviter tout doublon et redeviennent ce
qu'ils doivent être : les nouveautés.

**Ordre des thématiques** : `THEME_META` et `ARTICLE_CATEGORY_LABELS`
réordonnés dans le même ordre de vie (famille, mariage, santé, argent,
logement, retraite, puis les thématiques agricoles historiques emploi et
cotisations) ; la mosaïque de l'accueil gagne les deux tuiles qui y
brillaient par leur absence — Mariage et Argent et difficultés ; le menu
« S'informer » et le pied de page publics, codés en dur avec six anciennes
thématiques, sont alignés sur les huit, dans le même ordre.

**Vérifié** : accueil (à la une dans l'ordre voulu, derniers guides du
fonds logement sans l'épinglé), tuiles du hub et navigation dans l'ordre
famille → cotisations ; build de production, typecheck et ESLint verts.
Aucune donnée modifiée : consolidation purement éditoriale et structurelle.


---

## 6novodecies. Simplification des entrées : hero allégé, inscription refondée, dock mobile, audit des doublons (2 août 2026)

> Demande : le hero de l’accueil est chargé ; la page inscription est restée « MSA » alors que le produit a évolué ; les entrées sont nombreuses — relever tous les doublons ; un dock en bas pourrait solutionner le nettoyage.

### 1. Hero allégé

- Avant : pastille, grand titre, sous-titre, **deux gros boutons** (« Créer mon espace », « Explorer la carte ») **puis** le champ d’orientation. Les deux boutons dupliquaient le bandeau « Envie de voir à quoi ressemble Mon espace ? » situé plus bas (mêmes deux actions).
- Après : le hero ne contient qu’**un seul élément interactif** — l’orientation (« Décrivez votre situation… ») — suivi d’une ligne de **liens texte discrets** (Créer mon espace · Découvrir la démo · Explorer la carte). Le bandeau démo plus bas garde les boutons pleins : une action, un endroit qui la porte fort.

### 2. Inscription refondée (sortie de l’univers « MSA »)

- Le dernier vestige n’était pas un texte mais le champ **« Votre situation »**, limité aux statuts agricoles (Salarié agricole, Exploitant agricole, Employeur agricole, Retraité agricole, Ayant droit / famille).
- Nouveau champ « Votre situation aujourd’hui » : **situations de vie** — Je travaille (emploi, indépendant, agriculture…) ; Je cherche un emploi ou une activité ; J’emploie ou je recrute ; Je suis à la retraite ; Ma famille change (naissance, mariage, séparation…) ; Ma santé m’empêche de travailler comme avant ; J’aide un proche au quotidien.
- Compatibilité : les clés historiques (`salarie_agricole`, `exploitant`) restent dans la table d’affichage `SITUATION_LABELS` (profils, carte, back-office continuent d’afficher les anciens comptes) ; seules les **options proposées** changent (`REGISTRATION_SITUATION_KEYS`). Un texte d’aide rappelle que la situation personnalise l’accueil et évoluera par les parcours.
- Le bureau devient **« Votre bureau d’accompagnement »** (« l’équipe qui pourra suivre les dossiers que vous choisirez de lui transmettre ; modifiable dans le profil »), sans la mention « (démonstration) » sur le champ.

### 3. Dock mobile public (l’idée de l’utilisateur, généralisée)

- Un dock existait, mais **limité aux pages de la carte** (3 onglets). Il devient l’entrée de nettoyage mobile de **toutes les pages publiques** : **Accueil · S’informer · Carte · Publier · Mon espace**, avec état actif (page courante), zone sûre bas d’écran et contenu public protégé (`pb-16` mobile).
- Non-doublons vérifiés : l’assistant flotte déjà **au-dessus du dock** sur mobile (`bottom-20`) ; l’espace connecté garde **sa propre** barre basse (`AppShell`) — les deux coquilles ne se cumulent jamais ; les pages d’authentification (`AuthSplit`) restent sans dock.

### 4. Inventaire des entrées et doublons relevés

Entrées publiques : en-tête (Explorer la carte, Être accompagné·e, S’informer → 8 thèmes, Mon espace) ; hero (orientation) ; mosaïque de destinations (14 tuiles) ; grille des 17 situations ; Guides à la une (6) ; Derniers guides (3) ; bandeau démo ; recherche de l’annuaire ; pied de page (thématiques, produit, contact) ; dock mobile (5) ; assistant (toutes pages). Espace connecté : barre latérale, barre basse propre, accueil espace (orientation + grille), « Mon année », assistant personnel.

Doublons et traitements :
1. **Hero CTA ⇔ bandeau démo** (mêmes actions) → boutons du hero retirés (§1).
2. **Thématiques atteignables par menu, mosaïque, /informations, pied de page, dock** → conservés (surfaces complémentaires desktop/mobile/éditoriale) ; l’ordre unique famille → cotisations a été aligné au chantier hub.
3. **Situations via orientation, grille d’accueil, grille d’espace, assistant** → la grille est la surface de découverte assumée, l’orientation le raccourci ; aucune surface nouvelle créée.
4. **Carte via en-tête, tuile univers, dock Carte/Publier** → regroupé par le dock en mobile ; inchangé sur ordinateur.
5. **Inscription via hero (retiré), bandeau démo, en-tête Mon espace → /espace → /connexion** → chemin principal unique assumé (bandeau + en-tête).

### 5. Vérifications

- Typecheck et lint verts ; rebuild de production et redémarrage de l’aperçu. Vérifié dans le HTML servi : hero réduit à l’orientation + trois liens texte ; inscription proposant les situations de vie et « Votre bureau d’accompagnement » ; dock des cinq entrées présent sur l’accueil (Accueil actif) et sur /informations ; espace connecté conservant une seule navigation basse (la sienne).


---

## 6vicies. Fonds éditorial « Emploi et activité » : 5 guides publics (13 octobre 2026)

> Suite logique des fonds thématiques : après mariage, argent, famille, santé, retraite et logement, la thématique « emploi » était la plus pauvre (3 courts articles hérités du monde agricole) alors que le produit porte quatre parcours d’activité. Même méthode que les fonds précédents : rédaction uniquement depuis le socle factuel déjà sourcé des parcours, aucun fait, montant, délai ou droit nouveau ; chaque contenu renvoie au parcours correspondant et reste complémentaire des articles génériques déjà présents au seed.

### 1. Socle utilisé

Parcours `emploi` (France Travail, mission locale pour les moins de 26 ans, Cap emploi, droits à la formation sur Mon Compte Formation), `recruteur` (offre déposée, DPAE auprès de la MSA ou de l’Urssaf avant la prise de poste, contrat et visite de santé au travail, Guso pour le spectacle ponctuel, aides à vérifier jamais promises), `activite` (accompagnement avant formalités, guichet unique, régime agricole ou Urssaf, artiste présumé salarié) et `transmission` (activité rendue transmissible — bilans, baux, matériel —, professionnel pour la forme, cessation au guichet unique, salarié·es sécurisé·es avant les dates, alignement avec la retraite).

### 2. Les 5 contenus (catégorie `emploi`)

1. **Recherche d’emploi : par où commencer, selon votre situation** (guide) — la bonne première porte selon l’âge, le handicap et l’objectif ; renvoi au parcours « Je cherche un emploi ou une formation ».
2. **Première embauche : les gestes dans le bon ordre** (guide) — offre, DPAE, contrat, comptes employeur, aides vérifiées sur les sites officiels ; renvoi au parcours « J’embauche ou je recrute », complémentaire de « Embaucher un salarié saisonnier » et de « Prévention et sécurité au travail agricole » déjà au seed.
3. **Un artiste ou un technicien pour un soir : déclarer avec le Guso** (article) — présomption de salariat du spectacle vivant, Guso obligatoire et gratuit hors activité principale ; renvoi au parcours recruteur.
4. **Créer son activité : l’accompagnement avant les formalités** (guide) — statut clarifié avec un accompagnement local, déclaration au guichet unique, MSA ou Urssaf selon le régime ; renvoi au parcours « Je commence ou développe une activité ».
5. **Transmettre ou cesser son activité : préparer avant de déclarer** (guide) — transmission préparée, salarié·es sécurisé·es, radiation et régularisations, retraite alignée ; renvoi au parcours « Je transmets ou je cesse mon activité ».

### 3. Thématique alignée sur le produit d’aujourd’hui

La catégorie `emploi` s’affiche désormais **« Emploi et activité »** (libellé de catégorie, tuile du hub, tagline : « Travailler, recruter, créer ou transmettre ») : la thématique n’est plus seulement l’emploi agricole, elle couvre les quatre parcours d’activité du produit. L’ordre des thématiques et les guides à la une ne changent pas.

### 4. Vérifications

Base d’aperçu recréée (migrations + seed complet, 52 articles publics), typecheck vert, build de production, aperçu redémarré. Vérifié dans le HTML visible : les 5 guides en 200 avec contenu réel, page thématique « Emploi et activité » listant les 5 titres, tuile du hub renommée, « Derniers guides » de l’accueil affichant les nouveautés emploi hors épinglés. Aucune promesse de droit, d’aide ou de délai : les aides « se vérifient au moment de l’embauche », l’indemnisation reste « éventuelle ».
