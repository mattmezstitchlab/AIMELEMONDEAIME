import { Icon, type IconName } from "@/components/icon";
import { formatAmount } from "@/components/ui";

/*
 * Fragments d'interface utilisés par les pages publiques.
 *
 * Cal.com appuie sa communication sur de vraies captures d'application plutôt
 * que sur des illustrations : chaque argument est doublé d'un aperçu crédible.
 * Ces blocs sont décoratifs (aria-hidden) — le texte qui les accompagne porte
 * le sens — et n'affichent aucune donnée réelle : uniquement de la démonstration.
 */

export function MockWindow({
  title,
  meta,
  children,
  className = "",
}: {
  title: string;
  meta?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div aria-hidden="true" className={`product-window ${className}`}>
      <div className="flex items-center justify-between gap-4 border-b border-line px-4 py-3">
        <span className="font-display text-[11px] uppercase tracking-[0.14em] text-ink-3">{title}</span>
        {meta && <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] text-ink-3">{meta}</span>}
      </div>
      {children}
    </div>
  );
}

type RowState = "done" | "current" | "todo" | "waiting";

const ROW_STATE: Record<RowState, { label: string; className: string; icon: IconName }> = {
  done: { label: "Réuni", className: "text-state-success", icon: "check" },
  current: { label: "À faire", className: "text-ink", icon: "clock" },
  waiting: { label: "En attente", className: "text-state-warning", icon: "timer" },
  todo: { label: "Plus tard", className: "text-ink-4", icon: "clock" },
};

/** Aperçu principal : le dossier civil suivi dans Mon espace. */
export function WeddingDossierMock({ className = "" }: { className?: string }) {
  const rows: Array<{ label: string; hint: string; state: RowState }> = [
    { label: "Pièces des futurs époux", hint: "Identité, filiation, domicile", state: "done" },
    { label: "Choix de la commune et date", hint: "Mairie de Saint-Aubin", state: "done" },
    { label: "Témoins et leurs qualités", hint: "2 témoins · accord à confirmer", state: "waiting" },
    { label: "Publication des bans", hint: "à vérifier avec la mairie", state: "current" },
    { label: "Contrat de mariage", hint: "Facultatif selon votre situation", state: "todo" },
  ];
  return (
    <MockWindow title="Dossier civil" meta="Préparer mon mariage" className="animate-fade-up">
      <div className="flex items-center justify-between gap-4 px-4 py-3.5">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink">Mariage · Saint-Aubin</p>
          <p className="mt-0.5 text-xs text-ink-3">4 étapes suivies · aucune transmission automatique</p>
        </div>
        <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 font-display text-[11px] leading-none text-ink-2">En cours</span>
      </div>
      <div className="px-4 pb-3">
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-[60%] rounded-full bg-ink" />
        </div>
      </div>
      <ul className="divide-y divide-line-soft border-t border-line-soft">
        {rows.map((row) => {
          const state = ROW_STATE[row.state];
          return (
            <li key={row.label} className="flex items-center gap-3 px-4 py-3">
              <Icon name={state.icon} className={`h-4 w-4 shrink-0 ${state.className}`} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-ink-2">{row.label}</span>
                <span className="block truncate text-xs text-ink-4">{row.hint}</span>
              </span>
              <span className={`shrink-0 text-[11px] ${state.className}`}>{state.label}</span>
            </li>
          );
        })}
      </ul>
      <div className="flex items-center gap-2 border-t border-line px-4 py-3 text-[11px] text-ink-4">
        <Icon name="lock" className="h-3.5 w-3.5" />
        Ces informations restent privées et ne sont jamais envoyées à une mairie.
      </div>
    </MockWindow>
  );
}

/** Réponses des foyers invités. */
export function GuestListMock() {
  const guests = [
    { name: "Famille Bertrand", persons: 4, answer: "Confirmé", tone: "bg-state-success-soft text-state-success ring-state-success-line" },
    { name: "Léa et Sanjay", persons: 2, answer: "Confirmé", tone: "bg-state-success-soft text-state-success ring-state-success-line" },
    { name: "Cousins de Nantes", persons: 5, answer: "En attente", tone: "bg-muted text-ink-2 ring-line" },
    { name: "Michel et Anne", persons: 2, answer: "Ne peuvent pas venir", tone: "bg-muted text-ink-3 ring-line" },
  ];
  return (
    <MockWindow title="Invités et réponses" meta="13 personnes · 4 foyers">
      <ul className="divide-y divide-line-soft">
        {guests.map((guest) => (
          <li key={guest.name} className="flex items-center gap-3 px-4 py-3">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-muted text-[11px] font-medium text-ink-2">
              {guest.persons}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm text-ink-2">{guest.name}</span>
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] ring-1 ${guest.tone}`}>{guest.answer}</span>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3 text-[11px] text-ink-4">
        <span className="inline-flex items-center gap-1.5">
          <Icon name="link" className="h-3.5 w-3.5" /> Un lien par foyer, révocable
        </span>
        <span>60 % de réponses</span>
      </div>
    </MockWindow>
  );
}

/** Budget et contributions. */
export function BudgetMock() {
  const lines = [
    { label: "Traiteur · 46 couverts", amount: 2940 },
    { label: "Musique (groupe local)", amount: 850 },
    { label: "Fleurs et décoration", amount: 420 },
  ];
  const total = lines.reduce((sum, line) => sum + line.amount, 0);
  return (
    <MockWindow title="Budget estimé" meta="Suivi par poste">
      <ul className="divide-y divide-line-soft">
        {lines.map((line) => (
          <li key={line.label} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
            <span className="min-w-0 truncate text-ink-2">{line.label}</span>
            <span className="shrink-0 tabular-nums text-ink">{formatAmount(line.amount)}</span>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between gap-4 border-t border-line px-4 py-3.5">
        <span className="text-sm text-ink-3">Total des devis connus</span>
        <span className="font-display text-lg tabular-nums text-ink">{formatAmount(total)}</span>
      </div>
      <div className="border-t border-line-soft px-4 py-3 text-[11px] text-ink-4">
        AIME® n’encaisse rien : les paiements se font auprès des prestataires choisis.
      </div>
    </MockWindow>
  );
}

/** Accès temporaires confiés aux proches. */
export function RolesMock() {
  const roles = [
    { name: "Coordination", who: "Camille, sœur", scope: "Réponses, programme, plan de table", until: "Expire dans 30 jours" },
    { name: "Témoin", who: "Youssef", scope: "Programme et plan de table (lecture)", until: "Expire dans 7 jours" },
  ];
  return (
    <MockWindow title="Proches organisateurs" meta="Accès limités">
      <ul className="divide-y divide-line-soft">
        {roles.map((role) => (
          <li key={role.name} className="px-4 py-3.5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-ink">{role.name}</span>
              <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] text-ink-3">{role.until}</span>
            </div>
            <p className="mt-1 text-xs text-ink-3">{role.who} · {role.scope}</p>
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-2 border-t border-line px-4 py-3 text-[11px] text-ink-4">
        <Icon name="shield" className="h-3.5 w-3.5" />
        Aucun accès au budget, aux documents ni aux échanges privés.
      </div>
    </MockWindow>
  );
}

/** Liste de pièces courte, pour les cartes d'étape. */
export function ChecklistMock({ items }: { items: Array<{ label: string; done?: boolean }> }) {
  return (
    <ul aria-hidden="true" className="space-y-2">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-2.5 text-xs">
          <span className={`grid h-4 w-4 shrink-0 place-items-center rounded-full ${item.done ? "bg-ink text-white" : "ring-1 ring-line"}`}>
            {item.done && <Icon name="check" className="h-3 w-3" />}
          </span>
          <span className={item.done ? "text-ink-3 line-through decoration-line" : "text-ink-2"}>{item.label}</span>
        </li>
      ))}
    </ul>
  );
}

/** Rétroplanning : jalons datés autour du jour J. */
export function TimelineMock() {
  const milestones = [
    { when: "M-6", label: "Dossier civil déposé en mairie" },
    { when: "M-3", label: "Réponses des invités suivies" },
    { when: "M-1", label: "Programme et plan de table arrêtés" },
    { when: "J", label: "Cérémonie · mairie puis réception" },
  ];
  return (
    <ul aria-hidden="true" className="divide-y divide-line-soft">
      {milestones.map((milestone) => (
        <li key={milestone.when} className="flex items-baseline gap-3 py-2.5 first:pt-0 last:pb-0">
          <span className="w-8 shrink-0 font-display text-[11px] tracking-[0.08em] text-ink-4">{milestone.when}</span>
          <span className="text-xs leading-relaxed text-ink-2">{milestone.label}</span>
        </li>
      ))}
    </ul>
  );
}
