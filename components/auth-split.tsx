import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/ui";

export function AuthSplit({ image, title, subtitle, children }: { image: string; title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <div className="grid flex-1 lg:grid-cols-2">
        <div className="relative isolate flex min-h-[320px] flex-col justify-between overflow-hidden p-8 lg:min-h-0 lg:p-12">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt="" className="animate-hero-zoom absolute inset-0 -z-20 h-full w-full object-cover" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/80 via-black/30 to-black/20" />
          <Link href="/" aria-label="Retour à l'accueil">
            <Logo light />
          </Link>
          <div className="animate-fade-up max-w-md">
            <h1 className="text-4xl font-bold leading-tight text-white lg:text-5xl">{title}</h1>
            <p className="mt-4 text-lg text-white/85">{subtitle}</p>
          </div>
        </div>
        <main id="contenu-principal" className="flex items-center justify-center px-6 py-14 sm:px-12">
          <div className="w-full max-w-md">{children}</div>
        </main>
      </div>
    </div>
  );
}
