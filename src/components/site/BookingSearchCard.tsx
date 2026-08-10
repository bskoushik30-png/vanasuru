import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Calendar, Users, Bed } from "lucide-react";
import { PROPERTIES } from "@/lib/site-data";
import type { PropertyKey } from "@/lib/site-data";

export function BookingSearchCard({ overlap = false }: { overlap?: boolean }) {
  const navigate = useNavigate();
  const [property, setProperty] = useState<PropertyKey>("mysore");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [rooms, setRooms] = useState(1);

  return (
    <div
      className={`relative bg-[color:var(--ivory)] border border-[color:var(--gold)]/30 shadow-2xl ${
        overlap ? "-mt-24" : ""
      }`}
    >
      <div className="grid grid-cols-1 md:grid-cols-6 gap-0">
        <Field label="Property" icon={null}>
          <select
            value={property}
            onChange={(e) => setProperty(e.target.value as PropertyKey)}
            className="w-full bg-transparent text-sm text-[color:var(--forest)] focus:outline-none py-2"
          >
            {Object.values(PROPERTIES).map((p) => (
              <option key={p.key} value={p.key}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Check In" icon={<Calendar size={14} className="text-[color:var(--gold)]" />}>
          <input
            type="date"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            className="w-full bg-transparent text-sm text-[color:var(--forest)] focus:outline-none py-2"
          />
        </Field>
        <Field label="Check Out" icon={<Calendar size={14} className="text-[color:var(--gold)]" />}>
          <input
            type="date"
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            className="w-full bg-transparent text-sm text-[color:var(--forest)] focus:outline-none py-2"
          />
        </Field>
        <Field label="Adults" icon={<Users size={14} className="text-[color:var(--gold)]" />}>
          <input
            type="number"
            min={1}
            value={adults}
            onChange={(e) => setAdults(+e.target.value)}
            className="w-full bg-transparent text-sm text-[color:var(--forest)] focus:outline-none py-2"
          />
        </Field>
        <Field label="Children" icon={<Users size={14} className="text-[color:var(--gold)]" />}>
          <input
            type="number"
            min={0}
            value={children}
            onChange={(e) => setChildren(+e.target.value)}
            className="w-full bg-transparent text-sm text-[color:var(--forest)] focus:outline-none py-2"
          />
        </Field>
        <Field label="Rooms" icon={<Bed size={14} className="text-[color:var(--gold)]" />}>
          <input
            type="number"
            min={1}
            value={rooms}
            onChange={(e) => setRooms(+e.target.value)}
            className="w-full bg-transparent text-sm text-[color:var(--forest)] focus:outline-none py-2"
          />
        </Field>
      </div>
      <button
        onClick={() =>
          navigate({
            to: "/book",
            search: { property, checkIn, checkOut, adults, children, rooms } as never,
          })
        }
        className="w-full bg-[color:var(--forest)] hover:bg-[color:var(--gold)] text-ivory hover:text-[color:var(--forest-deep)] transition-colors py-4 text-[11px] tracking-[0.32em] uppercase font-semibold"
      >
        Check Availability
      </button>
    </div>
  );
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block px-5 py-4 border-b md:border-b-0 md:border-r border-border/60 last:border-r-0">
      <div className="flex items-center gap-2 text-[10px] tracking-[0.28em] uppercase text-charcoal/60">
        {icon}
        {label}
      </div>
      <div className="mt-1">{children}</div>
    </label>
  );
}
