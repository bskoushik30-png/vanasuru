import { Link, useRouterState } from "@tanstack/react-router";
import { Facebook, Instagram, Youtube, Mail, Phone, MapPin } from "lucide-react";
import { BRAND, PROPERTIES, NAV_LINKS } from "@/lib/site-data";

export function SiteFooter() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAdminPage = pathname.startsWith("/admin");

  if (isAdminPage) {
    return (
      <footer className="bg-[color:var(--forest-deep)] border-t border-gold/20 text-ivory/85">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 py-6 flex flex-col sm:flex-row justify-between gap-3 text-xs text-ivory/50">
          <div>Â© {new Date().getFullYear()} VANASURU Admin Console. All rights reserved.</div>
          <div className="flex gap-6">
            <Link to="/" className="hover:text-gold">
              Home Page
            </Link>
            <Link to="/rooms" className="hover:text-gold">
              Rooms & Availability
            </Link>
            <Link to="/book" className="hover:text-gold">
              Book Stay
            </Link>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-[color:var(--forest-deep)] text-ivory/85">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-16 grid gap-12 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link to="/" className="inline-flex items-center gap-4" aria-label="VANASURU home">
            <img
              src="/images/logo-light.png"
              alt="VANASURU"
              className="h-20 w-20 object-contain"
              width={80}
              height={80}
            />
            <span className="flex flex-col">
              <span className="font-serif text-3xl tracking-[0.22em] text-ivory">VANASURU</span>
              <span className="mt-2 text-eyebrow">Luxury Nature Retreats</span>
            </span>
          </Link>
          <p className="mt-6 text-sm leading-relaxed text-ivory/70 max-w-sm">
            {BRAND.tagline} Slow mornings, refined interiors, and hospitality with a soul â€” across
            two considered destinations.
          </p>
          <div className="mt-6 flex gap-4 text-ivory/70">
            <a href="#" aria-label="Instagram" className="hover:text-gold">
              <Instagram size={18} />
            </a>
            <a href="#" aria-label="Facebook" className="hover:text-gold">
              <Facebook size={18} />
            </a>
            <a href="#" aria-label="YouTube" className="hover:text-gold">
              <Youtube size={18} />
            </a>
          </div>
        </div>

        <div>
          <div className="text-eyebrow">Explore</div>
          <ul className="mt-5 space-y-3 text-sm">
            {NAV_LINKS.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="hover:text-gold transition-colors">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {Object.values(PROPERTIES).map((p) => (
          <div key={p.key}>
            <div className="text-eyebrow">{p.name}</div>
            <ul className="mt-5 space-y-3 text-sm text-ivory/70">
              <li className="flex gap-3">
                <MapPin size={16} className="mt-0.5 text-gold shrink-0" />
                {p.address}
              </li>
              <li className="flex gap-3">
                <Phone size={16} className="mt-0.5 text-gold shrink-0" />
                {p.phone}
              </li>
              <li className="flex gap-3">
                <Mail size={16} className="mt-0.5 text-gold shrink-0" />
                {p.email}
              </li>
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-ivory/10">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 py-6 flex flex-col sm:flex-row justify-between gap-3 text-xs text-ivory/50">
          <div>Â© {new Date().getFullYear()} VANASURU Hospitality. All rights reserved.</div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-gold">
              Privacy
            </a>
            <a href="#" className="hover:text-gold">
              Terms
            </a>
            <a href="#" className="hover:text-gold">
              Sitemap
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

