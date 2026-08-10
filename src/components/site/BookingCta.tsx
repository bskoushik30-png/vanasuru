import { Link } from "@tanstack/react-router";
import { OptimizedImage } from "./OptimizedImage";

interface BookingCtaProps {
  image?: string;
}

export function BookingCta({
  image = "/images/Gemini_Generated_Image_v6somfv6somfv6so.png",
}: BookingCtaProps) {
  return (
    <section className="relative py-24 bg-[color:var(--forest-deep)] text-ivory overflow-hidden">
      <OptimizedImage
        src={image}
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-25"
        sizes="100vw"
      />
      <div className="relative z-10 max-w-4xl mx-auto text-center px-6">
        <div className="text-eyebrow">
          <span className="gold-divider mr-3" />
          Your Retreat Awaits
          <span className="gold-divider ml-3" />
        </div>
        <h2 className="mt-5 font-serif text-4xl md:text-6xl text-ivory">
          Begin the story of your stay.
        </h2>
        <p className="mt-5 text-ivory/75 max-w-xl mx-auto">
          Enquire with our hospitality team â€” we'll shape a stay around your dates, occasion, and
          every quiet preference.
        </p>
        <div className="mt-10 flex flex-wrap gap-4 justify-center">
          <Link
            to="/book"
            className="inline-flex items-center bg-[color:var(--gold)] text-[color:var(--forest-deep)] px-8 py-4 text-[11px] font-semibold tracking-[0.28em] uppercase hover:bg-ivory transition-colors"
          >
            Book Your Stay
          </Link>
          <Link
            to="/contact"
            className="inline-flex items-center border border-ivory/40 text-ivory px-8 py-4 text-[11px] font-semibold tracking-[0.28em] uppercase hover:border-[color:var(--gold)] hover:text-[color:var(--gold)] transition-colors"
          >
            Speak With Us
          </Link>
        </div>
      </div>
    </section>
  );
}
