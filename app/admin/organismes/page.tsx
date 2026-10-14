import { getOrganisms } from "@/lib/journey-queries";
import type { Metadata } from "next";
import { SectionTitle, Card, formatDate } from "@/components/ui";
import { ORGANISM_CATEGORY_LABEL } from "@/lib/situations";
import { OrganismEditor } from "./organism-editor";
import { requireRolePage } from "@/lib/auth";

export const metadata: Metadata = { title: "Organismes — Administration AIME®" };

export const dynamic = "force-dynamic";

export default async function AdminOrganismes() {
  await requireRolePage(["administrateur"]);
  const orgs = await getOrganisms();
  return (
    <div className="flex flex-col gap-6">
      <SectionTitle eyebrow="Administration" title="Annuaire des organismes" description="Mettez à jour les fiches après vérification sur les sites officiels. Ne marquez « vérifié » qu’après contrôle effectif du contenu." />
      {orgs.map((o) => (
        <Card key={o.id}>
          <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-bold text-ink">{o.name}</p><span className="text-xs text-ink-3">{ORGANISM_CATEGORY_LABEL[o.category]} · lien : {o.linkStatus} · contenu : {o.contentStatus}{o.verifiedAt ? ` · ${formatDate(o.verifiedAt)}` : ""}</span></div>
          <OrganismEditor o={{ id: o.id, name: o.name, role: o.role, audience: o.audience, territory: o.territory, url: o.url, source: o.source }} />
        </Card>
      ))}
    </div>
  );
}
