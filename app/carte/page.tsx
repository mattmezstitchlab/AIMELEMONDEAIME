import { redirect } from "next/navigation";

/** La carte des producteurs et disponibilités est désormais réunie dans la carte unique. */
export default function CarteRedirect() {
  redirect("/le-monde-aime");
}
