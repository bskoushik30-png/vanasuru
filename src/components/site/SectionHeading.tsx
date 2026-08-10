import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function SectionHeading({
  eyebrow,
  title,
  intro,
  align = "center",
  invert = false,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  intro?: ReactNode;
  align?: "center" | "left";
  invert?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "max-w-3xl",
        align === "center" ? "mx-auto text-center" : "text-left",
        className,
      )}
    >
      {eyebrow && (
        <div className="text-eyebrow">
          <span className="gold-divider mr-3" />
          {eyebrow}
          <span className="gold-divider ml-3" />
        </div>
      )}
      <h2
        className={cn(
          "mt-5 font-serif text-4xl md:text-5xl leading-[1.1]",
          invert ? "text-ivory" : "text-[color:var(--forest)]",
        )}
      >
        {title}
      </h2>
      {intro && (
        <p
          className={cn(
            "mt-5 text-base leading-relaxed",
            invert ? "text-ivory/75" : "text-charcoal/70",
          )}
        >
          {intro}
        </p>
      )}
    </div>
  );
}
