import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  useBookingStore,
  PHYSICAL_ROOMS,
  extractMapEmbedUrl,
  type Booking,
  type PaymentEntry,
  type PhysicalRoom,
  type Location,
  type User,
  type GalleryItem,
  type ResortEvent,
  type EventBooking,
} from "@/lib/booking-store";
import { PROPERTIES, ROOMS } from "@/lib/site-data";
import { uploadImageToProjectDb } from "@/lib/booking-api";
import { SiteShell } from "@/components/site/SiteShell";
import { SectionHeading } from "@/components/site/SectionHeading";
import { BillInvoiceModal } from "@/components/site/BillInvoiceModal";
import {
  Check,
  X,
  Trash2,
  User as UserIcon,
  Calendar,
  Home,
  TrendingUp,
  Info,
  Plus,
  ArrowLeft,
  CircleCheck,
  CircleAlert,
  HelpCircle,
  MapPin,
  BedDouble,
  Building2,
  Image,
  Sparkles,
  Upload,
  Eye,
  Star,
  Lock,
  Pencil,
  IndianRupee,
  FileText,
  Mail,
  Phone,
  IdCard,
  ShieldCheck,
  LogIn,
  LogOut,
  PlusCircle,
  Clock,
} from "lucide-react";
import { format, addDays, parseISO, differenceInDays } from "date-fns";

type BookingStatus = Booking["status"];
type BookingStatusFilter = "all" | BookingStatus;

const BOOKING_STATUS_FILTERS: BookingStatusFilter[] = [
  "all",
  "pending",
  "confirmed",
  "checked_in",
  "checked_out",
  "cancelled",
];

function isBookingStatusFilter(value: string): value is BookingStatusFilter {
  return BOOKING_STATUS_FILTERS.includes(value as BookingStatusFilter);
}

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "Dashboard â€” VANASURU" }],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();
  const store = useBookingStore();
  const {
    currentUser,
    bookings,
    locations,
    rooms,
    galleryItems,
    events,
    eventBookings,
    updateBookingStatus,
    deleteBooking,
    addLocation,
    deleteLocation,
    addRoom,
    updateRoom,
    deleteRoom,
    addGalleryItem,
    deleteGalleryItem,
    addEvent,
    deleteEvent,
    toggleHighlightEvent,
    createEventBooking,
    updateEventBookingStatus,
    checkInEventBooking,
    checkOutEventBooking,
    addEventPaymentEntry,
    addEventExtraCharge,
    updateEventCustomGrandTotal,
    deleteEventBooking,
    updateLocationPhotos,
    updateLocationMapEmbed,
    updateRoomPhotos,
    updateRoomAdvanceAmount,
    updateAllRoomsAdvanceAmount,
    adminBlockRoom,
    checkInBooking,
    checkOutBooking,
    addPaymentEntry,
    addExtraCharge,
    updateCustomGrandTotal,
    deleteAllBookings,
  } = store;

  // Redirect to login if not logged in
  useEffect(() => {
    if (!currentUser) {
      navigate({ to: "/login", search: { redirectTo: "/admin" } });
    }
  }, [currentUser, navigate]);

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[color:var(--sand)]/20">
        <p className="text-sm text-charcoal/60">Redirecting to login...</p>
      </div>
    );
  }

  return (
    <SiteShell transparentHeader={false}>
      {currentUser.role === "admin" ? (
        <AdminConsole
          bookings={bookings}
          locations={locations}
          rooms={rooms}
          galleryItems={galleryItems}
          events={events}
          eventBookings={eventBookings}
          updateStatus={updateBookingStatus}
          deleteBooking={deleteBooking}
          deleteAllBookings={deleteAllBookings}
          addLocation={addLocation}
          deleteLocation={deleteLocation}
          addRoom={addRoom}
          updateRoom={updateRoom}
          deleteRoom={deleteRoom}
          addGalleryItem={addGalleryItem}
          deleteGalleryItem={deleteGalleryItem}
          addEvent={addEvent}
          deleteEvent={deleteEvent}
          toggleHighlightEvent={toggleHighlightEvent}
          createEventBooking={createEventBooking}
          updateEventBookingStatus={updateEventBookingStatus}
          checkInEventBooking={checkInEventBooking}
          checkOutEventBooking={checkOutEventBooking}
          addEventPaymentEntry={addEventPaymentEntry}
          addEventExtraCharge={addEventExtraCharge}
          updateEventCustomGrandTotal={updateEventCustomGrandTotal}
          deleteEventBooking={deleteEventBooking}
          updateLocationPhotos={updateLocationPhotos}
          updateLocationMapEmbed={updateLocationMapEmbed}
          updateRoomPhotos={updateRoomPhotos}
          updateRoomAdvanceAmount={updateRoomAdvanceAmount}
          updateAllRoomsAdvanceAmount={updateAllRoomsAdvanceAmount}
          adminBlockRoom={adminBlockRoom}
          checkInBooking={checkInBooking}
          checkOutBooking={checkOutBooking}
          addPaymentEntry={addPaymentEntry}
          addExtraCharge={addExtraCharge}
          updateCustomGrandTotal={updateCustomGrandTotal}
        />
      ) : (
        <ClientDashboard
          currentUser={currentUser}
          bookings={bookings}
          eventBookings={eventBookings}
          cancelBooking={(id) => updateBookingStatus(id, "cancelled")}
        />
      )}
    </SiteShell>
  );
}

// ---------------------------------------------------------------------------
// EVENT TIMELINE ROW
// ---------------------------------------------------------------------------
function EventTimelineRow({
  venueName,
  dates,
  eventBookings,
  todayStr,
}: {
  venueName: string;
  dates: Date[];
  eventBookings: EventBooking[];
  todayStr: string;
}) {
  return (
    <>
      {/* Venue Column */}
      <div className="p-4 border-r border-b border-border/60 bg-amber-50/20 flex flex-col justify-center">
        <div className="font-serif text-xs font-bold text-[color:var(--forest)] flex items-center gap-1.5">
          <Sparkles size={13} className="text-amber-600 shrink-0" />
          <span className="truncate">{venueName}</span>
        </div>
        <div className="text-[9px] uppercase tracking-wider text-amber-700 mt-0.5 font-medium">
          Function Hall / Venue
        </div>
      </div>

      {/* Date Columns */}
      {dates.map((date, idx) => {
        const dateStr = date.toISOString().split("T")[0];
        const isToday = dateStr === todayStr;

        const eb = eventBookings.find(
          (b) =>
            b.status !== "cancelled" &&
            b.eventDate === dateStr &&
            (b.venue.toLowerCase().includes(venueName.toLowerCase()) ||
              venueName.toLowerCase().includes(b.venue.toLowerCase())),
        );

        if (eb) {
          const isConfirmed =
            eb.status === "confirmed" || eb.status === "checked_in" || eb.status === "checked_out";

          return (
            <div
              key={idx}
              className={`border-r border-b border-border/60 relative p-1 flex items-center justify-center text-center ${
                isToday ? "bg-amber-100/60" : "bg-amber-50/20"
              }`}
            >
              <div
                title={`🎉 Event: ${eb.eventTitle}\nClient: ${eb.userName} (${eb.userEmail})\nPhone: ${eb.guestDetails?.mobile || "N/A"}\nDate: ${eb.eventDate}\nGuests: ${eb.guestsCount}\nStatus: ${eb.status}\nTotal Fee: ₹${(eb.totalAmount || 50000).toLocaleString("en-IN")}`}
                className={`absolute inset-0.5 flex flex-col items-center justify-center rounded-sm overflow-hidden text-[9px] font-bold tracking-wider cursor-pointer shadow-sm ${
                  isConfirmed
                    ? "bg-amber-700 text-white border border-amber-400"
                    : "bg-amber-200 text-amber-900 border border-amber-400"
                }`}
              >
                <span className="truncate px-1 text-[8px] leading-tight font-semibold">🎉 {eb.eventTitle}</span>
                <span className="text-[7px] opacity-90 font-normal truncate max-w-full">
                  {eb.userName.split(" ")[0]}
                </span>
              </div>
            </div>
          );
        }

        return (
          <div
            key={idx}
            className={`border-r border-b border-border/60 flex items-center justify-center p-1 bg-amber-50/10 ${
              isToday ? "bg-amber-50/40" : ""
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-300/40" />
          </div>
        );
      })}
    </>
  );
}

// ---------------------------------------------------------------------------
// 1. ADMIN CONSOLE
// ---------------------------------------------------------------------------
function AdminConsole({
  bookings,
  locations,
  rooms,
  galleryItems,
  events,
  eventBookings,
  updateStatus,
  deleteBooking,
  deleteAllBookings: deleteAllBookingsFn,
  addLocation: addLocationFn,
  deleteLocation: deleteLocationFn,
  addRoom: addRoomFn,
  updateRoom: updateRoomFn,
  deleteRoom: deleteRoomFn,
  addGalleryItem: addGalleryItemFn,
  deleteGalleryItem: deleteGalleryItemFn,
  addEvent: addEventFn,
  deleteEvent: deleteEventFn,
  toggleHighlightEvent: toggleHighlightEventFn,
  createEventBooking: createEventBookingFn,
  updateEventBookingStatus: updateEventBookingStatusFn,
  checkInEventBooking: checkInEventBookingFn,
  checkOutEventBooking: checkOutEventBookingFn,
  addEventPaymentEntry: addEventPaymentEntryFn,
  addEventExtraCharge: addEventExtraChargeFn,
  updateEventCustomGrandTotal: updateEventCustomGrandTotalFn,
  deleteEventBooking: deleteEventBookingFn,
  updateLocationPhotos: updateLocationPhotosFn,
  updateLocationMapEmbed: updateLocationMapEmbedFn,
  updateRoomPhotos: updateRoomPhotosFn,
  updateRoomAdvanceAmount: updateRoomAdvanceAmountFn,
  updateAllRoomsAdvanceAmount: updateAllRoomsAdvanceAmountFn,
  adminBlockRoom: adminBlockRoomFn,
  checkInBooking: checkInBookingFn,
  checkOutBooking: checkOutBookingFn,
  addPaymentEntry: addPaymentEntryFn,
  addExtraCharge: addExtraChargeFn,
  updateCustomGrandTotal: updateCustomGrandTotalFn,
}: {
  bookings: Booking[];
  locations: Location[];
  rooms: PhysicalRoom[];
  galleryItems: GalleryItem[];
  events: ResortEvent[];
  eventBookings: EventBooking[];
  updateStatus: (id: string, s: BookingStatus) => boolean;
  deleteBooking: (id: string) => Promise<boolean>;
  deleteAllBookings: () => Promise<boolean>;
  addLocation: (loc: Omit<Location, "id">) => Promise<{ success: boolean; error?: string }>;
  deleteLocation: (id: string) => Promise<{ success: boolean; error?: string }>;
  addRoom: (room: PhysicalRoom) => Promise<{ success: boolean; error?: string }>;
  updateRoom: (room: PhysicalRoom) => Promise<{ success: boolean; error?: string }>;
  deleteRoom: (roomId: string) => Promise<{ success: boolean; error?: string }>;
  addGalleryItem: (item: Omit<GalleryItem, "id">) => GalleryItem;
  deleteGalleryItem: (id: string) => boolean;
  addEvent: (eventData: Omit<ResortEvent, "id" | "createdAt">) => ResortEvent;
  deleteEvent: (id: string) => boolean;
  toggleHighlightEvent: (id: string) => boolean;
  createEventBooking: (data: Omit<EventBooking, "id" | "createdAt" | "status"> & { paymentMode?: PaymentEntry["mode"] }) => { success: boolean; booking?: EventBooking; error?: string };
  updateEventBookingStatus: (id: string, s: EventBooking["status"]) => boolean;
  checkInEventBooking: (id: string) => boolean;
  checkOutEventBooking: (id: string) => boolean;
  addEventPaymentEntry: (id: string, entry: Omit<PaymentEntry, "id">) => boolean;
  addEventExtraCharge: (id: string, charge: { amount: number; reason: string }) => boolean;
  updateEventCustomGrandTotal: (id: string, customTotal: number) => boolean;
  deleteEventBooking: (id: string) => boolean;
  updateLocationPhotos: (keyOrId: string, photos: string[]) => boolean;
  updateLocationMapEmbed: (keyOrId: string, url: string) => boolean;
  updateRoomPhotos: (roomId: string, photos: string[]) => boolean;
  updateRoomAdvanceAmount: (
    roomId: string,
    advanceAmount: number,
  ) => Promise<{ success: boolean; error?: string }>;
  updateAllRoomsAdvanceAmount: (
    advanceAmount: number,
  ) => Promise<{ success: boolean; error?: string }>;
  adminBlockRoom: (data: {
    roomId: string;
    checkIn: string;
    checkOut: string;
    guestName: string;
    guestEmail?: string;
    guestMobile?: string;
    idProofType?: string;
    idProofNumber?: string;
    idProofImage?: string;
    notes?: string;
  }) => { success: boolean; error?: string };
  checkInBooking: (id: string) => { success: boolean; booking?: Booking; error?: string };
  checkOutBooking: (id: string) => { success: boolean; booking?: Booking; error?: string };
  addPaymentEntry: (
    id: string,
    entry: Omit<PaymentEntry, "id">,
  ) => { success: boolean; booking?: Booking; error?: string };
  addExtraCharge: (
    id: string,
    charge: { amount: number; reason: string },
  ) => { success: boolean; booking?: Booking; error?: string };
  updateCustomGrandTotal: (
    id: string,
    customTotal: number,
  ) => { success: boolean; booking?: Booking; error?: string };
}) {
  const [selectedProperty, setSelectedProperty] = useState(locations[0]?.key || "mysore");
  const [activeTab, setActiveTab] = useState<
    "bookings" | "timeline" | "rooms" | "locations" | "gallery" | "events"
  >("bookings");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<BookingStatusFilter>("all");

  const [showBookModal, setShowBookModal] = useState(false);
  const [bookSuccess, setBookSuccess] = useState("");
  const [bookError, setBookError] = useState("");
  const [selectedGuestBooking, setSelectedGuestBooking] = useState<Booking | null>(null);
  const [invoiceBooking, setInvoiceBooking] = useState<Booking | EventBooking | null>(null);
  const [expandedIdImage, setExpandedIdImage] = useState<string | null>(null);
  const [resendNotifyMsg, setResendNotifyMsg] = useState("");

  // Payment Entry Form State inside Member Profile
  const [newPayAmount, setNewPayAmount] = useState("");
  const [newPayMode, setNewPayMode] = useState<PaymentEntry["mode"]>("Cash");
  const [newPayNotes, setNewPayNotes] = useState("");
  const [payStatusMsg, setPayStatusMsg] = useState("");

  // Extra Charges & Custom Grand Total State
  const [extraChargeAmount, setExtraChargeAmount] = useState("");
  const [extraChargeReason, setExtraChargeReason] = useState("");
  const [extraChargeMsg, setExtraChargeMsg] = useState("");
  const [isEditingGrandTotal, setIsEditingGrandTotal] = useState(false);
  const [customTotalInput, setCustomTotalInput] = useState("");

  const handleGuestCheckIn = (bId: string) => {
    const res = checkInBookingFn(bId);
    if (res.success && res.booking) {
      setSelectedGuestBooking(res.booking);
    }
  };

  const handleGuestCheckOut = (bId: string) => {
    const res = checkOutBookingFn(bId);
    if (res.success && res.booking) {
      setSelectedGuestBooking(res.booking);
    }
  };

  const handleAddPaymentRecord = (bId: string) => {
    setPayStatusMsg("");
    const amt = parseFloat(newPayAmount);
    if (isNaN(amt) || amt <= 0) {
      setPayStatusMsg("Please enter a valid payment amount (> 0)");
      return;
    }

    const res = addPaymentEntryFn(bId, {
      amount: amt,
      mode: newPayMode,
      notes: newPayNotes.trim() || undefined,
      date: new Date().toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    });

    if (res.success && res.booking) {
      setSelectedGuestBooking(res.booking);
      setNewPayAmount("");
      setNewPayNotes("");
      setPayStatusMsg("Payment recorded successfully!");
      setTimeout(() => setPayStatusMsg(""), 2500);
    } else {
      setPayStatusMsg(res.error || "Failed to record payment");
    }
  };

  const handleAddExtraChargeRecord = (bId: string) => {
    setExtraChargeMsg("");
    const amt = Number(extraChargeAmount);
    if (isNaN(amt) || amt === 0) {
      setExtraChargeMsg("Please enter a valid non-zero amount.");
      return;
    }
    if (!extraChargeReason.trim()) {
      setExtraChargeMsg("Please enter a reason or description.");
      return;
    }

    const res = addExtraChargeFn(bId, {
      amount: amt,
      reason: extraChargeReason.trim(),
    });

    if (res.success && res.booking) {
      setSelectedGuestBooking(res.booking);
      setExtraChargeAmount("");
      setExtraChargeReason("");
      setExtraChargeMsg("Extra charge / adjustment recorded successfully!");
      setTimeout(() => setExtraChargeMsg(""), 2500);
    } else {
      setExtraChargeMsg(res.error || "Failed to record charge");
    }
  };

  const handleSaveCustomGrandTotal = (bId: string) => {
    const amt = Number(customTotalInput);
    if (isNaN(amt) || amt < 0) return;
    const res = updateCustomGrandTotalFn(bId, amt);
    if (res.success && res.booking) {
      setSelectedGuestBooking(res.booking);
      setIsEditingGrandTotal(false);
    }
  };

  const [bookForm, setBookForm] = useState({
    roomId: rooms[0]?.id || "",
    checkIn: "",
    checkOut: "",
    guestName: "",
    guestEmail: "",
    guestMobile: "",
    idProofType: "Aadhaar Card",
    idProofNumber: "",
    idProofImage: "",
    notes: "Direct Admin Room Reservation",
  });

  const handleIdImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBookForm((prev) => ({ ...prev, idProofImage: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmBook = () => {
    setBookError("");
    setBookSuccess("");
    if (!bookForm.roomId) {
      setBookError("Please select a room.");
      return;
    }
    if (!bookForm.checkIn || !bookForm.checkOut) {
      setBookError("Please select Check-In and Check-Out dates.");
      return;
    }
    if (bookForm.checkIn >= bookForm.checkOut) {
      setBookError("Check-Out date must be after Check-In date.");
      return;
    }
    if (!bookForm.guestName.trim()) {
      setBookError("Guest Name is required.");
      return;
    }
    if (!bookForm.guestEmail.trim()) {
      setBookError("Guest Email is required.");
      return;
    }
    if (!bookForm.guestMobile.trim()) {
      setBookError("Guest Mobile/Phone number is required.");
      return;
    }
    if (!bookForm.idProofNumber.trim()) {
      setBookError("ID Proof Number is required.");
      return;
    }

    const res = adminBlockRoomFn({
      roomId: bookForm.roomId,
      checkIn: bookForm.checkIn,
      checkOut: bookForm.checkOut,
      guestName: bookForm.guestName.trim(),
      guestEmail: bookForm.guestEmail.trim(),
      guestMobile: bookForm.guestMobile.trim(),
      idProofType: bookForm.idProofType,
      idProofNumber: bookForm.idProofNumber.trim(),
      idProofImage: bookForm.idProofImage,
      notes: bookForm.notes.trim(),
    });

    if (res.success) {
      setBookSuccess(
        `Room ${bookForm.roomId} successfully booked for ${bookForm.guestName}. Confirmation email sent to ${bookForm.guestEmail}.`,
      );
      setTimeout(() => {
        setShowBookModal(false);
        setBookSuccess("");
      }, 2000);
    } else {
      setBookError(res.error || "Failed to book room.");
    }
  };

  // Metrics
  const activeBookings = bookings.filter((b) => b.status !== "cancelled");
  const pendingCount = bookings.filter((b) => b.status === "pending").length;
  const confirmedCount = bookings.filter((b) => b.status === "confirmed").length;

  // Occupancy rate calculation (use dynamic room count)
  const totalRoomCount = rooms.length || 1;
  const todayStr = new Date().toISOString().split("T")[0];
  const occupiedRoomsToday = activeBookings.filter((b) => {
    return todayStr >= b.checkIn && todayStr < b.checkOut;
  }).length;
  const occupancyRate = Math.round((occupiedRoomsToday / totalRoomCount) * 100);

  // Filter bookings for display
  const filteredBookings = bookings
    .filter((b) => {
      const matchQuery =
        b.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.userEmail.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === "all" || b.status === statusFilter;
      return matchQuery && matchStatus;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Gantt Timeline Dates setup (16-day window starting 2 days ago)
  const startDate = addDays(new Date(), -2);
  const timelineDates = Array.from({ length: 16 }).map((_, i) => addDays(startDate, i));

  // Filter physical rooms for current property in timeline
  const propertyRooms = rooms.filter((r) => r.property === selectedProperty);

  const tabItems: { key: typeof activeTab; label: string; icon: React.ReactNode }[] = [
    { key: "bookings", label: "Bookings", icon: <Calendar size={14} /> },
    { key: "timeline", label: "Timeline", icon: <TrendingUp size={14} /> },
    { key: "rooms", label: "Rooms", icon: <BedDouble size={14} /> },
    { key: "locations", label: "Locations", icon: <MapPin size={14} /> },
    { key: "gallery", label: "Gallery", icon: <Image size={14} /> },
    { key: "events", label: "Events & Halls", icon: <Sparkles size={14} /> },
  ];

  return (
    <div className="pt-28 pb-24 px-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-[color:var(--gold)]/20 pb-8 mb-10">
        <div>
          <div className="text-eyebrow">Admin Console</div>
          <h1 className="mt-3 font-serif text-4xl text-[color:var(--forest)]">Retreat Dashboard</h1>
        </div>
        <div className="mt-6 md:mt-0 flex flex-wrap gap-2">
          {tabItems.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-[10px] font-semibold tracking-widest uppercase border transition-colors ${
                activeTab === tab.key
                  ? "bg-[color:var(--forest)] text-ivory border-[color:var(--forest)]"
                  : "border-border text-charcoal hover:bg-[color:var(--sand)]/50"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-10">
        <MetricCard
          icon={<Calendar className="text-[color:var(--gold)]" />}
          label="Pending Enquiries"
          value={pendingCount}
          sub="Awaiting validation"
          highlight={pendingCount > 0}
        />
        <MetricCard
          icon={<CircleCheck className="text-[color:var(--gold)]" />}
          label="Confirmed Stays"
          value={confirmedCount}
          sub="Active reservations"
        />
        <MetricCard
          icon={<Home className="text-[color:var(--gold)]" />}
          label="Tonight's Occupancy"
          value={`${occupiedRoomsToday} / ${totalRoomCount}`}
          sub={`${occupancyRate}% Room occupancy`}
        />
        <MetricCard
          icon={<TrendingUp className="text-[color:var(--gold)]" />}
          label="Total Bookings Managed"
          value={bookings.length}
          sub="Lifetime logs"
        />
      </div>

      {/* Book Room Modal */}
      {showBookModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-[color:var(--gold)]/40 shadow-2xl max-w-lg w-full p-6 space-y-4 relative animate-in fade-in zoom-in duration-200 my-8">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="font-serif text-xl font-bold text-[color:var(--forest)] flex items-center gap-2">
                <Calendar size={18} className="text-emerald-700" /> Book Room (Admin Direct)
              </h3>
              <button
                onClick={() => setShowBookModal(false)}
                className="text-charcoal/50 hover:text-charcoal cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-charcoal/60">
              Reserve dates directly for a room. Email, Mobile Phone, and ID Proof Number are required.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-charcoal/60 mb-1">
                  Select Room *
                </label>
                <select
                  value={bookForm.roomId}
                  onChange={(e) => setBookForm({ ...bookForm, roomId: e.target.value })}
                  className="w-full bg-transparent border border-border focus:border-[color:var(--gold)] focus:outline-none px-3 py-2 text-xs"
                >
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      [{r.id}] {r.name} ({r.property.toUpperCase()}) - ₹
                      {(r.advanceAmount ?? 10).toLocaleString("en-IN")} Advance
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-charcoal/60 mb-1">
                    Check In *
                  </label>
                  <input
                    type="date"
                    required
                    value={bookForm.checkIn}
                    onChange={(e) => setBookForm({ ...bookForm, checkIn: e.target.value })}
                    className="w-full bg-transparent border border-border focus:border-[color:var(--gold)] focus:outline-none px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-charcoal/60 mb-1">
                    Check Out *
                  </label>
                  <input
                    type="date"
                    required
                    value={bookForm.checkOut}
                    onChange={(e) => setBookForm({ ...bookForm, checkOut: e.target.value })}
                    className="w-full bg-transparent border border-border focus:border-[color:var(--gold)] focus:outline-none px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-charcoal/60 mb-1">
                  Guest Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter guest full name"
                  value={bookForm.guestName}
                  onChange={(e) => setBookForm({ ...bookForm, guestName: e.target.value })}
                  className="w-full bg-transparent border border-border focus:border-[color:var(--gold)] focus:outline-none px-3 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-charcoal/60 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="guest@example.com"
                    value={bookForm.guestEmail}
                    onChange={(e) => setBookForm({ ...bookForm, guestEmail: e.target.value })}
                    className="w-full bg-transparent border border-border focus:border-[color:var(--gold)] focus:outline-none px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-charcoal/60 mb-1">
                    Mobile Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={bookForm.guestMobile}
                    onChange={(e) => setBookForm({ ...bookForm, guestMobile: e.target.value })}
                    className="w-full bg-transparent border border-border focus:border-[color:var(--gold)] focus:outline-none px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-charcoal/60 mb-1">
                    ID Proof Type *
                  </label>
                  <select
                    value={bookForm.idProofType}
                    onChange={(e) => setBookForm({ ...bookForm, idProofType: e.target.value })}
                    className="w-full bg-transparent border border-border focus:border-[color:var(--gold)] focus:outline-none px-3 py-2 text-xs"
                  >
                    <option value="Aadhaar Card">Aadhaar Card</option>
                    <option value="Passport">Passport</option>
                    <option value="Driving License">Driving License</option>
                    <option value="Voter ID">Voter ID</option>
                    <option value="PAN Card">PAN Card</option>
                    <option value="Govt Photo ID">Govt Photo ID</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-charcoal/60 mb-1">
                    ID Proof Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1234 5678 9012"
                    value={bookForm.idProofNumber}
                    onChange={(e) => setBookForm({ ...bookForm, idProofNumber: e.target.value })}
                    className="w-full bg-transparent border border-border focus:border-[color:var(--gold)] focus:outline-none px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-charcoal/60 mb-1">
                  ID Proof Image (Optional)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleIdImageUpload}
                    className="w-full bg-transparent border border-border text-xs py-1.5 px-3 focus:outline-none"
                  />
                  {bookForm.idProofImage && (
                    <img
                      src={bookForm.idProofImage}
                      alt="ID Preview"
                      className="w-10 h-10 object-cover rounded border border-gold"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-charcoal/60 mb-1">
                  Notes / Internal Purpose
                </label>
                <input
                  type="text"
                  placeholder="e.g. VIP Direct Booking, Corporate Reservation"
                  value={bookForm.notes}
                  onChange={(e) => setBookForm({ ...bookForm, notes: e.target.value })}
                  className="w-full bg-transparent border border-border focus:border-[color:var(--gold)] focus:outline-none px-3 py-2 text-xs"
                />
              </div>
            </div>

            {bookError && (
              <div className="text-xs text-red-700 bg-red-50 border border-red-200 p-2.5">
                {bookError}
              </div>
            )}
            {bookSuccess && (
              <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 p-2.5">
                {bookSuccess}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowBookModal(false)}
                className="px-4 py-2 text-xs font-semibold uppercase tracking-wider border border-border text-charcoal cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBook}
                className="px-5 py-2 text-xs font-semibold uppercase tracking-wider bg-emerald-700 hover:bg-emerald-800 text-white transition-colors cursor-pointer"
              >
                Confirm Book Room
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guest Details Modal */}
      {selectedGuestBooking && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-start justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in">
          <div className="bg-card border border-[color:var(--gold)]/40 shadow-2xl max-w-2xl w-full p-6 space-y-6 relative animate-in fade-in zoom-in duration-200 mt-4 mb-16 sm:mt-6 sm:mb-20 rounded-xl">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <div>
                <h3 className="font-serif text-xl font-bold text-[color:var(--forest)] flex items-center gap-2">
                  <UserIcon size={18} className="text-gold" /> Member &amp; Booking Details
                </h3>
                <p className="text-xs text-charcoal/60 mt-0.5">
                  Booking ID: <span className="font-mono font-bold text-gold-dark">{selectedGuestBooking.id}</span>
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedGuestBooking(null);
                  setResendNotifyMsg("");
                }}
                className="text-charcoal/50 hover:text-charcoal cursor-pointer p-1"
              >
                <X size={20} />
              </button>
            </div>

            {/* Guest Personal Info */}
            <div className="bg-sand/15 p-4 rounded-lg border border-sand-dark/20 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-base font-bold text-charcoal">
                    {selectedGuestBooking.userName}
                  </h4>
                  <div className="flex items-center gap-3 text-xs text-charcoal/80 mt-1">
                    <a
                      href={`mailto:${selectedGuestBooking.userEmail}`}
                      className="inline-flex items-center gap-1 text-emerald-800 hover:underline"
                    >
                      <Mail size={12} /> {selectedGuestBooking.userEmail}
                    </a>
                    <a
                      href={`tel:${selectedGuestBooking.guestDetails.mobile}`}
                      className="inline-flex items-center gap-1 text-emerald-800 hover:underline"
                    >
                      <Phone size={12} /> {selectedGuestBooking.guestDetails.mobile || "N/A"}
                    </a>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${
                    selectedGuestBooking.status === "confirmed"
                      ? "bg-emerald-100 text-emerald-800"
                      : selectedGuestBooking.status === "pending"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {selectedGuestBooking.status}
                </span>
              </div>

              {/* ID Proof details */}
              <div className="pt-3 border-t border-sand-dark/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="space-y-0.5">
                  <div className="text-[10px] uppercase font-bold text-charcoal/50 flex items-center gap-1">
                    <IdCard size={12} className="text-gold-dark" /> Verified ID Proof
                  </div>
                  <div className="text-xs font-semibold text-charcoal">
                    {selectedGuestBooking.guestDetails.idProofType || "Aadhaar Card"}:{" "}
                    <span className="font-mono text-charcoal/90 font-bold">
                      {selectedGuestBooking.guestDetails.idProofNumber || "Verified"}
                    </span>
                  </div>
                </div>

                {selectedGuestBooking.guestDetails.idProofImage && (
                  <button
                    onClick={() =>
                      setExpandedIdImage(selectedGuestBooking.guestDetails.idProofImage || null)
                    }
                    className="flex items-center gap-2 text-xs bg-gold/15 hover:bg-gold/25 text-charcoal font-medium px-3 py-1.5 rounded border border-gold/40 transition-colors"
                  >
                    <img
                      src={selectedGuestBooking.guestDetails.idProofImage}
                      alt="ID Proof"
                      className="w-6 h-6 object-cover rounded"
                    />
                    View ID Card Photo
                  </button>
                )}
              </div>

              {/* Address details */}
              {selectedGuestBooking.guestDetails.address && (
                <div className="pt-2 border-t border-sand-dark/20 text-xs text-charcoal/70">
                  <span className="font-semibold text-charcoal">Address:</span>{" "}
                  {selectedGuestBooking.guestDetails.address},{" "}
                  {selectedGuestBooking.guestDetails.city},{" "}
                  {selectedGuestBooking.guestDetails.state}{" "}
                  {selectedGuestBooking.guestDetails.pincode},{" "}
                  {selectedGuestBooking.guestDetails.country}
                </div>
              )}
            </div>

            {/* Stay & Room Details */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-card border border-border/60 rounded-lg">
                <span className="text-[10px] uppercase font-bold text-charcoal/50 block">Resort Property</span>
                <span className="font-semibold text-charcoal capitalize">{selectedGuestBooking.property}</span>
              </div>
              <div className="p-3 bg-card border border-border/60 rounded-lg">
                <span className="text-[10px] uppercase font-bold text-charcoal/50 block">Assigned Room</span>
                <span className="font-semibold text-[color:var(--forest)] font-mono">
                  {selectedGuestBooking.roomId} ({selectedGuestBooking.roomTypeSlug.replace("-", " ")})
                </span>
              </div>
              <div className="p-3 bg-card border border-border/60 rounded-lg">
                <span className="text-[10px] uppercase font-bold text-charcoal/50 block">Check-In / Out</span>
                <span className="font-semibold text-charcoal">
                  {selectedGuestBooking.checkIn} to {selectedGuestBooking.checkOut}
                </span>
              </div>
              <div className="p-3 bg-card border border-border/60 rounded-lg">
                <span className="text-[10px] uppercase font-bold text-charcoal/50 block">Guests Count</span>
                <span className="font-semibold text-charcoal">
                  {selectedGuestBooking.adults} Adults, {selectedGuestBooking.children} Children
                </span>
              </div>
            </div>

            {/* Check-In & Check-Out Operation Panel */}
            <div className="p-4 bg-sand/20 border border-sand-dark/30 rounded-lg space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-charcoal uppercase tracking-wider flex items-center gap-1.5">
                  <Clock size={14} className="text-gold-dark" /> Guest Stay Operations
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleGuestCheckIn(selectedGuestBooking.id)}
                    disabled={
                      selectedGuestBooking.status === "checked_in" ||
                      selectedGuestBooking.status === "checked_out"
                    }
                    className="px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider bg-emerald-700 hover:bg-emerald-800 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded transition-colors flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <LogIn size={13} /> Check In
                  </button>

                  <button
                    type="button"
                    onClick={() => handleGuestCheckOut(selectedGuestBooking.id)}
                    disabled={selectedGuestBooking.status !== "checked_in"}
                    className="px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider bg-blue-700 hover:bg-blue-800 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded transition-colors flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <LogOut size={13} /> Check Out
                  </button>
                </div>
              </div>

              {/* Recorded Timestamps Display */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                <div className="p-2.5 rounded bg-white border border-sand-dark/20">
                  <span className="text-[10px] uppercase font-bold text-charcoal/50 block">Actual Check-In Recorded</span>
                  {selectedGuestBooking.checkedInAt ? (
                    <span className="font-semibold text-emerald-800 flex items-center gap-1 mt-0.5">
                      <Check size={12} className="text-emerald-600" /> {selectedGuestBooking.checkedInAt}
                    </span>
                  ) : (
                    <span className="text-amber-800 italic text-[11px] mt-0.5 block">Not checked in yet</span>
                  )}
                </div>

                <div className="p-2.5 rounded bg-white border border-sand-dark/20">
                  <span className="text-[10px] uppercase font-bold text-charcoal/50 block">Actual Check-Out Recorded</span>
                  {selectedGuestBooking.checkedOutAt ? (
                    <span className="font-semibold text-blue-800 flex items-center gap-1 mt-0.5">
                      <Check size={12} className="text-blue-600" /> {selectedGuestBooking.checkedOutAt}
                    </span>
                  ) : (
                    <span className="text-charcoal/50 italic text-[11px] mt-0.5 block">
                      {selectedGuestBooking.checkedInAt ? "Guest currently stayed" : "Not checked out yet"}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Payment Structure & Installments Ledger */}
            {(() => {
              const assignedRoom = rooms.find(
                (r) => r.id === selectedGuestBooking.roomId || r.name === selectedGuestBooking.roomId,
              );
              const roomTypeInfo = ROOMS.find((r) => r.slug === selectedGuestBooking.roomTypeSlug);

              let pricePerNight = assignedRoom?.pricePerNight;
              if (!pricePerNight && roomTypeInfo) {
                const matched = roomTypeInfo.price.match(/\d[\d,]*/);
                if (matched) pricePerNight = parseInt(matched[0].replace(/,/g, ""), 10);
              }
              if (!pricePerNight) pricePerNight = 3500;

              let nights = 1;
              try {
                if (selectedGuestBooking.checkIn && selectedGuestBooking.checkOut) {
                  const diff = differenceInDays(
                    parseISO(selectedGuestBooking.checkOut),
                    parseISO(selectedGuestBooking.checkIn),
                  );
                  nights = diff > 0 ? diff : 1;
                }
              } catch (e) {
                nights = 1;
              }

              const baseRoomTotal = pricePerNight * nights * (selectedGuestBooking.roomsCount || 1);
              const baseGst = Math.round(baseRoomTotal * 0.18);
              const calculatedBaseGrandTotal = baseRoomTotal + baseGst;

              const extraChargesList = selectedGuestBooking.extraCharges || [];
              const extraChargesSum = extraChargesList.reduce((acc, c) => acc + c.amount, 0);

              const effectiveBaseTotal =
                selectedGuestBooking.customGrandTotal !== undefined && selectedGuestBooking.customGrandTotal !== null
                  ? selectedGuestBooking.customGrandTotal
                  : calculatedBaseGrandTotal;

              const grandTotal = effectiveBaseTotal + extraChargesSum;

              const initAdvance =
                typeof selectedGuestBooking.payment?.amountPaid === "number"
                  ? selectedGuestBooking.payment.amountPaid
                  : 0;
              const ledgerTotal = (selectedGuestBooking.paymentsHistory || []).reduce((acc, p) => acc + p.amount, 0);
              const totalPaidToDate = initAdvance + ledgerTotal;
              const remainingBalance = Math.max(0, grandTotal - totalPaidToDate);

              return (
                <div className="p-4 bg-white border border-sand-dark/30 rounded-lg space-y-4">
                  <div className="flex justify-between items-center border-b border-sand-dark/20 pb-2">
                    <span className="text-xs font-bold text-charcoal uppercase tracking-wider flex items-center gap-1.5">
                      <IndianRupee size={14} className="text-gold-dark" /> Structured Payment Ledger &amp; Balance
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-charcoal">
                        Grand Total: ₹{grandTotal.toLocaleString("en-IN")}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingGrandTotal(!isEditingGrandTotal);
                          setCustomTotalInput(effectiveBaseTotal.toString());
                        }}
                        className="text-[10px] font-semibold text-[color:var(--forest)] underline hover:text-[color:var(--gold)] cursor-pointer"
                      >
                        {isEditingGrandTotal ? "Cancel Edit" : "Edit Grand Total"}
                      </button>
                    </div>
                  </div>

                  {/* Inline Grand Total Override */}
                  {isEditingGrandTotal && (
                    <div className="p-3 bg-amber-50 border border-amber-300 rounded space-y-2 text-xs">
                      <span className="font-bold text-amber-900 block">
                        Override Room Base Grand Total (before extra charges):
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">₹</span>
                        <input
                          type="number"
                          min="0"
                          value={customTotalInput}
                          onChange={(e) => setCustomTotalInput(e.target.value)}
                          className="w-32 bg-white border border-amber-300 px-3 py-1.5 font-mono font-bold text-xs focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveCustomGrandTotal(selectedGuestBooking.id)}
                          className="px-3 py-1.5 bg-[color:var(--forest)] text-ivory font-semibold text-xs rounded uppercase tracking-wider hover:bg-[color:var(--gold)] hover:text-black transition-colors cursor-pointer"
                        >
                          Save New Grand Total
                        </button>
                      </div>
                      <p className="text-[10px] text-amber-800 italic">
                        Calculated default room tariff ({nights} night(s) @ ₹{pricePerNight}/night + 18% GST) was ₹{calculatedBaseGrandTotal.toLocaleString("en-IN")}.
                      </p>
                    </div>
                  )}

                  {/* Summary Bar */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 bg-sand/20 rounded border border-sand-dark/10">
                      <span className="text-[9px] uppercase font-bold text-charcoal/60 block">Grand Total</span>
                      <span className="font-mono font-bold text-charcoal">₹{grandTotal.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="p-2 bg-emerald-50 rounded border border-emerald-200">
                      <span className="text-[9px] uppercase font-bold text-emerald-800 block">Total Paid</span>
                      <span className="font-mono font-bold text-emerald-700">₹{totalPaidToDate.toLocaleString("en-IN")}</span>
                    </div>
                    <div className={`p-2 rounded border ${remainingBalance === 0 ? "bg-emerald-100 border-emerald-300 text-emerald-900" : "bg-amber-50 border-amber-300 text-amber-900"}`}>
                      <span className="text-[9px] uppercase font-bold block">Balance Due</span>
                      <span className="font-mono font-bold">₹{remainingBalance.toLocaleString("en-IN")}</span>
                    </div>
                  </div>

                  {/* Extra Charges / Adjustments Breakdown Section */}
                  <div className="space-y-2 pt-2 border-t border-sand-dark/10">
                    <span className="text-[11px] font-semibold text-charcoal/80 block">
                      Extra Charges &amp; Bill Adjustments (e.g. Room Service, Extra Bed):
                    </span>

                    {/* Add Extra Charge Form */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="number"
                        placeholder="Extra Amount (₹)"
                        value={extraChargeAmount}
                        onChange={(e) => setExtraChargeAmount(e.target.value)}
                        className="bg-transparent border border-border px-3 py-1.5 text-xs focus:outline-none focus:border-gold font-mono"
                      />
                      <input
                        type="text"
                        placeholder="Reason (e.g. Extra Bed / Room Service)"
                        value={extraChargeReason}
                        onChange={(e) => setExtraChargeReason(e.target.value)}
                        className="bg-transparent border border-border px-3 py-1.5 text-xs focus:outline-none focus:border-gold sm:col-span-2"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddExtraChargeRecord(selectedGuestBooking.id)}
                      className="w-full bg-amber-700 hover:bg-amber-800 text-white font-semibold py-1.5 text-xs rounded uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      + Add Extra Charge / Adjustment
                    </button>
                    {extraChargeMsg && (
                      <p className="text-xs text-center text-amber-800 font-medium">{extraChargeMsg}</p>
                    )}

                    {/* Extra Charges Table */}
                    {extraChargesList.length > 0 && (
                      <div className="overflow-x-auto pt-1">
                        <table className="w-full text-left text-xs border-collapse border border-amber-200">
                          <thead>
                            <tr className="bg-amber-100/60 text-amber-900 font-semibold text-[10px] uppercase tracking-wider">
                              <th className="p-1.5">Date</th>
                              <th className="p-1.5">Reason / Description</th>
                              <th className="p-1.5 text-right">Extra Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-amber-200/50 bg-amber-50/20">
                            {extraChargesList.map((chg) => (
                              <tr key={chg.id}>
                                <td className="p-1.5 font-mono text-[11px]">{chg.date}</td>
                                <td className="p-1.5 font-medium text-charcoal">{chg.reason}</td>
                                <td className="p-1.5 text-right font-mono font-semibold text-amber-800">
                                  +₹{chg.amount.toLocaleString("en-IN")}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Add Payment Form */}
                  <div className="space-y-2 pt-2 border-t border-sand-dark/10">
                    <span className="text-[11px] font-semibold text-charcoal/80 block">Record New Payment Entry:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="number"
                        placeholder="Amount (₹)"
                        value={newPayAmount}
                        onChange={(e) => setNewPayAmount(e.target.value)}
                        className="bg-transparent border border-border px-3 py-1.5 text-xs focus:outline-none focus:border-gold font-mono"
                      />
                      <select
                        value={newPayMode}
                        onChange={(e) => setNewPayMode(e.target.value as PaymentEntry["mode"])}
                        className="bg-transparent border border-border px-3 py-1.5 text-xs focus:outline-none focus:border-gold"
                      >
                        <option value="Cash">Cash</option>
                        <option value="UPI">UPI Payment</option>
                        <option value="Card">Credit/Debit Card</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="Razorpay">Razorpay Online</option>
                        <option value="Other">Other</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Notes (e.g. Cash at check-in)"
                        value={newPayNotes}
                        onChange={(e) => setNewPayNotes(e.target.value)}
                        className="bg-transparent border border-border px-3 py-1.5 text-xs focus:outline-none focus:border-gold"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddPaymentRecord(selectedGuestBooking.id)}
                      className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-1.5 text-xs rounded uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      + Add Payment Record
                    </button>
                    {payStatusMsg && (
                      <p className="text-xs text-center text-emerald-800 font-medium">{payStatusMsg}</p>
                    )}
                  </div>

                  {/* Payments History Table */}
                  <div className="overflow-x-auto pt-2">
                    <span className="text-[10px] uppercase font-bold text-charcoal/50 block mb-1">Payments Installment History:</span>
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-sand/30 text-charcoal/70 font-semibold text-[10px] uppercase tracking-wider">
                          <th className="p-2">Date</th>
                          <th className="p-2">Mode</th>
                          <th className="p-2">Notes</th>
                          <th className="p-2 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-sand-dark/10">
                        {initAdvance > 0 && (
                          <tr>
                            <td className="p-2 font-mono text-[11px]">Initial</td>
                            <td className="p-2 font-medium text-emerald-800">Booking Advance</td>
                            <td className="p-2 text-charcoal/60 text-[11px]">{selectedGuestBooking.payment?.paymentId || "Online/Direct"}</td>
                            <td className="p-2 text-right font-mono font-semibold text-emerald-700">₹{initAdvance.toLocaleString("en-IN")}</td>
                          </tr>
                        )}
                        {(selectedGuestBooking.paymentsHistory || []).map((p) => (
                          <tr key={p.id}>
                            <td className="p-2 font-mono text-[11px]">{p.date}</td>
                            <td className="p-2 font-medium text-charcoal">{p.mode}</td>
                            <td className="p-2 text-charcoal/60 text-[11px]">{p.notes || "-"}</td>
                            <td className="p-2 text-right font-mono font-semibold text-emerald-700">₹{p.amount.toLocaleString("en-IN")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}

            {/* Email Notification Status */}
            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg flex justify-between items-center text-xs">
              <div className="flex items-center gap-2 text-emerald-900 font-medium">
                <Mail size={15} className="text-emerald-700" />
                <span>
                  Notification Email: <strong className="text-emerald-800">Sent &amp; Confirmed</strong>
                </span>
              </div>
              <button
                onClick={() => {
                  setResendNotifyMsg(
                    `Booking confirmation and tax invoice re-sent to ${selectedGuestBooking.userEmail}`,
                  );
                  setTimeout(() => setResendNotifyMsg(""), 3000);
                }}
                className="text-[11px] bg-emerald-700 hover:bg-emerald-800 text-white font-semibold px-2.5 py-1 rounded transition-colors"
              >
                Resend Email
              </button>
            </div>

            {resendNotifyMsg && (
              <div className="text-xs text-emerald-800 bg-emerald-100 p-2.5 rounded border border-emerald-300 animate-fade-in">
                {resendNotifyMsg}
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex justify-between items-center pt-2 border-t border-border">
              <button
                onClick={() => {
                  setInvoiceBooking(selectedGuestBooking);
                }}
                className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold uppercase tracking-wider px-4 py-2 rounded transition-colors cursor-pointer"
              >
                <FileText size={14} /> View / Print Bill &amp; Invoice
              </button>

              <button
                onClick={() => {
                  setSelectedGuestBooking(null);
                  setResendNotifyMsg("");
                }}
                className="px-4 py-2 text-xs font-semibold uppercase tracking-wider border border-border text-charcoal hover:bg-sand/30 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ID Image Lightbox Modal */}
      {expandedIdImage && (
        <div className="fixed inset-0 z-[120] bg-black/80 flex items-center justify-center p-4">
          <div className="relative max-w-2xl w-full bg-white p-4 rounded-xl shadow-2xl space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="font-semibold text-sm text-charcoal">ID Proof Photo Preview</h4>
              <button
                onClick={() => setExpandedIdImage(null)}
                className="p-1 text-charcoal/60 hover:text-charcoal"
              >
                <X size={20} />
              </button>
            </div>
            <img
              src={expandedIdImage}
              alt="ID Proof Large"
              className="w-full max-h-[70vh] object-contain rounded border border-sand-dark/20"
            />
          </div>
        </div>
      )}

      {/* VIEW 1: BOOKINGS LIST */}
      {activeTab === "bookings" && (
        <div className="bg-card border border-border/60 shadow-lg p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
            <h3 className="font-serif text-2xl text-[color:var(--forest)] self-start md:self-center">
              Reservations List
            </h3>

            <div className="w-full md:w-auto flex flex-wrap gap-3">
              <button
                onClick={() => {
                  setShowBookModal(true);
                  setBookSuccess("");
                  setBookError("");
                }}
                className="inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-[10px] font-semibold tracking-wider uppercase px-4 py-2 transition-colors cursor-pointer rounded-sm"
              >
                <Plus size={13} /> Book Room
              </button>
              {bookings.length > 0 && (
                <button
                  type="button"
                  onClick={async () => {
                    if (
                      window.confirm(
                        "ARE YOU SURE you want to PERMANENTLY delete ALL bookings from the Supabase database? This cannot be undone.",
                      )
                    ) {
                      await deleteAllBookingsFn();
                    }
                  }}
                  className="inline-flex items-center gap-1.5 bg-red-700 hover:bg-red-800 text-white text-[10px] font-semibold tracking-wider uppercase px-3 py-2 transition-colors cursor-pointer rounded-sm"
                  title="Wipe all bookings from Supabase database permanently"
                >
                  <Trash2 size={13} /> Clear All Reservations
                </button>
              )}
              <input
                type="text"
                placeholder="Search Guest or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border border-border focus:border-[color:var(--gold)] focus:outline-none px-4 py-2 text-xs"
              />
              <select
                value={statusFilter}
                onChange={(e) => {
                  if (isBookingStatusFilter(e.target.value)) {
                    setStatusFilter(e.target.value);
                  }
                }}
                className="bg-transparent border border-border focus:border-[color:var(--gold)] focus:outline-none px-4 py-2 text-xs"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto border border-border/40">
            {filteredBookings.length === 0 ? (
              <div className="text-center py-12 text-sm text-charcoal/50">
                No matching enquiries found.
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[color:var(--sand)]/30 border-b border-border/60 text-charcoal/80 uppercase tracking-widest font-semibold text-[10px]">
                    <th className="p-4">ID</th>
                    <th className="p-4">Guest</th>
                    <th className="p-4">Resort</th>
                    <th className="p-4">Room Type / ID</th>
                    <th className="p-4">Stay Dates</th>
                    <th className="p-4">Guests</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-[color:var(--sand)]/10 transition-colors">
                      <td className="p-4 font-mono font-bold text-[color:var(--forest)]">{b.id}</td>
                      <td className="p-4">
                        <button
                          onClick={() => setSelectedGuestBooking(b)}
                          className="font-semibold text-charcoal hover:text-emerald-800 text-left cursor-pointer hover:underline block"
                          title="Click to view full guest details"
                        >
                          {b.userName}
                        </button>
                        <div className="text-[10px] text-charcoal/60 mt-0.5">{b.userEmail}</div>
                      </td>
                      <td className="p-4 font-medium text-charcoal/80 capitalize">{b.property}</td>
                      <td className="p-4">
                        <div className="capitalize">{b.roomTypeSlug.replace("-", " ")}</div>
                        <div className="text-[10px] text-[color:var(--gold)] font-mono font-medium mt-0.5">
                          {b.roomId}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-charcoal/80">
                          {format(parseISO(b.checkIn), "MMM dd")} –{" "}
                          {format(parseISO(b.checkOut), "MMM dd, yyyy")}
                        </div>
                        <div className="text-[10px] text-charcoal/50 mt-0.5">
                          {differenceInDays(parseISO(b.checkOut), parseISO(b.checkIn))} nights
                        </div>
                      </td>
                      <td className="p-4 text-charcoal/70">
                        {b.adults} Adults {b.children > 0 && `, ${b.children} Ch`}
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`inline-block px-3 py-1 text-[9px] font-bold tracking-wider uppercase rounded-full ${
                            b.status === "confirmed"
                              ? "bg-emerald-100 text-emerald-800"
                              : b.status === "pending"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-gray-150 text-gray-600"
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => setSelectedGuestBooking(b)}
                          title="View Member & Guest Details"
                          className="p-1.5 border border-indigo-300 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-sm cursor-pointer transition-colors"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => setInvoiceBooking(b)}
                          title="View / Print Tax Invoice Bill"
                          className="p-1.5 border border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-sm cursor-pointer transition-colors"
                        >
                          <FileText size={14} />
                        </button>
                        {b.status === "pending" && (
                          <button
                            onClick={() => updateStatus(b.id, "confirmed")}
                            title="Confirm Booking"
                            className="p-1.5 border border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-sm cursor-pointer transition-colors"
                          >
                            <Check size={14} />
                          </button>
                        )}
                        {b.status !== "cancelled" && (
                          <button
                            onClick={() => updateStatus(b.id, "cancelled")}
                            title="Cancel Booking"
                            className="p-1.5 border border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-sm cursor-pointer transition-colors"
                          >
                            <X size={14} />
                          </button>
                        )}
                        <button
                          onClick={async () => {
                            if (
                              confirm(
                                "Are you sure you want to permanently delete this booking from the database?",
                              )
                            ) {
                              await deleteBooking(b.id);
                            }
                          }}
                          title="Delete Permanently"
                          className="p-1.5 border border-red-300 text-red-700 bg-red-50 hover:bg-red-100 rounded-sm cursor-pointer transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: VISUAL GANTT TIMELINE */}
      {activeTab === "timeline" && (
        <div className="bg-card border border-border/60 shadow-lg p-6 md:p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h3 className="font-serif text-2xl text-[color:var(--forest)]">
                Room Occupancy Matrix
              </h3>
              <p className="text-xs text-charcoal/50 mt-1">
                Real-time scheduling of {rooms.length} physical rooms.
              </p>
            </div>

            {/* Property Selector — dynamic from locations */}
            <div className="flex gap-2 p-1 border border-border bg-[color:var(--sand)]/10 flex-wrap">
              {locations.map((loc) => {
                const locRoomCount = rooms.filter((r) => r.property === loc.key).length;
                return (
                  <button
                    key={loc.key}
                    onClick={() => setSelectedProperty(loc.key)}
                    className={`px-4 py-2 text-[10px] tracking-widest uppercase font-bold transition-all ${
                      selectedProperty === loc.key
                        ? "bg-[color:var(--forest)] text-ivory"
                        : "text-charcoal/60 hover:text-charcoal"
                    }`}
                  >
                    {loc.name.replace("VANASURU ", "")} ({locRoomCount})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Gantt Timeline Grid */}
          <div className="overflow-x-auto border border-border/40">
            <div className="min-w-[900px] grid grid-cols-[180px_repeat(16,1fr)] bg-card select-none">
              {/* Row Header - Date headers */}
              <div className="bg-[color:var(--sand)]/30 p-4 font-semibold text-[10px] tracking-widest uppercase text-charcoal/60 flex items-center border-r border-b border-border/60">
                Rooms Matrix
              </div>
              {timelineDates.map((date, idx) => {
                const isToday = date.toISOString().split("T")[0] === todayStr;
                return (
                  <div
                    key={idx}
                    className={`bg-[color:var(--sand)]/30 p-2 text-center border-b border-r border-border/60 flex flex-col justify-center items-center ${
                      isToday ? "bg-amber-50 text-amber-800" : "text-charcoal/70"
                    }`}
                  >
                    <span className="text-[9px] uppercase tracking-wider font-semibold">
                      {format(date, "EEE")}
                    </span>
                    <span className="text-[11px] font-bold mt-0.5">{format(date, "dd")}</span>
                    <span className="text-[8px] text-charcoal/40 uppercase mt-0.5">
                      {format(date, "MMM")}
                    </span>
                  </div>
                );
              })}

              {/* Matrix Rows (One row per physical room) */}
              {propertyRooms.map((room) => (
                <TimelineRow
                  key={room.id}
                  room={room}
                  dates={timelineDates}
                  bookings={activeBookings}
                  todayStr={todayStr}
                />
              ))}

              {/* Function Halls & Events Section Header */}
              <div className="col-span-full bg-[color:var(--forest)] text-ivory px-4 py-2.5 text-xs font-serif font-bold tracking-wider flex items-center justify-between border-t border-b border-border/60">
                <span className="flex items-center gap-2">
                  <Sparkles size={14} className="text-[color:var(--gold)]" /> Function Halls & Event Bookings Matrix
                </span>
                <span className="text-[10px] text-ivory/80 uppercase tracking-widest font-sans font-semibold">
                  {eventBookings.filter((eb) => eb.status !== "cancelled").length} Event(s) Scheduled
                </span>
              </div>

              {/* Event Venues Matrix Rows */}
              {Array.from(
                new Set([
                  ...events.map((e) => e.venue),
                  ...eventBookings.map((eb) => eb.venue),
                  "Heritage Gardens & Lawns",
                  "Grand Banquet Hall",
                  "Courtyard Pavilion",
                ]),
              ).map((venueName) => (
                <EventTimelineRow
                  key={venueName}
                  venueName={venueName}
                  dates={timelineDates}
                  eventBookings={eventBookings}
                  todayStr={todayStr}
                />
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-6 flex flex-wrap gap-6 text-[10px] text-charcoal/60">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-[color:var(--forest)] border border-[color:var(--gold)]/30 inline-block" />
              <span>Confirmed Stay</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-amber-600 border border-amber-300 inline-block rounded-xs" />
              <span className="font-bold text-amber-900">🎉 Function Hall & Event Booking</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-[color:var(--gold)]/40 border border-[color:var(--gold)]/30 inline-block" />
              <span>Pending Enquiry</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 border border-dashed border-border inline-block bg-[color:var(--sand)]/10" />
              <span>Available / Unbooked Night</span>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: ROOMS MANAGEMENT */}
      {activeTab === "rooms" && (
        <RoomsManager
          rooms={rooms}
          locations={locations}
          addRoom={addRoomFn}
          updateRoom={updateRoomFn}
          deleteRoom={deleteRoomFn}
          updateRoomAdvanceAmount={updateRoomAdvanceAmountFn}
          updateAllRoomsAdvanceAmount={updateAllRoomsAdvanceAmountFn}
        />
      )}

      {/* VIEW 4: LOCATIONS MANAGEMENT */}
      {activeTab === "locations" && (
        <LocationsManager
          locations={locations}
          rooms={rooms}
          addLocation={addLocationFn}
          deleteLocation={deleteLocationFn}
        />
      )}

      {/* VIEW 5: GALLERY MANAGEMENT */}
      {activeTab === "gallery" && (
        <GalleryManager
          galleryItems={galleryItems}
          addGalleryItem={addGalleryItemFn}
          deleteGalleryItem={deleteGalleryItemFn}
        />
      )}

      {/* VIEW 6: EVENTS MANAGEMENT */}
      {activeTab === "events" && (
        <EventsManager
          events={events}
          eventBookings={eventBookings}
          locations={locations}
          addEvent={addEventFn}
          deleteEvent={deleteEventFn}
          toggleHighlightEvent={toggleHighlightEventFn}
          createEventBooking={createEventBookingFn}
          updateEventBookingStatus={updateEventBookingStatusFn}
          checkInEventBooking={checkInEventBookingFn}
          checkOutEventBooking={checkOutEventBookingFn}
          addEventPaymentEntry={addEventPaymentEntryFn}
          addEventExtraCharge={addEventExtraChargeFn}
          updateEventCustomGrandTotal={updateEventCustomGrandTotalFn}
          deleteEventBooking={deleteEventBookingFn}
          onViewBill={(eb) => setInvoiceBooking(eb)}
        />
      )}

      <BillInvoiceModal
        booking={invoiceBooking}
        isOpen={!!invoiceBooking}
        onClose={() => setInvoiceBooking(null)}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// GALLERY MANAGER
// ---------------------------------------------------------------------------
function GalleryManager({
  galleryItems,
  addGalleryItem,
  deleteGalleryItem,
}: {
  galleryItems: GalleryItem[];
  addGalleryItem: (item: Omit<GalleryItem, "id">) => GalleryItem;
  deleteGalleryItem: (id: string) => boolean;
}) {
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [inputMode, setInputMode] = useState<"file" | "url">("file");
  const [imageUrl, setImageUrl] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [tag, setTag] = useState<"mysore" | "mahadevapura">("mysore");
  const [category, setCategory] = useState<"Rooms" | "Dining" | "Events" | "Outdoors">("Rooms");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");

  const [isSaving, setIsSaving] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const validFiles = files.filter((f) => f.size <= 50 * 1024 * 1024);
      if (validFiles.length < files.length) {
        setFormError("Some images were skipped because they exceed 50MB limit.");
      } else {
        setFormError("");
      }
      setSelectedFiles(validFiles);

      const previews: string[] = [];
      let readCount = 0;
      validFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) previews.push(reader.result as string);
          readCount++;
          if (readCount === validFiles.length) {
            setFilePreviews(previews);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const convertToStandard43DataUrl = (
    dataUrl: string,
    targetWidth = 1600,
    targetHeight = 1200,
  ): Promise<string> => {
    return new Promise((resolve) => {
      if (!dataUrl.startsWith("data:image")) {
        resolve(dataUrl);
        return;
      }
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.src = dataUrl;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";

          // Calculate cover scale to fit 4:3 aspect ratio canvas perfectly without distortion
          const scale = Math.max(targetWidth / img.width, targetHeight / img.height);
          const drawWidth = img.width * scale;
          const drawHeight = img.height * scale;
          const offsetX = (targetWidth - drawWidth) / 2;
          const offsetY = (targetHeight - drawHeight) / 2;

          ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
          resolve(canvas.toDataURL("image/jpeg", 0.92));
        } else {
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
    });
  };

  const handleAdd = async () => {
    setFormError("");
    setFormSuccess("");
    let sources: string[] = [];

    if (inputMode === "file") {
      if (filePreviews.length === 0) {
        setFormError("Please select one or more image files to upload.");
        return;
      }
      sources = filePreviews;
    } else {
      if (!imageUrl.trim()) {
        setFormError("Please enter an image URL.");
        return;
      }
      sources = [imageUrl.trim()];
    }

    setIsSaving(true);
    try {
      let addedCount = 0;
      for (let i = 0; i < sources.length; i++) {
        const src = sources[i];
        const fileName = selectedFiles[i]?.name || `gallery-${Date.now()}-${i + 1}.jpg`;

        // 1. Force conversion to formal 4:3 aspect ratio canvas (1600x1200)
        const landscapeDataUrl = await convertToStandard43DataUrl(src);

        let finalUrl = landscapeDataUrl;

        // 2. Save file directly into project folder (public/images/)
        if (landscapeDataUrl.startsWith("data:image")) {
          try {
            const uploadRes = await uploadImageToProjectDb({
              data: { fileName, dataUrl: landscapeDataUrl, folder: "gallery" },
            });
            if (uploadRes?.url) {
              finalUrl = uploadRes.url;
            }
          } catch (uploadErr) {
            console.warn("Could not save to disk folder, using local fallback", uploadErr);
          }
        }

        addGalleryItem({
          src: finalUrl,
          tag,
          category,
        });
        addedCount++;
      }

      setFormSuccess(
        addedCount === 1
          ? "1 gallery image saved in landscape mode into project folder!"
          : `${addedCount} gallery images saved in landscape mode into project folder!`,
      );
      setImageUrl("");
      setSelectedFiles([]);
      setFilePreviews([]);
      setTimeout(() => setFormSuccess(""), 4000);
    } catch (err) {
      setFormError("Failed to save image(s). Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to remove this image from the gallery?")) {
      deleteGalleryItem(id);
    }
  };

  const filteredItems = galleryItems.filter((item) => {
    if (categoryFilter === "All") return true;
    if (categoryFilter === "mysore" || categoryFilter === "mahadevapura")
      return item.tag === categoryFilter;
    return item.category === categoryFilter;
  });

  return (
    <div className="bg-card border border-border/60 shadow-lg p-6 md:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h3 className="font-serif text-2xl text-[color:var(--forest)]">
            <Image className="inline-block mr-2 text-[color:var(--gold)]" size={24} />
            Manage Gallery Images
          </h3>
          <p className="text-xs text-charcoal/50 mt-1">
            Upload custom photos under Rooms, Dining, Events, or Outdoors.
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setFormError("");
            setFormSuccess("");
          }}
          className={`inline-flex items-center gap-2 px-5 py-2.5 text-[10px] font-semibold tracking-widest uppercase border transition-colors ${
            showForm
              ? "bg-charcoal text-ivory border-charcoal"
              : "bg-[color:var(--forest)] text-ivory border-[color:var(--forest)] hover:bg-[color:var(--gold)] hover:text-[color:var(--forest-deep)] hover:border-[color:var(--gold)]"
          }`}
        >
          {showForm ? <X size={14} /> : <Plus size={14} />}
          {showForm ? "Cancel" : "Upload / Add Image"}
        </button>
      </div>

      {showForm && (
        <div className="border border-[color:var(--gold)]/30 bg-[color:var(--sand)]/10 p-6 mb-8 space-y-4">
          <h4 className="font-serif text-lg text-[color:var(--forest)] mb-2">New Gallery Image</h4>

          <div className="flex gap-4 border-b border-border/40 pb-3 mb-4">
            <button
              type="button"
              onClick={() => setInputMode("file")}
              className={`text-xs font-semibold uppercase tracking-wider px-3 py-1.5 border transition-colors ${
                inputMode === "file"
                  ? "bg-[color:var(--forest)] text-ivory border-[color:var(--forest)]"
                  : "border-border text-charcoal"
              }`}
            >
              Upload Local File
            </button>
            <button
              type="button"
              onClick={() => setInputMode("url")}
              className={`text-xs font-semibold uppercase tracking-wider px-3 py-1.5 border transition-colors ${
                inputMode === "url"
                  ? "bg-[color:var(--forest)] text-ivory border-[color:var(--forest)]"
                  : "border-border text-charcoal"
              }`}
            >
              Paste Image URL
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              {inputMode === "file" ? (
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-semibold text-charcoal/60 mb-1.5">
                    Select Image File(s) * (Hold Ctrl/Cmd or Shift to select multiple)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    className="w-full text-xs text-charcoal/80 file:mr-4 file:py-2 file:px-4 file:border-0 file:text-xs file:font-semibold file:bg-[color:var(--forest)] file:text-ivory hover:file:bg-[color:var(--gold)] hover:file:text-[color:var(--forest-deep)] transition-colors cursor-pointer"
                  />
                  {filePreviews.length > 0 && (
                    <div className="mt-3">
                      <div className="text-[10px] font-semibold text-[color:var(--forest)] uppercase tracking-wider mb-2">
                        {filePreviews.length} photo{filePreviews.length > 1 ? "s" : ""} selected for
                        upload:
                      </div>
                      <div className="flex flex-wrap gap-2 max-h-44 overflow-y-auto p-2 border border-border bg-white">
                        {filePreviews.map((src, idx) => (
                          <div
                            key={idx}
                            className="relative w-20 h-16 border border-border overflow-hidden rounded-sm group"
                          >
                            <img
                              src={src}
                              alt={`Preview ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-[9px] text-white font-mono font-bold">
                                #{idx + 1}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-semibold text-charcoal/60 mb-1.5">
                    Image URL *
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com/photo.jpg"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full bg-transparent border border-border focus:border-[color:var(--gold)] focus:outline-none px-4 py-2.5 text-sm"
                  />
                  {imageUrl && (
                    <div className="mt-3 relative w-32 h-24 border border-border overflow-hidden">
                      <img
                        src={imageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => (e.currentTarget.style.display = "none")}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-semibold text-charcoal/60 mb-1.5">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value as "Rooms" | "Dining" | "Events" | "Outdoors")
                  }
                  className="w-full bg-transparent border border-border focus:border-[color:var(--gold)] focus:outline-none px-4 py-2.5 text-sm"
                >
                  <option value="Rooms">Rooms</option>
                  <option value="Dining">Dining</option>
                  <option value="Events">Events</option>
                  <option value="Outdoors">Outdoors</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest font-semibold text-charcoal/60 mb-1.5">
                  Destination Property *
                </label>
                <select
                  value={tag}
                  onChange={(e) => setTag(e.target.value as "mysore" | "mahadevapura")}
                  className="w-full bg-transparent border border-border focus:border-[color:var(--gold)] focus:outline-none px-4 py-2.5 text-sm"
                >
                  <option value="mysore">VANASURU Silverleaf</option>
                  <option value="mahadevapura">VANASURU Village</option>
                </select>
              </div>
            </div>
          </div>

          {formError && (
            <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 px-4 py-2.5 text-xs">
              <CircleAlert size={14} /> {formError}
            </div>
          )}
          {formSuccess && (
            <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-xs">
              <CircleCheck size={14} /> {formSuccess}
            </div>
          )}

          <button
            onClick={handleAdd}
            disabled={isSaving}
            className={`inline-flex items-center gap-2 bg-[color:var(--forest)] text-ivory px-6 py-3 text-[10px] font-semibold tracking-widest uppercase hover:bg-[color:var(--gold)] hover:text-[color:var(--forest-deep)] transition-colors cursor-pointer ${
              isSaving ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <Plus size={14} /> {isSaving ? "Processing & Saving..." : "Save to Gallery"}
          </button>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="flex flex-wrap gap-2 mb-6 items-center justify-between">
        <div className="text-xs text-charcoal/60 font-semibold uppercase tracking-wider">
          Filter Gallery ({filteredItems.length} photos)
        </div>
        <div className="flex flex-wrap gap-2">
          {["All", "mysore", "mahadevapura", "Rooms", "Dining", "Events", "Outdoors"].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1 text-[10px] uppercase font-semibold tracking-wider border transition-colors ${
                categoryFilter === cat
                  ? "bg-[color:var(--forest)] text-ivory border-[color:var(--forest)]"
                  : "border-border text-charcoal/70 hover:bg-[color:var(--sand)]/50"
              }`}
            >
              {cat === "mysore" ? "Mysore" : cat === "mahadevapura" ? "Mahadevapura" : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Gallery Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="group relative border border-border bg-white overflow-hidden shadow-sm"
          >
            <div className="aspect-[4/3] w-full overflow-hidden bg-charcoal/5">
              <img
                src={item.src}
                alt=""
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="p-3 flex items-center justify-between bg-white border-t border-border/40">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="px-2 py-0.5 text-[9px] uppercase font-semibold tracking-wider bg-[color:var(--sand)] text-[color:var(--forest)]">
                  {item.category}
                </span>
                <span className="px-2 py-0.5 text-[9px] uppercase font-semibold tracking-wider bg-charcoal/10 text-charcoal">
                  {item.tag}
                </span>
              </div>
              <button
                onClick={() => handleDelete(item.id)}
                title="Delete Image"
                className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors cursor-pointer"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ROOMS MANAGER
// ---------------------------------------------------------------------------
function RoomsManager({
  rooms,
  locations,
  addRoom,
  updateRoom,
  deleteRoom,
  updateRoomAdvanceAmount,
  updateAllRoomsAdvanceAmount,
}: {
  rooms: PhysicalRoom[];
  locations: Location[];
  addRoom: (room: PhysicalRoom) => Promise<{ success: boolean; error?: string }>;
  updateRoom: (room: PhysicalRoom) => Promise<{ success: boolean; error?: string }>;
  deleteRoom: (roomId: string) => Promise<{ success: boolean; error?: string }>;
  updateRoomAdvanceAmount: (
    roomId: string,
    advanceAmount: number,
  ) => Promise<{ success: boolean; error?: string }>;
  updateAllRoomsAdvanceAmount: (
    advanceAmount: number,
  ) => Promise<{ success: boolean; error?: string }>;
}) {
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [inlineAdvanceVal, setInlineAdvanceVal] = useState("");
  const [editingRoomFull, setEditingRoomFull] = useState<PhysicalRoom | null>(null);
  const [editRoomForm, setEditRoomForm] = useState<PhysicalRoom | null>(null);
  const [newRoom, setNewRoom] = useState<{
    id: string;
    name: string;
    property: string;
    roomTypeSlug: string;
    advanceAmount: number;
    pricePerNight: number;
    maxGuests: number;
    maxAdults: number;
    maxKids: number;
    bedType: string;
  }>({
    id: "",
    name: "",
    property: locations[0]?.key || "",
    roomTypeSlug: ROOMS[0]?.slug || "deluxe-room",
    advanceAmount: 1,
    pricePerNight: 3500,
    maxGuests: 4,
    maxAdults: 2,
    maxKids: 1,
    bedType: "King Bed",
  });

  const [photoInputMode, setPhotoInputMode] = useState<"file" | "url">("file");
  const [roomPhotoUrl, setRoomPhotoUrl] = useState("");
  const [selectedPhotoFiles, setSelectedPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);

  const roomTypes = ROOMS.map((r) => ({ slug: r.slug, name: r.name }));

  const startEditInlineAdvance = (roomId: string, currentVal: number) => {
    setEditingRoomId(roomId);
    setInlineAdvanceVal(currentVal.toString());
  };

  const saveInlineAdvance = async (roomId: string) => {
    const val = Number(inlineAdvanceVal);
    if (isNaN(val) || val < 0) return;
    await updateRoomAdvanceAmount(roomId, val);
    setEditingRoomId(null);
  };

  const handleAllRoomsAdvanceUpdate = async () => {
    const val = prompt("Enter new advance amount for ALL rooms:");
    if (val !== null && !isNaN(Number(val))) {
      await updateAllRoomsAdvanceAmount(Number(val));
    }
  };

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const validFiles = files.filter((f) => f.size <= 50 * 1024 * 1024);
      setSelectedPhotoFiles((prev) => [...prev, ...validFiles]);

      const previews: string[] = [];
      let readCount = 0;
      validFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) previews.push(reader.result as string);
          readCount++;
          if (readCount === validFiles.length) {
            setPhotoPreviews((prev) => [...prev, ...previews]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleAddPhotoUrl = () => {
    if (roomPhotoUrl.trim()) {
      setPhotoPreviews((prev) => [...prev, roomPhotoUrl.trim()]);
      setRoomPhotoUrl("");
    }
  };

  const removePhotoPreview = (index: number) => {
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
    setSelectedPhotoFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAdd = async () => {
    setFormError("");
    setFormSuccess("");
    if (!newRoom.id.trim() || !newRoom.name.trim()) {
      setFormError("Room ID and Name are required.");
      return;
    }
    if (!newRoom.property) {
      setFormError("Please select a location.");
      return;
    }

    setIsUploadingPhotos(true);
    const finalPhotos: string[] = [];
    try {
      for (let i = 0; i < photoPreviews.length; i++) {
        const src = photoPreviews[i];
        if (src.startsWith("data:image")) {
          try {
            const fileName = selectedPhotoFiles[i]?.name || `room-${Date.now()}-${i + 1}.jpg`;
            const uploadRes = await uploadImageToProjectDb({
              data: { fileName, dataUrl: src, folder: "rooms" },
            });
            if (uploadRes?.url) {
              finalPhotos.push(uploadRes.url);
            } else {
              finalPhotos.push(src);
            }
          } catch {
            finalPhotos.push(src);
          }
        } else {
          finalPhotos.push(src);
        }
      }
    } finally {
      setIsUploadingPhotos(false);
    }

    const result = await addRoom({
      id: newRoom.id.trim().toUpperCase(),
      name: newRoom.name.trim(),
      property: newRoom.property,
      roomTypeSlug: newRoom.roomTypeSlug,
      advanceAmount: Number(newRoom.advanceAmount) >= 0 ? Number(newRoom.advanceAmount) : 1,
      pricePerNight: Number(newRoom.pricePerNight) > 0 ? Number(newRoom.pricePerNight) : 3500,
      photos: finalPhotos,
      maxGuests: Number(newRoom.maxGuests) || 4,
      maxAdults: Number(newRoom.maxAdults) || 2,
      maxKids: Number(newRoom.maxKids) >= 0 ? Number(newRoom.maxKids) : 1,
      bedType: newRoom.bedType.trim() || "King Bed",
    });
    if (result.success) {
      setFormSuccess(`Room "${newRoom.name.trim()}" added successfully.`);
      setNewRoom({
        id: "",
        name: "",
        property: locations[0]?.key || "",
        roomTypeSlug: ROOMS[0]?.slug || "deluxe-room",
        advanceAmount: 1,
        pricePerNight: 3500,
        maxGuests: 4,
        maxAdults: 2,
        maxKids: 1,
        bedType: "King Bed",
      });
      setPhotoPreviews([]);
      setSelectedPhotoFiles([]);
      setRoomPhotoUrl("");
      setTimeout(() => setFormSuccess(""), 3000);
    } else {
      setFormError(result.error || "Failed to add room.");
    }
  };

  const handleDelete = async (roomId: string, roomName: string) => {
    if (!confirm(`Delete room "${roomName}" (${roomId})? This cannot be undone.`)) return;
    const result = await deleteRoom(roomId);
    if (!result.success) {
      alert(result.error || "Failed to delete room.");
    }
  };

  const openEditModal = (room: PhysicalRoom) => {
    setEditingRoomFull(room);
    setEditRoomForm({ ...room });
  };

  const handleSaveEditRoom = async () => {
    if (!editRoomForm) return;
    const result = await updateRoom(editRoomForm);
    if (result.success) {
      setEditingRoomFull(null);
      setEditRoomForm(null);
    } else {
      alert(result.error || "Failed to update room details.");
    }
  };

  // Group rooms by location
  const groupedRooms = locations.map((loc) => ({
    location: loc,
    rooms: rooms.filter((r) => r.property === loc.key),
  }));
  // Also include rooms with unknown locations
  const knownKeys = new Set(locations.map((l) => l.key));
  const orphanRooms = rooms.filter((r) => !knownKeys.has(r.property));

  return (
    <div className="bg-card border border-border/60 shadow-lg p-6 md:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h3 className="font-serif text-2xl text-[color:var(--forest)]">
            <BedDouble className="inline-block mr-2 text-[color:var(--gold)]" size={24} />
            Manage Rooms
          </h3>
          <p className="text-xs text-charcoal/50 mt-1">
            {rooms.length} rooms across {locations.length} locations
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleAllRoomsAdvanceUpdate}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-[10px] font-semibold tracking-widest uppercase border border-[color:var(--gold)] text-[color:var(--forest)] hover:bg-[color:var(--gold)] hover:text-[color:var(--forest-deep)] transition-colors cursor-pointer"
          >
            Update All Advance
          </button>
          <button
            onClick={() => {
              setShowForm(!showForm);
              setFormError("");
              setFormSuccess("");
            }}
            className={`inline-flex items-center gap-2 px-5 py-2.5 text-[10px] font-semibold tracking-widest uppercase border transition-colors ${
              showForm
                ? "bg-charcoal text-ivory border-charcoal"
                : "bg-[color:var(--forest)] text-ivory border-[color:var(--forest)] hover:bg-[color:var(--gold)] hover:text-[color:var(--forest-deep)] hover:border-[color:var(--gold)]"
            }`}
          >
            {showForm ? <X size={14} /> : <Plus size={14} />}
            {showForm ? "Cancel" : "Add Room"}
          </button>
        </div>
      </div>

      {/* Add Room Form */}
      {showForm && (
        <div className="border border-[color:var(--gold)]/30 bg-[color:var(--sand)]/10 p-6 mb-8 space-y-4">
          <h4 className="font-serif text-lg text-[color:var(--forest)] mb-4">New Room Details</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-semibold text-charcoal/60 mb-1.5">
                Room ID *
              </label>
              <input
                type="text"
                placeholder="e.g. RM301"
                value={newRoom.id}
                onChange={(e) => setNewRoom({ ...newRoom, id: e.target.value })}
                className="w-full bg-transparent border border-border focus:border-[color:var(--gold)] focus:outline-none px-4 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-semibold text-charcoal/60 mb-1.5">
                Room Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Room 301"
                value={newRoom.name}
                onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                className="w-full bg-transparent border border-border focus:border-[color:var(--gold)] focus:outline-none px-4 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-semibold text-charcoal/60 mb-1.5">
                Location *
              </label>
              <select
                value={newRoom.property}
                onChange={(e) => setNewRoom({ ...newRoom, property: e.target.value })}
                className="w-full bg-transparent border border-border focus:border-[color:var(--gold)] focus:outline-none px-4 py-2.5 text-sm"
              >
                <option value="" disabled>
                  Select location...
                </option>
                {locations.map((loc) => (
                  <option key={loc.key} value={loc.key}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-semibold text-charcoal/60 mb-1.5">
                Room Type *
              </label>
              <select
                value={newRoom.roomTypeSlug}
                onChange={(e) => setNewRoom({ ...newRoom, roomTypeSlug: e.target.value })}
                className="w-full bg-transparent border border-border focus:border-[color:var(--gold)] focus:outline-none px-4 py-2.5 text-sm"
              >
                {roomTypes.map((rt) => (
                  <option key={rt.slug} value={rt.slug}>
                    {rt.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-semibold text-charcoal/60 mb-1.5">
                Bed Type / Capacity *
              </label>
              <input
                type="text"
                placeholder="e.g. King Bed, 2 Queen Beds"
                value={newRoom.bedType}
                onChange={(e) => setNewRoom({ ...newRoom, bedType: e.target.value })}
                className="w-full bg-transparent border border-border focus:border-[color:var(--gold)] focus:outline-none px-4 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-semibold text-charcoal/60 mb-1.5">
                Total People Allowed (Max Guests) *
              </label>
              <input
                type="number"
                min="1"
                placeholder="e.g. 4"
                value={newRoom.maxGuests}
                onChange={(e) =>
                  setNewRoom({ ...newRoom, maxGuests: Math.max(1, Number(e.target.value)) })
                }
                className="w-full bg-transparent border border-border focus:border-[color:var(--gold)] focus:outline-none px-4 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-semibold text-charcoal/60 mb-1.5">
                Max Adults Allowed *
              </label>
              <input
                type="number"
                min="1"
                placeholder="e.g. 2"
                value={newRoom.maxAdults}
                onChange={(e) =>
                  setNewRoom({ ...newRoom, maxAdults: Math.max(1, Number(e.target.value)) })
                }
                className="w-full bg-transparent border border-border focus:border-[color:var(--gold)] focus:outline-none px-4 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-semibold text-charcoal/60 mb-1.5">
                Max Kids Allowed *
              </label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 1"
                value={newRoom.maxKids}
                onChange={(e) =>
                  setNewRoom({ ...newRoom, maxKids: Math.max(0, Number(e.target.value)) })
                }
                className="w-full bg-transparent border border-border focus:border-[color:var(--gold)] focus:outline-none px-4 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-semibold text-charcoal/60 mb-1.5">
                Room Price Per Night (₹) *
              </label>
              <input
                type="number"
                min="0"
                step="100"
                placeholder="e.g. 3500"
                value={newRoom.pricePerNight}
                onChange={(e) =>
                  setNewRoom({ ...newRoom, pricePerNight: Math.max(0, Number(e.target.value)) })
                }
                className="w-full bg-transparent border border-border focus:border-[color:var(--gold)] focus:outline-none px-4 py-2.5 text-sm font-mono font-bold"
              />
              <p className="text-[10px] text-charcoal/50 mt-1">
                Actual tariff per night displayed to guests and used for total bill calculations.
              </p>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-semibold text-charcoal/60 mb-1.5">
                Advance Payment (₹) *
              </label>
              <input
                type="number"
                min="0"
                step="1"
                placeholder="e.g. 1"
                value={newRoom.advanceAmount}
                onChange={(e) =>
                  setNewRoom({ ...newRoom, advanceAmount: Math.max(0, Number(e.target.value)) })
                }
                className="w-full bg-transparent border border-border focus:border-[color:var(--gold)] focus:outline-none px-4 py-2.5 text-sm font-mono"
              />
              <p className="text-[10px] text-charcoal/50 mt-1">
                Amount to be collected as advance payment during guest booking.
              </p>
            </div>

            {/* Room Photos Section */}
            <div className="sm:col-span-2 border-t border-border/40 pt-4 mt-2">
              <label className="block text-[10px] uppercase tracking-widest font-semibold text-charcoal/60 mb-2">
                Room Photos (Optional)
              </label>
              <div className="flex gap-3 mb-3">
                <button
                  type="button"
                  onClick={() => setPhotoInputMode("file")}
                  className={`text-[10px] font-semibold uppercase tracking-wider px-3 py-1 border transition-colors ${
                    photoInputMode === "file"
                      ? "bg-[color:var(--forest)] text-ivory border-[color:var(--forest)]"
                      : "border-border text-charcoal"
                  }`}
                >
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setPhotoInputMode("url")}
                  className={`text-[10px] font-semibold uppercase tracking-wider px-3 py-1 border transition-colors ${
                    photoInputMode === "url"
                      ? "bg-[color:var(--forest)] text-ivory border-[color:var(--forest)]"
                      : "border-border text-charcoal"
                  }`}
                >
                  Paste URL
                </button>
              </div>

              {photoInputMode === "file" ? (
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoFileChange}
                  className="w-full text-xs text-charcoal file:mr-4 file:py-2 file:px-4 file:border-0 file:text-[10px] file:font-semibold file:uppercase file:tracking-wider file:bg-[color:var(--forest)] file:text-ivory hover:file:bg-[color:var(--gold)] hover:file:text-[color:var(--forest-deep)] file:cursor-pointer"
                />
              ) : (
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://example.com/room-photo.jpg"
                    value={roomPhotoUrl}
                    onChange={(e) => setRoomPhotoUrl(e.target.value)}
                    className="flex-1 bg-transparent border border-border focus:border-[color:var(--gold)] focus:outline-none px-4 py-2 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddPhotoUrl}
                    className="px-4 py-2 bg-[color:var(--forest)] text-ivory text-[10px] font-semibold uppercase tracking-wider hover:bg-[color:var(--gold)] hover:text-[color:var(--forest-deep)]"
                  >
                    Add URL
                  </button>
                </div>
              )}

              {/* Photo Previews */}
              {photoPreviews.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-3">
                  {photoPreviews.map((src, idx) => (
                    <div key={idx} className="relative w-20 h-20 border border-border group">
                      <img
                        src={src}
                        alt={`Preview ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removePhotoPreview(idx)}
                        className="absolute -top-1.5 -right-1.5 bg-red-600 text-white rounded-full p-0.5 shadow-md hover:bg-red-700 cursor-pointer"
                        title="Remove photo"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {formError && (
            <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 px-4 py-2.5 text-xs">
              <CircleAlert size={14} /> {formError}
            </div>
          )}
          {formSuccess && (
            <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-xs">
              <CircleCheck size={14} /> {formSuccess}
            </div>
          )}

          <button
            onClick={handleAdd}
            disabled={isUploadingPhotos}
            className="inline-flex items-center gap-2 bg-[color:var(--forest)] text-ivory px-6 py-3 text-[10px] font-semibold tracking-widest uppercase hover:bg-[color:var(--gold)] hover:text-[color:var(--forest-deep)] transition-colors cursor-pointer disabled:opacity-50"
          >
            <Plus size={14} /> {isUploadingPhotos ? "Uploading & Saving..." : "Add Room"}
          </button>
        </div>
      )}

      {/* Rooms Cards grouped by location in 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {groupedRooms.map(({ location, rooms: locRooms }) => (
          <div key={location.key} className="border border-border/60 bg-card shadow-sm">
            <div className="bg-[color:var(--sand)]/30 px-5 py-3.5 border-b border-border/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 size={16} className="text-[color:var(--gold)]" />
                <span className="font-serif text-base font-bold text-[color:var(--forest)]">
                  {location.name}
                </span>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-[color:var(--forest)]/10 text-[color:var(--forest)] px-2.5 py-1 rounded-full">
                {locRooms.length} {locRooms.length === 1 ? "room" : "rooms"}
              </span>
            </div>
            {locRooms.length === 0 ? (
              <div className="text-center py-10 text-xs text-charcoal/40">
                No rooms at this location yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[color:var(--sand)]/10 border-b border-border/30 text-charcoal/70 uppercase tracking-widest font-semibold text-[10px]">
                      <th className="p-3">Photos</th>
                      <th className="p-3">Room</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Advance</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {locRooms.map((room) => (
                      <tr
                        key={room.id}
                        className="hover:bg-[color:var(--sand)]/10 transition-colors"
                      >
                        <td className="p-3">
                          {room.photos && room.photos.length > 0 ? (
                            <div className="flex -space-x-1.5 overflow-hidden">
                              {room.photos.slice(0, 2).map((img, i) => (
                                <img
                                  key={i}
                                  src={img}
                                  alt={room.name}
                                  className="inline-block h-7 w-7 rounded-full ring-2 ring-white object-cover"
                                />
                              ))}
                              {room.photos.length > 2 && (
                                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 text-[9px] font-bold text-gray-700 ring-2 ring-white">
                                  +{room.photos.length - 2}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] text-charcoal/40 italic">No photos</span>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="font-mono font-bold text-[color:var(--forest)] text-xs">
                            {room.id}
                          </div>
                          <div className="text-[11px] text-charcoal font-medium">{room.name}</div>
                          <div className="text-[10px] text-charcoal/60 mt-0.5">
                            {room.bedType || "King Bed"} • Max {room.maxGuests ?? 4} guests (
                            {room.maxAdults ?? 2}A, {room.maxKids ?? 1}K)
                          </div>
                        </td>
                        <td className="p-3 capitalize text-charcoal/70 text-[11px]">
                          {room.roomTypeSlug.replace("-", " ")}
                        </td>
                        <td className="p-3">
                          {editingRoomId === room.id ? (
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-mono text-charcoal/60">₹</span>
                              <input
                                type="number"
                                min="0"
                                value={inlineAdvanceVal}
                                onChange={(e) => setInlineAdvanceVal(e.target.value)}
                                className="w-20 px-2 py-1 border border-[color:var(--gold)] bg-white text-xs font-mono font-bold focus:outline-none"
                                autoFocus
                              />
                              <button
                                onClick={() => saveInlineAdvance(room.id)}
                                className="p-1.5 bg-emerald-600 text-white rounded hover:bg-emerald-700 cursor-pointer transition-colors"
                                title="Save"
                              >
                                <Check size={12} />
                              </button>
                              <button
                                onClick={() => setEditingRoomId(null)}
                                className="p-1.5 bg-gray-400 text-white rounded hover:bg-gray-500 cursor-pointer transition-colors"
                                title="Cancel"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 group">
                              <span className="font-semibold text-[color:var(--forest)] font-mono text-[11px]">
                                ₹{(room.advanceAmount ?? 10).toLocaleString("en-IN")}
                              </span>
                              <button
                                onClick={() => startEditInlineAdvance(room.id, room.advanceAmount ?? 10)}
                                title="Edit advance amount for this room"
                                className="p-1 text-charcoal/40 hover:text-[color:var(--forest)] hover:bg-[color:var(--sand)]/40 rounded transition-all cursor-pointer"
                              >
                                <Pencil size={12} />
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openEditModal(room)}
                              title="Edit Room Details"
                              className="p-1.5 border border-border text-[color:var(--forest)] bg-white hover:bg-[color:var(--gold)] hover:text-black rounded-sm cursor-pointer transition-colors"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(room.id, room.name)}
                              title="Delete Room"
                              className="p-1.5 border border-red-300 text-red-700 bg-red-50 hover:bg-red-100 rounded-sm cursor-pointer transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}

        {orphanRooms.length > 0 && (
          <div className="border border-amber-200">
            <div className="bg-amber-50 px-5 py-3 border-b border-amber-200 flex items-center gap-2">
              <HelpCircle size={14} className="text-amber-600" />
              <span className="font-serif text-sm font-bold text-amber-800">
                Unassigned Location
              </span>
            </div>
            <table className="w-full text-left text-xs border-collapse">
              <tbody className="divide-y divide-amber-100">
                {orphanRooms.map((room) => (
                  <tr key={room.id} className="hover:bg-amber-50/50 transition-colors">
                    <td className="p-3 font-mono font-bold text-[color:var(--forest)]">
                      {room.id}
                    </td>
                    <td className="p-3 font-medium text-charcoal">{room.name}</td>
                    <td className="p-3 capitalize text-charcoal/70">
                      {room.roomTypeSlug.replace("-", " ")}
                    </td>
                    <td className="p-3 text-[10px] text-amber-600 font-medium">
                      Location: {room.property}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(room)}
                          title="Edit Room Details"
                          className="p-1.5 border border-border text-[color:var(--forest)] bg-white hover:bg-[color:var(--gold)] hover:text-black rounded-sm cursor-pointer transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(room.id, room.name)}
                          title="Delete Room"
                          className="p-1.5 border border-red-300 text-red-700 bg-red-50 hover:bg-red-100 rounded-sm cursor-pointer transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* EDIT ROOM DETAILS MODAL */}
      {editingRoomFull && editRoomForm && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white border border-[color:var(--gold)]/40 shadow-2xl max-w-2xl w-full p-6 my-8 space-y-5 relative text-charcoal rounded-sm">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <h3 className="font-serif text-xl font-bold text-[color:var(--forest)] flex items-center gap-2">
                <Pencil className="text-[color:var(--gold)]" size={18} />
                Edit Room Details: {editingRoomFull.name} ({editingRoomFull.id})
              </h3>
              <button
                onClick={() => {
                  setEditingRoomFull(null);
                  setEditRoomForm(null);
                }}
                className="p-1.5 hover:bg-sand/40 rounded-full text-charcoal/60 hover:text-charcoal cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-semibold text-charcoal/70 mb-1">
                  Room Name / Number *
                </label>
                <input
                  type="text"
                  value={editRoomForm.name}
                  onChange={(e) => setEditRoomForm({ ...editRoomForm, name: e.target.value })}
                  className="w-full bg-white border border-border px-3 py-2 text-xs focus:border-[color:var(--gold)] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-semibold text-charcoal/70 mb-1">
                  Resort Location *
                </label>
                <select
                  value={editRoomForm.property}
                  onChange={(e) => setEditRoomForm({ ...editRoomForm, property: e.target.value })}
                  className="w-full bg-white border border-border px-3 py-2 text-xs focus:border-[color:var(--gold)] focus:outline-none"
                >
                  {locations.map((loc) => (
                    <option key={loc.key} value={loc.key}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-semibold text-charcoal/70 mb-1">
                  Room Category / Type *
                </label>
                <select
                  value={editRoomForm.roomTypeSlug}
                  onChange={(e) => setEditRoomForm({ ...editRoomForm, roomTypeSlug: e.target.value })}
                  className="w-full bg-white border border-border px-3 py-2 text-xs focus:border-[color:var(--gold)] focus:outline-none"
                >
                  {roomTypes.map((rt) => (
                    <option key={rt.slug} value={rt.slug}>
                      {rt.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-semibold text-charcoal/70 mb-1">
                  Room Price Per Night (₹) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={editRoomForm.pricePerNight ?? 3500}
                  onChange={(e) =>
                    setEditRoomForm({
                      ...editRoomForm,
                      pricePerNight: Math.max(0, Number(e.target.value)),
                    })
                  }
                  className="w-full bg-white border border-border px-3 py-2 text-xs font-mono font-bold focus:border-[color:var(--gold)] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-semibold text-charcoal/70 mb-1">
                  Advance Amount (₹) *
                </label>
                <input
                  type="number"
                  min="0"
                  value={editRoomForm.advanceAmount ?? 1}
                  onChange={(e) =>
                    setEditRoomForm({
                      ...editRoomForm,
                      advanceAmount: Math.max(0, Number(e.target.value)),
                    })
                  }
                  className="w-full bg-white border border-border px-3 py-2 text-xs font-mono focus:border-[color:var(--gold)] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-semibold text-charcoal/70 mb-1">
                  Bed Type *
                </label>
                <input
                  type="text"
                  value={editRoomForm.bedType || "King Bed"}
                  onChange={(e) => setEditRoomForm({ ...editRoomForm, bedType: e.target.value })}
                  className="w-full bg-white border border-border px-3 py-2 text-xs focus:border-[color:var(--gold)] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-semibold text-charcoal/70 mb-1">
                  Max Total Guests *
                </label>
                <input
                  type="number"
                  min="1"
                  value={editRoomForm.maxGuests ?? 4}
                  onChange={(e) =>
                    setEditRoomForm({
                      ...editRoomForm,
                      maxGuests: Math.max(1, Number(e.target.value)),
                    })
                  }
                  className="w-full bg-white border border-border px-3 py-2 text-xs focus:border-[color:var(--gold)] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-semibold text-charcoal/70 mb-1">
                  Max Adults *
                </label>
                <input
                  type="number"
                  min="1"
                  value={editRoomForm.maxAdults ?? 2}
                  onChange={(e) =>
                    setEditRoomForm({
                      ...editRoomForm,
                      maxAdults: Math.max(1, Number(e.target.value)),
                    })
                  }
                  className="w-full bg-white border border-border px-3 py-2 text-xs focus:border-[color:var(--gold)] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-semibold text-charcoal/70 mb-1">
                  Max Kids *
                </label>
                <input
                  type="number"
                  min="0"
                  value={editRoomForm.maxKids ?? 1}
                  onChange={(e) =>
                    setEditRoomForm({
                      ...editRoomForm,
                      maxKids: Math.max(0, Number(e.target.value)),
                    })
                  }
                  className="w-full bg-white border border-border px-3 py-2 text-xs focus:border-[color:var(--gold)] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-border/40 pt-4">
              <button
                type="button"
                onClick={() => {
                  setEditingRoomFull(null);
                  setEditRoomForm(null);
                }}
                className="px-5 py-2.5 text-xs font-semibold uppercase tracking-wider border border-border hover:bg-sand/40 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEditRoom}
                className="px-6 py-2.5 text-xs font-semibold uppercase tracking-wider bg-[color:var(--forest)] text-ivory hover:bg-[color:var(--gold)] hover:text-black transition-colors cursor-pointer"
              >
                Save Room Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// LOCATIONS MANAGER
// ---------------------------------------------------------------------------
function LocationsManager({
  locations,
  rooms,
  addLocation,
  deleteLocation,
}: {
  locations: Location[];
  rooms: PhysicalRoom[];
  addLocation: (loc: Omit<Location, "id">) => Promise<{ success: boolean; error?: string }>;
  deleteLocation: (id: string) => Promise<{ success: boolean; error?: string }>;
}) {
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [newLoc, setNewLoc] = useState({
    key: "",
    name: "",
    address: "",
    phone: "",
    email: "",
    tagline: "",
    mapEmbedUrl: "",
    photoUrlInput: "",
    photos: [] as string[],
  });

  const handleAddPhoto = () => {
    if (newLoc.photoUrlInput.trim()) {
      setNewLoc({
        ...newLoc,
        photos: [...newLoc.photos, newLoc.photoUrlInput.trim()],
        photoUrlInput: "",
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setNewLoc((prev) => ({
            ...prev,
            photos: [...prev.photos, event.target!.result as string],
          }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAdd = async () => {
    setFormError("");
    setFormSuccess("");
    if (!newLoc.name.trim() || !newLoc.key.trim()) {
      setFormError("Location name and key are required.");
      return;
    }
    if (!newLoc.address.trim()) {
      setFormError("Address is required.");
      return;
    }

    const cleanEmbedUrl = extractMapEmbedUrl(newLoc.mapEmbedUrl);
    const finalPhotos: string[] = [];

    try {
      for (let i = 0; i < newLoc.photos.length; i++) {
        const src = newLoc.photos[i];
        if (src.startsWith("data:image")) {
          const uploadRes = await uploadImageToProjectDb({
            data: {
              fileName: `location-${newLoc.key.trim() || Date.now()}-${i + 1}.jpg`,
              dataUrl: src,
              folder: "locations",
            },
          });
          if (!uploadRes?.url) throw new Error("Location image upload did not return a URL.");
          finalPhotos.push(uploadRes.url);
        } else {
          finalPhotos.push(src);
        }
      }
    } catch (error) {
      console.error(error);
      setFormError("Failed to save location photo(s) into public/images/uploads/locations.");
      return;
    }

    const result = await addLocation({
      key: newLoc.key.trim(),
      name: newLoc.name.trim(),
      address: newLoc.address.trim(),
      phone: newLoc.phone.trim(),
      email: newLoc.email.trim(),
      tagline: newLoc.tagline.trim(),
      mapEmbedUrl: cleanEmbedUrl,
      photos: finalPhotos,
    });
    if (result.success) {
      setFormSuccess(`Location "${newLoc.name.trim()}" added successfully.`);
      setNewLoc({
        key: "",
        name: "",
        address: "",
        phone: "",
        email: "",
        tagline: "",
        mapEmbedUrl: "",
        photoUrlInput: "",
        photos: [],
      });
      setTimeout(() => setFormSuccess(""), 3000);
    } else {
      setFormError(result.error || "Failed to add location.");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete location "${name}"? All rooms must be removed first.`)) return;
    const result = await deleteLocation(id);
    if (!result.success) {
      alert(result.error || "Failed to delete location.");
    }
  };

  return (
    <div className="bg-card border border-border/60 shadow-lg p-6 md:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h3 className="font-serif text-2xl text-[color:var(--forest)]">
            <MapPin className="inline-block mr-2 text-[color:var(--gold)]" size={24} />
            Manage Locations
          </h3>
          <p className="text-xs text-charcoal/50 mt-1">
            {locations.length} property locations configured
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setFormError("");
            setFormSuccess("");
          }}
          className={`inline-flex items-center gap-2 px-5 py-2.5 text-[10px] font-semibold tracking-widest uppercase border transition-colors ${
            showForm
              ? "bg-charcoal text-ivory border-charcoal"
              : "bg-[color:var(--forest)] text-ivory border-[color:var(--forest)] hover:bg-[color:var(--gold)] hover:text-[color:var(--forest-deep)] hover:border-[color:var(--gold)]"
          }`}
        >
          {showForm ? <X size={14} /> : <Plus size={14} />}
          {showForm ? "Cancel" : "Add Location"}
        </button>
      </div>

      {/* Add Location Form */}
      {showForm && (
        <div className="border border-[color:var(--gold)]/30 bg-[color:var(--sand)]/10 p-6 mb-8 space-y-4">
          <h4 className="font-serif text-lg text-[color:var(--forest)] mb-4">
            New Location Details
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-semibold text-charcoal/60 mb-1.5">
                Location Name *
              </label>
              <input
                type="text"
                placeholder="e.g. VANASURU Coorg"
                value={newLoc.name}
                onChange={(e) => setNewLoc({ ...newLoc, name: e.target.value })}
                className="w-full bg-transparent border border-border focus:border-[color:var(--gold)] focus:outline-none px-4 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-semibold text-charcoal/60 mb-1.5">
                Key / Slug *
              </label>
              <input
                type="text"
                placeholder="e.g. coorg"
                value={newLoc.key}
                onChange={(e) => setNewLoc({ ...newLoc, key: e.target.value })}
                className="w-full bg-transparent border border-border focus:border-[color:var(--gold)] focus:outline-none px-4 py-2.5 text-sm"
              />
              <span className="text-[9px] text-charcoal/40 mt-1 block">
                Lowercase, no spaces. Used as internal key.
              </span>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[10px] uppercase tracking-widest font-semibold text-charcoal/60 mb-1.5">
                Address *
              </label>
              <input
                type="text"
                placeholder="Full property address"
                value={newLoc.address}
                onChange={(e) => setNewLoc({ ...newLoc, address: e.target.value })}
                className="w-full bg-transparent border border-border focus:border-[color:var(--gold)] focus:outline-none px-4 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-semibold text-charcoal/60 mb-1.5">
                Phone
              </label>
              <input
                type="text"
                placeholder="+91 90000 00003"
                value={newLoc.phone}
                onChange={(e) => setNewLoc({ ...newLoc, phone: e.target.value })}
                className="w-full bg-transparent border border-border focus:border-[color:var(--gold)] focus:outline-none px-4 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-semibold text-charcoal/60 mb-1.5">
                Email
              </label>
              <input
                type="email"
                placeholder="stay.coorg@vanasuru.com"
                value={newLoc.email}
                onChange={(e) => setNewLoc({ ...newLoc, email: e.target.value })}
                className="w-full bg-transparent border border-border focus:border-[color:var(--gold)] focus:outline-none px-4 py-2.5 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[10px] uppercase tracking-widest font-semibold text-charcoal/60 mb-1.5">
                Tagline
              </label>
              <input
                type="text"
                placeholder="A short description of this location"
                value={newLoc.tagline}
                onChange={(e) => setNewLoc({ ...newLoc, tagline: e.target.value })}
                className="w-full bg-transparent border border-border focus:border-[color:var(--gold)] focus:outline-none px-4 py-2.5 text-sm"
              />
            </div>

            {/* Paste Embed Address / Google Maps Embed HTML */}
            <div className="sm:col-span-2 border-t border-border/40 pt-4 mt-2">
              <label className="block text-[10px] uppercase tracking-widest font-semibold text-[color:var(--forest)] mb-1.5">
                ðŸ“ Paste Embedded Address / Google Maps Embed Code
              </label>
              <textarea
                rows={3}
                placeholder={`Paste full iframe tag e.g. <iframe src="https://www.google.com/maps/embed?pb=..." width="600" ...></iframe> OR embed URL`}
                value={newLoc.mapEmbedUrl}
                onChange={(e) => setNewLoc({ ...newLoc, mapEmbedUrl: e.target.value })}
                className="w-full bg-white border border-border focus:border-[color:var(--gold)] focus:outline-none px-4 py-2.5 text-xs font-mono"
              />
              <span className="text-[10px] text-charcoal/60 mt-1 block">
                Automatically parses iframe src URL. Map will be embedded in Events & Property
                pages.
              </span>
              {newLoc.mapEmbedUrl && (
                <div className="mt-3 aspect-video max-h-48 w-full overflow-hidden border border-border">
                  <iframe
                    src={extractMapEmbedUrl(newLoc.mapEmbedUrl)}
                    className="w-full h-full border-0"
                    loading="lazy"
                    title="Map Preview"
                  />
                </div>
              )}
            </div>

            {/* Photos for Location */}
            <div className="sm:col-span-2 border-t border-border/40 pt-4 mt-2">
              <label className="block text-[10px] uppercase tracking-widest font-semibold text-[color:var(--forest)] mb-1.5">
                ðŸ“· Location Photos
              </label>
              <div className="flex flex-col sm:flex-row gap-3 items-center">
                <input
                  type="url"
                  placeholder="Image URL..."
                  value={newLoc.photoUrlInput}
                  onChange={(e) => setNewLoc({ ...newLoc, photoUrlInput: e.target.value })}
                  className="flex-1 w-full bg-white border border-border px-4 py-2 text-xs focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddPhoto}
                  className="px-4 py-2 bg-[color:var(--forest)] text-ivory text-xs font-semibold uppercase tracking-wider hover:bg-[color:var(--gold)] hover:text-black"
                >
                  Add URL
                </button>
                <label className="cursor-pointer bg-[color:var(--sand)] text-charcoal px-4 py-2 border border-border flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider">
                  <Upload size={14} /> Upload
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {newLoc.photos.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-3">
                  {newLoc.photos.map((pUrl, idx) => (
                    <div key={idx} className="relative w-20 h-20 border border-border group">
                      <img src={pUrl} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() =>
                          setNewLoc({
                            ...newLoc,
                            photos: newLoc.photos.filter((_, i) => i !== idx),
                          })
                        }
                        className="absolute top-0 right-0 bg-red-600 text-white w-5 h-5 flex items-center justify-center text-xs opacity-80 group-hover:opacity-100"
                      >
                        Ã—
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {formError && (
            <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 px-4 py-2.5 text-xs">
              <CircleAlert size={14} /> {formError}
            </div>
          )}
          {formSuccess && (
            <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-xs">
              <CircleCheck size={14} /> {formSuccess}
            </div>
          )}

          <button
            onClick={handleAdd}
            className="inline-flex items-center gap-2 bg-[color:var(--forest)] text-ivory px-6 py-3 text-[10px] font-semibold tracking-widest uppercase hover:bg-[color:var(--gold)] hover:text-[color:var(--forest-deep)] transition-colors cursor-pointer"
          >
            <Plus size={14} /> Add Location
          </button>
        </div>
      )}

      {/* Locations Table */}
      <div className="overflow-x-auto border border-border/40">
        {locations.length === 0 ? (
          <div className="text-center py-12 text-sm text-charcoal/50">
            No locations configured. Add your first property location above.
          </div>
        ) : (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[color:var(--sand)]/30 border-b border-border/60 text-charcoal/80 uppercase tracking-widest font-semibold text-[10px]">
                <th className="p-4">Name</th>
                <th className="p-4">Key</th>
                <th className="p-4">Address</th>
                <th className="p-4">Map Embed</th>
                <th className="p-4 text-center">Photos</th>
                <th className="p-4 text-center">Rooms</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {locations.map((loc) => {
                const roomCount = rooms.filter((r) => r.property === loc.key).length;
                return (
                  <tr key={loc.id} className="hover:bg-[color:var(--sand)]/10 transition-colors">
                    <td className="p-4">
                      <div className="font-serif font-bold text-[color:var(--forest)]">
                        {loc.name}
                      </div>
                      {loc.tagline && (
                        <div className="text-[10px] text-charcoal/50 mt-0.5 max-w-[200px] truncate">
                          {loc.tagline}
                        </div>
                      )}
                    </td>
                    <td className="p-4 font-mono text-[color:var(--gold)] font-medium">
                      {loc.key}
                    </td>
                    <td className="p-4 text-charcoal/70 max-w-[200px]">
                      <div className="truncate">{loc.address}</div>
                    </td>
                    <td className="p-4">
                      {loc.mapEmbedUrl ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-semibold px-2 py-1 rounded border border-emerald-200">
                          <Check size={12} /> Configured
                        </span>
                      ) : (
                        <span className="text-[10px] text-charcoal/40">Not set</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <span className="font-semibold text-charcoal/80">
                        {loc.photos ? loc.photos.length : 0}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center justify-center w-7 h-7 bg-[color:var(--sand)]/50 border border-border/60 font-bold text-[color:var(--forest)] text-sm rounded-full">
                        {roomCount}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDelete(loc.id, loc.name)}
                        title="Delete Location"
                        className="p-1.5 border border-red-300 text-red-700 bg-red-50 hover:bg-red-100 rounded-sm cursor-pointer transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function EventsManager({
  events,
  eventBookings,
  locations,
  addEvent,
  deleteEvent,
  toggleHighlightEvent,
  createEventBooking,
  updateEventBookingStatus,
  checkInEventBooking,
  checkOutEventBooking,
  addEventPaymentEntry,
  addEventExtraCharge,
  updateEventCustomGrandTotal,
  deleteEventBooking,
  onViewBill,
}: {
  events: ResortEvent[];
  eventBookings: EventBooking[];
  locations: Location[];
  addEvent: (eventData: Omit<ResortEvent, "id" | "createdAt">) => ResortEvent;
  deleteEvent: (id: string) => boolean;
  toggleHighlightEvent: (id: string) => boolean;
  createEventBooking: (data: Omit<EventBooking, "id" | "createdAt" | "status"> & { paymentMode?: PaymentEntry["mode"] }) => { success: boolean; booking?: EventBooking; error?: string };
  updateEventBookingStatus: (id: string, s: EventBooking["status"]) => boolean;
  checkInEventBooking: (id: string) => boolean;
  checkOutEventBooking: (id: string) => boolean;
  addEventPaymentEntry: (id: string, entry: Omit<PaymentEntry, "id">) => boolean;
  addEventExtraCharge: (id: string, charge: { amount: number; reason: string }) => boolean;
  updateEventCustomGrandTotal: (id: string, customTotal: number) => boolean;
  deleteEventBooking: (id: string) => boolean;
  onViewBill: (eb: EventBooking) => void;
}) {
  const [filterProp, setFilterProp] = useState<string>("all");

  const [showManualModal, setShowManualModal] = useState(false);
  const [manualSuccess, setManualSuccess] = useState("");
  const [manualError, setManualError] = useState("");
  const [manualForm, setManualForm] = useState({
    eventTitle: events[0]?.title || "Heritage Banquet & Wedding",
    property: locations[0]?.key || "mysore",
    venue: events[0]?.venue || "Heritage Gardens & Lawns",
    userName: "",
    userEmail: "",
    mobile: "",
    eventDate: new Date().toISOString().split("T")[0],
    guestsCount: 150,
    specialNotes: "",
    totalAmount: 50000,
    advanceAmount: 10000,
    paymentMode: "UPI" as PaymentEntry["mode"],
  });

  const [selectedLedgerEvent, setSelectedLedgerEvent] = useState<EventBooking | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMode, setPayMode] = useState<PaymentEntry["mode"]>("UPI");
  const [payNotes, setPayNotes] = useState("");
  const [payMsg, setPayMsg] = useState("");

  const [extraAmount, setExtraAmount] = useState("");
  const [extraReason, setExtraReason] = useState("");
  const [extraMsg, setExtraMsg] = useState("");

  const [isEditingTotal, setIsEditingTotal] = useState(false);
  const [customTotalInput, setCustomTotalInput] = useState("");

  const handleManualEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setManualError("");
    setManualSuccess("");

    if (!manualForm.userName.trim() || !manualForm.userEmail.trim() || !manualForm.mobile.trim()) {
      setManualError("Guest Name, Email, and Mobile number are required.");
      return;
    }

    const res = createEventBooking({
      eventTitle: manualForm.eventTitle.trim(),
      property: manualForm.property,
      venue: manualForm.venue.trim() || "Heritage Grounds",
      userEmail: manualForm.userEmail.trim(),
      userName: manualForm.userName.trim(),
      eventDate: manualForm.eventDate || new Date().toISOString().split("T")[0],
      guestsCount: Number(manualForm.guestsCount) || 100,
      totalAmount: Number(manualForm.totalAmount || 50000),
      advanceAmount: Number(manualForm.advanceAmount || 0),
      paymentMode: manualForm.paymentMode,
      guestDetails: {
        firstName: manualForm.userName.split(" ")[0] || manualForm.userName,
        lastName: manualForm.userName.split(" ").slice(1).join(" ") || "",
        email: manualForm.userEmail.trim(),
        mobile: manualForm.mobile.trim(),
        specialNotes: manualForm.specialNotes,
      },
    });

    if (res.success && res.booking) {
      updateEventBookingStatus(res.booking.id, "confirmed");
      setManualSuccess(`Event reservation ${res.booking.id} created & confirmed successfully!`);
      setTimeout(() => {
        setShowManualModal(false);
        setManualSuccess("");
        setManualForm({
          eventTitle: events[0]?.title || "Heritage Banquet & Wedding",
          property: locations[0]?.key || "mysore",
          venue: events[0]?.venue || "Heritage Gardens & Lawns",
          userName: "",
          userEmail: "",
          mobile: "",
          eventDate: new Date().toISOString().split("T")[0],
          guestsCount: 150,
          specialNotes: "",
          totalAmount: 50000,
          advanceAmount: 10000,
          paymentMode: "UPI",
        });
      }, 1500);
    } else {
      setManualError(res.error || "Failed to record event booking");
    }
  };

  const handleAddPaymentRecord = () => {
    if (!selectedLedgerEvent) return;
    setPayMsg("");
    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0) {
      setPayMsg("Please enter a valid payment amount (> 0)");
      return;
    }

    const success = addEventPaymentEntry(selectedLedgerEvent.id, {
      amount: amt,
      mode: payMode,
      notes: payNotes.trim() || undefined,
      date: new Date().toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    });

    if (success) {
      const updated = eventBookings.find((b) => b.id === selectedLedgerEvent.id);
      if (updated) setSelectedLedgerEvent({ ...updated });
      setPayAmount("");
      setPayNotes("");
      setPayMsg("Event payment entry recorded successfully!");
      setTimeout(() => setPayMsg(""), 2500);
    } else {
      setPayMsg("Failed to record payment");
    }
  };

  const handleAddExtraChargeRecord = () => {
    if (!selectedLedgerEvent) return;
    setExtraMsg("");
    const amt = Number(extraAmount);
    if (isNaN(amt) || amt === 0) {
      setExtraMsg("Please enter a valid amount.");
      return;
    }
    if (!extraReason.trim()) {
      setExtraMsg("Please enter a reason or description.");
      return;
    }

    const success = addEventExtraCharge(selectedLedgerEvent.id, {
      amount: amt,
      reason: extraReason.trim(),
    });

    if (success) {
      const updated = eventBookings.find((b) => b.id === selectedLedgerEvent.id);
      if (updated) setSelectedLedgerEvent({ ...updated });
      setExtraAmount("");
      setExtraReason("");
      setExtraMsg("Extra charge recorded successfully!");
      setTimeout(() => setExtraMsg(""), 2500);
    } else {
      setExtraMsg("Failed to record extra charge");
    }
  };

  const handleSaveCustomTotal = () => {
    if (!selectedLedgerEvent) return;
    const amt = Number(customTotalInput);
    if (isNaN(amt) || amt < 0) return;
    const success = updateEventCustomGrandTotal(selectedLedgerEvent.id, amt);
    if (success) {
      const updated = eventBookings.find((b) => b.id === selectedLedgerEvent.id);
      if (updated) setSelectedLedgerEvent({ ...updated });
      setIsEditingTotal(false);
    }
  };

  const filteredEvents =
    filterProp === "all" ? events : events.filter((e) => e.property === filterProp);

  return (
    <div className="space-y-10">
      <div className="bg-card border border-border/60 shadow-lg p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 text-[color:var(--gold)] text-xs font-semibold uppercase tracking-widest">
            <Sparkles size={16} /> Resort Celebrations &amp; Venues
          </div>
          <h3 className="font-serif text-3xl text-[color:var(--forest)] mt-1">
            Events &amp; Function Halls
          </h3>
          <p className="text-xs text-charcoal/60 mt-1">
            Publish events, highlight celebrations on Home page, and process manual client venue bookings with full payment breakdown.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              setShowManualModal(true);
              setManualSuccess("");
              setManualError("");
            }}
            className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-3 text-xs font-semibold tracking-widest uppercase transition-colors cursor-pointer rounded-sm"
          >
            <Plus size={16} /> Book Event Manually
          </button>
          <Link
            to="/create-event"
            className="inline-flex items-center gap-2 bg-[color:var(--forest)] text-ivory px-6 py-3 text-xs font-semibold tracking-widest uppercase hover:bg-[color:var(--gold)] hover:text-[color:var(--forest-deep)] transition-colors"
          >
            <Plus size={16} /> Create Event / Function Hall
          </Link>
        </div>
      </div>

      {showManualModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-[color:var(--gold)]/40 shadow-2xl max-w-lg w-full p-6 space-y-4 relative animate-in fade-in zoom-in duration-200 my-8">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="font-serif text-xl font-bold text-[color:var(--forest)] flex items-center gap-2">
                <Sparkles size={18} className="text-emerald-700" /> Book Event / Function Hall (Admin Direct)
              </h3>
              <button
                onClick={() => setShowManualModal(false)}
                className="text-charcoal/50 hover:text-charcoal cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-charcoal/60">
              Record a manual event or function hall reservation when a client contacts via phone or email.
            </p>

            {manualSuccess && (
              <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs rounded font-semibold text-center">
                {manualSuccess}
              </div>
            )}
            {manualError && (
              <div className="p-3 bg-red-100 border border-red-300 text-red-900 text-xs rounded font-semibold text-center">
                {manualError}
              </div>
            )}

            <form onSubmit={handleManualEventSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-charcoal/60 mb-1">
                  Select Event / Function Hall *
                </label>
                <select
                  value={manualForm.eventTitle}
                  onChange={(e) => {
                    const selEvt = events.find((ev) => ev.title === e.target.value);
                    setManualForm({
                      ...manualForm,
                      eventTitle: e.target.value,
                      venue: selEvt ? selEvt.venue : manualForm.venue,
                      property: selEvt ? selEvt.property : manualForm.property,
                    });
                  }}
                  className="w-full bg-transparent border border-border focus:border-[color:var(--gold)] focus:outline-none px-3 py-2"
                >
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.title}>
                      {ev.title} ({ev.venue} - {ev.property.toUpperCase()})
                    </option>
                  ))}
                  <option value="Custom Function Hall Banquet">Custom Function Hall Banquet</option>
                  <option value="Wedding & Lawn Party">Wedding &amp; Lawn Party</option>
                  <option value="Corporate Off-site & Conference">Corporate Off-site &amp; Conference</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-charcoal/60 mb-1">
                    Location / Resort *
                  </label>
                  <select
                    value={manualForm.property}
                    onChange={(e) => setManualForm({ ...manualForm, property: e.target.value })}
                    className="w-full bg-transparent border border-border focus:border-[color:var(--gold)] focus:outline-none px-3 py-2"
                  >
                    {locations.map((loc) => (
                      <option key={loc.key} value={loc.key}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-charcoal/60 mb-1">
                    Venue / Hall Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Grand Heritage Lawn"
                    value={manualForm.venue}
                    onChange={(e) => setManualForm({ ...manualForm, venue: e.target.value })}
                    className="w-full bg-transparent border border-border focus:border-[color:var(--gold)] focus:outline-none px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-charcoal/60 mb-1">
                  Client Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rajesh Sharma"
                  value={manualForm.userName}
                  onChange={(e) => setManualForm({ ...manualForm, userName: e.target.value })}
                  className="w-full bg-transparent border border-border focus:border-[color:var(--gold)] focus:outline-none px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-charcoal/60 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="client@example.com"
                    value={manualForm.userEmail}
                    onChange={(e) => setManualForm({ ...manualForm, userEmail: e.target.value })}
                    className="w-full bg-transparent border border-border focus:border-[color:var(--gold)] focus:outline-none px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-charcoal/60 mb-1">
                    Mobile Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={manualForm.mobile}
                    onChange={(e) => setManualForm({ ...manualForm, mobile: e.target.value })}
                    className="w-full bg-transparent border border-border focus:border-[color:var(--gold)] focus:outline-none px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-charcoal/60 mb-1">
                    Event Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={manualForm.eventDate}
                    onChange={(e) => setManualForm({ ...manualForm, eventDate: e.target.value })}
                    className="w-full bg-transparent border border-border focus:border-[color:var(--gold)] focus:outline-none px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-charcoal/60 mb-1">
                    Guests Count *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="150"
                    value={manualForm.guestsCount}
                    onChange={(e) =>
                      setManualForm({ ...manualForm, guestsCount: Number(e.target.value) })
                    }
                    className="w-full bg-transparent border border-border focus:border-[color:var(--gold)] focus:outline-none px-3 py-2"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50/50 border border-amber-200/80 rounded-xs space-y-2">
                <div className="text-[10px] uppercase font-bold tracking-wider text-amber-900 flex items-center gap-1">
                  <IndianRupee size={12} /> Event Payment &amp; Advance Details
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[9px] uppercase font-semibold text-amber-900/70 mb-0.5">
                      Total Fee (₹) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      required
                      value={manualForm.totalAmount}
                      onChange={(e) =>
                        setManualForm({ ...manualForm, totalAmount: Math.max(0, Number(e.target.value)) })
                      }
                      className="w-full bg-white border border-amber-300 font-mono font-bold px-2 py-1 text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase font-semibold text-amber-900/70 mb-0.5">
                      Advance Paid (₹) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="500"
                      required
                      value={manualForm.advanceAmount}
                      onChange={(e) =>
                        setManualForm({ ...manualForm, advanceAmount: Math.max(0, Number(e.target.value)) })
                      }
                      className="w-full bg-white border border-amber-300 font-mono px-2 py-1 text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase font-semibold text-amber-900/70 mb-0.5">
                      Payment Mode
                    </label>
                    <select
                      value={manualForm.paymentMode}
                      onChange={(e) =>
                        setManualForm({ ...manualForm, paymentMode: e.target.value as PaymentEntry["mode"] })
                      }
                      className="w-full bg-white border border-amber-300 px-2 py-1 text-xs focus:outline-none"
                    >
                      <option value="UPI">UPI</option>
                      <option value="Cash">Cash</option>
                      <option value="Card">Card</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-charcoal/60 mb-1">
                  Special Notes / Catering Request
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Vegetarian buffet, Stage decor setup..."
                  value={manualForm.specialNotes}
                  onChange={(e) => setManualForm({ ...manualForm, specialNotes: e.target.value })}
                  className="w-full bg-transparent border border-border focus:border-[color:var(--gold)] focus:outline-none px-3 py-2"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-2.5 text-xs rounded uppercase tracking-wider transition-colors cursor-pointer mt-2"
              >
                Confirm &amp; Record Event Booking
              </button>
            </form>
          </div>
        </div>
      )}

      {selectedLedgerEvent && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-[color:var(--gold)]/40 shadow-2xl max-w-xl w-full p-6 space-y-4 relative text-charcoal rounded-sm animate-in fade-in zoom-in duration-200 my-8">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="font-serif text-xl font-bold text-[color:var(--forest)] flex items-center gap-2">
                <IndianRupee className="text-[color:var(--gold)]" size={20} />
                Event Payment Ledger: {selectedLedgerEvent.id}
              </h3>
              <button
                onClick={() => setSelectedLedgerEvent(null)}
                className="text-charcoal/50 hover:text-charcoal cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="text-xs text-charcoal/70 space-y-1 bg-[color:var(--sand)]/20 p-3 border border-border/60">
              <div><strong className="text-charcoal">Client:</strong> {selectedLedgerEvent.userName} ({selectedLedgerEvent.userEmail})</div>
              <div><strong className="text-charcoal font-semibold">Event / Venue:</strong> {selectedLedgerEvent.eventTitle} ({selectedLedgerEvent.venue})</div>
              <div><strong className="text-charcoal font-semibold">Event Date:</strong> {selectedLedgerEvent.eventDate} &bull; Guests: {selectedLedgerEvent.guestsCount}</div>
            </div>

            {(() => {
              const extraChargesSum = (selectedLedgerEvent.extraCharges || []).reduce((s, c) => s + c.amount, 0);
              const baseTotal = selectedLedgerEvent.totalAmount || 50000;
              const grandTotal = selectedLedgerEvent.customGrandTotal !== undefined ? selectedLedgerEvent.customGrandTotal + extraChargesSum : baseTotal + extraChargesSum;

              const initialAdv = selectedLedgerEvent.advanceAmount || 0;
              const paymentsSum = (selectedLedgerEvent.paymentsHistory || []).reduce((s, p) => s + p.amount, 0);
              const totalPaid = paymentsSum > 0 ? paymentsSum : initialAdv;
              const balanceDue = Math.max(0, grandTotal - totalPaid);

              return (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-sm space-y-3">
                  <div className="flex justify-between items-center border-b border-amber-200 pb-2">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-amber-900 block">Total Banquet Fee</span>
                      {isEditingTotal ? (
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type="number"
                            value={customTotalInput}
                            onChange={(e) => setCustomTotalInput(e.target.value)}
                            className="bg-white border border-amber-400 font-mono font-bold px-2 py-0.5 text-xs w-28"
                          />
                          <button onClick={handleSaveCustomTotal} className="bg-amber-800 text-white text-[10px] font-bold px-2 py-1 rounded">Save</button>
                        </div>
                      ) : (
                        <div className="font-serif text-xl font-bold text-amber-950 flex items-center gap-2">
                          ₹{grandTotal.toLocaleString("en-IN")}
                          <button onClick={() => { setCustomTotalInput(String(grandTotal)); setIsEditingTotal(true); }} className="text-[10px] font-sans font-normal text-amber-700 underline">Edit Total</button>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-emerald-900 block">Total Amount Paid</span>
                      <div className="font-serif text-xl font-bold text-emerald-700">₹{totalPaid.toLocaleString("en-IN")}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-red-900 block">Balance Due</span>
                      <div className="font-serif text-xl font-bold text-red-700">₹{balanceDue.toLocaleString("en-IN")}</div>
                    </div>
                  </div>

                  {(selectedLedgerEvent.paymentsHistory || []).length > 0 && (
                    <div className="space-y-1 pt-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 block">Payments Log:</span>
                      <div className="divide-y divide-amber-200 text-xs">
                        {(selectedLedgerEvent.paymentsHistory || []).map((p) => (
                          <div key={p.id} className="py-1 flex justify-between items-center">
                            <div><span className="font-semibold text-charcoal">{p.mode}</span> <span className="text-[10px] text-charcoal/60">({p.date}) {p.notes && `- ${p.notes}`}</span></div>
                            <div className="font-mono font-bold text-emerald-800">₹{p.amount.toLocaleString("en-IN")}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(selectedLedgerEvent.extraCharges || []).length > 0 && (
                    <div className="space-y-1 pt-2 border-t border-amber-200">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 block">Extra Charges &amp; Add-ons:</span>
                      <div className="divide-y divide-amber-200 text-xs">
                        {(selectedLedgerEvent.extraCharges || []).map((c) => (
                          <div key={c.id} className="py-1 flex justify-between items-center">
                            <div><span className="font-medium text-amber-950">{c.reason}</span> <span className="text-[10px] text-charcoal/60">({c.date})</span></div>
                            <div className="font-mono font-bold text-amber-900">+₹{c.amount.toLocaleString("en-IN")}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="space-y-2 border-t border-border pt-3">
              <span className="text-xs font-bold text-charcoal block">Record New Payment Entry:</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="number"
                  placeholder="Amount (₹)"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="bg-white border border-border px-3 py-1.5 text-xs font-mono focus:border-[color:var(--gold)] focus:outline-none"
                />
                <select
                  value={payMode}
                  onChange={(e) => setPayMode(e.target.value as PaymentEntry["mode"])}
                  className="bg-white border border-border px-3 py-1.5 text-xs focus:border-[color:var(--gold)] focus:outline-none"
                >
                  <option value="UPI">UPI Payment</option>
                  <option value="Cash">Cash</option>
                  <option value="Card">Credit/Debit Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
                <input
                  type="text"
                  placeholder="Notes (e.g. Stage Decor Advance)"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="bg-white border border-border px-3 py-1.5 text-xs focus:border-[color:var(--gold)] focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={handleAddPaymentRecord}
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-2 text-xs rounded uppercase tracking-wider transition-colors cursor-pointer"
              >
                + Add Payment Entry
              </button>
              {payMsg && <p className="text-xs text-center text-emerald-800 font-medium">{payMsg}</p>}
            </div>

            <div className="space-y-2 border-t border-border pt-3">
              <span className="text-xs font-bold text-charcoal block">Add Extra Charge / Custom Services:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Amount (₹)"
                  value={extraAmount}
                  onChange={(e) => setExtraAmount(e.target.value)}
                  className="bg-white border border-border px-3 py-1.5 text-xs font-mono focus:border-[color:var(--gold)] focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Reason (e.g. Sound System & DJ)"
                  value={extraReason}
                  onChange={(e) => setExtraReason(e.target.value)}
                  className="bg-white border border-border px-3 py-1.5 text-xs focus:border-[color:var(--gold)] focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={handleAddExtraChargeRecord}
                className="w-full bg-amber-700 hover:bg-amber-800 text-white font-semibold py-2 text-xs rounded uppercase tracking-wider transition-colors cursor-pointer"
              >
                + Add Extra Charge
              </button>
              {extraMsg && <p className="text-xs text-center text-amber-800 font-medium">{extraMsg}</p>}
            </div>
          </div>
        </div>
      )}

      <div className="bg-card border border-border/60 shadow-lg p-6 md:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h4 className="font-serif text-xl text-[color:var(--forest)]">Active Events</h4>
          <div className="flex items-center gap-2">
            <span className="text-xs text-charcoal/60">Filter Property:</span>
            <select
              value={filterProp}
              onChange={(e) => setFilterProp(e.target.value)}
              className="bg-transparent border border-border px-3 py-1.5 text-xs focus:border-[color:var(--gold)] focus:outline-none"
            >
              <option value="all">All Properties</option>
              {locations.map((loc) => (
                <option key={loc.key} value={loc.key}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((evt) => (
            <div
              key={evt.id}
              className="border border-border/60 bg-white p-5 flex flex-col justify-between relative group"
            >
              {evt.image && (
                <div className="h-40 -mx-5 -mt-5 mb-4 relative overflow-hidden bg-charcoal/10">
                  <img src={evt.image} alt={evt.title} className="w-full h-full object-cover" />
                  {evt.isHighlighted && (
                    <span className="absolute top-3 left-3 bg-[color:var(--gold)] text-[color:var(--forest-deep)] text-[9px] font-bold tracking-widest uppercase px-2.5 py-1 flex items-center gap-1 shadow-sm">
                      <Star size={10} fill="currentColor" /> Highlighted on Home
                    </span>
                  )}
                </div>
              )}
              <div>
                <div className="text-[10px] tracking-widest uppercase text-[color:var(--gold)] font-semibold">
                  {evt.property.toUpperCase()} &bull; {evt.venue}
                </div>
                <h5 className="font-serif text-lg text-[color:var(--forest)] font-bold mt-1">
                  {evt.title}
                </h5>
                <p className="text-xs text-charcoal/70 mt-2 line-clamp-2">{evt.description}</p>
                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-charcoal/60 border-t border-border/40 pt-3">
                  <div>📅 {evt.date}</div>
                  <div>👥 Cap: {evt.capacity}</div>
                  <div>₹{evt.price.toLocaleString("en-IN")}</div>
                </div>
              </div>
              <div className="mt-5 border-t border-border/40 pt-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => toggleHighlightEvent(evt.id)}
                  className={`text-[10px] font-semibold tracking-wider uppercase px-3 py-1.5 border transition-colors ${
                    evt.isHighlighted
                      ? "bg-[color:var(--gold)]/20 border-[color:var(--gold)] text-[color:var(--forest)]"
                      : "border-border text-charcoal/60 hover:border-[color:var(--gold)]"
                  }`}
                >
                  {evt.isHighlighted ? "★ Highlighted" : "☆ Highlight"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Delete event "${evt.title}"?`)) {
                      deleteEvent(evt.id);
                    }
                  }}
                  className="p-1.5 border border-red-300 text-red-700 bg-red-50 hover:bg-red-100 rounded-sm"
                  title="Delete Event"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
          {filteredEvents.length === 0 && (
            <div className="col-span-full py-12 text-center text-sm text-charcoal/50 border border-dashed border-border">
              No events configured. Click "Create Event" to publish one.
            </div>
          )}
        </div>
      </div>

      <div className="bg-card border border-border/60 shadow-lg p-6 md:p-8">
        <h4 className="font-serif text-xl text-[color:var(--forest)] mb-2">
          Client Event &amp; Function Hall Bookings
        </h4>
        <p className="text-xs text-charcoal/60 mb-6">
          Reservations submitted by clients for function halls &amp; events in vicinity.
        </p>

        <div className="overflow-x-auto border border-border/40">
          {eventBookings.length === 0 ? (
            <div className="text-center py-12 text-sm text-charcoal/50">
              No event or function hall bookings submitted yet.
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[color:var(--sand)]/30 border-b border-border/60 text-charcoal/80 uppercase tracking-widest font-semibold text-[10px]">
                  <th className="p-4">Booking ID</th>
                  <th className="p-4">Client</th>
                  <th className="p-4">Event / Venue</th>
                  <th className="p-4">Event Date</th>
                  <th className="p-4 text-center">Guests</th>
                  <th className="p-4 text-right">Fee / Paid / Due</th>
                  <th className="p-4">Status &amp; Timestamps</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {eventBookings.map((eb) => {
                  const extraChargesSum = (eb.extraCharges || []).reduce((s, c) => s + c.amount, 0);
                  const baseTotal = eb.totalAmount || 50000;
                  const grandTotal = eb.customGrandTotal !== undefined ? eb.customGrandTotal + extraChargesSum : baseTotal + extraChargesSum;

                  const initialAdv = eb.advanceAmount || 0;
                  const paymentsSum = (eb.paymentsHistory || []).reduce((s, p) => s + p.amount, 0);
                  const totalPaid = paymentsSum > 0 ? paymentsSum : initialAdv;
                  const balanceDue = Math.max(0, grandTotal - totalPaid);

                  return (
                    <tr key={eb.id} className="hover:bg-[color:var(--sand)]/10">
                      <td className="p-4 font-mono font-bold text-[color:var(--forest)]">{eb.id}</td>
                      <td className="p-4">
                        <div className="font-medium text-charcoal">{eb.userName}</div>
                        <div className="text-[10px] text-charcoal/60">{eb.userEmail}</div>
                        {eb.guestDetails?.mobile && (
                          <div className="text-[10px] text-charcoal/50">{eb.guestDetails.mobile}</div>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-[color:var(--forest)]">
                          {eb.eventTitle}
                        </div>
                        <div className="text-[10px] text-charcoal/60">
                          {eb.venue} ({eb.property})
                        </div>
                      </td>
                      <td className="p-4 font-medium font-mono">{eb.eventDate}</td>
                      <td className="p-4 text-center font-bold">{eb.guestsCount}</td>
                      <td className="p-4 text-right font-mono">
                        <div className="font-bold text-[color:var(--forest)]">₹{grandTotal.toLocaleString("en-IN")}</div>
                        <div className="text-[10px] text-emerald-800 font-semibold">Paid: ₹{totalPaid.toLocaleString("en-IN")}</div>
                        {balanceDue > 0 ? (
                          <div className="text-[10px] text-red-700 font-semibold">Due: ₹{balanceDue.toLocaleString("en-IN")}</div>
                        ) : (
                          <div className="text-[9px] text-emerald-700 font-bold uppercase tracking-wider">Fully Paid</div>
                        )}
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 text-[9px] font-extrabold tracking-wider uppercase rounded-full ${
                            eb.status === "confirmed" || eb.status === "checked_in" || eb.status === "checked_out"
                              ? "bg-emerald-100 text-emerald-800"
                              : eb.status === "cancelled"
                                ? "bg-red-100 text-red-800"
                                : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {eb.status}
                        </span>
                        {eb.checkedInAt && (
                          <div className="text-[9px] text-emerald-800 font-medium mt-1">In: {eb.checkedInAt}</div>
                        )}
                        {eb.checkedOutAt && (
                          <div className="text-[9px] text-blue-800 font-medium">Out: {eb.checkedOutAt}</div>
                        )}
                      </td>
                      <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                        {(eb.status === "pending" || eb.status === "confirmed") && (
                          <button
                            type="button"
                            onClick={() => checkInEventBooking(eb.id)}
                            className="px-2 py-1 bg-emerald-700 text-white text-[10px] font-semibold uppercase tracking-wider rounded-xs hover:bg-emerald-800 transition-colors"
                            title="Check In Event"
                          >
                            Check In
                          </button>
                        )}
                        {eb.status === "checked_in" && (
                          <button
                            type="button"
                            onClick={() => checkOutEventBooking(eb.id)}
                            className="px-2 py-1 bg-blue-700 text-white text-[10px] font-semibold uppercase tracking-wider rounded-xs hover:bg-blue-800 transition-colors"
                            title="Check Out Event"
                          >
                            Check Out
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setSelectedLedgerEvent(eb)}
                          className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-semibold uppercase tracking-wider rounded-xs transition-colors inline-flex items-center gap-1"
                          title="View & Edit Payment Ledger"
                        >
                          <IndianRupee size={11} /> Payments
                        </button>
                        <button
                          type="button"
                          onClick={() => onViewBill(eb)}
                          className="px-2 py-1 bg-[color:var(--forest)] hover:bg-[color:var(--gold)] hover:text-black text-ivory text-[10px] font-semibold uppercase tracking-wider rounded-xs transition-colors inline-flex items-center gap-1"
                          title="Download Tax Invoice Bill PDF"
                        >
                          <FileText size={11} /> Bill Invoice
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteEventBooking(eb.id)}
                          className="p-1 border border-gray-300 text-gray-500 hover:text-red-700 rounded-xs"
                          title="Delete record"
                        >
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function TimelineRow({
  room,
  dates,
  bookings,
  todayStr,
}: {
  room: PhysicalRoom;
  dates: Date[];
  bookings: Booking[];
  todayStr: string;
}) {
  return (
    <>
      {/* Room Column */}
      <div className="p-4 border-r border-b border-border/60 bg-[color:var(--sand)]/10 flex flex-col justify-center">
        <div className="font-serif text-sm font-bold text-[color:var(--forest)]">{room.name}</div>
        <div className="text-[9px] uppercase tracking-wider text-[color:var(--gold)] mt-0.5 font-medium">
          {room.roomTypeSlug.replace("-", " ")}
        </div>
      </div>

      {/* Date Columns */}
      {dates.map((date, idx) => {
        const dateStr = date.toISOString().split("T")[0];
        const isToday = dateStr === todayStr;

        // Find if this room is booked for this date (match room.id, room.name, or numeric ID for online & manual bookings)
        const booking = bookings.find(
          (b) =>
            b.status !== "cancelled" &&
            (b.roomId === room.id || b.roomId === room.name || room.id.replace("RM", "") === b.roomId) &&
            dateStr >= b.checkIn &&
            dateStr < b.checkOut,
        );

        if (booking) {
          const isCheckInDay = dateStr === booking.checkIn;
          const isConfirmed =
            booking.status === "confirmed" ||
            booking.status === "checked_in" ||
            booking.status === "checked_out";

          return (
            <div
              key={idx}
              className={`border-r border-b border-border/60 relative p-1 flex items-center justify-center text-center ${
                isToday ? "bg-amber-50/40" : ""
              }`}
            >
              <div
                title={`${booking.userName} (${booking.id})\n${booking.checkIn} to ${booking.checkOut}\nStatus: ${booking.status}`}
                className={`absolute inset-0.5 flex items-center justify-center rounded-sm overflow-hidden text-[9px] font-semibold tracking-wider ${
                  isConfirmed
                    ? "bg-[color:var(--forest)] text-ivory border border-[color:var(--gold)]/30"
                    : "bg-[color:var(--gold)]/30 text-[color:var(--forest-deep)] border border-[color:var(--gold)]/40"
                }`}
              >
                {isCheckInDay ? (
                  <span className="px-1 truncate font-serif text-[8px] tracking-normal font-bold">
                    {booking.userName.split(" ")[0]}
                  </span>
                ) : (
                  <span className="opacity-40 font-mono text-[7px] font-normal">Ã¢â‚¬Â¢</span>
                )}
              </div>
            </div>
          );
        }

        // Room is free
        return (
          <div
            key={idx}
            className={`border-r border-b border-border/60 flex items-center justify-center p-1 bg-[color:var(--sand)]/5 ${
              isToday ? "bg-amber-50/40" : ""
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-border/40" />
          </div>
        );
      })}
    </>
  );
}

function MetricCard({
  icon,
  label,
  value,
  sub,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`bg-card border p-6 shadow-sm flex items-start gap-4 transition-all duration-300 hover:shadow-md ${
        highlight ? "border-[color:var(--gold)] bg-[color:var(--gold)]/5" : "border-border/60"
      }`}
    >
      <div className="w-10 h-10 rounded-full bg-[color:var(--sand)] flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <div className="text-[10px] tracking-[0.2em] uppercase text-charcoal/60 font-semibold">
          {label}
        </div>
        <div className="font-serif text-3xl text-[color:var(--forest)] font-semibold mt-2">
          {value}
        </div>
        <div className="text-[11px] text-charcoal/50 mt-1">{sub}</div>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// 2. CLIENT DASHBOARD (MY BOOKINGS)
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
function ClientDashboard({
  currentUser,
  bookings,
  eventBookings = [],
  cancelBooking,
}: {
  currentUser: User;
  bookings: Booking[];
  eventBookings?: EventBooking[];
  cancelBooking: (id: string) => boolean;
}) {
  // Filter bookings belonging to this client email
  const clientBookings = bookings
    .filter((b) => b.userEmail === currentUser.email)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const clientEventBookings = eventBookings
    .filter((eb) => eb.userEmail === currentUser.email)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const activeStays = clientBookings.filter((b) => b.status !== "cancelled");
  const cancelledStays = clientBookings.filter((b) => b.status === "cancelled");

  return (
    <div className="pt-28 pb-24 px-6 max-w-5xl mx-auto">
      <div className="text-center mb-12">
        <div className="text-eyebrow">Guest Console</div>
        <h1 className="mt-3 font-serif text-4xl md:text-5xl text-[color:var(--forest)]">
          Your Stays at VANASURU
        </h1>
        <p className="mt-3 text-sm text-charcoal/60 max-w-xl mx-auto">
          Welcome, {currentUser.name}. Track your reservation status, check upcoming stays, or plan
          your next nature escape.
        </p>
      </div>

      {clientBookings.length === 0 ? (
        <div className="bg-card border border-border/60 shadow-lg p-12 text-center max-w-2xl mx-auto">
          <Calendar className="mx-auto text-[color:var(--gold)] mb-4" size={40} />
          <h3 className="font-serif text-2xl text-[color:var(--forest)]">No bookings found.</h3>
          <p className="mt-3 text-sm text-charcoal/60 leading-relaxed">
            You haven't made any stay inquiries yet. Explore our rooms and check availability to
            start planning.
          </p>
          <div className="mt-8">
            <Link
              to="/book"
              className="inline-flex items-center bg-[color:var(--forest)] text-ivory px-8 py-4 text-[11px] font-semibold tracking-[0.28em] uppercase hover:bg-[color:var(--gold)] hover:text-[color:var(--forest-deep)] transition-colors"
            >
              Book Your First Stay
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="bg-card border border-border/60 shadow-md p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <Home size={20} className="text-[color:var(--gold)]" />
              <h3 className="font-serif text-2xl text-[color:var(--forest)]">
                Active Stays & Requests
              </h3>
            </div>

            {activeStays.length === 0 ? (
              <p className="text-sm text-charcoal/50 text-center py-6">
                You have no active stays booked.
              </p>
            ) : (
              <div className="space-y-6">
                {activeStays.map((b) => {
                  const propertyName =
                    (PROPERTIES as Record<string, { name: string }>)[b.property]?.name ||
                    `VANASURU ${b.property}`;
                  return (
                    <div
                      key={b.id}
                      className="border border-border/60 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-[color:var(--gold)]/60 transition-colors"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs font-bold bg-[color:var(--sand)]/50 text-charcoal px-2 py-0.5 border border-border/60 rounded-sm">
                            {b.id}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 text-[9px] font-extrabold tracking-wider uppercase rounded-full ${
                              b.status === "confirmed"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {b.status}
                          </span>
                        </div>
                        <h4 className="font-serif text-xl text-[color:var(--forest)] font-bold">
                          {propertyName}
                        </h4>
                        <div className="text-xs text-charcoal/80 space-y-1">
                          <div>
                            <span className="font-semibold text-charcoal">Dates:</span>{" "}
                            {format(parseISO(b.checkIn), "MMM dd")} Ã¢â‚¬â€œ{" "}
                            {format(parseISO(b.checkOut), "MMM dd, yyyy")} (
                            {differenceInDays(parseISO(b.checkOut), parseISO(b.checkIn))} nights)
                          </div>
                          <div>
                            <span className="font-semibold text-charcoal">Room:</span>{" "}
                            <span className="capitalize">{b.roomTypeSlug.replace("-", " ")}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-charcoal">Guests:</span> {b.adults}{" "}
                            Adults {b.children > 0 && `, ${b.children} Children`}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3">
                        {b.status === "pending" && (
                          <button
                            onClick={() => {
                              if (
                                confirm("Are you sure you want to cancel this booking request?")
                              ) {
                                cancelBooking(b.id);
                              }
                            }}
                            className="px-5 py-3 border border-red-200 text-red-700 bg-red-50/20 hover:bg-red-50 text-[10px] tracking-wider uppercase font-semibold transition-colors cursor-pointer"
                          >
                            Cancel Request
                          </button>
                        )}
                        <Link
                          to="/contact"
                          className="inline-flex justify-center items-center px-5 py-3 border border-border text-charcoal hover:border-[color:var(--gold)] text-[10px] tracking-wider uppercase font-semibold transition-colors"
                        >
                          Help & Support
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Cancelled Bookings history if any */}
          {cancelledStays.length > 0 && (
            <div className="bg-card/60 border border-border/40 shadow-sm p-6 md:p-8 opacity-75">
              <div className="flex items-center gap-3 mb-6">
                <Info size={18} className="text-charcoal/40" />
                <h3 className="font-serif text-xl text-charcoal/70">Cancelled History</h3>
              </div>
              <div className="divide-y divide-border/40">
                {cancelledStays.map((b) => (
                  <div
                    key={b.id}
                    className="py-4 first:pt-0 last:pb-0 flex justify-between items-center text-xs"
                  >
                    <div>
                      <span className="font-mono text-charcoal/50 mr-2">{b.id}</span>
                      <span className="font-medium text-charcoal/75 capitalize">
                        {b.property}
                      </span>{" "}
                      Ã¢â‚¬â€{" "}
                      <span className="capitalize text-charcoal/60">
                        {b.roomTypeSlug.replace("-", " ")}
                      </span>
                      <div className="text-[10px] text-charcoal/40 mt-0.5">
                        {b.checkIn} to {b.checkOut}
                      </div>
                    </div>
                    <span className="text-[9px] font-bold text-charcoal/40 uppercase tracking-widest">
                      Cancelled
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}



