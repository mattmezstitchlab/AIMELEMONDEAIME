import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL?.trim();

/**
 * Le build Next.js de Vercel doit pouvoir compiler le site sans se connecter à
 * PostgreSQL. La base reste requise pour les fonctionnalités dynamiques, mais
 * son absence ne doit pas faire échouer l'import de toutes les routes.
 */
export const isDatabaseConfigured = Boolean(databaseUrl);

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

export const pool: Pool | null = databaseUrl
  ? globalForDb.__arenaNextJsPostgresqlPool ?? new Pool({ connectionString: databaseUrl })
  : null;

if (pool && process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

const missingDatabaseClient = {
  query() {
    throw new Error("DATABASE_URL is required to use database-backed features.");
  },
  connect() {
    throw new Error("DATABASE_URL is required to use database-backed features.");
  },
} as unknown as Pool;

// Drizzle ne contacte PostgreSQL qu'à l'exécution d'une requête. Le client de
// repli produit une erreur explicite au runtime au lieu de casser le build.
export const db = drizzle(pool ?? missingDatabaseClient);
