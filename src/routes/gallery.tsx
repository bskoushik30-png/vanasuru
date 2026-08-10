import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SiteShell } from "@/components/site/SiteShell";
import { PageHero } from "@/components/site/PageHero";
import { Lightbox } from "@/components/site/Lightbox";
import { OptimizedImage } from "@/components/site/OptimizedImage";
import { useBookingStore } from "@/lib/booking-store";

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: "Gallery â€” VANASURU" },
      {
        name: "description",
        content: "A world in stillness â€” glimpses across VANASURU's two destinations.",
      },
      { property: "og:title", content: "Gallery â€” VANASURU" },
      { property: "og:description", content: "A world in stillness." },
    ],
  }),
  component: GalleryPage,
});

const FILTERS = [
  "All",
  "VANASURU Silverleaf",
  "VANASURU Village",
  "Rooms",
  "Dining",
  "Events",
  "Outdoors",
] as const;

function GalleryPage() {
  const { galleryItems } = useBookingStore();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [preview, setPreview] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (filter === "All") return galleryItems;
    if (filter === "VANASURU Silverleaf") return galleryItems.filter((g) => g.tag === "mysore");
    if (filter === "VANASURU Village")
      return galleryItems.filter((g) => g.tag === "mahadevapura");
    return galleryItems.filter((g) => g.category === filter);
  }, [filter, galleryItems]);

  return (
    <SiteShell>
      <PageHero
        image="/images/DSC_1319 (1).jpg"
        eyebrow="Gallery"
        title="A world in stillness."
        intro="Glimpses across our two destinations."
      />
      <section className="py-16 px-6">
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-5 py-2 text-[11px] tracking-[0.24em] uppercase font-semibold border transition-colors ${
                filter === f
                  ? "bg-[color:var(--forest)] text-ivory border-[color:var(--forest)]"
                  : "border-border text-[color:var(--forest)] hover:bg-[color:var(--sand)]/50"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="mx-auto max-w-7xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filtered.map((g) => (
            <button
              key={g.id || g.src}
              onClick={() => setPreview(g.src)}
              className="group relative block w-full aspect-[4/3] overflow-hidden bg-charcoal/5 border border-border/40 text-left focus:outline-none cursor-pointer"
            >
              <OptimizedImage
                src={g.src}
                alt=""
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                loading="lazy"
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-[9px] uppercase font-semibold tracking-wider bg-[color:var(--sand)] text-[color:var(--forest)]">
                    {g.category}
                  </span>
                  <span className="px-2 py-0.5 text-[9px] uppercase font-semibold tracking-wider bg-white/20 backdrop-blur-sm text-white">
                    {g.tag === "mysore" ? "Mysore" : "Mahadevapura"}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>
      {preview && <Lightbox src={preview} onClose={() => setPreview(null)} />}
    </SiteShell>
  );
}

