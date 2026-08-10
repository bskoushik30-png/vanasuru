import { Link } from "@tanstack/react-router";
import { ArrowRight, MapPin } from "lucide-react";
import { SiteShell } from "./SiteShell";
import { PageHero } from "./PageHero";
import { SectionHeading } from "./SectionHeading";
import { RoomCard } from "./RoomCard";
import { BookingCta } from "./BookingCta";
import { OptimizedImage } from "./OptimizedImage";
import { PROPERTIES, ROOMS, EXPERIENCES } from "@/lib/site-data";
import type { PropertyKey } from "@/lib/site-data";
import { useBookingStore, extractMapEmbedUrl } from "@/lib/booking-store";

export function PropertyPage({ propertyKey }: { propertyKey: PropertyKey }) {
  const { galleryItems, locations } = useBookingStore();
  const staticP = PROPERTIES[propertyKey];
  const dynamicLoc = locations.find((l) => l.key === propertyKey);

  const p = {
    ...staticP,
    name: dynamicLoc?.name || staticP.name,
    address: dynamicLoc?.address || staticP.address,
    mapEmbedUrl: dynamicLoc?.mapEmbedUrl || staticP.mapEmbedUrl,
  };

  const gallery = galleryItems.filter((g) => g.tag === propertyKey).slice(0, 6);

  const cleanMapUrl = extractMapEmbedUrl(p.mapEmbedUrl || "");

  return (
    <SiteShell>
      <PageHero
        image={p.hero}
        eyebrow={p.location}
        title={p.name}
        intro={p.tagline}
        height="full"
      />

      <section className="py-24 px-6">
        <SectionHeading eyebrow="Resort Overview" title="A stay, considered." intro={p.intro} />
      </section>

      <section className="pb-24 px-6">
        <div className="mx-auto max-w-7xl grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {p.highlights.map((h) => (
            <div key={h.title} className="bg-card border border-border/60 p-8">
              <div className="w-10 h-[2px] bg-[color:var(--gold)]" />
              <h3 className="mt-6 font-serif text-xl text-[color:var(--forest)]">{h.title}</h3>
              <p className="mt-3 text-sm text-charcoal/70 leading-relaxed">{h.blurb}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-24 px-6 bg-[color:var(--sand)]/40">
        <SectionHeading eyebrow="Featured Rooms" title="Where you'll rest." />
        <div className="mt-14 mx-auto max-w-7xl grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {ROOMS.map((r) => (
            <RoomCard key={r.slug} room={r} />
          ))}
        </div>
      </section>

      <section className="py-24 px-6">
        <SectionHeading
          eyebrow="Amenities & Experiences"
          title="Small pleasures, thoughtfully arranged."
        />
        <div className="mt-14 mx-auto max-w-6xl grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 text-center">
          {EXPERIENCES.map((e) => (
            <div key={e.title} className="p-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-[color:var(--forest)]/95 flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-[color:var(--gold)]" />
              </div>
              <div className="mt-4 font-serif text-lg text-[color:var(--forest)]">{e.title}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-24 px-6 bg-[color:var(--forest-deep)]">
        <SectionHeading
          eyebrow="Gallery"
          title={<span className="text-ivory">A glimpse into {p.name}.</span>}
          invert
        />
        <div className="mt-14 mx-auto max-w-7xl grid grid-cols-2 md:grid-cols-3 gap-3">
          {gallery.map((g, i) => (
            <OptimizedImage
              key={i}
              src={g.src}
              alt=""
              className="aspect-[4/3] w-full object-cover hover:scale-105 transition-transform duration-[900ms]"
              sizes="(min-width: 768px) 33vw, 50vw"
            />
          ))}
        </div>
        <div className="mt-12 text-center">
          <Link
            to="/gallery"
            className="inline-flex items-center gap-3 text-[11px] font-semibold tracking-[0.28em] uppercase text-[color:var(--gold)] border-b border-[color:var(--gold)] pb-1"
          >
            View Full Gallery <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      <section className="py-24 px-6">
        <div className="mx-auto max-w-7xl grid gap-14 md:grid-cols-2 items-start">
          <div>
            <SectionHeading
              align="left"
              eyebrow="Nearby"
              title="Around the resort."
              intro="Curated experiences and attractions moments away — from heritage palaces to nature trails and vibrant local markets."
            />
            <ul className="mt-8 space-y-3 text-charcoal/80">
              <li className="flex gap-3">
                <MapPin size={16} className="text-[color:var(--gold)] mt-1" /> Heritage landmarks
                within a short drive
              </li>
              <li className="flex gap-3">
                <MapPin size={16} className="text-[color:var(--gold)] mt-1" /> Local markets and
                artisan crafts
              </li>
              <li className="flex gap-3">
                <MapPin size={16} className="text-[color:var(--gold)] mt-1" /> Nature reserves and
                walking trails
              </li>
            </ul>
          </div>
          <div className="aspect-[4/3] bg-[color:var(--sand)]/60 border border-border/60 flex items-center justify-center overflow-hidden relative shadow-md">
            {cleanMapUrl ? (
              <iframe
                src={cleanMapUrl}
                className="w-full h-full border-0"
                loading="lazy"
                allowFullScreen
                title={`Map of ${p.name}`}
              />
            ) : (
              <div className="text-center text-charcoal/50 p-6">
                <MapPin className="mx-auto mb-3 text-[color:var(--gold)]" />
                <div className="text-eyebrow">Map</div>
                <div className="mt-1 text-sm">{p.address}</div>
              </div>
            )}
          </div>
        </div>
      </section>

      <BookingCta />
    </SiteShell>
  );
}
