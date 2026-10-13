import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { seedDatabase } from "./seed-data";

// Réinitialise entièrement les données de démonstration : `npm run db:seed`
// ⚠️ Crée des comptes de démonstration à mot de passe connu (dont un administrateur)
// et EFFACE les données existantes : interdit en production sans déverrouillage explicite.
async function main() {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEMO_SEED !== "1") {
    console.error(
      "Refusé : ce script de démonstration est interdit en production (NODE_ENV=production).\n" +
        "Il efface les données et crée des comptes à mot de passe connu.\n" +
        "Pour un environnement de démonstration assumé uniquement : ALLOW_DEMO_SEED=1"
    );
    process.exit(1);
  }
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL est requis (voir .env.example).");
    process.exit(1);
  }
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  await seedDatabase(drizzle(pool));
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
