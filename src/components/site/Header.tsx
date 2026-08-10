import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X, User as UserIcon, LogOut, LayoutDashboard, CalendarDays } from "lucide-react";
import { NAV_LINKS } from "@/lib/site-data";
import { useBookingStore } from "@/lib/booking-store";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function SiteHeader({ transparentOnTop = true }: { transparentOnTop?: boolean }) {
  const [scrolled, setScrolled] = useState(!transparentOnTop);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { currentUser, logout } = useBookingStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!transparentOnTop) return;
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [transparentOnTop]);

  useEffect(() => setOpen(false), [pathname]);

  const solid = scrolled || !transparentOnTop;
  const isAdminPage = pathname.startsWith("/admin");

  const displayLinks = isAdminPage ? [{ label: "Dashboard", to: "/admin" }] : NAV_LINKS;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500",
        solid
          ? "bg-[color:var(--forest-deep)]/95 backdrop-blur-sm shadow-[0_1px_0_rgba(184,144,74,0.25)]"
          : "bg-transparent",
      )}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-10">
        <Link to="/" className="flex items-center gap-3 leading-none" aria-label="VANASURU home">
          <img
            src="/images/logo-light.png"
            alt="VANASURU"
            className="h-14 w-14 object-contain"
            width={56}
            height={56}
          />
          <span className="hidden flex-col sm:flex">
            <span className="font-serif text-2xl tracking-[0.24em] text-ivory">VANASURU</span>
            <span className="mt-1 text-[10px] tracking-[0.32em] text-gold uppercase">
              Luxury Nature Retreats
            </span>
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-8 text-[13px] font-medium tracking-wide text-ivory/85">
          {displayLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="relative transition-colors hover:text-gold [&.active]:text-gold"
              activeProps={{ className: "active" }}
              activeOptions={{ exact: l.to === "/" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          {mounted && currentUser ? (
            <div className="hidden sm:inline-block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 text-ivory hover:text-gold cursor-pointer transition-colors text-xs font-semibold uppercase tracking-[0.16em]">
                    <UserIcon size={14} className="text-gold" />
                    <span>{currentUser.name.split(" ")[0]}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 bg-[color:var(--forest-deep)] border-[color:var(--gold)]/30 text-ivory"
                >
                  <DropdownMenuLabel className="font-serif text-sm border-b border-gold/10 pb-2">
                    {currentUser.name}
                    <div className="text-[10px] uppercase tracking-wider text-gold font-sans font-normal mt-0.5">
                      {currentUser.role === "admin" ? "Administrator" : "Guest Account"}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-gold/10" />
                  <DropdownMenuItem
                    asChild
                    className="focus:bg-[color:var(--forest)] focus:text-gold cursor-pointer py-2.5"
                  >
                    <Link to="/admin" className="flex items-center w-full gap-2">
                      <LayoutDashboard size={14} />
                      <span>{currentUser.role === "admin" ? "Admin Console" : "My Bookings"}</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    asChild
                    className="focus:bg-[color:var(--forest)] focus:text-gold cursor-pointer py-2.5"
                  >
                    <Link to="/book" className="flex items-center w-full gap-2">
                      <CalendarDays size={14} />
                      <span>Book a Room</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gold/10" />
                  <DropdownMenuItem
                    onClick={() => logout()}
                    className="focus:bg-destructive/20 focus:text-red-400 cursor-pointer text-red-300 py-2.5 flex items-center gap-2"
                  >
                    <LogOut size={14} />
                    <span>Log Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <Link
              to="/login"
              className="hidden sm:inline-flex items-center text-ivory hover:text-gold text-xs font-semibold uppercase tracking-[0.16em] transition-colors"
            >
              Sign In
            </Link>
          )}

          <Link
            to="/book"
            className="hidden sm:inline-flex items-center border border-gold bg-gold/95 px-5 py-2.5 text-[11px] font-semibold tracking-[0.28em] uppercase text-forest-deep transition-all hover:bg-transparent hover:text-gold"
          >
            Book Your Stay
          </Link>

          <button
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle navigation"
            className="lg:hidden text-ivory p-2 cursor-pointer"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden bg-[color:var(--forest-deep)] border-t border-gold/20">
          <div className="flex flex-col px-6 py-6 gap-4 text-ivory">
            {displayLinks.map((l) => (
              <Link key={l.to} to={l.to} className="text-sm tracking-wider hover:text-gold">
                {l.label}
              </Link>
            ))}

            {mounted && currentUser ? (
              <>
                <div className="h-px bg-gold/20 my-2" />
                <div className="text-xs text-gold/80 px-2 uppercase tracking-wider">
                  Logged in: {currentUser.name}
                </div>
                <Link to="/admin" className="text-sm tracking-wider hover:text-gold">
                  {currentUser.role === "admin" ? "Admin Console" : "My Bookings"}
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setOpen(false);
                  }}
                  className="text-left text-sm tracking-wider text-red-400 hover:text-red-300"
                >
                  Log Out
                </button>
              </>
            ) : (
              <Link to="/login" className="text-sm tracking-wider hover:text-gold">
                Sign In
              </Link>
            )}

            <Link
              to="/book"
              className="mt-2 inline-flex justify-center border border-gold px-5 py-3 text-[11px] font-semibold tracking-[0.28em] uppercase text-gold"
            >
              Book Your Stay
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

