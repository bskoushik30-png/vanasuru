import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SiteShell } from "@/components/site/SiteShell";
import { PageHero } from "@/components/site/PageHero";
import { RoomCard } from "@/components/site/RoomCard";
import { BookingCta } from "@/components/site/BookingCta";
import { ROOMS, PROPERTIES, type PropertyKey } from "@/lib/site-data";
import { useBookingStore } from "@/lib/booking-store";
import { Calendar, Search, MapPin, Sparkles } from "lucide-react";
import { format, parseISO, isValid } from "date-fns";

function isPropertyKey(value: string): value is PropertyKey {
  return value in PROPERTIES;
}

type RoomSearchParams = {
  property: PropertyKey;
  checkIn: string;
  checkOut: string;
};

export const Route = createFileRoute("/rooms")({
  head: () => ({
    meta: [
      { title: "Rooms & Suites â€” VANASURU" },
      {
        name: "description",
        content:
          "Deluxe rooms, premium suites, family villas, and executive rooms across VANASURU's two properties.",
      },
      { property: "og:title", content: "Rooms & Suites â€” VANASURU" },
      { property: "og:description", content: "Rooms shaped for slow days." },
    ],
  }),
  component: RoomsPage,
});

function RoomsPage() {
  const { rooms: physicalRooms, locations, checkAvailability } = useBookingStore();

  const [property, setProperty] = useState<PropertyKey>("mysore");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [isSearched, setIsSearched] = useState(false);
  const [searchParams, setSearchParams] = useState<RoomSearchParams | undefined>(undefined);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (checkIn && checkOut) {
      setIsSearched(true);
      setSearchParams({ property, checkIn, checkOut });
    }
  };

  const handleClear = () => {
    setCheckIn("");
    setCheckOut("");
    setIsSearched(false);
    setSearchParams(undefined);
  };

  // Group properties into 2 columns: mysore and mahadevapura
  const targetProperties: PropertyKey[] = ["mysore", "mahadevapura"];

  const propertyColumns = targetProperties.map((locKey) => {
    const propertyInfo =
      locations.find((l) => l.key === locKey) || PROPERTIES[locKey] || PROPERTIES["mysore"];
    const locRooms = physicalRooms.filter((r) => r.property === locKey);

    let activeRooms = locRooms;
    if (isSearched && checkIn && checkOut) {
      const avail = checkAvailability(locKey, checkIn, checkOut);
      const availableRoomIds = new Set(avail.flatMap((a) => a.availableRoomIds));
      activeRooms = locRooms.filter((r) => availableRoomIds.has(r.id));
    }

    const displayRooms = activeRooms.map((r) => {
      const roomTypeInfo = ROOMS.find((rt) => rt.slug === r.roomTypeSlug);
      const defaultImg = roomTypeInfo?.image || "/images/DSC05333.JPG.jpeg";
      const validPhotos =
        r.photos &&
        r.photos.filter((p) => typeof p === "string" && p.trim().length > 0 && p.trim() !== '""');

      return {
        id: r.id,
        slug: r.roomTypeSlug,
        name: r.name
          ? `${r.name} (${roomTypeInfo?.name || r.roomTypeSlug})`
          : roomTypeInfo?.name || r.id,
        property: r.property,
        description:
          roomTypeInfo?.description || "A serene room wrapped in warm woods and soft light.",
        image: defaultImg,
        photos: validPhotos && validPhotos.length > 0 ? validPhotos : [defaultImg],
        capacity: `${r.maxAdults ?? 2} Adults, ${r.maxKids ?? 1} Kids`,
        bed: r.bedType || roomTypeInfo?.bed || "King Bed",
        amenities: roomTypeInfo?.amenities || ["Garden View", "Free Wi-Fi"],
        advanceAmount: r.advanceAmount ?? 1,
        pricePerNight: r.pricePerNight || 7000,
        maxGuests: r.maxGuests ?? 4,
        maxAdults: r.maxAdults ?? 2,
        maxKids: r.maxKids ?? 1,
        bedType: r.bedType || roomTypeInfo?.bed || "King Bed",
      };
    });

    return {
      key: locKey,
      info: propertyInfo,
      rooms: displayRooms,
    };
  });

  return (
    <SiteShell>
      <PageHero
        image="/images/DSC_1319 (1).jpg"
        eyebrow="Rooms & Suites"
        title="Rooms shaped for slow days."
        intro="Every room at VANASURU is a considered retreat â€” layered materials, generous proportions, and the softest linens."
      />

      {/* Dynamic Date Filter Bar */}
      <section className="relative z-20 max-w-5xl mx-auto px-6 -mt-16">
        <form
          onSubmit={handleSearch}
          className="bg-card border border-[color:var(--gold)]/30 shadow-2xl p-6 md:p-8 grid gap-4 grid-cols-1 md:grid-cols-[1.2fr_1fr_1fr_auto]"
        >
          <div className="flex flex-col">
            <label className="text-[9px] tracking-[0.2em] uppercase text-charcoal/60 flex items-center gap-1.5 mb-1.5 font-bold">
              <MapPin size={12} className="text-[color:var(--gold)]" /> Resort Destination
            </label>
            <select
              value={property}
              onChange={(e) => {
                if (isPropertyKey(e.target.value)) {
                  setProperty(e.target.value);
                }
              }}
              className="bg-transparent border border-border focus:border-[color:var(--gold)] focus:outline-none px-4 py-2.5 text-xs text-[color:var(--forest)]"
            >
              {Object.values(PROPERTIES).map((p) => (
                <option key={p.key} value={p.key}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-[9px] tracking-[0.2em] uppercase text-charcoal/60 flex items-center gap-1.5 mb-1.5 font-bold">
              <Calendar size={12} className="text-[color:var(--gold)]" /> Check In
            </label>
            <input
              required
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              className="bg-transparent border border-border focus:border-[color:var(--gold)] focus:outline-none px-4 py-2 text-xs text-[color:var(--forest)]"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-[9px] tracking-[0.2em] uppercase text-charcoal/60 flex items-center gap-1.5 mb-1.5 font-bold">
              <Calendar size={12} className="text-[color:var(--gold)]" /> Check Out
            </label>
            <input
              required
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              className="bg-transparent border border-border focus:border-[color:var(--gold)] focus:outline-none px-4 py-2 text-xs text-[color:var(--forest)]"
            />
          </div>

          <div className="flex items-end gap-2 mt-2 md:mt-0">
            <button
              type="submit"
              className="flex-1 md:flex-none inline-flex justify-center items-center gap-2 bg-[color:var(--forest)] hover:bg-[color:var(--gold)] hover:text-[color:var(--forest-deep)] text-ivory text-[10px] tracking-widest uppercase font-semibold px-6 py-3.5 transition-colors cursor-pointer"
            >
              <Search size={12} /> Search
            </button>
            {isSearched && (
              <button
                type="button"
                onClick={handleClear}
                className="inline-flex justify-center items-center border border-border hover:border-red-400 hover:text-red-400 text-charcoal/60 text-[10px] tracking-widest uppercase font-semibold px-4 py-3.5 transition-colors cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </form>
      </section>

      {/* 2-Column Property Grid Section */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        {/* Search status header */}
        {isSearched && searchParams && (
          <div className="mb-12 p-5 bg-[color:var(--sand)]/20 border border-[color:var(--gold)]/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="text-eyebrow flex items-center gap-1.5">
                <Sparkles size={12} /> Availability Results
              </div>
              <h2 className="font-serif text-xl text-[color:var(--forest)] mt-2">
                Showing available rooms for{" "}
                {searchParams.checkIn && isValid(parseISO(searchParams.checkIn))
                  ? format(parseISO(searchParams.checkIn), "MMM dd, yyyy")
                  : searchParams.checkIn}{" "}
                to{" "}
                {searchParams.checkOut && isValid(parseISO(searchParams.checkOut))
                  ? format(parseISO(searchParams.checkOut), "MMM dd, yyyy")
                  : searchParams.checkOut}
              </h2>
            </div>
            <button
              onClick={handleClear}
              className="text-xs font-semibold tracking-wider text-[color:var(--forest)] hover:text-[color:var(--gold)] border-b border-current pb-0.5"
            >
              Clear Filter
            </button>
          </div>
        )}

        {/* 2-Column Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {propertyColumns.map(({ key, info, rooms: colRooms }) => (
            <div key={key} className="space-y-8 border-t-2 border-[color:var(--gold)]/40 pt-6">
              {/* Column Header */}
              <div className="flex justify-between items-end border-b border-border/40 pb-4">
                <div>
                  <div className="text-eyebrow flex items-center gap-1.5 text-[color:var(--gold)]">
                    <MapPin size={13} /> {info.name}
                  </div>
                  <h2 className="font-serif text-3xl text-[color:var(--forest)] mt-1">
                    {key === "mysore" ? "Silverleaf Retreat" : "Village Estate"}
                  </h2>
                  <p className="text-xs text-charcoal/60 mt-1 line-clamp-1">{info.tagline}</p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-[color:var(--forest)] text-ivory px-3 py-1 rounded-full">
                  {colRooms.length} {colRooms.length === 1 ? "room" : "rooms"}
                </span>
              </div>

              {/* Rooms Cards List in this Column */}
              {colRooms.length === 0 ? (
                <div className="text-center py-14 bg-card border border-border/60 p-8 shadow-sm">
                  <ShieldAlert className="mx-auto text-[color:var(--gold)] mb-3" size={36} />
                  <h3 className="font-serif text-xl text-[color:var(--forest)]">
                    No matching rooms available.
                  </h3>
                  <p className="mt-2 text-xs text-charcoal/60 leading-relaxed max-w-xs mx-auto">
                    No available rooms found for {info.name} for the selected dates.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-1 gap-8">
                  {colRooms.map((r) => (
                    <RoomCard key={r.id} room={r} searchParams={searchParams} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <BookingCta />
    </SiteShell>
  );
}

// Simple placeholder icon wrapper for fully booked notice
function ShieldAlert({ className, size }: { className?: string; size?: number }) {
  return (
    <svg
      className={className}
      width={size || 24}
      height={size || 24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

