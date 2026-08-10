import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { PageHero } from "@/components/site/PageHero";
import { SectionHeading } from "@/components/site/SectionHeading";
import { BookingCta } from "@/components/site/BookingCta";
import { OptimizedImage } from "@/components/site/OptimizedImage";
import { Leaf, HeartHandshake, Sparkles, Compass } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About VANASURU â€” A Story of Two Retreats" },
      {
        name: "description",
        content:
          "The story, values, and hospitality philosophy behind VANASURU's two destinations.",
      },
      { property: "og:title", content: "About VANASURU" },
      { property: "og:description", content: "The story behind our two luxury nature retreats." },
    ],
  }),
  component: About,
});

const VALUES = [
  {
    icon: Leaf,
    title: "Rooted in Nature",
    blurb: "Native gardens, local materials, and a light-footed approach to the land.",
  },
  {
    icon: HeartHandshake,
    title: "Hospitality with Soul",
    blurb: "Staff who anticipate, listen, and treat every guest as family.",
  },
  {
    icon: Sparkles,
    title: "Considered Design",
    blurb: "Interiors that whisper rather than shout â€” layered, tactile, and calm.",
  },
  {
    icon: Compass,
    title: "Sense of Place",
    blurb: "Every menu, ritual, and detail is drawn from the region we call home.",
  },
];

const TIMELINE = [
  {
    year: "2018",
    title: "The Idea",
    blurb: "A family conversation about slower stays becomes a serious plan.",
  },
  {
    year: "2020",
    title: "Land Chosen",
    blurb: "Twenty-two acres of heritage garden secured outside Mysore.",
  },
  {
    year: "2022",
    title: "VANASURU Silverleaf Opens",
    blurb: "The flagship retreat welcomes its first guests.",
  },
  {
    year: "2024",
    title: "Mahadevapura",
    blurb: "Our contemporary sister property arrives in Bengaluru.",
  },
];

function About() {
  return (
    <SiteShell>
      <PageHero
        image="/images/Gemini_Generated_Image_v6somfv6somfv6so.png"
        eyebrow="Our Story"
        title="A quieter way to travel."
        intro="VANASURU is a family of two considered retreats â€” built on the belief that hospitality can be soft, rooted, and deeply human."
      />

      <section className="py-28 px-6">
        <div className="mx-auto max-w-7xl grid gap-16 md:grid-cols-2 items-center">
          <OptimizedImage
            src="/images/DSC05314.JPG.jpeg"
            alt="VANASURU Retreat"
            className="w-full aspect-[4/5] object-cover rounded-sm shadow-md"
            sizes="(min-width: 768px) 50vw, 100vw"
          />
          <div>
            <SectionHeading
              align="left"
              eyebrow="Founder's Note"
              title={
                <>
                  Hospitality, <em className="italic text-[color:var(--gold)]">rewritten</em>.
                </>
              }
              intro="We wanted a place where the noise fell away. Where the light was honest, the food was local, and the people at the front desk actually knew your name by dinner. VANASURU is our answer â€” a small collection of retreats built for the guest who wants less, done beautifully."
            />
          </div>
        </div>
      </section>

      <section className="py-28 px-6 bg-[color:var(--sand)]/40">
        <SectionHeading eyebrow="Our Values" title="What we believe in." />
        <div className="mt-16 mx-auto max-w-6xl grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((v) => (
            <div key={v.title} className="bg-card border border-border/60 p-8">
              <v.icon className="text-[color:var(--gold)]" size={26} />
              <h3 className="mt-6 font-serif text-xl text-[color:var(--forest)]">{v.title}</h3>
              <p className="mt-3 text-sm text-charcoal/70 leading-relaxed">{v.blurb}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-28 px-6">
        <SectionHeading eyebrow="Timeline" title="A short history." />
        <div className="mt-16 mx-auto max-w-3xl border-l border-[color:var(--gold)]/40 pl-10 space-y-12">
          {TIMELINE.map((t) => (
            <div key={t.year} className="relative">
              <span className="absolute -left-[46px] top-1 w-3 h-3 rounded-full bg-[color:var(--gold)]" />
              <div className="text-eyebrow">{t.year}</div>
              <div className="mt-2 font-serif text-2xl text-[color:var(--forest)]">{t.title}</div>
              <p className="mt-2 text-charcoal/70">{t.blurb}</p>
            </div>
          ))}
        </div>
      </section>

      <BookingCta />
    </SiteShell>
  );
}

