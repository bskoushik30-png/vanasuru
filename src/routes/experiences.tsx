import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { PageHero } from "@/components/site/PageHero";
import { SectionHeading } from "@/components/site/SectionHeading";
import { BookingCta } from "@/components/site/BookingCta";
import { EXPERIENCES } from "@/lib/site-data";

export const Route = createFileRoute("/experiences")({
  head: () => ({
    meta: [
      { title: "Experiences — VANASURU" },
      {
        name: "description",
        content: "Fine dining, spa, weddings, events, and outdoor experiences at VANASURU.",
      },
      { property: "og:title", content: "Experiences — VANASURU" },
      { property: "og:description", content: "Curated with quiet intention." },
    ],
  }),
  component: ExperiencesPage,
});

function ExperiencesPage() {
  return (
    <SiteShell>
      <PageHero
        image="/images/DSC_1263.jpg"
        eyebrow="Experiences"
        title="Every hour, a small ceremony."
        intro="From dawn walks to fireside dinners — a considered choreography, held together by our team."
      />
      <section className="py-24 px-6">
        <SectionHeading eyebrow="Amenities & Services" title="Curated with quiet intention." />
        <div className="mt-16 mx-auto max-w-6xl grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {EXPERIENCES.map((e) => (
            <div key={e.title} className="bg-card border border-border/60 p-8">
              <div className="w-10 h-[2px] bg-[color:var(--gold)]" />
              <h3 className="mt-6 font-serif text-2xl text-[color:var(--forest)]">{e.title}</h3>
              <p className="mt-3 text-sm text-charcoal/70 leading-relaxed">{e.blurb}</p>
            </div>
          ))}
        </div>
      </section>
      <BookingCta />
    </SiteShell>
  );
}
