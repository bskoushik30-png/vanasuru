import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import fs from "node:fs";
import path from "node:path";
import { supabase } from "./supabase";
import { PROPERTIES, ROOMS, isPropertyMatch } from "./site-data";
import type { PropertyKey } from "./site-data";
import type { Booking, CreateBookingInput, User } from "./booking-store";
import { sendBookingConfirmationEmail } from "./email-api";

export const ADVANCE_AMOUNT_RUPEES = 1;
export const ADVANCE_AMOUNT_PAISE = ADVANCE_AMOUNT_RUPEES * 100;
export const PAYMENT_CURRENCY = "INR";

const propertySchema = z.string().min(1);
const bookingStatusSchema = z.enum(["pending", "confirmed", "cancelled"]);

const guestDetailsSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  mobile: z.string().min(6),
  address: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  pincode: z.string().min(1),
  country: z.string().min(1),
  idProofType: z.string().optional(),
  idProofNumber: z.string().optional(),
  idProofImage: z.string().optional(),
});

const bookingInputSchema = z.object({
  property: propertySchema,
  roomTypeSlug: z.string().min(1),
  roomId: z.string().optional(),
  checkIn: z.string().min(1),
  checkOut: z.string().min(1),
  adults: z.number().int().min(1),
  children: z.number().int().min(0),
  roomsCount: z.number().int().min(1).max(1),
  guestDetails: guestDetailsSchema,
});

const userSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(["client", "admin"]),
});

const availabilityInputSchema = z.object({
  property: propertySchema,
  checkIn: z.string().optional().default(""),
  checkOut: z.string().optional().default(""),
});

const createOrderInputSchema = z.object({ booking: bookingInputSchema, user: userSchema });

const verifyPaymentInputSchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

type Availability = {
  roomTypeSlug: string;
  availableCount: number;
  availableRoomIds: string[];
};

type PendingOrder = {
  booking: CreateBookingInput;
  user: User;
  advanceAmountPaise: number;
  createdAt: string;
};

type SupabaseBookingRow = {
  id: string;
  user_email: string;
  user_name: string;
  property: string;
  room_type_slug: string;
  room_id: string;
  check_in: string;
  check_out: string;
  adults: number;
  children: number;
  rooms_count: number;
  guest_details: Booking["guestDetails"];
  status: Booking["status"];
  checked_in_at?: string | null;
  checked_out_at?: string | null;
  payments_history?: any;
  extra_charges?: any;
  custom_grand_total?: number | null;
  email_notified?: boolean | null;
  payment: Booking["payment"] | null;
  created_at: string;
};

const PHYSICAL_ROOMS = [
  {
    id: "RM101",
    name: "Room 101",
    property: "mysore",
    roomTypeSlug: "deluxe-room",
    advanceAmount: 10,
  },
  {
    id: "RM102",
    name: "Room 102",
    property: "mysore",
    roomTypeSlug: "premium-suite",
    advanceAmount: 10,
  },
  {
    id: "RM103",
    name: "Room 103",
    property: "mysore",
    roomTypeSlug: "family-villa",
    advanceAmount: 10,
  },
  {
    id: "RM104",
    name: "Room 104",
    property: "mysore",
    roomTypeSlug: "deluxe-room",
    advanceAmount: 10,
  },
  {
    id: "RM201",
    name: "Room 201",
    property: "mahadevapura",
    roomTypeSlug: "executive-room",
    advanceAmount: 10,
  },
  {
    id: "RM202",
    name: "Room 202",
    property: "mahadevapura",
    roomTypeSlug: "premium-suite",
    advanceAmount: 10,
  },
  {
    id: "RM203",
    name: "Room 203",
    property: "mahadevapura",
    roomTypeSlug: "executive-room",
    advanceAmount: 10,
  },
] as const;

// In-memory fallback only used when Supabase is unreachable
const serverBookings: Booking[] = [];

const pendingOrders = new Map<string, PendingOrder>();

async function getStoredBookings(): Promise<Booking[]> {
  const { data, error } = await supabase.from("bookings").select("*");
  if (error) {
    console.warn("Supabase bookings table unavailable, using in-memory bookings.", error.message);
    return serverBookings;
  }
  return (data as SupabaseBookingRow[]).map(fromSupabaseBooking);
}

const OPTIONAL_BOOKING_COLUMNS = [
  "checked_in_at",
  "checked_out_at",
  "payments_history",
  "extra_charges",
  "custom_grand_total",
  "email_notified",
  "payment",
];

async function persistBooking(booking: Booking) {
  const currentPayload = { ...toSupabaseBooking(booking) } as Record<string, unknown>;

  while (true) {
    const { error } = await supabase.from("bookings").upsert(currentPayload);
    if (!error) {
      serverBookings.push(booking);
      return;
    }

    const errMsg = (error.message || "").toLowerCase();
    let strippedAny = false;

    for (const col of OPTIONAL_BOOKING_COLUMNS) {
      if (col in currentPayload && errMsg.includes(col)) {
        delete currentPayload[col];
        strippedAny = true;
      }
    }

    if (!strippedAny && (errMsg.includes("schema cache") || errMsg.includes("column"))) {
      for (const col of OPTIONAL_BOOKING_COLUMNS) {
        if (col in currentPayload) {
          delete currentPayload[col];
          strippedAny = true;
        }
      }
    }

    if (!strippedAny) {
      console.warn("Supabase booking insert note:", error.message);
      serverBookings.push(booking);
      return;
    }
  }
}

function fromSupabaseBooking(row: SupabaseBookingRow): Booking {
  return {
    id: row.id,
    userEmail: row.user_email,
    userName: row.user_name,
    property: row.property,
    roomTypeSlug: row.room_type_slug,
    roomId: row.room_id,
    checkIn: row.check_in,
    checkOut: row.check_out,
    adults: row.adults,
    children: row.children,
    roomsCount: row.rooms_count,
    guestDetails: row.guest_details,
    status: row.status,
    checkedInAt: row.checked_in_at ?? undefined,
    checkedOutAt: row.checked_out_at ?? undefined,
    paymentsHistory: row.payments_history ?? undefined,
    extraCharges: row.extra_charges ?? undefined,
    customGrandTotal: row.custom_grand_total ?? undefined,
    emailNotified: row.email_notified ?? undefined,
    createdAt: row.created_at,
    payment: row.payment ?? undefined,
  };
}

function toSupabaseBooking(booking: Booking): SupabaseBookingRow {
  return {
    id: booking.id,
    user_email: booking.userEmail,
    user_name: booking.userName,
    property: booking.property,
    room_type_slug: booking.roomTypeSlug,
    room_id: booking.roomId,
    check_in: booking.checkIn,
    check_out: booking.checkOut,
    adults: booking.adults,
    children: booking.children,
    rooms_count: booking.roomsCount,
    guest_details: booking.guestDetails,
    status: booking.status,
    checked_in_at: booking.checkedInAt ?? null,
    checked_out_at: booking.checkedOutAt ?? null,
    payments_history: booking.paymentsHistory ?? null,
    extra_charges: booking.extraCharges ?? null,
    custom_grand_total: booking.customGrandTotal ?? null,
    email_notified: booking.emailNotified ?? null,
    payment: booking.payment ?? null,
    created_at: booking.createdAt,
  };
}

export const syncBookingDb = createServerFn({ method: "POST" })
  .validator(z.object({ booking: z.any() }))
  .handler(async ({ data }) => {
    try {
      await persistBooking(data.booking as Booking);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || String(e) };
    }
  });

export const deleteBookingDb = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    try {
      console.log(`[Supabase API] Deleting booking record: ${data.id}`);
      const { error } = await supabase.from("bookings").delete().eq("id", data.id);
      if (error) {
        console.warn(`[Supabase API] Delete eq(id) error for ${data.id}:`, error.message);
        await supabase.from("bookings").delete().ilike("id", data.id.trim());
      }
      return { success: true };
    } catch (e: any) {
      console.error(`[Supabase API] Exception deleting booking ${data.id}:`, e);
      return { success: false, error: e?.message || String(e) };
    }
  });

export const deleteAllBookingsDb = createServerFn({ method: "POST" }).handler(async () => {
  try {
    console.log("[Supabase API] Wiping ALL bookings from Supabase database table...");
    const { data: rows } = await supabase.from("bookings").select("id");
    if (rows && rows.length > 0) {
      const ids = rows.map((r) => r.id);
      console.log(`[Supabase API] Found ${ids.length} booking records to delete:`, ids);
      const { error: inErr } = await supabase.from("bookings").delete().in("id", ids);
      if (inErr) {
        console.warn("[Supabase API] Bulk delete.in() warning:", inErr.message);
        for (const id of ids) {
          await supabase.from("bookings").delete().eq("id", id);
        }
      }
    }
    await supabase.from("bookings").delete().neq("id", "PROT_KEEP_NONE_DUMMY");
    await supabase.from("bookings").delete().gte("created_at", "1970-01-01T00:00:00Z");
    console.log("[Supabase API] Wiped all bookings successfully.");
    return { success: true };
  } catch (e: any) {
    console.error("[Supabase API] Exception wiping all bookings:", e);
    return { success: false, error: e?.message || String(e) };
  }
});

async function checkServerAvailability(
  property: string,
  checkIn: string,
  checkOut: string,
): Promise<Availability[]> {
  // Query physical rooms from Supabase if table is available, otherwise fallback
  const { data: dbRooms } = await supabase.from("rooms").select("*");
  const activeRooms =
    dbRooms && dbRooms.length > 0
      ? dbRooms.map((r) => ({
        id: r.id,
        name: r.name,
        property: r.property,
        roomTypeSlug: r.room_type_slug,
      }))
      : PHYSICAL_ROOMS;

  if (!checkIn || !checkOut) {
    return mapAvailableRooms(activeRooms.filter((room) => isPropertyMatch(room.property, property)));
  }

  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  if (Number.isNaN(checkInDate.getTime()) || Number.isNaN(checkOutDate.getTime())) return [];
  if (checkInDate >= checkOutDate) return [];

  const bookings = await getStoredBookings();
  const overlappingBookings = bookings.filter((booking) => {
    if (booking.status === "cancelled") return false;
    const bookingIn = new Date(booking.checkIn);
    const bookingOut = new Date(booking.checkOut);
    return checkInDate < bookingOut && checkOutDate > bookingIn;
  });

  const bookedRoomIds = new Set(overlappingBookings.map((booking) => booking.roomId));
  const availableRooms = activeRooms.filter(
    (room) => isPropertyMatch(room.property, property) && !bookedRoomIds.has(room.id),
  );

  return mapAvailableRooms(availableRooms);
}

function mapAvailableRooms(
  rooms: Array<{ id: string; name: string; property: string; roomTypeSlug: string }>,
): Availability[] {
  const availabilityMap: Record<string, { count: number; ids: string[] }> = {};
  rooms.forEach((room) => {
    if (!availabilityMap[room.roomTypeSlug])
      availabilityMap[room.roomTypeSlug] = { count: 0, ids: [] };
    availabilityMap[room.roomTypeSlug].count += 1;
    availabilityMap[room.roomTypeSlug].ids.push(room.id);
  });

  return Object.entries(availabilityMap).map(([roomTypeSlug, value]) => ({
    roomTypeSlug,
    availableCount: value.count,
    availableRoomIds: value.ids,
  }));
}

async function resolveRoom(booking: CreateBookingInput) {
  const availability = await checkServerAvailability(
    booking.property,
    booking.checkIn,
    booking.checkOut,
  );
  const roomType = availability.find((item) => item.roomTypeSlug === booking.roomTypeSlug);
  if (booking.roomId && roomType?.availableRoomIds.includes(booking.roomId)) {
    return booking.roomId;
  }
  return roomType?.availableRoomIds[0];
}

function requireRazorpayCredentials() {
  const keyId =
    process.env.RAZORPAY_KEY_ID ??
    process.env.VITE_RAZORPAY_KEY_ID ??
    (import.meta as any).env?.VITE_RAZORPAY_KEY_ID ??
    (import.meta as any).env?.RAZORPAY_KEY_ID;
  const keySecret =
    process.env.RAZORPAY_KEY_SECRET ??
    (import.meta as any).env?.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret)
    throw new Error("Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.");
  return { keyId, keySecret };
}

function toBasicAuth(keyId: string, keySecret: string) {
  const value = `${keyId}:${keySecret}`;
  if (typeof btoa === "function") return btoa(value);
  return Buffer.from(value).toString("base64");
}

async function getRoomAdvanceAmountInRupees(
  booking: CreateBookingInput,
  assignedRoomId?: string,
): Promise<number> {
  const targetRoomId = assignedRoomId || booking.roomId;
  const { data: dbRooms } = await supabase.from("rooms").select("*");
  const rooms =
    dbRooms && dbRooms.length > 0
      ? dbRooms.map((r) => ({
        id: r.id,
        property: r.property,
        roomTypeSlug: r.room_type_slug,
        advanceAmount: Number(r.advance_amount ?? 1),
      }))
      : PHYSICAL_ROOMS;

  if (targetRoomId) {
    const found = rooms.find((r) => r.id === targetRoomId);
    if (found && found.advanceAmount != null) return found.advanceAmount;
  }

  const matchingRoom = rooms.find(
    (r) => r.property === booking.property && r.roomTypeSlug === booking.roomTypeSlug,
  );
  if (matchingRoom && matchingRoom.advanceAmount != null) return matchingRoom.advanceAmount;

  return ADVANCE_AMOUNT_RUPEES;
}

async function createRazorpayOrder(booking: CreateBookingInput, user: User, amountPaise: number) {
  const { keyId, keySecret } = requireRazorpayCredentials();
  const receipt = `vanasuru_${Date.now()}`.slice(0, 40);
  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      authorization: `Basic ${toBasicAuth(keyId, keySecret)}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      amount: amountPaise,
      currency: PAYMENT_CURRENCY,
      receipt,
      notes: {
        booking_type: "advance",
        property:
          (PROPERTIES as Record<string, { name: string }>)[booking.property]?.name ??
          booking.property,
        room_type:
          ROOMS.find((room) => room.slug === booking.roomTypeSlug)?.name ?? booking.roomTypeSlug,
        check_in: booking.checkIn,
        check_out: booking.checkOut,
        guest_email: user.email,
      },
    }),
  });
  const payload = (await response.json()) as { id?: string; error?: { description?: string } };
  if (!response.ok || !payload.id)
    throw new Error(payload.error?.description ?? "Unable to create Razorpay order.");
  return { keyId, orderId: payload.id, receipt };
}

async function createSignature(orderId: string, paymentId: string, secret: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(`${orderId}|${paymentId}`),
  );
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function signaturesMatch(left: string, right: string) {
  if (left.length !== right.length) return false;
  let result = 0;
  for (let i = 0; i < left.length; i += 1) result |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return result === 0;
}

export const getBookingAvailability = createServerFn({ method: "GET" })
  .validator(availabilityInputSchema)
  .handler(async ({ data }) => {
    return checkServerAvailability(data.property, data.checkIn, data.checkOut);
  });

export const createAdvancePaymentOrder = createServerFn({ method: "POST" })
  .validator(createOrderInputSchema)
  .handler(async ({ data }) => {
    const assignedRoomId = await resolveRoom(data.booking);
    if (!assignedRoomId)
      throw new Error("Selected room type is no longer available for these dates.");
    const advanceRupees = await getRoomAdvanceAmountInRupees(data.booking, assignedRoomId);
    const advancePaise = advanceRupees * 100;
    const order = await createRazorpayOrder(data.booking, data.user, advancePaise);
    pendingOrders.set(order.orderId, {
      booking: data.booking,
      user: data.user,
      advanceAmountPaise: advancePaise,
      createdAt: new Date().toISOString(),
    });
    return {
      keyId: order.keyId,
      orderId: order.orderId,
      amount: advancePaise,
      amountDisplay: `Rs. ${advanceRupees.toLocaleString("en-IN")}`,
      currency: PAYMENT_CURRENCY,
      receipt: order.receipt,
    };
  });

export const verifyAdvancePayment = createServerFn({ method: "POST" })
  .validator(verifyPaymentInputSchema)
  .handler(async ({ data }) => {
    const { keySecret } = requireRazorpayCredentials();
    const pendingOrder = pendingOrders.get(data.razorpay_order_id);
    if (!pendingOrder)
      throw new Error("Payment verified, but the booking session expired. Please contact support.");
    const expectedSignature = await createSignature(
      data.razorpay_order_id,
      data.razorpay_payment_id,
      keySecret,
    );
    if (!signaturesMatch(expectedSignature, data.razorpay_signature))
      throw new Error("Payment signature verification failed. Booking was not created.");
    const assignedRoomId = await resolveRoom(pendingOrder.booking);
    if (!assignedRoomId)
      throw new Error(
        "Payment succeeded, but the selected room was just booked. Please contact support.",
      );

    const booking: Booking = {
      ...pendingOrder.booking,
      id: `BK-${Math.floor(1000 + Math.random() * 9000)}`,
      userEmail: pendingOrder.user.email,
      userName: pendingOrder.user.name,
      roomId: assignedRoomId,
      status: bookingStatusSchema.parse("confirmed"),
      createdAt: new Date().toISOString(),
      payment: {
        provider: "razorpay",
        orderId: data.razorpay_order_id,
        paymentId: data.razorpay_payment_id,
        amountPaid: pendingOrder.advanceAmountPaise,
        currency: PAYMENT_CURRENCY,
        paidAt: new Date().toISOString(),
      },
    };

    await persistBooking(booking);
    pendingOrders.delete(data.razorpay_order_id);

    // Send confirmation emails to guest and admin
    void sendBookingConfirmationEmail({ data: { booking } }).catch((err) => {
      console.error("Failed to send online booking confirmation email:", err);
    });

    return { booking };
  });

// Unified initial store loader
export const getInitialStoreData = createServerFn({ method: "GET" }).handler(async () => {
  const [bookingsResult, locationsResult, roomsResult, usersResult] = await Promise.all([
    supabase.from("bookings").select("*"),
    supabase.from("locations").select("*"),
    supabase.from("rooms").select("*"),
    supabase.from("users").select("*"),
  ]);

  const bookings = bookingsResult.data || [];
  const locations = locationsResult.data || [];
  const rooms = roomsResult.data || [];
  const users = usersResult.data || [];

  return {
    bookings: bookings.map(fromSupabaseBooking),
    locations: locations.map((row: Record<string, unknown>) => ({
      id: String(row.id || ""),
      key: String(row.key || ""),
      name: String(row.name || ""),
      address: String(row.address || ""),
      phone: String(row.phone || ""),
      email: String(row.email || ""),
      tagline: String(row.tagline || ""),
    })),
    rooms: rooms.map((row: Record<string, unknown>) => ({
      id: String(row.id || ""),
      name: String(row.name || ""),
      property: String(row.property || ""),
      roomTypeSlug: String(row.room_type_slug || ""),
      advanceAmount: Number(row.advance_amount ?? 1),
      pricePerNight: Number(row.price_per_night ?? 3500),
      photos: Array.isArray(row.photos) ? row.photos.map(String) : [],
      maxGuests: Number(row.max_guests ?? 4),
      maxAdults: Number(row.max_adults ?? 2),
      maxKids: Number(row.max_kids ?? 1),
      bedType: String(row.bed_type || "King Bed"),
    })),
    users: users.map((row: Record<string, unknown>) => ({
      id: String(row.id || ""),
      email: String(row.email || ""),
      password: String(row.password || ""),
      name: String(row.name || ""),
      role: (row.role === "admin" ? "admin" : "client") as "client" | "admin",
    })),
  };
});

// User Accounts CRUD
export const registerUserDb = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string(),
      email: z.string().email(),
      password: z.string(),
      name: z.string(),
      role: z.enum(["client", "admin"]),
    }),
  )
  .handler(async ({ data }) => {
    const { error } = await supabase.from("users").insert({
      ...data,
      email: data.email.toLowerCase().trim(),
    });
    if (error) throw new Error(error.message);
    return { success: true };
  });

// Locations CRUD
export const addLocationDb = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string(),
      key: z.string(),
      name: z.string(),
      address: z.string(),
      phone: z.string(),
      email: z.string(),
      tagline: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    const { error } = await supabase.from("locations").insert(data);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const deleteLocationDb = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const { error } = await supabase.from("locations").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

// Rooms CRUD
const OPTIONAL_ROOM_COLUMNS = [
  "photos",
  "advance_amount",
  "price_per_night",
  "max_guests",
  "max_adults",
  "max_kids",
  "bed_type",
];

async function syncRoomToSupabase(mode: "insert" | "upsert", payload: Record<string, unknown>) {
  const currentPayload = { ...payload };

  while (true) {
    const { error } =
      mode === "insert"
        ? await supabase.from("rooms").insert(currentPayload)
        : await supabase.from("rooms").upsert(currentPayload);

    if (!error) {
      return { success: true };
    }

    const errMsg = (error.message || "").toLowerCase();
    let strippedAny = false;

    for (const col of OPTIONAL_ROOM_COLUMNS) {
      if (col in currentPayload && errMsg.includes(col)) {
        delete currentPayload[col];
        strippedAny = true;
      }
    }

    if (!strippedAny && (errMsg.includes("schema cache") || errMsg.includes("column"))) {
      for (const col of OPTIONAL_ROOM_COLUMNS) {
        if (col in currentPayload) {
          delete currentPayload[col];
          strippedAny = true;
        }
      }
    }

    if (!strippedAny) {
      console.warn(`Room DB ${mode} warning:`, error.message);
      return { success: false, error: error.message };
    }
  }
}

export const addRoomDb = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string(),
      name: z.string(),
      property: z.string(),
      room_type_slug: z.string(),
      advance_amount: z.number().min(0).optional().default(1),
      price_per_night: z.number().min(0).optional().default(3500),
      photos: z.array(z.string()).optional().default([]),
      max_guests: z.number().optional().default(4),
      max_adults: z.number().optional().default(2),
      max_kids: z.number().optional().default(1),
      bed_type: z.string().optional().default("King Bed"),
    }),
  )
  .handler(async ({ data }) => {
    const insertPayload: Record<string, unknown> = {
      id: data.id,
      name: data.name,
      property: data.property,
      room_type_slug: data.room_type_slug,
      advance_amount: data.advance_amount,
      price_per_night: data.price_per_night,
      photos: data.photos,
      max_guests: data.max_guests,
      max_adults: data.max_adults,
      max_kids: data.max_kids,
      bed_type: data.bed_type,
    };
    const res = await syncRoomToSupabase("insert", insertPayload);
    if (!res.success) {
      console.warn("Could not insert room into Supabase DB:", res.error);
    }
    return { success: true };
  });

export const updateRoomDb = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string(),
      name: z.string(),
      property: z.string(),
      room_type_slug: z.string(),
      advance_amount: z.number().min(0).optional().default(1),
      price_per_night: z.number().min(0).optional().default(3500),
      photos: z.array(z.string()).optional().default([]),
      max_guests: z.number().optional().default(4),
      max_adults: z.number().optional().default(2),
      max_kids: z.number().optional().default(1),
      bed_type: z.string().optional().default("King Bed"),
    }),
  )
  .handler(async ({ data }) => {
    const payload: Record<string, unknown> = {
      id: data.id,
      name: data.name,
      property: data.property,
      room_type_slug: data.room_type_slug,
      advance_amount: data.advance_amount,
      price_per_night: data.price_per_night,
      photos: data.photos,
      max_guests: data.max_guests,
      max_adults: data.max_adults,
      max_kids: data.max_kids,
      bed_type: data.bed_type,
    };
    const res = await syncRoomToSupabase("upsert", { id: data.id, ...payload });
    if (!res.success) {
      console.warn("Could not upsert room into Supabase DB:", res.error);
    }
    return { success: true };
  });

export const deleteRoomDb = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const { error } = await supabase.from("rooms").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const updateRoomAdvanceDb = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string(),
      advance_amount: z.number().min(0),
    }),
  )
  .handler(async ({ data }) => {
    const { error } = await supabase
      .from("rooms")
      .update({ advance_amount: data.advance_amount })
      .eq("id", data.id);
    if (error) {
      console.warn("Supabase update room advance note:", error.message);
    }
    return { success: true };
  });

export const uploadImageToProjectDb = createServerFn({ method: "POST" })
  .validator(
    z.object({
      fileName: z.string(),
      dataUrl: z.string(),
      folder: z.enum(["gallery", "rooms", "locations", "events"]).optional().default("gallery"),
    }),
  )
  .handler(async ({ data }) => {
    const sanitizedName = `${Date.now()}-${data.fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const base64Data = data.dataUrl.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    // 1. Try uploading to Supabase Storage bucket
    try {
      const mimeMatch = data.dataUrl.match(/^data:(image\/\w+);base64,/);
      const contentType = mimeMatch ? mimeMatch[1] : "image/jpeg";
      const storagePath = `${data.folder}/${sanitizedName}`;
      const { data: storageUpload, error: storageErr } = await supabase.storage
        .from("uploads")
        .upload(storagePath, buffer, { contentType, upsert: true });

      if (!storageErr && storageUpload) {
        const { data: pubUrl } = supabase.storage.from("uploads").getPublicUrl(storagePath);
        if (pubUrl?.publicUrl) {
          return { success: true, url: pubUrl.publicUrl };
        }
      }
    } catch (sErr) {
      console.warn("[Storage] Supabase bucket upload note:", sErr);
    }

    // 2. Try writing to local disk (for local development)
    try {
      const targetDir = path.join(process.cwd(), "public", "images", "uploads", data.folder);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      const filePath = path.join(targetDir, sanitizedName);
      fs.writeFileSync(filePath, buffer);
      return {
        success: true,
        url: `/images/uploads/${data.folder}/${sanitizedName}`,
      };
    } catch (diskErr: unknown) {
      console.warn("[Serverless] Local disk is read-only (Vercel lambda), using Data URL fallback.");
      // 3. Serverless fallback: return Data URL directly
      return {
        success: true,
        url: data.dataUrl,
      };
    }
  });

export const deleteEventBookingDb = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const { error } = await supabase.from("event_bookings").delete().eq("id", data.id);
    if (error) {
      console.warn("Supabase delete event booking note:", error.message);
    }
    return { success: true };
  });

