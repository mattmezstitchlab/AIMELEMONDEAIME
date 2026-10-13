import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { seedDatabase } from "./seed-data";

// Réinitialise entièrement les données de démonstration : `npx tsx src/db/seed.ts`
async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  await seedDatabase(drizzle(pool));
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
