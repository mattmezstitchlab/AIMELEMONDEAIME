# AIME — proposition de valeur et limites

## Concept recommandé
**Un mariage pour se réunir. Des liens pour la suite.**

Un point de départ pour préparer le mariage, mobiliser les proches et les
savoir-faire locaux, puis garder des liens utiles après l’événement.

Utilité recherchée : éviter de séparer artificiellement l’organisation d’un
événement, l’entraide entre proches et la vie locale. Le mariage est un cas
concret de départ, pas un prétexte pour promettre tous les services publics.
Cette proposition est une hypothèse de positionnement à tester avec couples,
invités et professionnels ; elle n’est pas une exclusivité nationale démontrée.

## Ce qui existe déjà en France — ne pas le présenter comme inédit
- Mariages.net : prestataires, demandes de devis, budget, liste d’invités, site
  invité, RSVP synchronisé et plan de table.
  https://www.mariages.net/wedding-planner
- Mon Appli de Mariage annonce invités, RSVP, budget, site invité et CRM prestataires.
  https://monapplimariage.fr/
- AlloVoisins : demandes de services/matériel, propositions, mise en relation et messagerie.
  https://www.allovoisins.com/comment-ca-marche

Ces pages décrivent les offres des éditeurs ; elles ne constituent pas un test
indépendant de leur qualité. Recherche effectuée le 16 octobre 2026, non exhaustive.

## Liste répondant strictement à « encore impossible en France »
**Aucune fonctionnalité vérifiée.** Les sources trouvées ne permettent pas
d’affirmer qu’une possibilité d’AIME est impossible ailleurs en France.
L’absence de concurrent trouvé ne prouve pas l’absence d’un service.
Ni RSVP, ni budget, ni devis, ni entraide, ni transmission de savoir-faire ne
justifient une telle revendication. Ne pas publier « premier », « seul »,
« inédit en France » sans étude complémentaire documentée.

## Pistes de différenciation à valider, pas des impossibilités actuelles
1. Continuité avant/pendant/après le mariage : retrouver les liens consentis
   pour des projets locaux ultérieurs, sans inscrire les invités à leur insu.
2. Proches, professionnels et entraide réunis dans un projet avec des accès limités.
3. Circuits territoriaux explicitement reliés aux besoins du mariage.
4. Assistance de navigation locale, sans envoyer les questions à une IA tierce.

## État de la version publique réunifiée
Accessible sans compte : nouvelle architecture, parcours et repères, entrées
prestataires/invités, assistant de navigation et brouillon local de demande.
Les listes dynamiques nécessitent une base et des publications ; ne pas promettre
un catalogue local réellement rempli.

Présent dans le code mais non activé en production : comptes, projets privés,
RSVP de vrais foyers, informations partagées, calendrier depuis une invitation,
tableau de bord prestataire, publications et échanges. Prérequis : PostgreSQL,
migrations, secret de session stable, configuration des comptes et tests.

Non développé dans ce lot : devis multiservices formalisés, contrats/signatures,
paiements, disponibilités structurées, envoi automatique d’invitations,
portfolios professionnels complets et intégrations administratives.
