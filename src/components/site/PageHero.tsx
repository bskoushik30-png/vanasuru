import type { ReactNode } from "react";
import { OptimizedImage } from "./OptimizedImage";

export function PageHero({
  image,
  eyebrow,
  mark,
  title,
  intro,
  children,
  height = "tall",
}: {
  image: string;
  eyebrow?: string;
  mark?: ReactNode;
  title: ReactNode;
  intro?: ReactNode;
  children?: ReactNode;
  height?: "tall" | "full";
}) {
  return (
    <section
      className={`relative w-full ${height === "full" ? "h-screen" : "h-[70vh] min-h-[520px]"} flex items-center justify-center text-center overflow-hidden`}
    >
      <OptimizedImage
        src={image}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        sizes="100vw"
        loading="eager"
        fetchPriority="high"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[color:var(--forest-deep)]/70 via-[color:var(--forest-deep)]/50 to-[color:var(--forest-deep)]/85" />
      <div className="relative z-10 max-w-4xl px-6">
        {mark && <div className="mb-5 flex justify-center">{mark}</div>}
        {eyebrow && (
          <div className="text-eyebrow">
            <span className="gold-divider mr-3" />
            {eyebrow}
            <span className="gold-divider ml-3" />
          </div>
        )}
        <h1 className="mt-6 font-serif text-5xl md:text-7xl text-ivory leading-[1.05]">{title}</h1>
        {intro && (
          <p className="mt-6 text-ivory/85 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            {intro}
          </p>
        )}
        {children && <div className="mt-10">{children}</div>}
      </div>
    </section>
  );
}

