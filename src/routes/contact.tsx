import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Phone, Mail, MapPin, CheckCircle2 } from "lucide-react";
import { SiteShell } from "@/components/site/SiteShell";
import { PageHero } from "@/components/site/PageHero";
import { SectionHeading } from "@/components/site/SectionHeading";
import { PROPERTIES } from "@/lib/site-data";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact â€” VANASURU" },
      { name: "description", content: "Reach VANASURU Silverleaf or VANASURU Village." },
      { property: "og:title", content: "Contact â€” VANASURU" },
      { property: "og:description", content: "We'd love to hear from you." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [sent, setSent] = useState(false);
  return (
    <SiteShell>
      <PageHero
        image="/images/DSC05333.JPG.jpeg"
        eyebrow="Contact"
        title="We'd love to hear from you."
        intro="Reach either property directly, or send us a note â€” we respond within one working day."
      />

      <section className="py-24 px-6">
        <div className="mx-auto max-w-6xl grid gap-8 md:grid-cols-2">
          {Object.values(PROPERTIES).map((p) => (
            <div key={p.key} className="bg-card border border-border/60 p-10">
              <div className="text-eyebrow">{p.location}</div>
              <h3 className="mt-3 font-serif text-3xl text-[color:var(--forest)]">{p.name}</h3>
              <ul className="mt-6 space-y-4 text-sm text-charcoal/80">
                <li className="flex gap-3">
                  <MapPin size={16} className="text-[color:var(--gold)] mt-0.5 shrink-0" />
                  {p.address}
                </li>
                <li className="flex gap-3">
                  <Phone size={16} className="text-[color:var(--gold)] mt-0.5 shrink-0" />
                  {p.phone}
                </li>
                <li className="flex gap-3">
                  <Mail size={16} className="text-[color:var(--gold)] mt-0.5 shrink-0" />
                  {p.email}
                </li>
              </ul>
              {p.mapEmbedUrl ? (
                <div className="mt-6 aspect-[16/9] w-full overflow-hidden border border-border/60 rounded-sm">
                  <iframe
                    src={p.mapEmbedUrl}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="strict-origin-when-cross-origin"
                    title={`${p.name} Location Map`}
                    className="w-full h-full"
                  />
                </div>
              ) : (
                <div className="mt-6 aspect-[16/9] bg-[color:var(--sand)]/60 border border-border/60 flex items-center justify-center text-charcoal/50 text-sm">
                  <div className="text-center">
                    <MapPin className="mx-auto mb-2 text-[color:var(--gold)]" size={20} />
                    Map placeholder
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="py-24 px-6 bg-[color:var(--sand)]/40">
        <div className="mx-auto max-w-3xl">
          <SectionHeading eyebrow="General Enquiry" title="Send us a note." />
          {sent ? (
            <div className="mt-14 bg-card border border-[color:var(--gold)]/40 p-12 text-center">
              <CheckCircle2 className="mx-auto text-[color:var(--gold)]" size={40} />
              <h3 className="mt-6 font-serif text-3xl text-[color:var(--forest)]">
                Message received.
              </h3>
              <p className="mt-3 text-charcoal/70">We'll be in touch shortly.</p>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSent(true);
              }}
              className="mt-14 bg-card border border-border/60 p-8 md:p-10 grid gap-6 md:grid-cols-2"
            >
              <TF label="Name" required />
              <TF label="Email" type="email" required />
              <TF label="Mobile" type="tel" required />
              <TF label="Subject" required />
              <label className="md:col-span-2 block">
                <div className="text-[10px] tracking-[0.28em] uppercase text-charcoal/60">
                  Message
                </div>
                <textarea
                  rows={5}
                  required
                  className="mt-2 w-full bg-transparent border border-border focus:border-[color:var(--gold)] focus:outline-none px-4 py-3 text-sm"
                />
              </label>
              <button
                type="submit"
                className="md:col-span-2 bg-[color:var(--forest)] hover:bg-[color:var(--gold)] hover:text-[color:var(--forest-deep)] text-ivory py-4 text-[11px] font-semibold tracking-[0.28em] uppercase transition-colors"
              >
                Send Message
              </button>
            </form>
          )}
        </div>
      </section>
    </SiteShell>
  );
}

function TF({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <div className="text-[10px] tracking-[0.28em] uppercase text-charcoal/60">{label}</div>
      <input
        {...props}
        className="mt-2 w-full bg-transparent border border-border focus:border-[color:var(--gold)] focus:outline-none px-4 py-3 text-sm"
      />
    </label>
  );
}

