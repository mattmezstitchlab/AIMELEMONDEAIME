"use client";

import { useRouter } from "next/navigation";
import { MyExchanges, type CommunityData } from "@/components/community/community-app";

export function MyExchangesClient({ mine, userId }: { mine: CommunityData["mine"]; userId: number }) {
  const router = useRouter();
  return <MyExchanges mine={mine} userId={userId} goPublish={() => router.push("/le-monde-aime?onglet=publier")} />;
}
