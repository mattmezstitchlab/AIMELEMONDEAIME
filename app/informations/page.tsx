import Link from "next/link";
import { PublicPage } from "@/components/public-shell";
import { Hero } from "@/components/ui";
import { Icon } from "@/components/icon";
import { ARTICLE_CATEGORY_LABELS, THEME_META } from "@/lib/constants";

export default function InformationsHub() {
  return (
    <PublicPage>
      <Hero size="md" image="/images/hero-campagne.jpg" eyebrow="Informations" title="Toutes les thématiques" subtitle="Choisissez un sujet pour accéder aux articles et guides associés." />
      <div className="mx-auto grid max-w-6xl gap-5 px-6 py-20 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(THEME_META).map(([slug, meta]) => (
          <Link key={slug} href={`/informations/${slug}`} className="flex items-center gap-4 rounded-2xl bg-[#fafaf9] p-7 transition hover:bg-emerald-50">
            <Icon name={meta.icon} className="h-10 w-10 text-emerald-500" />
            <span>
              <span className="block text-lg font-semibold text-[#1d1d1f]">{ARTICLE_CATEGORY_LABELS[slug]}</span>
              <span className="text-sm text-slate-600">{meta.desc}</span>
            </span>
          </Link>
        ))}
      </div>
    </PublicPage>
  );
}
