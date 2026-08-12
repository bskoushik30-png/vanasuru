import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Quote, MapPin, Calendar } from "lucide-react";
import { SiteShell } from "@/components/site/SiteShell";
import { PageHero } from "@/components/site/PageHero";
import { BookingSearchCard } from "@/components/site/BookingSearchCard";
import { SectionHeading } from "@/components/site/SectionHeading";
import { RoomCard } from "@/components/site/RoomCard";
import { BookingCta } from "@/components/site/BookingCta";
import { OptimizedImage } from "@/components/site/OptimizedImage";
import { PROPERTIES, ROOMS, EXPERIENCES, TESTIMONIALS, type PropertyKey } from "@/lib/site-data";
import { useBookingStore } from "@/lib/booking-store";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { galleryItems, events } = useBookingStore();

  return (
    <SiteShell>
      <PageHero
        image="/images/uploads/DSC05342.JPG"
        eyebrow="VANASURU Hospitality"
        title={
          <>
            Escape Into <em className="italic text-[color:var(--gold)]">VANASURU</em>.
          </>
        }
        intro="Two destinations. One unforgettable stay. A refined retreat into forest quiet, garden mornings, and unhurried hospitality."
        height="full"
      >
        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            to="/rooms"
            className="inline-flex items-center bg-[color:var(--gold)] text-[color:var(--forest-deep)] px-8 py-4 text-[11px] font-semibold tracking-[0.28em] uppercase hover:bg-ivory transition-colors"
          >
            Explore Our Rooms
          </Link>
          <Link
            to="/book"
            className="inline-flex items-center border border-ivory/60 text-ivory px-8 py-4 text-[11px] font-semibold tracking-[0.28em] uppercase hover:border-[color:var(--gold)] hover:text-[color:var(--gold)] transition-colors"
          >
            Book Your Stay
          </Link>
        </div>
      </PageHero>

      <div className="mx-auto max-w-6xl px-6 lg:px-10">
        <BookingSearchCard overlap />
      </div>

      {/* Brand intro */}
      <section className="py-28 px-6">
        <SectionHeading
          eyebrow="A Brand Story"
          title={
            <>
              Two destinations, <em className="italic text-[color:var(--gold)]">one soul</em>.
            </>
          }
          intro="VANASURU began as a promise — that hospitality could be quieter, more considered, and more rooted in the land. From heritage gardens in Mysore to a contemporary retreat in Bengaluru, we shape stays that feel like coming home to something older and finer."
        />
      </section>

      {/* Two resort cards */}
      <section className="pb-28 px-6">
        <div className="mx-auto max-w-7xl grid gap-10 md:grid-cols-2">
          {Object.values(PROPERTIES).map((p) => (
            <Link
              key={p.key}
              to={p.href}
              className="group relative h-[520px] overflow-hidden block"
            >
              <OptimizedImage
                src={p.hero}
                alt={p.name}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] group-hover:scale-105"
                sizes="(min-width: 768px) 50vw, 100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[color:var(--forest-deep)]/95 via-[color:var(--forest-deep)]/30 to-transparent" />
              <div className="relative z-10 h-full flex flex-col justify-end p-10 text-ivory">
                <div className="text-eyebrow">{p.location}</div>
                <h3 className="mt-3 font-serif text-4xl">{p.name}</h3>
                <p className="mt-3 text-ivory/80 max-w-md">{p.tagline}</p>
                <div className="mt-6 inline-flex items-center gap-3 text-[11px] font-semibold tracking-[0.28em] uppercase text-[color:var(--gold)]">
                  Explore Resort <ArrowRight size={14} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured rooms */}
      <section className="py-28 px-6 bg-[color:var(--sand)]/40">
        <SectionHeading
          eyebrow="Rooms & Suites"
          title="Rooms shaped for slow days."
          intro="From forest-facing suites to airy family villas — every room is a considered retreat."
        />
        <div className="mt-16 mx-auto max-w-7xl grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {ROOMS.map((r) => (
            <RoomCard key={r.slug} room={r} redirectTo="/rooms" hidePrice />
          ))}
        </div>
        <div className="mt-14 text-center">
          <Link
            to="/rooms"
            className="inline-flex items-center gap-3 text-[11px] font-semibold tracking-[0.28em] uppercase text-[color:var(--forest)] border-b border-[color:var(--gold)] pb-1 hover:text-[color:var(--gold)]"
          >
            All Rooms & Suites <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* Experiences preview */}
      <section className="py-24 px-6 bg-[color:var(--sand)]/30">
        <SectionHeading
          eyebrow="Experiences"
          title="Curated with quiet intention."
          intro="From farm-to-table dining to spa rituals and forest walks — indulgence, softly delivered."
        />
        <div className="mt-16 mx-auto max-w-6xl grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-y-12 gap-x-6">
          {EXPERIENCES.slice(0, 10).map((e) => (
            <div key={e.title} className="text-center px-2 flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-[color:var(--forest)] flex items-center justify-center shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--gold)]" />
              </div>
              <div className="mt-4 font-serif text-lg text-[color:var(--forest)] leading-tight">
                {e.title}
              </div>
              <p className="mt-1.5 text-xs text-charcoal/65 leading-relaxed max-w-[180px]">
                {e.blurb}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Gallery preview */}
      <section className="py-28 px-6 bg-[color:var(--forest-deep)]">
        <SectionHeading
          eyebrow="Gallery"
          title={<span className="text-ivory">A world in stillness.</span>}
          intro={<span className="text-ivory/70">Glimpses across our two destinations.</span>}
          invert
        />
        <div className="mt-14 mx-auto max-w-7xl grid grid-cols-2 md:grid-cols-4 gap-3">
          {galleryItems.slice(0, 8).map((g, i) => (
            <div
              key={i}
              className="overflow-hidden aspect-[4/3] bg-charcoal/5 border border-border/40"
            >
              <OptimizedImage
                src={g.src}
                alt=""
                className="h-full w-full object-cover hover:scale-105 transition-transform duration-[900ms]"
                sizes="(min-width: 768px) 25vw, 50vw"
              />
            </div>
          ))}
        </div>
        <div className="mt-14 text-center">
          <Link
            to="/gallery"
            className="inline-flex items-center gap-3 text-[11px] font-semibold tracking-[0.28em] uppercase text-[color:var(--gold)] border-b border-[color:var(--gold)] pb-1 hover:text-ivory hover:border-ivory"
          >
            View Full Gallery <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* Highlighted Events & Function Halls */}
      <section className="py-28 px-6 bg-[color:var(--sand)]/20 border-t border-b border-border/40">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Featured Celebrations"
            title={
              <>
                Highlighted <em className="italic text-[color:var(--gold)]">Events & Venues</em>.
              </>
            }
            intro="Weddings, music evenings, and executive retreats hosted across our serenity grounds."
          />

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {(events.filter((e) => e.isHighlighted).length > 0
              ? events.filter((e) => e.isHighlighted)
              : events
            )
              .slice(0, 3)
              .map((evt) => (
                <div
                  key={evt.id}
                  className="bg-card border border-border/60 overflow-hidden flex flex-col justify-between group hover:shadow-xl transition-all duration-300"
                >
                  <div>
                    <div className="relative h-56 overflow-hidden">
                      <img
                        src={evt.image}
                        alt={evt.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      <div className="absolute top-4 left-4 bg-[color:var(--gold)] text-[color:var(--forest-deep)] text-[9px] font-bold tracking-widest uppercase px-3 py-1 shadow-sm">
                        {evt.property.toUpperCase()} • {evt.venue}
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="font-serif text-xl font-bold text-[color:var(--forest)]">
                        {evt.title}
                      </h3>
                      <p className="text-xs text-charcoal/70 mt-2 line-clamp-2 leading-relaxed">
                        {evt.description}
                      </p>
                      <div className="mt-4 flex items-center justify-between text-xs text-charcoal/60 border-t border-border/40 pt-3">
                        <span className="flex items-center gap-1.5">
                          <Calendar size={13} className="text-[color:var(--gold)]" />
                          {evt.date}
                        </span>
                        <span className="font-semibold text-[color:var(--forest)] font-mono">
                          ₹{evt.price.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 pt-0">
                    <Link
                      to="/events"
                      className="w-full inline-flex items-center justify-center gap-2 bg-[color:var(--forest)] text-ivory py-3 text-[10px] font-semibold tracking-widest uppercase hover:bg-[color:var(--gold)] hover:text-[color:var(--forest-deep)] transition-colors"
                    >
                      Book Event / Hall <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              to="/events"
              className="inline-flex items-center gap-3 text-[11px] font-semibold tracking-[0.28em] uppercase text-[color:var(--forest)] border-b border-[color:var(--gold)] pb-1 hover:text-[color:var(--gold)]"
            >
              Explore All Events & Function Halls <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6 bg-[color:var(--sand)]/30">
        <SectionHeading eyebrow="Words From Our Guests" title="Held with care." />
        <div className="mt-16 mx-auto max-w-6xl grid gap-8 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <figure
              key={i}
              className="bg-white p-10 shadow-sm flex flex-col justify-between h-full"
            >
              <div>
                <Quote className="text-[color:var(--gold)] rotate-180" size={24} />
                <blockquote className="mt-6 font-serif text-lg md:text-xl text-[color:var(--forest)] leading-relaxed">
                  "{t.quote}"
                </blockquote>
              </div>
              <figcaption className="mt-8 pt-4">
                <div className="font-semibold text-charcoal text-sm">{t.author}</div>
                <div className="text-[10px] tracking-[0.18em] uppercase text-charcoal/50 mt-1">
                  {t.context}
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <BookingCta />
    </SiteShell>
  );
}


