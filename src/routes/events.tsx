import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SiteShell } from "@/components/site/SiteShell";
import { PageHero } from "@/components/site/PageHero";
import { SectionHeading } from "@/components/site/SectionHeading";
import { PROPERTIES, EVENT_TYPES, FUNCTION_HALLS } from "@/lib/site-data";
import { useBookingStore, extractMapEmbedUrl, type ResortEvent } from "@/lib/booking-store";
import {
  CheckCircle2,
  MapPin,
  Calendar,
  Users,
  Sparkles,
  Building2,
  Plus,
  ArrowRight,
  X,
  Star,
  Check,
} from "lucide-react";

export const Route = createFileRoute("/events")({
  head: () => ({
    meta: [
      { title: "Events & Celebrations — VANASURU" },
      {
        name: "description",
        content: "Weddings, engagements, corporate off-sites, and function halls at VANASURU.",
      },
      { property: "og:title", content: "Events & Celebrations — VANASURU" },
      {
        property: "og:description",
        content: "Milestone moments and luxury function halls in serene nature.",
      },
    ],
  }),
  component: EventsPage,
});

function EventsPage() {
  const { locations, events, currentUser } = useBookingStore();
  const [selectedPropertyKey, setSelectedPropertyKey] = useState<string>("mysore");

  // Find active location object
  const activeLocation = locations.find((l) => l.key === selectedPropertyKey) || {
    key: selectedPropertyKey,
    name: PROPERTIES[selectedPropertyKey]?.name || "VANASURU Silverleaf",
    address: PROPERTIES[selectedPropertyKey]?.address || "Mysuru, Karnataka",
    mapEmbedUrl: PROPERTIES[selectedPropertyKey]?.mapEmbedUrl,
  };

  const mapUrl = extractMapEmbedUrl(
    activeLocation.mapEmbedUrl || PROPERTIES[selectedPropertyKey]?.mapEmbedUrl || "",
  );

  const propertyEvents = events.filter((e) => e.property === selectedPropertyKey);
  const propertyHalls = FUNCTION_HALLS.filter((h) => h.property === selectedPropertyKey);

  return (
    <SiteShell>
      <PageHero
        image="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=75"
        eyebrow="Events & Celebrations"
        title="Once-in-a-lifetime moments."
        intro="Weddings, engagements, corporate off-sites, and luxury function halls — VANASURU holds each occasion with grace."
      />

      {/* Property Switcher Tabs */}
      <section className="pt-16 pb-8 px-6 bg-[color:var(--sand)]/30 border-b border-border/60">
        <div className="mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="text-eyebrow">Explore Venues by Destination</div>
            <h2 className="font-serif text-2xl text-[color:var(--forest)] font-bold mt-1">
              Function Halls & Locations in Vicinity
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {Object.values(PROPERTIES).map((p) => (
              <button
                key={p.key}
                onClick={() => {
                  setSelectedPropertyKey(p.key);
                }}
                className={`px-6 py-3 text-xs font-semibold tracking-widest uppercase border transition-all cursor-pointer ${
                  selectedPropertyKey === p.key
                    ? "bg-[color:var(--forest)] text-ivory border-[color:var(--forest)] shadow-md"
                    : "bg-white text-charcoal border-border hover:border-[color:var(--gold)]"
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Embedded Location Map Section */}
      <section className="py-16 px-6 bg-[color:var(--sand)]/10">
        <div className="mx-auto max-w-7xl grid gap-10 lg:grid-cols-12 items-center">
          <div className="lg:col-span-5 space-y-4">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[color:var(--gold)]">
              <MapPin size={16} /> Location & Map
            </div>
            <h3 className="font-serif text-3xl text-[color:var(--forest)] font-bold">
              {activeLocation.name} Vicinity
            </h3>
            <p className="text-sm text-charcoal/70 leading-relaxed">{activeLocation.address}</p>
            <div className="pt-2 text-xs text-charcoal/60 space-y-2">
              <div className="flex items-center gap-2">
                <Check size={14} className="text-[color:var(--gold)]" /> Serene, private estate
                environment
              </div>
              <div className="flex items-center gap-2">
                <Check size={14} className="text-[color:var(--gold)]" /> Expansive parking for up to
                200+ vehicles
              </div>
              <div className="flex items-center gap-2">
                <Check size={14} className="text-[color:var(--gold)]" /> In-house banquet & luxury
                accommodation
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="relative aspect-video w-full overflow-hidden border border-border shadow-lg bg-card">
              {mapUrl ? (
                <iframe
                  src={mapUrl}
                  className="w-full h-full border-0"
                  loading="lazy"
                  allowFullScreen
                  title={`Map of ${activeLocation.name}`}
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center p-8 text-center text-charcoal/50">
                  <div>
                    <MapPin size={32} className="mx-auto mb-2 text-[color:var(--gold)]" />
                    <p className="font-serif text-lg text-[color:var(--forest)]">
                      {activeLocation.name}
                    </p>
                    <p className="text-xs mt-1">{activeLocation.address}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Resort Events */}
      <section className="py-24 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
            <div>
              <SectionHeading
                align="left"
                eyebrow="Upcoming Resort Events"
                title="Celebrations & Highlights"
                intro="Intimate musical evenings, gala dinners, and curated resort experiences."
              />
            </div>
            {currentUser?.role === "admin" && (
              <Link
                to="/create-event"
                className="inline-flex items-center gap-2 bg-[color:var(--forest)] text-ivory px-6 py-3 text-xs font-semibold tracking-widest uppercase hover:bg-[color:var(--gold)] hover:text-[color:var(--forest-deep)] transition-colors"
              >
                <Plus size={14} /> Create New Event
              </Link>
            )}
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {events.map((evt) => (
              <div
                key={evt.id}
                className="bg-card border border-border/60 overflow-hidden flex flex-col justify-between hover:shadow-xl transition-all duration-300 group"
              >
                <div>
                  <div className="relative h-56 overflow-hidden">
                    <img
                      src={evt.image}
                      alt={evt.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    {evt.isHighlighted && (
                      <span className="absolute top-4 left-4 bg-[color:var(--gold)] text-[color:var(--forest-deep)] text-[9px] font-bold tracking-widest uppercase px-3 py-1 flex items-center gap-1 shadow-sm">
                        <Star size={10} fill="currentColor" /> Featured Highlight
                      </span>
                    )}
                    <div className="absolute bottom-4 left-4 right-4 text-ivory">
                      <div className="text-[10px] tracking-widest uppercase text-[color:var(--gold)] font-semibold">
                        {evt.property.toUpperCase()} • {evt.venue}
                      </div>
                      <h3 className="font-serif text-xl font-bold mt-0.5 leading-tight">
                        {evt.title}
                      </h3>
                    </div>
                  </div>

                  <div className="p-6 space-y-4">
                    <p className="text-xs text-charcoal/70 leading-relaxed">{evt.description}</p>
                    <div className="grid grid-cols-2 gap-3 text-xs border-t border-border/40 pt-4 text-charcoal/80">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={14} className="text-[color:var(--gold)]" />
                        <span>{evt.date}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users size={14} className="text-[color:var(--gold)]" />
                        <span>Cap: {evt.capacity} Guests</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 pt-0 border-t border-border/40 mt-4 flex items-center justify-between">
                  <div className="font-serif text-lg font-bold text-[color:var(--forest)]">
                    ₹{evt.price.toLocaleString("en-IN")}
                  </div>
                  <Link
                    to="/contact"
                    className="inline-flex items-center gap-2 bg-[color:var(--forest)] text-ivory px-4 py-2.5 text-[10px] font-semibold tracking-widest uppercase hover:bg-[color:var(--gold)] hover:text-[color:var(--forest-deep)] transition-colors cursor-pointer"
                  >
                    Inquire &amp; Contact <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Function Halls in Vicinity */}
      <section className="py-24 px-6 bg-[color:var(--sand)]/40">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Vicinity Venues"
            title={`Function Halls at ${activeLocation.name}`}
            intro="Air-conditioned ballrooms, heritage green lawns, and outdoor pavilions equipped for celebrations."
          />

          <div className="mt-14 grid gap-8 md:grid-cols-2">
            {propertyHalls.map((hall) => (
              <div
                key={hall.id}
                className="bg-card border border-border/60 overflow-hidden flex flex-col md:flex-row hover:shadow-lg transition-shadow"
              >
                <div className="md:w-1/2 relative h-64 md:h-auto">
                  <img src={hall.image} alt={hall.name} className="w-full h-full object-cover" />
                  <div className="absolute top-4 left-4 bg-[color:var(--forest-deep)]/90 text-ivory text-[9px] font-bold tracking-widest uppercase px-3 py-1">
                    {hall.capacity}
                  </div>
                </div>
                <div className="md:w-1/2 p-6 md:p-8 flex flex-col justify-between">
                  <div>
                    <h3 className="font-serif text-2xl text-[color:var(--forest)] font-bold mb-2">
                      {hall.name}
                    </h3>
                    <p className="text-xs text-charcoal/70 leading-relaxed mb-4">
                      {hall.description}
                    </p>
                    <ul className="space-y-1.5 text-xs text-charcoal/80 mb-6">
                      {hall.features.map((f, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--gold)]" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Link
                    to="/contact"
                    className="block text-center w-full bg-[color:var(--forest)] text-ivory py-3 text-[10px] font-semibold tracking-widest uppercase hover:bg-[color:var(--gold)] hover:text-[color:var(--forest-deep)] transition-colors cursor-pointer"
                  >
                    Contact to Reserve Hall
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Occasions We Host */}
      <section className="py-24 px-6">
        <SectionHeading eyebrow="Occasions We Host" title="From intimate to grand." />
        <div className="mt-14 mx-auto max-w-6xl grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {EVENT_TYPES.map((e) => (
            <div
              key={e}
              className="bg-card border border-border/60 p-8 hover:border-[color:var(--gold)] transition-colors"
            >
              <div className="w-10 h-[2px] bg-[color:var(--gold)]" />
              <div className="mt-5 font-serif text-2xl text-[color:var(--forest)]">{e}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact Section Banner for Event Booking */}
      <section id="book-event" className="py-24 px-6 bg-[color:var(--forest-deep)] text-ivory text-center">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="text-eyebrow text-[color:var(--gold)]">Planning a Milestone Celebration?</div>
          <h2 className="font-serif text-3xl md:text-4xl font-bold">Contact Our Events Desk</h2>
          <p className="text-sm text-ivory/80 leading-relaxed max-w-xl mx-auto">
            Client event and function hall reservations are coordinated directly through our events management desk to ensure customized menu curation, decor themes, and guest room allocations.
          </p>
          <div className="pt-4 flex flex-wrap justify-center gap-4">
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 bg-[color:var(--gold)] text-[color:var(--forest-deep)] font-bold px-8 py-4 text-xs tracking-widest uppercase hover:bg-ivory transition-colors cursor-pointer shadow-lg"
            >
              Contact Us to Book Event <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}

