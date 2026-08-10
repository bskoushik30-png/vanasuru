# VANASURU — Build Plan

This is a large multi-page site plus an authenticated admin dashboard with a database. I'll ship it in phases so you can review as it comes together, rather than dumping everything in one giant turn.

## Design foundation (Phase 0)

- Palette wired as semantic tokens in `src/styles.css` (deep forest `#173F35`, sage `#8FA58A`, ivory `#F6F1E8`, sand `#E8DFD0`, gold `#B8904A`, charcoal `#242424`).
- Fonts loaded via `<link>` in `__root.tsx`: **Cormorant Garamond** (headings) + **Manrope** (body). Gold accent utilities for dividers/buttons.
- Shared components: `SiteHeader` (transparent → forest-green on scroll), `SiteFooter`, `BookingSearchCard`, `SectionHeading`, `GoldDivider`, `WhatsAppFab`, `RoomCard`, `ResortCard`, `Lightbox`.
- Hero + section imagery: curated Unsplash luxury-resort URLs (no local asset generation — keeps the build fast and easy to swap later).

## Public pages (Phase 1)

Routes under `src/routes/`, each with its own `head()` metadata:

- `/` Home — cinematic hero, floating booking card, brand intro, two resort cards, featured rooms, experiences, gallery preview, events preview, testimonials, CTA, footer.
- `/about`, `/resorts`, `/resorts/mysore`, `/resorts/mahadevapura`
- `/rooms` (Book This Room → `/book?room=...&property=...`)
- `/experiences`, `/gallery` (masonry + filters + lightbox), `/events`, `/contact`
- `/book` — 3-step enquiry form with success state.

## Backend (Phase 2) — Lovable Cloud

Enable Lovable Cloud, then migrations for:

- `resorts`, `rooms`, `services`, `gallery_images`, `testimonials`
- `booking_enquiries`, `event_enquiries`, `contact_enquiries` (all with `status` enum: `new | contacted | confirmed | cancelled`)
- `app_role` enum + `user_roles` table + `has_role()` security-definer function
- RLS:
  - Public read on resorts/rooms/services/gallery/testimonials (safe columns)
  - Anonymous INSERT allowed on the three enquiry tables (rate-limited by RLS)
  - Only `admin` role can SELECT/UPDATE enquiries and manage content tables
- Public-anon key used for enquiry inserts and public reads via a server publishable client / browser client.

## Admin (Phase 3)

- `/auth` (email+password + Google sign-in via the Lovable broker) — public route.
- `/_authenticated/admin/*` (integration-managed gate):
  - Overview: total / new / confirmed / property-wise cards
  - Booking enquiries table: search + filters (property, status, date, name), row → details modal, status update, CSV export
  - Event enquiries, Contact enquiries (same shape)
  - Content managers: Resorts, Rooms, Services, Gallery, Testimonials (CRUD, image URLs; storage upload can be layered in later)
- First admin: I'll add a one-time "promote me" server fn gated by a secret you set, OR simply document seeding via SQL — recommending the secret-gated promote fn.

## Technical section

- Stack: TanStack Start + React 19 + Tailwind v4 + shadcn + Lucide + Framer Motion (subtle) + Lovable Cloud (Supabase). Zod for form validation, react-hook-form for the multi-step booking form, TanStack Query for admin data.
- Enquiry writes go through a public `createServerFn` with Zod validation (no auth required); admin reads/mutations go through `requireSupabaseAuth` + `has_role('admin')` check.
- CSV export built client-side from fetched rows (no extra dependency).
- Gallery filters and lightbox are client state; images are URL strings on `gallery_images` rows.
- Architecture leaves clean seams for later Razorpay, real-time availability, and confirmation emails/WhatsApp — but none of those are wired now.

## What I'm NOT doing (per your instructions)

- No real payment integration
- No email/WhatsApp sending (WhatsApp FAB uses a placeholder number)
- No real Google Maps embed — placeholder iframe or styled map card
- No custom photography — Unsplash placeholder URLs throughout

## Delivery order in chat

1. Approve this plan.
2. I ship Phase 0 + Phase 1 (design system + all public pages with placeholder content, fully navigable). You review the look.
3. I enable Lovable Cloud, ship Phase 2 schema + wire the public enquiry forms to the DB.
4. I ship Phase 3 (auth + admin dashboard + CRUD).

Reply "go" (or with tweaks) and I'll start Phase 0+1.
