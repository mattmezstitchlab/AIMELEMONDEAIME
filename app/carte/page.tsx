import { redirect } from "next/navigation";

/** Adresse conservée : la carte des producteurs a rejoint Le Monde Aime, désormais en listes. */
export default function CarteRedirect() {
  redirect("/le-monde-aime");
}
