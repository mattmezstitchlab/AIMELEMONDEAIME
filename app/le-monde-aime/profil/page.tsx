import { redirect } from "next/navigation";

export default async function AncienProfil({ searchParams }: { searchParams: Promise<{ bienvenue?: string }> }) {
  const { bienvenue } = await searchParams;
  redirect(bienvenue ? "/espace/profil?bienvenue=1" : "/espace/profil");
}
