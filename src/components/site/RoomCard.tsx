import { Link } from "@tanstack/react-router";
import { Users, BedDouble, MapPin, Tag } from "lucide-react";
import type { ROOMS } from "@/lib/site-data";
import { OptimizedImage } from "./OptimizedImage";

export type DisplayRoom = {
  id?: string;
  slug: string;
  name: string;
  property?: string;
  description?: string;
  image: string;
  photos?: string[];
  capacity?: string;
  bed?: string;
  amenities?: string[];
  price?: string;
  pricePerNight?: number;
  advanceAmount?: number;
  maxGuests?: number;
  maxAdults?: number;
  maxKids?: number;
  bedType?: string;
};

export function RoomCard({
  room,
  searchParams,
  redirectTo,
  hidePrice = false,
}: {
  room: DisplayRoom;
  searchParams?: { property?: string; checkIn?: string; checkOut?: string };
  redirectTo?: string;
  hidePrice?: boolean;
}) {
  const validPhotos = room.photos?.filter(
    (p: string) => typeof p === "string" && p.trim().length > 0 && p.trim() !== '""',
  );
  const displayImage =
    validPhotos && validPhotos.length > 0
      ? validPhotos[0]
      : room.image && room.image.trim().length > 0
        ? room.image
        : "/images/DSC05333.JPG.jpeg";

  const targetLink = redirectTo || "/book";
  const searchObj = redirectTo
    ? undefined
    : ({
        property: room.property || searchParams?.property || "mysore",
        room: room.slug,
        checkIn: searchParams?.checkIn,
        checkOut: searchParams?.checkOut,
      } as never);

  return (
    <article className="group bg-card border border-border/60 overflow-hidden flex flex-col shadow-md hover:shadow-xl transition-shadow duration-300">
      <Link to={targetLink} search={searchObj} className="relative aspect-[4/3] overflow-hidden bg-charcoal/5 block">
        <OptimizedImage
          src={displayImage}
          alt={room.name}
          className="h-full w-full object-cover transition-transform duration-[900ms] group-hover:scale-105"
          loading="lazy"
          sizes="(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw"
        />
        {room.id && (
          <div className="absolute top-3 left-3 bg-[color:var(--forest)]/90 text-ivory text-[10px] font-mono font-bold px-2.5 py-1 tracking-wider backdrop-blur-sm">
            {room.id}
          </div>
        )}
        {room.photos && room.photos.length > 1 && (
          <div className="absolute bottom-3 right-3 bg-black/60 text-white text-[9px] font-semibold px-2 py-0.5 rounded backdrop-blur-sm">
            {room.photos.length} photos
          </div>
        )}
      </Link>
      <div className="p-6 flex flex-col flex-1">
        <div className="flex justify-between items-start gap-2">
          <h3 className="font-serif text-2xl text-[color:var(--forest)] font-bold">
            <Link to={targetLink} search={searchObj} className="hover:text-[color:var(--gold)] transition-colors">
              {room.name}
            </Link>
          </h3>
        </div>
        {room.description && (
          <p className="mt-2.5 text-xs text-charcoal/70 leading-relaxed flex-1 line-clamp-3">
            {room.description}
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-4 text-xs tracking-wider uppercase text-charcoal/60">
          <span className="flex items-center gap-1.5">
            <Users size={13} className="text-[color:var(--gold)]" />
            {"maxAdults" in room && room.maxAdults !== undefined
              ? `${room.maxAdults} Adult${room.maxAdults > 1 ? "s" : ""}, ${room.maxKids ?? 0} Kid${(room.maxKids ?? 0) !== 1 ? "s" : ""}`
              : room.capacity || "2 Adults"}
          </span>
          <span className="flex items-center gap-1.5">
            <BedDouble size={13} className="text-[color:var(--gold)]" />
            {("bedType" in room && room.bedType) || room.bed || "King Bed"}
          </span>
        </div>
        {room.amenities && room.amenities.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {room.amenities.slice(0, 4).map((a) => (
              <span
                key={a}
                className="text-[10px] tracking-wide px-2 py-0.5 bg-[color:var(--sand)]/60 text-[color:var(--forest)]"
              >
                {a}
              </span>
            ))}
          </div>
        )}
        <div
          className={`mt-6 flex items-center ${hidePrice ? "justify-end" : "justify-between"} border-t border-border/60 pt-4 gap-2`}
        >
          {!hidePrice && (
            <div className="flex flex-col gap-1">
              <div className="flex items-baseline gap-1.5">
                <span className="text-[10px] tracking-wider uppercase text-charcoal/60 font-bold">Room Tariff:</span>
                <span className="font-serif text-lg font-bold text-[color:var(--forest)]">
                  {room.pricePerNight
                    ? `₹${room.pricePerNight.toLocaleString("en-IN")}`
                    : room.price || "₹3,500"}
                </span>
                <span className="text-[11px] font-sans text-charcoal/60 font-normal">/ night</span>
              </div>
              <div className="text-[11px] font-semibold text-emerald-800 flex items-center gap-1.5 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 w-fit">
                <Tag size={12} className="text-[color:var(--gold)]" />
                <span>Reserve with <strong className="text-[color:var(--forest-deep)]">₹{(room.advanceAmount ?? 1).toLocaleString("en-IN")} advance</strong></span>
              </div>
            </div>
          )}
          <Link
            to={targetLink}
            search={searchObj}
            className="text-[10px] tracking-[0.24em] uppercase font-semibold text-[color:var(--gold)] border-b border-[color:var(--gold)] pb-0.5 hover:text-[color:var(--forest)] hover:border-[color:var(--forest)] transition-colors shrink-0"
          >
            Book Room
          </Link>
        </div>
      </div>
    </article>
  );
}
