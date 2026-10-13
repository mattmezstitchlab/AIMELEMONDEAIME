import { defineConfig } from "drizzle-kit";

// URL surchargeable par variable d'environnement (voir .env.example) ;
// la valeur par défaut ne vise qu'un PostgreSQL local de développement.
export default defineConfig({
  dialect: "postgresql",
  schema: "./db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:5432/app_db",
  },
});
