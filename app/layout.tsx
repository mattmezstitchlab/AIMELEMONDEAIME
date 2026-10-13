import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth";
import { AssistantWidget } from "@/components/assistant/assistant";
import type { AssistantRole } from "@/lib/assistant/registry";

export const metadata: Metadata = {
  title: "AIME® — Le Monde Aime · La terre, les arts et les générations",
  description:
    "Trouvez près de vous de quoi vivre, créer et transmettre. Un seul espace pour vos projets, vos échanges et l'accompagnement de vos démarches. Prototype indépendant, non affilié à un organisme public.",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  const role: AssistantRole = user ? (user.role as AssistantRole) : "visiteur";
  return (
    <html lang="fr">
      <body className="bg-white text-slate-900 antialiased">
        <a href="#contenu-principal" className="skip-link">
          Aller au contenu principal
        </a>
        {children}
        <AssistantWidget role={role} userName={user?.fullName ?? null} />
      </body>
    </html>
  );
}
