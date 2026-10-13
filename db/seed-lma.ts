import bcrypt from "bcryptjs";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { and, eq, inArray, isNull } from "drizzle-orm";
import {
  artistProfiles, circleMembers, circlePosts, circles, communityListings, communityRequests, projectMembers, projectNeeds, projects, users,
} from "./schema";
import { defaultUniverses } from "../lib/lma";

const DAY = 86_400_000;

/** Met à niveau les anciennes annonces (univers et type de publication) sans rien supprimer. */
async function normalizeLegacyListings(db: NodePgDatabase) {
  const rows = await db.select({ id: communityListings.id, category: communityListings.category, action: communityListings.action, universes: communityListings.universes })
    .from(communityListings);
  for (const row of rows) {
    if (row.universes.length === 0) {
      await db.update(communityListings).set({ universes: defaultUniverses(row.category), publicationType: row.action === "cherche" ? "besoin" : "proposition" }).where(eq(communityListings.id, row.id));
    }
  }
}

/** Ajoute les profils, annonces, projet et cercle de démonstration (tous marqués fictifs). */
export async function seedLmaDemoIfEmpty(db: NodePgDatabase) {
  await normalizeLegacyListings(db);
  const [already] = await db.select({ id: users.id }).from(users).where(eq(users.email, "tom.leroy@exemple.fr")).limit(1);
  if (already) return false;

  const members = await db.select({ id: users.id, email: users.email }).from(users).where(eq(users.role, "membre"));
  const byEmail = (email: string) => members.find((m) => m.email === email)?.id;
  const jean = byEmail("jean.dupont@exemple.fr");
  const marie = byEmail("marie.lefevre@exemple.fr");
  const paul = byEmail("paul.martin@exemple.fr");
  const lucas = byEmail("lucas.moreau@exemple.fr");
  const amelie = byEmail("amelie.roux@exemple.fr");
  if (!jean || !marie || !paul) { console.warn("[demo] Comptes membres de base absents : démonstration Le Monde Aime ignorée."); return false; }

  const pw = await bcrypt.hash("Demo1234!", 10);
  const base = { passwordHash: pw, role: "membre" as const, onboardingCompleted: true, isDemo: true, profileVisible: true, birthDate: "1985-05-14" };
  const [tom, odette, veillees] = await db.insert(users).values([
    { ...base, email: "tom.leroy@exemple.fr", fullName: "Tom Leroy", displayName: "Tom, musicien", bio: "Guitariste et accordéoniste, j'anime bals, veillées et fêtes de village. Fiche fictive de démonstration.", activities: ["Musicien", "Technicien son", "Parent"], universes: ["arts"], offersText: "Concerts acoustiques, sonorisation légère", needsText: "Un lieu pour répéter", transmitText: "L'accordéon", profileCity: "Chartres", profileLat: "48.44", profileLng: "1.52", travelRadiusKm: 60, availabilityNote: "Week-ends et soirées d'été" } as never,
    { ...base, email: "odette.lambert@exemple.fr", fullName: "Odette Lambert", displayName: "Odette", bio: "Couturière à la retraite, j'aime transmettre les gestes simples pour réparer et créer. Fiche fictive de démonstration.", activities: ["Couturière", "Grand-mère", "Bénévole"], universes: ["savoirs"], offersText: "Ateliers couture, retouches", transmitText: "La couture et la réparation de vêtements", profileCity: "Chartres", profileLat: "48.47", profileLng: "1.46", travelRadiusKm: 20, availabilityNote: "Mercredis après-midi" } as never,
    { ...base, email: "veillees@exemple.fr", fullName: "Association Les Veillées de Beauce", displayName: "Association Les Veillées de Beauce", bio: "Association locale fictive : veillées, contes et ateliers entre générations.", activities: ["Association", "Animation culturelle"], universes: ["arts", "savoirs"], offersText: "Salle pour répéter, ateliers intergénérationnels", needsText: "Bénévoles pour l'été", transmitText: "Contes et recettes de la Beauce", profileCity: "Chartres", profileLat: "48.41", profileLng: "1.55", travelRadiusKm: 30, availabilityNote: "Week-ends" } as never,
  ]).returning({ id: users.id });

  // Profils des comptes de démonstration existants (uniquement s'ils n'ont pas encore de nom d'affichage).
  const enrich = async (id: number | undefined, set: Partial<typeof users.$inferInsert>) => {
    if (!id) return;
    await db.update(users).set({ isDemo: true, ...set }).where(and(eq(users.id, id), isNull(users.displayName)));
  };
  await enrich(jean, { displayName: "Ferme des Blés — Jean", bio: "Agriculteur en Beauce : farine à la meule, accueil à la ferme et fête d'été. Fiche fictive.", activities: ["Agriculteur", "Parent", "Bénévole"], universes: ["terre", "savoirs"], offersText: "Farine, huile de colza, accueil à la ferme", needsText: "Une sono pour la fête", transmitText: "Le travail du blé", profileVisible: true, profileCity: "Chartres", profileLat: "48.45", profileLng: "1.50", travelRadiusKm: 30, availabilityNote: "Soirées et week-ends" });
  await enrich(marie, { displayName: "Ferme des Herbages — Marie", bio: "Exploitante en Bretagne : légumes, œufs et pain au levain. Fiche fictive.", activities: ["Exploitante", "Boulangère"], universes: ["terre"], offersText: "Légumes, œufs, pain", profileVisible: true, profileCity: "Saint-Brieuc", profileLat: "48.51", profileLng: "-2.76", travelRadiusKm: 30 });
  await enrich(paul, { displayName: "Paul", bio: "Retraité jardinier et conteur. Fiche fictive.", activities: ["Retraité", "Jardinier", "Conteur"], universes: ["savoirs", "terre"], transmitText: "Le greffage des arbres fruitiers et les contes", profileVisible: true, profileCity: "Chartres", profileLat: "48.46", profileLng: "1.47", travelRadiusKm: 15 });
  await enrich(lucas, { displayName: "Lucas", bio: "Profil volontairement non affiché sur la carte (exemple de discrétion).", activities: ["Étudiant", "Coup de main à vélo"], profileVisible: false });
  await enrich(amelie, { displayName: "Amélie — maraîchage", bio: "Maraîchère près de Nantes. Fiche fictive.", activities: ["Maraîchère"], universes: ["terre"], offersText: "Paniers de légumes, miel", profileVisible: true, profileCity: "Nantes", profileLat: "47.24", profileLng: "-1.53" });

  await db.insert(artistProfiles).values({
    userId: tom.id, disciplines: ["Musique", "Son et lumière"],
    presentation: "Duo acoustique guitare et accordéon : répertoire populaire, bals et veillées. (Fiche fictive de démonstration)",
    zoneNote: "Eure-et-Loir et départements voisins", availabilityNote: "Week-ends et soirées d'été, réservation un mois à l'avance",
    techSheet: "Durée : 2 × 45 minutes.\nBesoins : 2 prises électriques, 3 m × 2 m d'espace couvert.\nSon : sonorisation légère fournie jusqu'à 80 personnes ; au-delà, prévoir une sono complémentaire.\nInstallation : 1 heure.",
  });

  const soon = new Date(Date.now() + 3 * DAY);
  const until = new Date(Date.now() + 45 * DAY);
  const mk = (ownerId: number, v: Partial<typeof communityListings.$inferInsert> & { title: string; description: string; category: typeof communityListings.$inferInsert["category"]; action: typeof communityListings.$inferInsert["action"]; city: string; lat: string; lng: string }) =>
    ({ condition: "sans_objet", quantity: 1, unit: "pièce", attributes: {}, pickupDetails: "À convenir après accord", isDemo: true, ownerId, ...v }) as typeof communityListings.$inferInsert;
  const [lConcert, lCouture, lAtelier] = await db.insert(communityListings).values([
    mk(tom.id, { action: "prestation", category: "arts_rencontres", title: "Exemple · Concert acoustique pour fête ou veillée", description: "Duo guitare et accordéon, 2 × 45 minutes, sonorisation légère comprise. Tarif défini sur devis selon le lieu et la durée.", priceMode: "devis", universes: ["arts"], unit: "prestation", city: "Chartres", lat: "48.44", lng: "1.52", availableFrom: soon, availableUntil: until }),
    mk(odette.id, { action: "transmission", category: "savoirs_transmission", title: "Exemple · Atelier couture : réparer et retoucher ses vêtements", description: "Séance conviviale pour apprendre les gestes de base. Matériel fourni, tous âges accompagnés d'un adulte.", priceMode: "gratuit", universes: ["savoirs"], quantity: 6, unit: "place", city: "Chartres", lat: "48.47", lng: "1.46", availableFrom: soon, availableUntil: until }),
    mk(veillees.id, { action: "transmission", category: "savoirs_transmission", title: "Exemple · Atelier intergénérationnel : contes et recettes de la Beauce", description: "Un après-midi pour partager récits, recettes et chansons entre générations. Les enfants viennent accompagnés de leurs responsables.", priceMode: "gratuit", universes: ["savoirs", "arts"], quantity: 12, unit: "place", city: "Chartres", lat: "48.41", lng: "1.55", availableFrom: soon, availableUntil: until }),
  ]).returning();
  await db.insert(communityListings).values([
    mk(veillees.id, { action: "pret", category: "lieux_espaces", title: "Exemple · Salle des fêtes prêtée pour répéter", description: "Salle de 60 m² disponible en semaine pour les groupes de musique ou de théâtre. Prêt gratuit, remise en état à la fin.", priceMode: "gratuit", universes: ["arts"], city: "Chartres", lat: "48.41", lng: "1.55", availableFrom: soon, availableUntil: until }),
    mk(jean, { action: "vends", category: "produits_locaux", title: "Exemple · Farine paysanne T65 (sachet 2 kg)", description: "Blé de la ferme moulu à la meule de pierre. Retrait à la ferme.", condition: "neuf", priceMode: "prix", price: "4.80", quantity: 25, unit: "sachet", universes: ["terre"], city: "Chartres", lat: "48.45", lng: "1.50" }),
    mk(jean, { action: "cherche", category: "evenementiel", title: "Exemple · Je cherche une sono pour la fête d'été à la ferme", description: "Enceinte et micro pour environ 80 personnes, un samedi de l'été. Sans budget fixé : à discuter.", publicationType: "besoin", priceMode: "prix", universes: ["arts", "terre"], city: "Chartres", lat: "48.45", lng: "1.50" }),
    mk(tom.id, { action: "cherche", category: "lieux_espaces", title: "Exemple · Nous cherchons un lieu pour répéter", description: "Petit groupe de musique, répétitions le soir, environ 10 personnes.", publicationType: "besoin", priceMode: "prix", universes: ["arts"], city: "Chartres", lat: "48.44", lng: "1.52" }),
  ]);

  // ---- Projet partagé : fête d'été à la ferme
  const [project] = await db.insert(projects).values({
    ownerId: jean, title: "Exemple · Fête d'été à la ferme des Blés",
    intention: "Réunir producteurs, musiciens, associations et voisins autour d'une journée à la ferme : repas, concert, atelier entre générations. Projet fictif de démonstration.",
    city: "Chartres", lat: "48.45", lng: "1.50", startsAt: new Date(Date.now() + 20 * DAY), endsAt: new Date(Date.now() + 20 * DAY + 9 * 3_600_000),
    universes: ["terre", "arts", "savoirs"], isDemo: true,
    program: [{ time: "11 h", label: "Accueil et visite de la ferme" }, { time: "13 h", label: "Repas partagé avec les produits locaux" }, { time: "15 h", label: "Atelier couture et contes entre générations" }, { time: "18 h", label: "Concert dans la grange" }],
  }).returning();
  await db.insert(projectMembers).values([
    { projectId: project.id, userId: jean, role: "organisateur", status: "accepte" },
    { projectId: project.id, userId: tom.id, role: "participant", status: "accepte" },
    { projectId: project.id, userId: odette.id, role: "participant", status: "accepte" },
    { projectId: project.id, userId: veillees.id, role: "participant", status: "demande" },
  ]);
  const [needTables, needMusic, needAtelier] = await db.insert(projectNeeds).values([
    { projectId: project.id, text: "tables pliantes", quantity: 3, category: "evenementiel" },
    { projectId: project.id, text: "musicien pour le concert", quantity: 1, category: "arts_rencontres" },
    { projectId: project.id, text: "atelier couture", quantity: 1, category: "savoirs_transmission" },
    { projectId: project.id, text: "pain et légumes pour le repas", quantity: 20, category: "produits_locaux" },
    { projectId: project.id, text: "sono", quantity: 1, category: "evenementiel" },
  ]).returning();

  const [tablesListing] = await db.select().from(communityListings).where(and(eq(communityListings.ownerId, marie), eq(communityListings.action, "loue"))).limit(1);
  const start = new Date(Date.now() + 20 * DAY);
  const end = new Date(Date.now() + 20 * DAY + 9 * 3_600_000);
  const reqs: Array<{ need: number; listing: number; qty: number; status: "demandee" | "reservee"; message: string; period?: boolean }> = [
    { need: needMusic.id, listing: lConcert.id, qty: 1, status: "reservee", message: "Exemple fictif : concert de la fête d'été, confirmé par Tom." },
    { need: needAtelier.id, listing: lCouture.id, qty: 1, status: "demandee", message: "Exemple fictif : pourriez-vous animer l'atelier couture ?" },
  ];
  if (tablesListing) reqs.unshift({ need: needTables.id, listing: tablesListing.id, qty: 3, status: "demandee", message: "Exemple fictif : 3 tables pour le repas partagé.", period: true });
  let n = 1;
  for (const r of reqs) {
    const [created] = await db.insert(communityRequests).values({
      reference: `LMA-DEMO-P${Date.now().toString().slice(-6)}${n++}`, listingId: r.listing, requesterId: jean, quantity: r.qty, message: r.message,
      startsAt: r.period ? start : null, endsAt: r.period ? end : null, projectId: project.id, projectNeedId: r.need, status: r.status,
      ownerConfirmedAt: r.status === "reservee" ? new Date() : null,
    }).returning({ id: communityRequests.id });
    await db.update(projectNeeds).set({ requestId: created.id }).where(eq(projectNeeds.id, r.need));
  }
  void lAtelier;

  // ---- Cercle privé familial
  const [circle] = await db.insert(circles).values({ ownerId: jean, name: "Exemple · Famille Dupont — recettes et souvenirs", kind: "famille", description: "Cercle privé fictif : recettes, photos et récits de famille.", isDemo: true }).returning();
  await db.insert(circleMembers).values([
    { circleId: circle.id, userId: jean, role: "responsable", status: "accepte" },
    { circleId: circle.id, userId: paul, role: "membre", status: "accepte" },
    { circleId: circle.id, userId: marie, role: "membre", status: "invite" },
  ]);
  await db.insert(circlePosts).values([
    { circleId: circle.id, authorId: jean, kind: "recette", title: "La tarte aux pommes de grand-mère", body: "Recette familiale fictive : pâte sablée, pommes de la ferme, un soupçon de cannelle. (Reste privée au cercle.)", visibility: "prive", isDemo: true },
    { circleId: circle.id, authorId: jean, kind: "photo", title: "Album privé du mariage", body: "Contenu privé fictif : jamais visible sur la carte ni dans la recherche.", visibility: "prive", isDemo: true },
    { circleId: circle.id, authorId: paul, kind: "recit", title: "Souvenir d'une moisson d'autrefois", body: "Récit fictif publié par son auteur : « On finissait la journée sous le noyer, avec le pain encore chaud et les histoires du village. »", visibility: "publie", isDemo: true },
  ]);

  void inArray;
  return true;
}
