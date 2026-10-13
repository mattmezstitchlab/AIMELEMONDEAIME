/**
 * Base de règles AIME® — orientation et préparation, sans IA.
 * Chaque situation : questions progressives → étapes expliquées, pièces, organismes et liens officiels.
 * Les règles sont versionnées et datées ; elles n'attribuent aucun droit et ne valident aucun dossier.
 */
export const RULES_VERSION = "2026.10-d";
export const RULES_REVIEWED_AT = "2026-10-13";
// 2026.10-c : parcours Santé, échéances officielles calculées dans les règles.
// 2026.10-d : parcours Famille, Proche et Quotidien épaissis au même niveau.

export type Question = {
  key: string;
  label: string;
  type: "select" | "text" | "date" | "number" | "textarea" | "time";
  options?: Array<[string, string]>;
  help?: string;
  why?: string;
  required?: boolean;
};

export type TaskRule = {
  kind: "action" | "piece";
  label: string;
  detail?: string;
  reason: string;
  organisms?: string[];
  officialUrl?: string;
  frameworkFlag?: "cadre_a_verifier" | "guso_probable";
  /**
   * Échéance calculée à la préparation du plan : `days` jours après la date
   * de la réponse `from` (question de type date), ou après le jour de
   * préparation. `official` exige une `source` — jamais d'échéance inventée.
   */
  due?: { days: number; from?: string; official?: boolean; source?: string };
};

/** Calcule l'échéance concrète d'une tâche (fonction pure, testable). */
export function computeDueAt(rule: TaskRule, answers: Record<string, string>, now = new Date()): Date | null {
  if (!rule.due) return null;
  let base = now;
  if (rule.due.from) {
    const raw = answers[rule.due.from];
    if (!raw) return null;
    const parsed = new Date(`${raw}T12:00:00`);
    if (Number.isNaN(parsed.getTime())) return null;
    base = parsed;
  }
  const due = new Date(base);
  due.setDate(due.getDate() + rule.due.days);
  return due;
}

export type Situation = {
  key: string;
  label: string;
  short: string;
  description: string;
  icon: "emploi" | "search" | "music" | "famille" | "logement" | "entraide" | "heart" | "retraite" | "sante";
  image: string;
  pilot?: boolean;
  questions: Question[];
  build: (a: Record<string, string>) => TaskRule[];
};

const yes = (v?: string) => v === "oui";

export const SITUATIONS: Situation[] = [
  {
    key: "evenement",
    label: "J'organise un événement et j'engage un artiste",
    short: "Événement et artiste",
    description: "Fête, mariage, repas associatif, concert : trouver un artiste, préparer l'engagement, les autorisations et les ressources.",
    icon: "music",
    image: "/images/hero-famille.jpg",
    pilot: true,
    questions: [
      { key: "event_type", label: "Quel type d'événement ?", type: "select", required: true, options: [["prive", "Fête privée, mariage, anniversaire"], ["village", "Fête de village, repas associatif"], ["concert", "Concert ou spectacle"], ["atelier", "Atelier ou rencontre"], ["autre", "Autre"]] },
      { key: "organizer_nature", label: "Qui organise ?", type: "select", required: true, why: "Le cadre d'embauche d'un artiste dépend de la nature de l'organisateur : un particulier ou une association ne sont pas soumis aux mêmes règles qu'un professionnel du spectacle.", options: [["particulier", "Un particulier"], ["association", "Une association"], ["collectivite", "Une commune ou collectivité"], ["entreprise", "Une entreprise hors spectacle (ferme, commerce…)"], ["pro_spectacle", "Une structure dont le spectacle est l'activité principale"], ["inconnu", "Je ne sais pas"]] },
      { key: "date", label: "Date de l'événement", type: "date", required: true },
      { key: "horaires", label: "Horaires (facultatif)", type: "text", help: "Ex. 18 h – 23 h" },
      { key: "lieu", label: "Commune", type: "text", required: true },
      { key: "acces", label: "Qui pourra venir ?", type: "select", required: true, why: "Un événement ouvert au public peut nécessiter une information de la mairie et, si de la musique est diffusée, une démarche auprès de la Sacem.", options: [["invites", "Uniquement des invités"], ["public", "Ouvert au public"], ["voie_publique", "Ouvert au public, sur la voie publique"]] },
      { key: "public", label: "Nombre de personnes attendues", type: "number" },
      { key: "buvette", label: "Prévoyez-vous une buvette avec boissons alcoolisées ?", type: "select", options: [["non", "Non"], ["oui", "Oui"]] },
      { key: "discipline", label: "Quelle discipline artistique ?", type: "select", required: true, options: [["Musique", "Musique"], ["Chant", "Chant"], ["Conte et lecture", "Conte et lecture"], ["Théâtre", "Théâtre"], ["Danse", "Danse"], ["Cirque et rue", "Cirque et arts de la rue"], ["Son et lumière", "Technicien son et lumière"], ["autre", "Autre"]] },
      { key: "budget", label: "Budget indicatif pour l'artiste (€, facultatif)", type: "number", why: "Il aide à orienter vos demandes. Il n'est jamais montré publiquement." },
      { key: "technique", label: "Besoins techniques (facultatif)", type: "textarea", help: "Électricité, sonorisation, espace couvert…" },
    ],
    build: (a) => {
      const nonPro = ["particulier", "association", "collectivite", "entreprise"].includes(a.organizer_nature);
      const tasks: TaskRule[] = [
        { kind: "action", label: "Préciser le programme et les besoins du projet", reason: "Le projet partagé rassemble vos besoins, les contributions confirmées et le programme : chacun y retrouve la même information.", },
        { kind: "action", label: `Trouver un artiste (${a.discipline || "discipline à préciser"}) et lui envoyer une demande`, reason: "La demande part vers la personne choisie ; rien n'est réservé tant qu'elle n'a pas fait de proposition et que vous ne l'avez pas acceptée." },
        {
          kind: "action",
          label: "Vérifier le cadre d'engagement de l'artiste",
          detail: "Pour le spectacle vivant, le Code du travail présume que l'artiste rémunéré est salarié (art. L7121-3). Une simple facture ou un numéro Siret ne suffit pas à établir qu'il peut facturer : selon les cas, l'engagement passe par un contrat de travail.",
          reason: "Le cadre dépend à la fois de l'organisateur et de la situation de l'artiste. AIME® ne peut pas le trancher à votre place.",
          organisms: ["france-travail-spectacle", "audiens"],
          officialUrl: "https://www.service-public.fr",
          frameworkFlag: "cadre_a_verifier",
        },
      ];
      if (nonPro || a.organizer_nature === "inconnu") {
        tasks.push({
          kind: "action",
          label: "Si l'artiste est engagé comme salarié : se renseigner sur le Guso",
          detail: "Le Guichet unique du spectacle occasionnel s'adresse aux employeurs dont le spectacle n'est pas l'activité principale (particuliers, associations, collectivités, entreprises hors spectacle) qui embauchent des artistes ou techniciens pour du spectacle vivant. Préparer l'engagement dans AIME® ne vaut pas déclaration Guso.",
          reason: a.organizer_nature === "inconnu" ? "Vous ne savez pas encore qui organise : précisez-le pour confirmer si le Guso vous concerne." : "Vous avez indiqué un organisateur dont le spectacle n'est pas l'activité principale.",
          organisms: ["guso"],
          officialUrl: "https://www.guso.fr",
          frameworkFlag: "guso_probable",
        });
      }
      if (a.acces !== "invites") {
        tasks.push({ kind: "action", label: "Informer la mairie de l'événement ouvert au public", detail: "Les obligations varient selon la commune, le lieu et l'affluence : la mairie vous indiquera les démarches applicables.", reason: "Votre événement est ouvert au public.", organisms: ["mairie"], officialUrl: "https://lannuaire.service-public.fr" });
        tasks.push({ kind: "action", label: "Vérifier si une démarche Sacem est nécessaire pour la musique diffusée", reason: "De la musique diffusée en public peut donner lieu à une autorisation de diffusion. À vérifier selon votre programme.", organisms: ["sacem"], officialUrl: "https://www.sacem.fr" });
      }
      if (yes(a.buvette)) tasks.push({ kind: "action", label: "Demander l'autorisation de buvette temporaire en mairie", reason: "Une buvette avec boissons alcoolisées lors d'un événement nécessite en principe une autorisation municipale.", organisms: ["mairie"], officialUrl: "https://www.service-public.fr" });
      tasks.push({ kind: "action", label: "Vérifier votre assurance responsabilité civile d'organisateur", reason: "Elle couvre les dommages pouvant survenir pendant l'événement. À vérifier avec votre assureur." });
      tasks.push({ kind: "action", label: "Réserver les ressources locales (mobilier, produits, technique, transport)", reason: "Les annonces de la carte permettent d'emprunter, louer ou acheter près de chez vous ; chaque réservation est acceptée par son propriétaire." });
      tasks.push({ kind: "piece", label: "Proposition ou devis de l'artiste", reason: "Trace écrite des conditions convenues." });
      tasks.push({ kind: "piece", label: "Fiche technique de l'artiste", reason: "Pour préparer le lieu, l'électricité et le son." });
      tasks.push({ kind: "piece", label: "Contrat d'engagement signé", reason: "Contrat de travail ou contrat de prestation selon le cadre vérifié." });
      tasks.push({ kind: "piece", label: "Attestation d'assurance responsabilité civile", reason: "Souvent demandée par la mairie ou le lieu." });
      return tasks;
    },
  },
  {
    key: "activite",
    label: "Je commence ou développe une activité",
    short: "Activité",
    description: "Créer une activité indépendante, agricole ou artistique, ou faire évoluer celle que vous avez.",
    icon: "emploi",
    image: "/images/hero-cotisations.jpg",
    questions: [
      { key: "type", label: "Quel type d'activité ?", type: "select", required: true, options: [["agricole", "Agricole"], ["artisanale", "Artisanale ou commerciale"], ["liberale", "Libérale ou services"], ["artistique", "Artistique"]] },
      { key: "stade", label: "Où en êtes-vous ?", type: "select", required: true, options: [["idee", "J'ai une idée"], ["creation", "Je suis prêt à créer"], ["existante", "Mon activité existe déjà"]] },
      { key: "commune", label: "Commune (facultatif)", type: "text" },
    ],
    build: (a) => [
      { kind: "action", label: "Se faire accompagner pour clarifier le projet", reason: "Un accompagnement local aide à choisir le statut adapté avant toute formalité.", organisms: ["france-services"], officialUrl: "https://www.france-services.gouv.fr" },
      ...(a.stade !== "existante" ? [{ kind: "action" as const, label: "Déclarer la création sur le guichet unique des formalités d'entreprise", reason: "Toutes les créations d'entreprise passent par ce guichet en ligne.", organisms: ["guichet-unique"], officialUrl: "https://formalites.entreprises.gouv.fr" }] : []),
      a.type === "agricole"
        ? { kind: "action", label: "Se renseigner auprès de la MSA sur la protection sociale de l'activité agricole", reason: "La MSA gère la protection sociale des personnes relevant du régime agricole.", organisms: ["msa"], officialUrl: "https://www.msa.fr" }
        : { kind: "action", label: "Se renseigner auprès de l'Urssaf sur les cotisations de l'activité", reason: "L'Urssaf recouvre les cotisations des travailleurs indépendants hors régime agricole.", organisms: ["urssaf"], officialUrl: "https://www.urssaf.fr" },
      ...(a.type === "artistique" ? [{ kind: "action" as const, label: "Vérifier si votre activité relève du salariat (artiste du spectacle) ou de l'indépendance", reason: "Pour le spectacle vivant, l'artiste rémunéré est présumé salarié : le statut se vérifie avant de facturer.", organisms: ["france-travail-spectacle"], frameworkFlag: "cadre_a_verifier" as const }] : []),
      { kind: "piece", label: "Pièce d'identité et justificatif de domicile", reason: "Demandés lors des formalités de création." },
    ],
  },
  {
    key: "emploi",
    label: "Je cherche un emploi ou une formation",
    short: "Emploi et formation",
    description: "Trouver un emploi, une formation, un apprentissage, ou un accompagnement adapté.",
    icon: "search",
    image: "/images/hero-emploi.jpg",
    questions: [
      { key: "age", label: "Avez-vous moins de 26 ans ?", type: "select", required: true, why: "Les missions locales accompagnent spécifiquement les jeunes de 16 à 25 ans.", options: [["non", "Non"], ["oui", "Oui"]] },
      { key: "handicap", label: "Souhaitez-vous un accompagnement lié à un handicap ?", type: "select", why: "Question facultative : elle permet de vous indiquer Cap emploi. Votre réponse reste privée.", options: [["non", "Non ou je préfère ne pas répondre"], ["oui", "Oui"]] },
      { key: "objectif", label: "Votre objectif", type: "select", required: true, options: [["emploi", "Trouver un emploi"], ["formation", "Me former"], ["reconversion", "Changer de métier"]] },
    ],
    build: (a) => [
      { kind: "action", label: "S'inscrire ou mettre à jour son dossier auprès de France Travail", reason: "France Travail accompagne la recherche d'emploi et l'indemnisation éventuelle.", organisms: ["france-travail"], officialUrl: "https://www.francetravail.fr" },
      ...(yes(a.age) ? [{ kind: "action" as const, label: "Contacter la mission locale la plus proche", reason: "Vous avez moins de 26 ans : les missions locales vous accompagnent sur l'emploi, la formation et la vie quotidienne.", organisms: ["mission-locale"], officialUrl: "https://www.unml.info" }] : []),
      ...(yes(a.handicap) ? [{ kind: "action" as const, label: "Se renseigner auprès de Cap emploi", reason: "Vous souhaitez un accompagnement lié au handicap.", organisms: ["cap-emploi"], officialUrl: "https://www.cheops-ops.org" }] : []),
      ...(a.objectif !== "emploi" ? [{ kind: "action" as const, label: "Consulter vos droits à la formation sur Mon Compte Formation", reason: "Votre objectif inclut une formation.", organisms: ["mon-compte-formation"], officialUrl: "https://www.moncompteformation.gouv.fr" }] : []),
      { kind: "piece", label: "CV à jour", reason: "Utile pour chaque candidature et rendez-vous." },
    ],
  },
  {
    key: "famille",
    label: "Ma famille change",
    short: "Famille",
    description: "Naissance, adoption, mariage, Pacs ou séparation : ce qui change, qui prévenir et dans quel délai. Pour un décès, un parcours distinct vous accompagne.",
    icon: "famille",
    image: "/images/hero-famille.jpg",
    questions: [
      { key: "evenement", label: "Que se passe-t-il ?", type: "select", required: true, options: [["naissance", "Une naissance"], ["adoption", "Une adoption"], ["union", "Un mariage ou un Pacs"], ["separation", "Une séparation ou un divorce"]] },
      { key: "date", label: "Date de l'événement (passée ou prévue)", type: "date", required: true, why: "Certains délais légaux courent à partir de cette date, par exemple la déclaration de naissance." },
      { key: "regime", label: "Relevez-vous du régime agricole ?", type: "select", why: "Les prestations familiales sont versées par la CAF ou, pour le régime agricole, par la MSA.", options: [["non", "Non"], ["oui", "Oui"], ["inconnu", "Je ne sais pas"]] },
      { key: "premier_enfant", label: "S'il s'agit d'une naissance ou d'une adoption : est-ce votre premier enfant ?", type: "select", options: [["oui", "Oui"], ["non", "Non"], ["sans_objet", "Sans objet (mariage, Pacs, séparation)"]] },
      { key: "conge", label: "Envisagez-vous un congé lié à l'arrivée de l'enfant (parental, d'adoption, partagé) ?", type: "select", options: [["oui", "Oui"], ["non", "Non"], ["inconnu", "Je ne sais pas encore"], ["sans_objet", "Sans objet"]] },
    ],
    build: (a) => {
      const caisse = a.regime === "oui" ? "msa" : a.regime === "inconnu" ? null : "caf";
      const caisseLabel = caisse === "msa" ? "la MSA" : caisse === "caf" ? "la CAF" : "la CAF ou la MSA (selon votre régime)";
      const declareCaisse: TaskRule = { kind: "action", label: `Déclarer le changement à ${caisseLabel}`, detail: "La composition du foyer conditionne les prestations familiales et plusieurs aides ; la déclaration peut se faire en ligne.", reason: "Ne pas déclarer retarde les prestations et peut générer des trop-perçus.", organisms: caisse ? [caisse] : ["caf", "msa"], officialUrl: caisse === "msa" ? "https://www.msa.fr" : "https://www.caf.fr" };
      const t: TaskRule[] = [];
      if (a.evenement === "naissance") {
        t.push({ kind: "action", label: "Déclarer la naissance à la mairie du lieu de naissance sous 5 jours", detail: "La déclaration se fait en principe par la maternité ou par un parent, avec le certificat d'accouchement.", reason: "C'est l'acte qui établit l'état civil de l'enfant ; le délai est légal.", organisms: ["mairie"], officialUrl: "https://www.service-public.fr", due: { days: 5, from: "date", official: true, source: "service-public.fr — déclaration de naissance sous 5 jours" } });
        t.push({ kind: "action", label: "Demander l'acte de naissance et faire mettre à jour le livret de famille", reason: "Ces documents sont demandés par presque tous les organismes ensuite.", organisms: ["mairie"] });
      }
      if (a.evenement === "adoption") {
        t.push({ kind: "piece", label: "Jugement d'adoption ou attestation de l'organisme d'adoption", reason: "Il fonde l'état civil de l'enfant et l'ouverture des droits liés à l'adoption." });
        t.push({ kind: "action", label: "Faire transcrire l'adoption sur les registres d'état civil", reason: "La transcription met à jour l'acte de naissance et le livret de famille.", organisms: ["mairie"], officialUrl: "https://www.service-public.fr", frameworkFlag: "cadre_a_verifier" });
      }
      if (a.evenement === "union") {
        t.push({ kind: "piece", label: "Acte de mariage ou certificat d'enregistrement du Pacs", reason: "Demandé par les organismes pour mettre à jour votre situation." });
        t.push({ kind: "action", label: "Faire mettre à jour le livret de famille", reason: "Il reprend les événements du foyer et sert de justificatif courant.", organisms: ["mairie"] });
        t.push({ kind: "action", label: "Déclarer le changement de situation aux impôts", detail: "L'année du mariage ou du Pacs, des choix d'imposition existent ; les règles et leurs effets sont expliqués sur le site officiel, sans conseil personnalisé de la part d'AIME®.", reason: "La situation de famille influe sur l'impôt sur le revenu et le taux de prélèvement.", organisms: ["impots"], officialUrl: "https://www.impots.gouv.fr" });
        t.push({ kind: "action", label: "Si vous le souhaitez : choisir un nom d'usage et faire actualiser vos pièces d'identité", reason: "Le nom d'usage est un choix personnel ; il se déclare et figure sur les titres d'identité.", organisms: ["france-titres", "mairie"], officialUrl: "https://www.service-public.fr" });
      }
      if (a.evenement === "separation") {
        t.push({ kind: "piece", label: "Jugement de divorce ou convention de séparation", reason: "Il fixe la résidence des enfants, les contributions et la date des effets entre époux." });
        t.push({ kind: "action", label: "Faire annoter le livret de famille et l'acte de mariage", reason: "Les documents à jour évitent les blocages dans les démarches suivantes.", organisms: ["mairie"] });
        t.push({ kind: "action", label: "Point-justice : information gratuite sur la pension alimentaire, la garde et les démarches", detail: "Un premier avis neutre, avant d'engager des frais ; la médiation familiale y est aussi présentée.", reason: "La séparation engage des décisions durables : être informé avant de signer.", organisms: ["point-justice"], officialUrl: "https://www.justice.fr" });
        t.push({ kind: "action", label: "Déclarer le changement de situation aux impôts", detail: "Séparation et divorce modifient le foyer fiscal et le taux de prélèvement ; délais et modalités sur le site officiel.", reason: "Éviter les trop-perçus et les régularisations l'année suivante.", organisms: ["impots"], officialUrl: "https://www.impots.gouv.fr" });
      }
      t.push(declareCaisse);
      if ((a.evenement === "naissance" || a.evenement === "adoption") && a.premier_enfant === "oui") {
        t.push({ kind: "action", label: "Estimer vos droits liés à l'arrivée d'un premier enfant (prime, prestation d'accueil)", detail: "Le simulateur officiel et votre caisse indiquent ce qui peut s'appliquer ; les conditions de ressources sont vérifiées par la caisse, jamais par AIME®.", reason: "Certaines aides se demandent dans des délais courts après la naissance ou l'adoption.", organisms: caisse ? [caisse] : ["caf", "msa"], officialUrl: "https://www.mesdroitssociaux.gouv.fr" });
      }
      if ((a.evenement === "naissance" || a.evenement === "adoption") && (a.conge === "oui" || a.conge === "inconnu")) {
        t.push({ kind: "action", label: "Préparer la demande de congé parental ou d'adoption auprès de l'employeur", detail: "Le congé se demande à l'employeur avec des délais de prévenance qui dépendent de votre situation et de votre convention ; la prestation partagée se demande ensuite à la caisse.", reason: "Anticiper évite les ruptures de revenus entre la fin du congé maternité/paternité et la reprise.", organisms: caisse ? [caisse] : ["caf", "msa"], officialUrl: "https://www.service-public.fr", frameworkFlag: "cadre_a_verifier" });
      }
      t.push({ kind: "action", label: "Mettre à jour la situation auprès de l'Assurance Maladie", detail: "Rattachement de l'enfant à la carte Vitale d'un ou des deux parents, changement de situation personnelle.", reason: "Le rattachement évite les blocages de remboursements pour l'enfant.", organisms: ["assurance-maladie"], officialUrl: "https://www.ameli.fr" });
      if (a.evenement === "naissance" || a.evenement === "adoption") t.push({ kind: "piece", label: "Acte de naissance (ou jugement) et livret de famille mis à jour", reason: "Le duo demandé pour inscrire l'enfant partout : crèche, mutuelle, prestations." });
      else if (a.evenement === "union") t.push({ kind: "piece", label: "Livret de famille mis à jour", reason: "Justificatif courant de la nouvelle situation du foyer." });
      return t;
    },
  },
  {
    key: "logement",
    label: "Je cherche un logement",
    short: "Logement",
    description: "Louer, être aidé pour le loyer, trouver une solution d'urgence ou connaître ses droits.",
    icon: "logement",
    image: "/images/hero-logement.jpg",
    questions: [
      { key: "besoin", label: "Votre besoin", type: "select", required: true, options: [["location", "Trouver une location"], ["aide", "Être aidé pour payer le loyer"], ["urgence", "Une solution rapide"], ["droits", "Connaître mes droits"]] },
      { key: "salarie", label: "Êtes-vous salarié d'une entreprise du secteur privé ?", type: "select", why: "Action Logement accompagne notamment les salariés du secteur privé.", options: [["non", "Non"], ["oui", "Oui"]] },
    ],
    build: (a) => [
      { kind: "action", label: "Obtenir un conseil juridique gratuit auprès de l'ADIL", reason: "Les ADIL informent gratuitement sur le logement : bail, droits, aides.", organisms: ["adil"], officialUrl: "https://www.anil.org" },
      ...(a.besoin === "aide" ? [{ kind: "action" as const, label: "Faire une estimation de l'aide au logement", reason: "Les aides personnelles au logement sont versées par la CAF ou la MSA.", organisms: ["caf", "msa"], officialUrl: "https://www.caf.fr" }] : []),
      ...(a.besoin === "urgence" ? [{ kind: "action" as const, label: "Contacter le CCAS de votre commune", reason: "Le centre communal d'action sociale peut orienter vers une solution d'urgence.", organisms: ["ccas"], officialUrl: "https://lannuaire.service-public.fr" }] : []),
      ...(yes(a.salarie) ? [{ kind: "action" as const, label: "Consulter les services d'Action Logement", reason: "Vous êtes salarié du secteur privé.", organisms: ["action-logement"], officialUrl: "https://www.actionlogement.fr" }] : []),
      { kind: "piece", label: "Justificatifs de ressources récents", reason: "Demandés par les bailleurs et pour les aides." },
    ],
  },
  {
    key: "quotidien",
    label: "J'ai besoin d'aide au quotidien",
    short: "Aide au quotidien",
    description: "Démarches, numérique, courses, déplacements ou coup de main ponctuel : trouver de l'aide près de chez vous, humaine d'abord.",
    icon: "entraide",
    image: "/images/hero-campagne.jpg",
    questions: [
      { key: "besoin", label: "De quoi s'agit-il ?", type: "select", required: true, options: [["demarches", "Être aidé pour des démarches et des papiers"], ["numerique", "Utiliser internet, un ordinateur ou un smartphone"], ["essentiels", "Des besoins essentiels (courses, nourriture, vêtements)"], ["deplacement", "Me déplacer (courses, rendez-vous, soins)"], ["services", "Un coup de main (jardin, petits travaux, animaux)"], ["droits", "Connaître mes droits sociaux"]] },
      { key: "tentative", label: "Où en êtes-vous ?", type: "select", options: [["pas_encore", "Je n'ai pas encore essayé"], ["bloque", "J'ai essayé, mais je suis bloqué·e"], ["sans_equipement", "Je n'ai pas l'équipement ou la connexion"]] },
      { key: "delai", label: "Y a-t-il un délai serré (moins d'une semaine) ?", type: "select", options: [["non", "Non"], ["oui", "Oui"], ["inconnu", "Je ne sais pas"]] },
      { key: "frequence", label: "C'est un besoin…", type: "select", options: [["ponctuel", "Ponctuel (une fois)"], ["regulier", "Régulier (chaque semaine, par exemple)"]] },
    ],
    build: (a) => {
      const t: TaskRule[] = [];
      if (a.delai === "oui") t.push({ kind: "action", label: "Signaler le délai dès le premier contact", detail: "Que ce soit à France services, au CCAS ou dans une demande sur la carte AIME®, dites la date butoir : cela permet de prioriser et de trouver le bon interlocuteur.", reason: "Beaucoup de délais peuvent être tenus si l'on s'y prend avec le bon guichet dès le départ." });
      if (a.besoin === "demarches") {
        t.push({ kind: "action", label: "Prendre rendez-vous dans un espace France services près de chez vous", detail: "L'accompagnement est gratuit et humain, pour les démarches de plusieurs organismes ; apportez vos pièces et, si vous en avez, vos identifiants.", reason: "Un conseiller peut débloquer en une visite ce qui bloque depuis des semaines en ligne.", organisms: ["france-services"], officialUrl: "https://www.france-services.gouv.fr" });
        if (a.tentative === "bloque") t.push({ kind: "action", label: "Reprendre la démarche bloquée avec le conseiller", detail: "Notez où le blocage survient (message affiché, pièce refusée, code perdu) : cela fait gagner la moitié du rendez-vous.", reason: "Le blocage précis évite de recommencer toute la démarche de zéro." });
        t.push({ kind: "action", label: "Pour les titres (carte d'identité, passeport, carte grise) : faire la pré-demande sur France Titres", detail: "La pré-demande en ligne raccourcit le passage en mairie ; France services peut la faire avec vous.", reason: "C'est le passage obligé pour la plupart des titres.", organisms: ["france-titres"], officialUrl: "https://ants.gouv.fr" });
      }
      if (a.besoin === "numerique") {
        t.push({ kind: "action", label: "Demander un accompagnement numérique (France services, médiathèque, association locale)", detail: "Ateliers collectifs ou rendez-vous individuel : précisez ce que vous voulez apprendre à faire vous-même, pas seulement faire faire.", reason: "Être aidé une fois en comprenant rend autonome pour la suivante.", organisms: ["france-services"], officialUrl: "https://www.france-services.gouv.fr" });
        if (a.tentative === "sans_equipement") t.push({ kind: "action", label: "Repérer les points d'accès gratuits près de chez vous", detail: "France services, médiathèques et certaines mairies mettent à disposition ordinateurs et connexion ; le CCAS connaît aussi les aides à l'équipement.", reason: "Pas besoin d'acheter du matériel pour une démarche ponctuelle.", organisms: ["ccas", "france-services"] });
        t.push({ kind: "action", label: "Publier une demande d'aide informatique sur la carte AIME®", detail: "Décrivez l'appareil et le blocage, sans jamais transmettre vos mots de passe ; la rencontre peut se faire dans un lieu public.", reason: "Des voisins à l'aise avec le numérique donnent volontiers un premier coup de main." });
      }
      if (a.besoin === "essentiels") {
        t.push({ kind: "action", label: "Publier un besoin sur la carte AIME®", detail: "Don de nourriture, de vêtements ou de produits de première nécessité : décrivez le besoin, le lieu et le délai.", reason: "Producteurs, voisins et associations près de chez vous peuvent répondre vite." });
        t.push({ kind: "action", label: "Contacter le CCAS de votre commune", detail: "Épicerie sociale, aides d'urgence, orientation vers les associations caritatives locales.", reason: "Le CCAS connaît les dispositifs de la commune et peut débloquer une aide d'urgence.", organisms: ["ccas"], officialUrl: "https://lannuaire.service-public.fr" });
      }
      if (a.besoin === "deplacement") {
        t.push({ kind: "action", label: "Publier une demande de trajet sur la carte AIME®", detail: "Précisez le jour, l'heure, le lieu de départ et de destination, et si un accompagnement sur place est souhaité.", reason: "Les trajets partagés entre voisins sont l'entraide la plus simple à organiser." });
        t.push({ kind: "action", label: "Se renseigner sur le transport solidaire et les services locaux", detail: "Certaines communes et associations organisent des navettes ou des chauffeurs bénévoles ; le CCAS tient la liste à jour.", reason: "Ces services existent souvent sans être connus.", organisms: ["ccas"] });
      }
      if (a.besoin === "services") {
        t.push({ kind: "action", label: "Publier une demande sur la carte AIME®", detail: "Jardin, petits travaux, garde d'animaux : décrivez la tâche, le matériel disponible et le créneau ; convenez d'un échange ou d'un tarif clair avant de commencer.", reason: "Un cadre simple dès le départ évite les malentendus entre voisins." });
        t.push({ kind: "action", label: "Pour les travaux engageant la sécurité (électricité, toiture, gaz) : passer par un professionnel déclaré", detail: "L'entraide convient aux coups de main simples ; les travaux à risque exigent un professionnel assuré.", reason: "En cas d'accident ou de dégât, l'assurance ne couvre pas un travail bénévole à risque.", frameworkFlag: "cadre_a_verifier" });
      }
      if (a.besoin === "droits") {
        t.push({ kind: "action", label: "Estimer vos droits sur Mes droits sociaux", detail: "Le simulateur public parcourt les principales aides selon votre situation, sans rien attribuer : c'est un point de départ.", reason: "Beaucoup d'aides ne sont pas demandées faute d'être connues.", organisms: ["mes-droits-sociaux"], officialUrl: "https://www.mesdroitssociaux.gouv.fr" });
        t.push({ kind: "action", label: "Faire vérifier le résultat avec un conseiller France services ou le CCAS", detail: "Apportez le résultat du simulateur : le conseiller confirme les guichets et les pièces pour chaque aide repérée.", reason: "Le simulateur oriente ; l'humain confirme et aide à constituer les demandes.", organisms: ["france-services", "ccas"] });
      }
      if (a.frequence === "regulier" && (a.besoin === "essentiels" || a.besoin === "deplacement" || a.besoin === "services")) {
        t.push({ kind: "action", label: "Transformer l'aide ponctuelle en rendez-vous régulier", detail: "Si la même personne vous aide bien, proposez un rythme fixe et conservez le lien dans votre cercle AIME® plutôt que de republier à chaque fois.", reason: "La régularité rassure tout le monde et évite les ruptures d'aide." });
      }
      if (a.besoin !== "demarches" && a.besoin !== "numerique") t.push({ kind: "action", label: "En parallèle, un conseiller France services peut confirmer vos droits et démarches liées", reason: "Une situation du quotidien cache souvent un droit non demandé (aide, tarif, accompagnement).", organisms: ["france-services"], officialUrl: "https://www.france-services.gouv.fr" });
      return t;
    },
  },
  {
    key: "proche",
    label: "J'accompagne un proche",
    short: "Accompagner un proche",
    description: "Perte d'autonomie, handicap, aide au quotidien : organiser le soutien, connaître les interlocuteurs et préserver aussi l'aidant. Aucune donnée médicale n'est demandée.",
    icon: "heart",
    image: "/images/hero-retraite.jpg",
    questions: [
      { key: "situation", label: "Votre proche est concerné par…", type: "select", required: true, why: "Les interlocuteurs ne sont pas les mêmes pour le handicap et pour la perte d'autonomie liée à l'âge. Aucune donnée médicale n'est demandée.", options: [["handicap", "Un handicap"], ["age", "Une perte d'autonomie liée à l'âge"], ["inconnu", "Je ne sais pas encore"]] },
      { key: "domaine", label: "Quel est le besoin le plus pressant ?", type: "select", required: true, options: [["domicile", "L'aide à domicile et au quotidien"], ["soins", "Coordonner les soins et les rendez-vous"], ["decisions", "Les papiers, le budget, les décisions"], ["presence", "Rompre l'isolement, une présence"], ["tout", "Un peu de tout, je suis débordé·e"]] },
      { key: "capacite", label: "Votre proche peut-il encore décider et signer seul·e ?", type: "select", why: "C'est ce qui détermine si des procurations ou une mesure de protection sont à envisager — jamais contre sa volonté.", options: [["oui", "Oui"], ["partiel", "En partie seulement"], ["non", "Non"]] },
      { key: "accord", label: "Votre proche est-il d'accord pour être aidé ?", type: "select", options: [["oui", "Oui"], ["en_discussion", "C'est en discussion"], ["non", "Pas encore / il ou elle refuse"]] },
      { key: "aidant", label: "Êtes-vous son aidant·e principal·e ?", type: "select", options: [["oui", "Oui"], ["partage", "C'est partagé dans la famille"], ["non", "Non, j'aide de loin"]] },
    ],
    build: (a) => {
      const t: TaskRule[] = [];
      if (a.accord && a.accord !== "oui") t.push({ kind: "action", label: "En parler avec votre proche avant toute démarche", detail: "Commencer par ce qu'il ou elle souhaite garder, puis ce qui devient difficile ; un tiers de confiance (médecin traitant, conseiller France services) peut aider la conversation.", reason: "Une aide acceptée dure ; une aide imposée se défait. Rien ne se décide à la place de votre proche tant qu'il peut exprimer ses choix." });
      if (a.situation !== "age") t.push({ kind: "action", label: "Se renseigner auprès de la MDPH du département", detail: "Évaluation des besoins, droits et prestations liés au handicap ; le dossier peut se préparer en ligne.", reason: "La MDPH est le guichet unique du handicap : ses décisions ouvrent la plupart des aides.", organisms: ["mdph"], officialUrl: "https://www.monparcourshandicap.gouv.fr" });
      if (a.situation !== "handicap") t.push({ kind: "action", label: "Consulter le portail national pour les personnes âgées et leurs aidants", detail: "Aides à l'autonomie (dont l'APA), points d'information locaux, soutien aux aidants.", reason: "Il présente les aides selon la situation, sans les attribuer.", organisms: ["personnes-agees"], officialUrl: "https://www.pour-les-personnes-agees.gouv.fr" });
      if (a.domaine === "domicile" || a.domaine === "tout") {
        t.push({ kind: "action", label: "Demander une évaluation des besoins à domicile", detail: "Aide-ménagère, auxiliaire de vie, portage de repas, adaptation du logement : l'évaluation se demande au département, à la caisse de retraite ou via la MDPH selon la situation.", reason: "L'évaluation ouvre les plans d'aide financés ; sans elle, tout repose sur la famille.", organisms: a.situation === "handicap" ? ["mdph"] : ["personnes-agees", "ccas"] });
        t.push({ kind: "action", label: "Publier les premiers besoins sur la carte AIME®", detail: "Courses, présence, petits trajets : l'entraide de voisinage complète les aides professionnelles, elle ne les remplace pas.", reason: "Commencer petit permet de tester ce qui soulage vraiment." });
      }
      if (a.domaine === "soins" || a.domaine === "tout") {
        t.push({ kind: "action", label: "Centraliser les rendez-vous dans un agenda partagé du cercle familial", detail: "Notez qui accompagne, où et quand ; ne consignez jamais de résultats médicaux détaillés dans AIME® — seulement les rendez-vous et les suites pratiques.", reason: "Ce qui use les aidants, c'est souvent la coordination plus que les soins eux-mêmes." });
        t.push({ kind: "piece", label: "Coordonnées des professionnels qui interviennent", reason: "Médecin traitant, infirmiers, pharmacie, services à domicile : une liste à jour évite les urgences désorganisées." });
      }
      if (a.domaine === "decisions" || a.domaine === "tout" || a.capacite === "partiel" || a.capacite === "non") {
        t.push({ kind: "action", label: "Point-justice : comprendre les procurations et les mesures de protection", detail: "Procuration bancaire, habilitation familiale, sauvegarde de justice, curatelle, tutelle, mandat de protection future : un juriste gratuit explique les différences et leurs effets.", reason: "Ces mesures encadrent les décisions sans les confisquer ; elles se choisissent informé, jamais dans l'urgence.", organisms: ["point-justice"], officialUrl: "https://www.justice.fr" });
        if (a.capacite === "non") t.push({ kind: "action", label: "Si votre proche ne peut plus décider : faire évaluer la situation avec le médecin et le Point-justice", detail: "Un certificat médical circonstancié est le point de départ des mesures judiciaires ; la famille peut saisir le juge, qui décide.", reason: "Signer à la place d'un proche sans cadre légal expose tout le monde, y compris pour les dépenses courantes.", frameworkFlag: "cadre_a_verifier" });
      }
      if (a.domaine === "presence") {
        t.push({ kind: "action", label: "Publier une demande de visite ou de présence sur la carte AIME®", detail: "Précisez les jours, la durée et ce que votre proche aime (conversation, lecture, promenade) : la régularité compte plus que la durée.", reason: "Une présence régulière vaut mieux qu'une grande visite exceptionnelle." });
        t.push({ kind: "action", label: "Contacter le CCAS : visites de convivialité et registre des personnes fragiles", detail: "Le registre communal permet d'être contacté en cas de canicule ou de crise ; l'inscription est volontaire.", reason: "Dispositifs simples, souvent méconnus, tenus par la commune.", organisms: ["ccas"], officialUrl: "https://lannuaire.service-public.fr" });
      }
      t.push({ kind: "action", label: "Créer un cercle privé familial pour organiser l'aide", detail: "Agenda partagé, nouvelles et répartition des tâches entre proches — sans documents administratifs ni données médicales détaillées.", reason: "Un seul endroit pour coordonner évite les oublis et les doubles emplois." });
      if (a.aidant === "oui" || a.aidant === "partage") {
        t.push({ kind: "action", label: "Vérifier vos droits d'aidant : congé de proche aidant, allocation journalière, répit", detail: "Le portail des aidants et votre caisse (CAF ou MSA) présentent les conditions ; votre employeur peut aussi être concerné par le congé de proche aidant.", reason: "Aider durablement suppose d'être soi-même soutenu ; ces droits existent pour cela.", organisms: ["personnes-agees"], officialUrl: "https://www.pour-les-personnes-agees.gouv.fr", frameworkFlag: "cadre_a_verifier" });
        t.push({ kind: "action", label: "Prévoir votre répit dès maintenant", detail: "Accueil de jour, relais ponctuel, famille ou voisins via la carte AIME® : bloquez des créneaux avant d'être épuisé.", reason: "Le répit se prévoit quand tout va à peu près bien ; en crise, il est introuvable." });
      }
      return t;
    },
  },
  {
    key: "sante",
    label: "Je suis malade ou en arrêt de travail",
    short: "Santé et arrêt de travail",
    description: "Maladie, accident du travail ou hospitalisation : les déclarations à faire, leurs délais et les pièces à réunir, sans décider ni promettre d'indemnisation à votre place.",
    icon: "sante",
    image: "/images/hero-sante.jpg",
    questions: [
      { key: "statut", label: "Quelle est votre situation professionnelle ?", type: "select", required: true, options: [["salarie_agricole", "Salarié·e agricole"], ["exploitant", "Exploitant·e agricole"], ["salarie_general", "Salarié·e hors régime agricole"], ["independant", "Indépendant·e, artisan, commerçant·e"], ["autre", "Autre ou je ne sais pas"]] },
      { key: "cause", label: "Que se passe-t-il ?", type: "select", required: true, options: [["maladie", "Une maladie"], ["accident_travail", "Un accident du travail ou de trajet"], ["maladie_pro", "Une maladie que je relie à mon travail"], ["hospitalisation", "Une hospitalisation"], ["autre", "Autre chose"]] },
      { key: "debut", label: "Date de début de l'arrêt (ou de l'accident)", type: "date", required: true, why: "Les délais de déclaration courent à partir de cette date : c'est elle qui fixe vos échéances." },
      { key: "avis", label: "Avez-vous déjà un avis d'arrêt signé par un médecin ?", type: "select", required: true, options: [["oui", "Oui"], ["non", "Non"], ["en_cours", "C'est en cours"]] },
      { key: "duree", label: "Pensez-vous être arrêté·e plus de 30 jours ?", type: "select", options: [["non", "Non"], ["oui", "Oui"], ["inconnu", "Je ne sais pas encore"]], why: "Un arrêt long change la préparation de la reprise (visite médicale, risque d'inaptitude)." },
    ],
    build: (a) => {
      const agricole = a.statut === "salarie_agricole" || a.statut === "exploitant";
      const caisse = agricole ? "msa" : "assurance-maladie";
      const salarie = a.statut === "salarie_agricole" || a.statut === "salarie_general";
      const due48h = { days: 2, from: "debut", official: true, source: "service-public.fr — transmission de l'avis d'arrêt sous 48 heures" } as const;
      const t: TaskRule[] = [];
      if (a.avis !== "oui") t.push({ kind: "action", label: "Consulter un médecin pour obtenir l'avis d'arrêt de travail", detail: "Chaque prolongation doit être signée avant la fin de l'arrêt en cours.", reason: "Sans avis signé, aucune déclaration n'est possible.", organisms: [caisse] });
      t.push({ kind: "action", label: `Envoyer l'avis d'arrêt à ${agricole ? "la MSA" : "votre caisse d'assurance maladie"} dans les 48 heures`, reason: "Le délai de transmission conditionne la prise en charge de l'arrêt : il court dès la signature de l'avis.", organisms: [caisse], officialUrl: "https://www.service-public.fr", due: due48h });
      if (salarie) t.push({ kind: "action", label: "Transmettre le volet employeur à votre employeur dans les 48 heures", reason: "Votre employeur complète ensuite l'attestation de salaire, indispensable au calcul des indemnités journalières par la caisse.", organisms: [caisse], officialUrl: "https://www.service-public.fr", due: due48h });
      if (a.cause === "accident_travail") {
        t.push({ kind: "action", label: "Vérifier que votre employeur a déclaré l'accident à la caisse sous 48 heures", detail: "C'est à l'employeur de déclarer ; demandez-lui la feuille d'accident du travail, qui évite l'avance de frais pour les soins liés à l'accident.", reason: "Sans déclaration de l'employeur, les soins risquent d'être traités comme une maladie ordinaire.", organisms: [caisse], officialUrl: "https://www.service-public.fr", due: due48h });
        t.push({ kind: "piece", label: "Certificat médical d'accident du travail", reason: "Le médecin le remplit en décrivant les lésions constatées : gardez l'original accessible." });
      }
      if (a.cause === "maladie_pro") {
        t.push({ kind: "action", label: "Déclarer la maladie professionnelle auprès de votre caisse", detail: "La déclaration s'appuie sur un certificat médical initial décrivant la maladie et le travail exercé ; les délais et tableaux de reconnaissance sont vérifiés par la caisse.", reason: "La reconnaissance en maladie professionnelle ouvre des droits spécifiques : c'est la caisse qui instruit, pas AIME®.", organisms: [caisse], officialUrl: "https://www.service-public.fr", frameworkFlag: "cadre_a_verifier" });
        t.push({ kind: "piece", label: "Certificat médical initial (maladie suspectée)", reason: "Il relie la maladie à l'activité exercée : demandez au médecin de le préciser." });
      }
      t.push({ kind: "piece", label: "Avis d'arrêt de travail (tous les volets)", reason: "Le document de départ de toutes les transmissions : photographiez-le avant de l'envoyer." });
      if (salarie) t.push({ kind: "piece", label: "Attestation de salaire complétée par l'employeur", reason: "Elle sert au calcul des indemnités journalières par la caisse ; relancez poliment l'employeur si elle tarde." });
      if (a.duree === "oui" || a.duree === "inconnu") {
        t.push({ kind: "action", label: "Anticiper la reprise : visite de pré-reprise ou de reprise avec la médecine du travail", detail: "Après un arrêt long, une visite de reprise est en principe organisée à l'initiative de l'employeur ; la visite de pré-reprise peut préparer un retour adapté.", reason: "Préparer la reprise tôt évite les reprises impossibles et les arrêts qui se répètent.", organisms: ["france-services"] });
        t.push({ kind: "action", label: "Si la reprise au même poste semble impossible : se renseigner sur l'inaptitude, l'invalidité et la MDPH", detail: "Le médecin du travail statue sur l'aptitude ; la caisse instruit l'invalidité ; la MDPH évalue les compensations du handicap. AIME® oriente, ces organismes décident.", reason: "Mieux vaut ouvrir ces questions pendant l'arrêt qu'au pied du mur.", organisms: [caisse, "mdph"], officialUrl: "https://www.service-public.fr", frameworkFlag: "cadre_a_verifier" });
      }
      t.push({ kind: "action", label: `Suivre vos remboursements et vos droits sur le site de ${agricole ? "la MSA" : "l'Assurance Maladie (ameli)"}`, reason: "Vous y vérifiez ce qui est pris en charge, sans qu'AIME® décide ni ne calcule de montant.", organisms: [caisse], officialUrl: agricole ? "https://www.msa.fr" : "https://www.ameli.fr" });
      return t;
    },
  },
  {
    key: "retraite",
    label: "Je prépare ma retraite",
    short: "Retraite",
    description: "Vérifier sa carrière, estimer sa retraite, demander sa pension au bon moment.",
    icon: "retraite",
    image: "/images/hero-retraite.jpg",
    questions: [
      { key: "regime", label: "Avez-vous travaillé dans l'agriculture ?", type: "select", why: "La retraite de base agricole est gérée par la MSA ; le régime général par l'Assurance retraite.", options: [["non", "Non"], ["oui", "Oui"], ["mixte", "En partie"]] },
      { key: "horizon", label: "Dans combien de temps ?", type: "select", required: true, options: [["plus5", "Plus de 5 ans"], ["moins5", "Moins de 5 ans"], ["moins1", "Moins d'un an"]] },
    ],
    build: (a) => [
      { kind: "action", label: "Vérifier son relevé de carrière sur Info Retraite", reason: "Le service inter-régimes rassemble la carrière de tous vos régimes.", organisms: ["info-retraite"], officialUrl: "https://www.info-retraite.fr" },
      ...(a.regime !== "non" ? [{ kind: "action" as const, label: "Prendre contact avec la MSA pour la partie agricole", reason: "Vous avez indiqué une carrière agricole.", organisms: ["msa"], officialUrl: "https://www.msa.fr" }] : []),
      ...(a.regime !== "oui" ? [{ kind: "action" as const, label: "Consulter l'Assurance retraite", reason: "Régime général des salariés.", organisms: ["assurance-retraite"], officialUrl: "https://www.lassuranceretraite.fr" }] : []),
      { kind: "action", label: "Consulter sa retraite complémentaire Agirc-Arrco", reason: "Concerne les salariés du secteur privé.", organisms: ["agirc-arrco"], officialUrl: "https://www.agirc-arrco.fr" },
      ...(a.horizon === "moins1" ? [{ kind: "action" as const, label: "Faire la demande de retraite en ligne (service inter-régimes)", reason: "Vous partez dans moins d'un an : la demande se fait en ligne, une seule fois pour tous les régimes de base et complémentaires.", organisms: ["info-retraite"], officialUrl: "https://www.info-retraite.fr" }] : []),
    ],
  },
  {
    key: "demenagement",
    label: "Je déménage",
    short: "Déménagement",
    description: "Préparer le nouveau logement, mettre à jour ses coordonnées et trouver de l'aide locale sans refaire les mêmes formalités.",
    icon: "logement",
    image: "/images/hero-logement.jpg",
    questions: [
      { key: "logement", label: "Quelle est votre situation dans le logement que vous quittez ?", type: "select", required: true, options: [["locataire", "Locataire"], ["proprietaire", "Propriétaire"], ["autre", "Autre ou je ne sais pas encore"]] },
      { key: "date", label: "Date envisagée (facultatif)", type: "date", why: "Uniquement pour organiser vos rappels personnels. Ce n'est pas une date transmise aux organismes." },
      { key: "enfants", label: "Des enfants changent-ils d'établissement scolaire ?", type: "select", options: [["oui", "Oui"], ["non", "Non"], ["inconnu", "Je ne sais pas encore"]] },
      { key: "vehicule", label: "Un véhicule est-il immatriculé à votre nom ?", type: "select", options: [["oui", "Oui"], ["non", "Non"], ["inconnu", "Je ne sais pas"]] },
      { key: "regime", label: "Votre protection sociale dépend-elle du régime agricole ?", type: "select", why: "Cette question sert seulement à vous montrer le bon organisme, CAF ou MSA selon votre situation. Votre réponse n'est pas publiée.", options: [["oui", "Oui"], ["non", "Non"], ["inconnu", "Je ne sais pas"]] },
    ],
    build: (a) => [
      { kind: "action", label: "Préparer le départ du logement et les contrats utiles", detail: "Bail, assurance habitation, énergie, eau et internet : notez ce qui vous concerne avant le départ.", reason: "Le service officiel « Je déménage en France » présente ces étapes selon votre situation.", officialUrl: "https://www.service-public.gouv.fr/particuliers/vosdroits/F14128" },
      ...(a.logement === "locataire" ? [{ kind: "action" as const, label: "Vérifier le préavis et organiser l'état des lieux", reason: "Vous avez indiqué quitter un logement en tant que locataire. Les modalités dépendent du bail et de votre situation.", organisms: ["adil"], officialUrl: "https://www.service-public.gouv.fr/particuliers/vosdroits/F14128" }] : []),
      { kind: "action", label: "Utiliser le service officiel de déclaration groupée du changement d'adresse", detail: "Service-Public permet déjà de prévenir certains organismes en une seule opération. AIME® prépare votre liste ; il n'envoie aucune donnée à ce service.", reason: "Cela évite de signaler séparément la même adresse aux organismes couverts par le téléservice.", organisms: ["france-services"], officialUrl: "https://www.service-public.gouv.fr/particuliers/vosdroits/F14128" },
      ...(a.regime === "oui" ? [{ kind: "action" as const, label: "Vérifier la mise à jour de vos coordonnées auprès de la MSA", reason: "Vous avez indiqué dépendre du régime agricole. Vérifiez si la déclaration groupée a bien couvert cet organisme.", organisms: ["msa"], officialUrl: "https://www.msa.fr" }] : a.regime === "non" ? [{ kind: "action" as const, label: "Vérifier la mise à jour de vos coordonnées auprès de la CAF et de l'Assurance Maladie si concerné", reason: "Ces organismes peuvent gérer vos prestations et vos soins ; évitez une double déclaration lorsque le service groupé les a déjà prévenus.", organisms: ["caf", "assurance-maladie"], officialUrl: "https://www.service-public.gouv.fr/particuliers/vosdroits/F14128" }] : []),
      ...(a.vehicule === "oui" ? [{ kind: "action" as const, label: "Vérifier le changement d'adresse de la carte grise", reason: "Vous avez indiqué qu'un véhicule est immatriculé à votre nom. Service-Public précise les modalités selon le véhicule.", organisms: ["france-titres"], officialUrl: "https://www.service-public.gouv.fr/particuliers/vosdroits/F14128" }] : []),
      ...(a.enfants === "oui" ? [{ kind: "action" as const, label: "Préparer le changement d'établissement scolaire ou la continuité de scolarité", reason: "Vous avez indiqué que des enfants pourraient changer d'établissement.", organisms: ["mairie"], officialUrl: "https://www.service-public.gouv.fr/particuliers/vosdroits/F14128" }] : []),
      { kind: "action", label: "Trouver localement du matériel ou un trajet pour le déménagement", reason: "La carte AIME® peut aider à trouver un prêt de matériel, un trajet ou un coup de main. Toute contribution attend l'accord de la personne concernée." },
      { kind: "piece", label: "Liste personnelle des contrats et comptes à mettre à jour", reason: "Vous conservez la maîtrise de vos informations. N'ajoutez ni numéro de sécurité sociale ni document médical." },
    ],
  },
  {
    key: "deces_proche",
    label: "Un proche est décédé",
    short: "Après un décès",
    description: "Trouver les premiers interlocuteurs, organiser les démarches et demander de l'aide, à votre rythme.",
    icon: "heart",
    image: "/images/hero-retraite.jpg",
    questions: [
      { key: "lieu", label: "Où cela s'est-il passé ?", type: "select", required: true, why: "À l'hôpital ou en Ehpad, l'établissement effectue en général la déclaration à la mairie. À domicile, un professionnel de santé constate le décès. Aucun détail médical n'est demandé ici.", options: [["etablissement", "À l'hôpital ou en Ehpad"], ["domicile", "À domicile"], ["etranger", "À l'étranger"], ["inconnu", "Je ne sais pas / je préfère ne pas préciser"]] },
      { key: "lien", label: "Quel était votre lien avec cette personne ? (facultatif)", type: "select", why: "Cela aide seulement à afficher des interlocuteurs possibles. AIME® ne vous demande ni son identité ni ses données médicales.", options: [["conjoint", "Conjoint ou partenaire"], ["parent", "Parent"], ["autre", "Autre"], ["inconnu", "Je préfère ne pas répondre"]] },
      { key: "logement", label: "Un logement est-il à organiser ? (facultatif)", type: "select", options: [["oui", "Oui"], ["non", "Non"], ["inconnu", "Je ne sais pas"]] },
    ],
    build: (a) => [
      { kind: "action", label: a.lieu === "etablissement" ? "Vérifier que l'établissement a pris en charge la déclaration en mairie" : a.lieu === "etranger" ? "Contacter l'autorité locale et le consulat ou l'ambassade de France" : "Faire constater le décès et se renseigner sur la déclaration en mairie", detail: "La situation varie selon le lieu. AIME® ne réalise aucune déclaration de décès.", reason: "Service-Public distingue les démarches selon que le décès a lieu en établissement, à domicile ou à l'étranger.", organisms: ["mairie"], officialUrl: "https://www.service-public.gouv.fr/particuliers/vosdroits/F16507" },
      { kind: "action", label: "Obtenir des copies de l'acte de décès auprès de la mairie compétente", reason: "L'acte est établi par la mairie après la déclaration et peut être demandé pour les démarches suivantes.", organisms: ["mairie"], officialUrl: "https://www.service-public.gouv.fr/particuliers/vosdroits/F16507" },
      { kind: "action", label: "Prévenir les organismes concernés, un par un selon la situation", detail: "Il n'existe pas de téléservice unique qui prévient toutes les administrations d'un décès. Vérifiez notamment la banque, les caisses de retraite, la CAF ou la MSA, l'Assurance Maladie et, le cas échéant, l'employeur.", reason: "Le guide officiel « Un proche est décédé » indique qui contacter selon la situation, sans supposer que chaque organisme est concerné.", organisms: ["assurance-maladie", "caf", "msa", "info-retraite"], officialUrl: "https://www.service-public.gouv.fr/particuliers/vosdroits/F16507" },
      ...(a.logement === "oui" ? [{ kind: "action" as const, label: "Se renseigner sur la gestion du logement", reason: "Vous avez indiqué qu'un logement pourrait être concerné. Le bail, l'assurance et les droits des proches dépendent de la situation.", organisms: ["adil"], officialUrl: "https://www.service-public.gouv.fr/particuliers/vosdroits/F16507" }] : []),
      { kind: "action", label: "Demander une aide humaine si nécessaire", detail: "Un espace France services ou un point d'information local peut vous aider à identifier les démarches. Prenez le temps nécessaire.", reason: "Ces démarches sont nombreuses et votre situation peut nécessiter un accompagnement personnalisé.", organisms: ["france-services"], officialUrl: "https://www.france-services.gouv.fr" },
      { kind: "piece", label: "Liste des pièces à demander à la mairie ou à l'établissement", detail: "Consultez le guide officiel pour savoir qui doit fournir l'acte et quelles pièces sont nécessaires. Ne téléversez ici ni données médicales ni numéro de sécurité sociale.", reason: "Cette liste est une aide à la préparation, pas une collecte de pièces sensibles.", officialUrl: "https://www.service-public.gouv.fr/particuliers/vosdroits/F16507" },
    ],
  },
];

export const SITUATION_BY_KEY = new Map(SITUATIONS.map((s) => [s.key, s]));

export const TASK_STATUS_LABEL: Record<string, string> = {
  a_preparer: "À préparer",
  pret: "Prêt",
  effectue_declare: "Effectué selon vous",
  attente_reponse: "En attente de réponse",
  a_completer: "À compléter",
  termine: "Terminé",
};

export const ENGAGEMENT_STATUS_LABEL: Record<string, string> = {
  demande_envoyee: "Demande envoyée",
  proposition_recue: "Proposition reçue",
  devis_accepte: "Devis accepté — participation confirmée",
  contrat_signe_declare: "Contrat signé (déclaré par l'organisateur)",
  embauche_declaree: "Embauche déclarée (selon l'organisateur, non vérifiée)",
  refusee: "Refusée",
  annulee: "Annulée",
};

export const FRAMEWORK_LABEL: Record<string, string> = {
  salarie: "Engagement salarié (contrat de travail)",
  facture: "Facture (l'artiste indique pouvoir facturer)",
  association: "Via une association ou structure",
  inconnu: "Je ne sais pas",
};

/** Organismes de référence : rôles rédigés de façon générale ; contenu à confirmer par l'équipe. */
export const ORGANISMS_SEED: Array<{ slug: string; name: string; category: string; role: string; audience: string; url: string; contentSource?: string }> = [
  { slug: "assurance-maladie", name: "Assurance Maladie (CPAM)", category: "sante", role: "Remboursement des soins, arrêts de travail, maternité et paternité pour le régime général.", audience: "Assurés du régime général", url: "https://www.ameli.fr" },
  { slug: "msa", name: "MSA — Mutualité sociale agricole", category: "sante", role: "Protection sociale (santé, famille, retraite, cotisations) des personnes relevant du régime agricole.", audience: "Exploitants, salariés agricoles et leurs familles", url: "https://www.msa.fr" },
  { slug: "caf", name: "CAF — Caisses d'allocations familiales", category: "famille", role: "Prestations familiales, aides au logement et solidarité.", audience: "Familles et allocataires hors régime agricole", url: "https://www.caf.fr" },
  { slug: "mairie", name: "Mairie", category: "administratif", role: "État civil, événements publics, autorisations locales.", audience: "Habitants de la commune", url: "https://lannuaire.service-public.fr" },
  { slug: "ccas", name: "CCAS — Centre communal d'action sociale", category: "logement", role: "Aide sociale de proximité, orientation et solutions d'urgence.", audience: "Habitants de la commune", url: "https://lannuaire.service-public.fr" },
  { slug: "france-travail", name: "France Travail", category: "emploi", role: "Accompagnement vers l'emploi et indemnisation chômage.", audience: "Demandeurs d'emploi", url: "https://www.francetravail.fr" },
  { slug: "mission-locale", name: "Missions locales", category: "emploi", role: "Accompagnement des jeunes vers l'emploi, la formation et l'autonomie.", audience: "Jeunes de 16 à 25 ans", url: "https://www.unml.info" },
  { slug: "cap-emploi", name: "Cap emploi", category: "emploi", role: "Accompagnement vers l'emploi des personnes en situation de handicap.", audience: "Personnes en situation de handicap", url: "https://www.cheops-ops.org" },
  { slug: "urssaf", name: "Urssaf", category: "activite", role: "Recouvrement des cotisations sociales, dont celles des travailleurs indépendants.", audience: "Indépendants, employeurs", url: "https://www.urssaf.fr" },
  { slug: "guichet-unique", name: "Guichet unique des formalités d'entreprise", category: "activite", role: "Point d'entrée en ligne pour créer, modifier ou cesser une entreprise.", audience: "Créateurs et chefs d'entreprise", url: "https://formalites.entreprises.gouv.fr" },
  { slug: "france-travail-spectacle", name: "France Travail Spectacle", category: "spectacle", role: "Services de France Travail dédiés aux artistes et techniciens du spectacle.", audience: "Artistes et techniciens du spectacle", url: "https://www.francetravail.fr" },
  { slug: "guso", name: "Guso — Guichet unique du spectacle occasionnel", category: "spectacle", role: "Service obligatoire et gratuit pour les employeurs dont le spectacle n'est pas l'activité principale qui embauchent des artistes ou techniciens pour du spectacle vivant : déclarations, contrat, cotisations.", audience: "Particuliers, associations, collectivités, entreprises hors spectacle", url: "https://www.guso.fr", contentSource: "https://culturegrandest.fr/les-essentiels/guide-de-la-securite/les-obligations-des-organisateurs-et-exploitants/la-licence-dentrepreneur-de-spectacles-et-le-guso" },
  { slug: "audiens", name: "Audiens", category: "spectacle", role: "Protection sociale (retraite complémentaire, prévoyance, santé) des professionnels de la culture.", audience: "Professionnels de la culture et des médias", url: "https://www.audiens.org" },
  { slug: "conges-spectacles", name: "Congés Spectacles", category: "spectacle", role: "Gestion des congés payés des artistes et techniciens intermittents.", audience: "Intermittents du spectacle et employeurs", url: "https://www.conges-spectacles.com" },
  { slug: "afdas", name: "Afdas", category: "spectacle", role: "Opérateur de compétences : formation des professionnels de la culture.", audience: "Salariés et intermittents de la culture", url: "https://www.afdas.com" },
  { slug: "thalie-sante", name: "Thalie Santé", category: "spectacle", role: "Santé au travail des intermittents du spectacle.", audience: "Intermittents du spectacle", url: "https://www.thalie-sante.org" },
  { slug: "sacem", name: "Sacem", category: "spectacle", role: "Gestion des droits d'auteur pour la musique diffusée en public.", audience: "Organisateurs d'événements musicaux", url: "https://www.sacem.fr" },
  { slug: "assurance-retraite", name: "Assurance retraite (Carsat)", category: "retraite", role: "Retraite de base des salariés du régime général.", audience: "Salariés du régime général", url: "https://www.lassuranceretraite.fr" },
  { slug: "agirc-arrco", name: "Agirc-Arrco", category: "retraite", role: "Retraite complémentaire des salariés du secteur privé.", audience: "Salariés du secteur privé", url: "https://www.agirc-arrco.fr" },
  { slug: "info-retraite", name: "Info Retraite", category: "retraite", role: "Service inter-régimes : relevé de carrière et demande de retraite en ligne.", audience: "Tous les actifs et futurs retraités", url: "https://www.info-retraite.fr" },
  { slug: "action-logement", name: "Action Logement", category: "logement", role: "Aides au logement des salariés du secteur privé.", audience: "Salariés du secteur privé", url: "https://www.actionlogement.fr" },
  { slug: "adil", name: "ADIL — Agence départementale d'information sur le logement", category: "logement", role: "Conseil juridique, financier et fiscal gratuit sur le logement.", audience: "Locataires, propriétaires, accédants", url: "https://www.anil.org" },
  { slug: "mdph", name: "MDPH — Maison départementale des personnes handicapées", category: "autonomie", role: "Information, évaluation et demandes de droits liés au handicap.", audience: "Personnes en situation de handicap et leurs proches", url: "https://www.monparcourshandicap.gouv.fr" },
  { slug: "personnes-agees", name: "Portail national pour les personnes âgées et leurs aidants", category: "autonomie", role: "Information sur l'autonomie, les aides et le soutien aux aidants.", audience: "Personnes âgées et aidants", url: "https://www.pour-les-personnes-agees.gouv.fr" },
  { slug: "mon-compte-formation", name: "Mon Compte Formation", category: "formation", role: "Consultation et utilisation des droits à la formation.", audience: "Actifs", url: "https://www.moncompteformation.gouv.fr" },
  { slug: "crous", name: "Crous (services étudiants)", category: "formation", role: "Bourses, logement et vie étudiante.", audience: "Étudiants", url: "https://www.etudiant.gouv.fr" },
  { slug: "impots", name: "Impôts (DGFiP)", category: "administratif", role: "Impôt sur le revenu, taxes, changement de situation.", audience: "Contribuables", url: "https://www.impots.gouv.fr" },
  { slug: "france-titres", name: "France Titres (ANTS)", category: "administratif", role: "Carte d'identité, passeport, permis de conduire, carte grise.", audience: "Tous", url: "https://ants.gouv.fr" },
  { slug: "point-justice", name: "Point-justice", category: "administratif", role: "Information juridique gratuite et orientation.", audience: "Tous", url: "https://www.justice.fr" },
  { slug: "france-services", name: "France services", category: "administratif", role: "Accompagnement gratuit et humain pour les démarches de plusieurs organismes, près de chez vous.", audience: "Tous", url: "https://www.france-services.gouv.fr" },
  { slug: "mes-droits-sociaux", name: "Mes droits sociaux", category: "administratif", role: "Simulateur public pour estimer ses droits aux aides sociales.", audience: "Tous", url: "https://www.mesdroitssociaux.gouv.fr" },
];

export const ORGANISM_CATEGORY_LABEL: Record<string, string> = {
  sante: "Santé et protection",
  famille: "Famille et aides",
  emploi: "Emploi et insertion",
  activite: "Activité indépendante",
  spectacle: "Spectacle et culture",
  retraite: "Retraite",
  logement: "Logement et solidarité",
  autonomie: "Handicap et autonomie",
  formation: "Formation et jeunesse",
  administratif: "Vie administrative et accès au droit",
};
