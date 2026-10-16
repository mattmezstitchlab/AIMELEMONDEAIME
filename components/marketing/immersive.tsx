import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

/** Une image locale pleine largeur, le texte sur une surface opaque lisible. */
export function ImmersiveHero({ image, eyebrow, title, text, children, priority = false }: {
  image: string; eyebrow: string; title: string; text: string; children?: ReactNode; priority?: boolean;
}) {
  return (
    <section className="immersive-hero">
      <Image src={image} alt="" fill sizes="100vw" priority={priority} className="immersive-photo" />
      <div className="immersive-inner">
        <div className="immersive-copy">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="immersive-description">{text}</p>
          {children && <div className="mt-8 flex flex-wrap gap-3">{children}</div>}
        </div>
      </div>
    </section>
  );
}

export function LandscapeSection({ image, number, title, text, href, label }: {
  image: string; number: string; title: string; text: string; href: string; label: string;
}) {
  return (
    <section className="landscape-section">
      <div className="landscape-image"><Image src={image} alt="" fill sizes="(min-width: 1024px) 60vw, 100vw" className="object-cover grayscale" /></div>
      <div className="landscape-copy">
        <p className="eyebrow">{number}</p>
        <h2>{title}</h2>
        <p>{text}</p>
        <Link href={href} className="mt-7 inline-flex min-h-12 w-fit items-center rounded-full bg-ink px-6 text-sm font-semibold text-canvas">{label} <span aria-hidden="true" className="ml-4">↗</span></Link>
      </div>
    </section>
  );
}
