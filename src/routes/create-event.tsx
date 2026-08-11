import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useBookingStore, extractMapEmbedUrl } from "@/lib/booking-store";
import { PROPERTIES, FUNCTION_HALLS } from "@/lib/site-data";
import { uploadImageToProjectDb } from "@/lib/booking-api";
import { SiteShell } from "@/components/site/SiteShell";
import { PageHero } from "@/components/site/PageHero";
import { SectionHeading } from "@/components/site/SectionHeading";
import {
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Image as ImageIcon,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  Upload,
  Building2,
} from "lucide-react";

export const Route = createFileRoute("/create-event")({
  head: () => ({
    meta: [
      { title: "Create Event & Function Hall â€” VANASURU" },
      {
        name: "description",
        content: "Create and publish new resort events and function hall offerings.",
      },
    ],
  }),
  component: CreateEventPage,
});

function CreateEventPage() {
  const navigate = useNavigate();
  const { locations, addEvent, currentUser } = useBookingStore();

  const [title, setTitle] = useState("");
  const [property, setProperty] = useState(locations[0]?.key || "mysore");
  const [venue, setVenue] = useState(FUNCTION_HALLS[0]?.name || "Heritage Gardens & Lawns");
  const [date, setDate] = useState("");
  const [capacity, setCapacity] = useState("200");
  const [price, setPrice] = useState("50000");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(
    "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=75",
  );
  const [isHighlighted, setIsHighlighted] = useState(true);
  const [imageFileName, setImageFileName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!title.trim()) {
      setErrorMsg("Please enter an event title");
      return;
    }

    try {
      let finalImage = image;
      if (image.startsWith("data:image")) {
        const uploadRes = await uploadImageToProjectDb({
          data: {
            fileName: imageFileName || `event-${Date.now()}.jpg`,
            dataUrl: image,
            folder: "events",
          },
        });
        if (!uploadRes?.url) throw new Error("Event image upload did not return a URL.");
        finalImage = uploadRes.url;
      }

      addEvent({
        title: title.trim(),
        description: description.trim() || "Exclusive event and celebration hosted at VANASURU.",
        property,
        venue,
        date: date || "Available Daily",
        capacity: parseInt(capacity, 10) || 100,
        price: parseFloat(price) || 0,
        image:
          finalImage ||
          "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=75",
        isHighlighted,
      });

      setSubmitted(true);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to create event");
    }
  };

  return (
    <SiteShell>
      <PageHero
        image="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=75"
        eyebrow="Resort Event Management"
        title="Create New Event or Function Hall"
        intro="Publish upcoming events, wedding galas, or function hall offerings to highlight across the resort and Home page."
      />

      <section className="py-20 px-6 max-w-4xl mx-auto">
        <Link
          to="/events"
          className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-charcoal/60 hover:text-[color:var(--forest)] mb-8 transition-colors"
        >
          <ArrowLeft size={14} /> Back to Events
        </Link>

        {submitted ? (
          <div className="bg-card border border-[color:var(--gold)]/40 p-12 text-center shadow-lg">
            <CheckCircle2 className="mx-auto text-[color:var(--gold)]" size={48} />
            <h3 className="mt-6 font-serif text-3xl text-[color:var(--forest)]">
              Event Published Successfully!
            </h3>
            <p className="mt-3 text-charcoal/70 max-w-md mx-auto">
              "{title}" has been created and{" "}
              {isHighlighted
                ? "is now highlighted on the Home page"
                : "is now live on the Events page"}
              .
            </p>
            <div className="mt-8 flex flex-wrap gap-4 justify-center">
              <Link
                to="/events"
                className="bg-[color:var(--forest)] text-ivory px-6 py-3 text-xs font-semibold tracking-widest uppercase hover:bg-[color:var(--gold)] hover:text-[color:var(--forest-deep)] transition-colors"
              >
                View on Events Page
              </Link>
              <Link
                to="/"
                className="border border-border px-6 py-3 text-xs font-semibold tracking-widest uppercase hover:border-[color:var(--gold)] transition-colors"
              >
                Go to Home Page
              </Link>
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setTitle("");
                  setDescription("");
                }}
                className="text-xs text-[color:var(--gold)] underline underline-offset-4 py-3"
              >
                Create Another Event
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-card border border-border/60 p-8 md:p-12 shadow-sm">
            <div className="flex items-center gap-3 border-b border-border/60 pb-6 mb-8">
              <Sparkles className="text-[color:var(--gold)]" size={24} />
              <div>
                <h2 className="font-serif text-2xl text-[color:var(--forest)]">
                  Event & Venue Details
                </h2>
                <p className="text-xs text-charcoal/60 mt-0.5">
                  Fill in the details below to publish an event or list a function hall in the
                  vicinity.
                </p>
              </div>
            </div>

            {errorMsg && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="block">
                  <div className="text-[10px] tracking-[0.28em] uppercase text-charcoal/70 font-semibold mb-2">
                    Event or Function Hall Title *
                  </div>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Royal Heritage Wedding Gala / Grand Banquet Celebration"
                    className="w-full bg-transparent border border-border focus:border-[color:var(--gold)] focus:outline-none px-4 py-3 text-sm"
                  />
                </label>
              </div>

              <div>
                <label className="block">
                  <div className="text-[10px] tracking-[0.28em] uppercase text-charcoal/70 font-semibold mb-2 flex items-center gap-1.5">
                    <MapPin size={12} className="text-[color:var(--gold)]" /> Select Resort Location
                    *
                  </div>
                  <select
                    value={property}
                    onChange={(e) => setProperty(e.target.value)}
                    className="w-full bg-transparent border border-border focus:border-[color:var(--gold)] focus:outline-none px-4 py-3 text-sm"
                  >
                    {locations.length > 0
                      ? locations.map((loc) => (
                          <option key={loc.key} value={loc.key}>
                            {loc.name} ({loc.address.split(",")[0]})
                          </option>
                        ))
                      : Object.values(PROPERTIES).map((p) => (
                          <option key={p.key} value={p.key}>
                            {p.name}
                          </option>
                        ))}
                  </select>
                </label>
              </div>

              <div>
                <label className="block">
                  <div className="text-[10px] tracking-[0.28em] uppercase text-charcoal/70 font-semibold mb-2 flex items-center gap-1.5">
                    <Building2 size={12} className="text-[color:var(--gold)]" /> Function Hall /
                    Venue Name *
                  </div>
                  <input
                    type="text"
                    required
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    placeholder="e.g. Heritage Gardens & Lawns / Grand Ballroom"
                    className="w-full bg-transparent border border-border focus:border-[color:var(--gold)] focus:outline-none px-4 py-3 text-sm"
                  />
                </label>
              </div>



              <div>
                <label className="block">
                  <div className="text-[10px] tracking-[0.28em] uppercase text-charcoal/70 font-semibold mb-2 flex items-center gap-1.5">
                    <Users size={12} className="text-[color:var(--gold)]" /> Guest Capacity
                  </div>
                  <input
                    type="number"
                    min="1"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    placeholder="200"
                    className="w-full bg-transparent border border-border focus:border-[color:var(--gold)] focus:outline-none px-4 py-3 text-sm"
                  />
                </label>
              </div>

              <div>
                <label className="block">
                  <div className="text-[10px] tracking-[0.28em] uppercase text-charcoal/70 font-semibold mb-2 flex items-center gap-1.5">
                    <DollarSign size={12} className="text-[color:var(--gold)]" /> Rental / Entry
                    Price (â‚¹)
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="50000"
                    className="w-full bg-transparent border border-border focus:border-[color:var(--gold)] focus:outline-none px-4 py-3 text-sm"
                  />
                </label>
              </div>

              <div className="md:col-span-2">
                <label className="block">
                  <div className="text-[10px] tracking-[0.28em] uppercase text-charcoal/70 font-semibold mb-2">
                    Event Cover Photo
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 items-start">
                    <input
                      type="url"
                      value={image}
                      onChange={(e) => setImage(e.target.value)}
                      placeholder="Paste Image URL..."
                      className="flex-1 w-full bg-transparent border border-border focus:border-[color:var(--gold)] focus:outline-none px-4 py-3 text-sm"
                    />
                    <label className="cursor-pointer bg-[color:var(--sand)]/80 hover:bg-[color:var(--sand)] text-charcoal px-4 py-3 border border-border flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
                      <Upload size={14} /> Upload File
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {image && (
                    <div className="mt-3 relative h-40 w-full overflow-hidden border border-border">
                      <img src={image} alt="Preview" className="h-full w-full object-cover" />
                    </div>
                  )}
                </label>
              </div>

              <div className="md:col-span-2">
                <label className="block">
                  <div className="text-[10px] tracking-[0.28em] uppercase text-charcoal/70 font-semibold mb-2">
                    Description & Special Notes
                  </div>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the occasion, catering options, decor inclusions, or booking guidelines..."
                    className="w-full bg-transparent border border-border focus:border-[color:var(--gold)] focus:outline-none px-4 py-3 text-sm"
                  />
                </label>
              </div>

              <div className="md:col-span-2 bg-[color:var(--sand)]/30 p-4 border border-border flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sm text-[color:var(--forest)] flex items-center gap-2">
                    <Sparkles size={16} className="text-[color:var(--gold)]" /> Highlight on Home
                    Page
                  </div>
                  <p className="text-xs text-charcoal/65 mt-0.5">
                    Feature this event in the prominent Home page "Events & Function Halls"
                    showcase.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={isHighlighted}
                  onChange={(e) => setIsHighlighted(e.target.checked)}
                  className="w-5 h-5 accent-[color:var(--gold)] cursor-pointer"
                />
              </div>

              <div className="md:col-span-2 pt-4">
                <button
                  type="submit"
                  className="w-full bg-[color:var(--forest)] hover:bg-[color:var(--gold)] hover:text-[color:var(--forest-deep)] text-ivory py-4 text-[11px] font-semibold tracking-[0.28em] uppercase transition-colors"
                >
                  Publish Event & Function Hall
                </button>
              </div>
            </form>
          </div>
        )}
      </section>
    </SiteShell>
  );
}



