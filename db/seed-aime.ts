import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { and, eq, like, sql } from "drizzle-orm";
import { artistEngagements, journeyEvents, journeyTasks, journeys, organisms, projects, users } from "./schema";
import { ORGANISMS_SEED, RULES_VERSION, SITUATION_BY_KEY } from "../lib/situations";

/** Contrôle des liens effectué le 2026-10-11 (réponse HTTP 200). 403/000 = non joignable depuis l'environnement : à vérifier. */
const LINK_OK = new Set(["msa", "caf", "mairie", "ccas", "france-travail", "mission-locale", "cap-emploi", "guichet-unique", "france-travail-spectacle", "guso", "audiens", "afdas", "thalie-sante", "assurance-retraite", "agirc-arrco", "info-retraite", "action-logement", "adil", "mdph", "personnes-agees", "mon-compte-formation", "crous", "impots", "france-titres", "point-justice", "france-services", "mes-droits-sociaux"]);
const CHECKED_AT = new Date("2026-10-11T12:00:00Z");

/** Migrations de marque non destructives (aucune ligne supprimée). */
async function rebrandData(db: NodePgDatabase) {
  await db.execute(sql`update users set email = replace(email, '@msa-demo.fr', '@aime-demo.fr') where email like '%@msa-demo.fr'`);
  await db.execute(sql`update cases set reference = replace(reference, 'MSA-', 'DOS-') where reference like 'MSA-%'`);
  await db.execute(sql`update messages set body = replace(replace(replace(body, 'bureau MSA', 'équipe d''accompagnement'), 'caisse MSA', 'équipe d''accompagnement'), 'MSA-20', 'DOS-20'), subject = replace(coalesce(subject,''), 'bureau MSA', 'équipe d''accompagnement')`);
  await db.execute(sql`update case_events set message = replace(replace(replace(message, 'bureau MSA', 'équipe d''accompagnement'), 'caisse MSA', 'équipe d''accompagnement'), 'MSA-20', 'DOS-20')`);
  await db.execute(sql`update notifications set title = replace(replace(title, 'bureau MSA', 'équipe d''accompagnement'), 'caisse MSA', 'équipe d''accompagnement'), body = replace(replace(replace(body, 'bureau MSA', 'équipe d''accompagnement'), 'caisse MSA', 'équipe d''accompagnement'), 'MSA-20', 'DOS-20')`);
}

export async function seedAimeIfEmpty(db: NodePgDatabase) {
  await rebrandData(db);
  const [any] = await db.select({ id: organisms.id }).from(organisms).limit(1);
  if (!any) {
    await db.insert(organisms).values(ORGANISMS_SEED.map((o) => ({
      slug: o.slug, name: o.name, category: o.category, role: o.role, audience: o.audience, url: o.url,
      source: o.contentSource ?? o.url,
      linkStatus: LINK_OK.has(o.slug) ? "verifie" : "a_verifier",
      contentStatus: o.contentSource ? "verifie" : "a_verifier",
      verifiedAt: LINK_OK.has(o.slug) ? CHECKED_AT : null,
    })));
  }
  const [demo] = await db.select({ id: journeys.id }).from(journeys).where(eq(journeys.isDemo, true)).limit(1);
  if (demo) return false;
  const jean = (await db.select({ id: users.id }).from(users).where(eq(users.email, "jean.dupont@exemple.fr")).limit(1))[0]?.id;
  const tom = (await db.select({ id: users.id }).from(users).where(eq(users.email, "tom.leroy@exemple.fr")).limit(1))[0]?.id;
  const [project] = await db.select().from(projects).where(and(like(projects.title, "Exemple · Fête d'été%"))).limit(1);
  if (!jean || !project) return false;
  const answers = { event_type: "village", organizer_nature: "entreprise", date: project.startsAt.toISOString().slice(0, 10), horaires: "11 h – 23 h", lieu: project.city, acces: "public", public: "80", buvette: "oui", discipline: "Musique", budget: "600", technique: "Grange couverte, 2 prises" };
  const def = SITUATION_BY_KEY.get("evenement")!;
  const rules = def.build(answers);
  const [j] = await db.insert(journeys).values({
    userId: jean, situation: "evenement", title: `Événement à ${project.city} (exemple fictif)`, answers, status: "en_cours", projectId: project.id, rulesVersion: RULES_VERSION, isDemo: true,
    summary: "Exemple fictif : fête d'été à la ferme, ouverte au public, environ 80 personnes, buvette, recherche d'un musicien.",
  }).returning({ id: journeys.id });
  await db.insert(journeyTasks).values(rules.map((r, i) => ({ journeyId: j.id, kind: r.kind, label: r.label, detail: r.detail ?? "", reason: r.reason, organismSlugs: r.organisms ?? [], officialUrl: r.officialUrl ?? null, frameworkFlag: r.frameworkFlag ?? null, sortOrder: i, status: i === 0 ? ("pret" as const) : ("a_preparer" as const) })));
  await db.insert(journeyEvents).values([{ journeyId: j.id, actorId: jean, message: "Démarche commencée (exemple fictif)." }, { journeyId: j.id, actorId: jean, message: `Plan préparé avec les règles ${RULES_VERSION}. Projet relié.` }]);
  if (tom) await db.insert(artistEngagements).values({ journeyId: j.id, projectId: project.id, organizerId: jean, artistId: tom, eventDate: project.startsAt, requestMessage: "Exemple fictif : concert acoustique en fin de journée, dans la grange.", isDemo: true });
  return true;
}
