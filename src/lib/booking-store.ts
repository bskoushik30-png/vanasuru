import { useState, useEffect } from "react";
import {
  getInitialStoreData,
  registerUserDb,
  addLocationDb,
  deleteLocationDb,
  addRoomDb,
  updateRoomDb,
  deleteRoomDb,
  updateRoomAdvanceDb,
  syncBookingDb,
  deleteBookingDb,
  deleteAllBookingsDb,
} from "./booking-api";
import {
  sendBookingConfirmationEmail,
  sendCheckInEmail,
  sendCheckOutEmail,
} from "./email-api";
import { isPropertyMatch } from "./site-data";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "client" | "admin";
}

export interface GalleryItem {
  id: string;
  src: string;
  tag: string;
  category: "Rooms" | "Dining" | "Events" | "Outdoors";
  title?: string;
}

interface StoredUser extends User {
  password: string;
}

export function extractMapEmbedUrl(input: string): string {
  if (!input) return "";
  const trimmed = input.trim();
  const srcMatch = trimmed.match(/src=["']([^"']+)["']/i);
  if (srcMatch && srcMatch[1]) {
    return srcMatch[1];
  }
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return trimmed;
}

export interface PhysicalRoom {
  id: string; // e.g. "RM101"
  name: string; // e.g. "101"
  property: string; // location key, e.g. "mysore"
  roomTypeSlug: string; // e.g. "deluxe-room"
  advanceAmount?: number; // Advance payment amount in Rupees
  pricePerNight?: number; // Room price per night in Rupees
  photos?: string[];
  maxGuests?: number;
  maxAdults?: number;
  maxKids?: number;
  bedType?: string;
}

export interface Location {
  id: string;
  key: string; // slug used as property key, e.g. "mysore"
  name: string;
  address: string;
  phone: string;
  email: string;
  tagline: string;
  photos?: string[];
  mapEmbedUrl?: string;
}

export interface ResortEvent {
  id: string;
  title: string;
  description: string;
  property: string; // location key, e.g. "mysore"
  venue: string; // e.g. "Heritage Gardens & Lawns"
  date: string;
  capacity: number;
  price: number;
  image: string;
  photos?: string[];
  isHighlighted: boolean;
  createdAt: string;
}

export interface EventBooking {
  id: string;
  eventId?: string;
  eventTitle: string;
  property: string;
  venue: string;
  userEmail: string;
  userName: string;
  eventDate: string;
  guestsCount: number;
  totalAmount?: number;
  advanceAmount?: number;
  guestDetails: {
    firstName: string;
    lastName: string;
    email: string;
    mobile: string;
    specialNotes?: string;
    address?: string;
    city?: string;
    state?: string;
  };
  status: "pending" | "confirmed" | "checked_in" | "checked_out" | "cancelled";
  createdAt: string;
  checkedInAt?: string;
  checkedOutAt?: string;
  paymentsHistory?: PaymentEntry[];
  extraCharges?: ExtraCharge[];
  customGrandTotal?: number;
}

export interface PaymentEntry {
  id: string;
  amount: number;
  date: string;
  mode: "Cash" | "UPI" | "Card" | "Bank Transfer" | "Razorpay" | "Other";
  notes?: string;
}

export interface ExtraCharge {
  id: string;
  amount: number;
  reason: string;
  date: string;
}

export interface Booking {
  id: string;
  userEmail: string;
  userName: string;
  property: string;
  roomTypeSlug: string;
  roomId: string; // assigned physical room
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  adults: number;
  children: number;
  roomsCount: number;
  guestDetails: {
    firstName: string;
    lastName: string;
    email: string;
    mobile: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
    specialNotes?: string;
    idProofType?: string;
    idProofNumber?: string;
    idProofImage?: string;
  };
  status: "pending" | "confirmed" | "checked_in" | "checked_out" | "cancelled";
  createdAt: string;
  checkedInAt?: string;
  checkedOutAt?: string;
  emailNotified?: boolean;
  payment?: {
    provider: "razorpay";
    orderId: string;
    paymentId: string;
    amountPaid: number;
    currency: string;
    paidAt: string;
  };
  paymentsHistory?: PaymentEntry[];
  extraCharges?: ExtraCharge[];
  customGrandTotal?: number;
}

export type CreateBookingInput = Omit<
  Booking,
  "id" | "userEmail" | "userName" | "roomId" | "status" | "createdAt"
> & { roomId?: string };

const DEFAULT_PHYSICAL_ROOMS: PhysicalRoom[] = [
  {
    id: "RM101",
    name: "Room 101",
    property: "mysore",
    roomTypeSlug: "deluxe-room",
    advanceAmount: 1,
    pricePerNight: 7000,
  },
  {
    id: "RM102",
    name: "Room 102",
    property: "mysore",
    roomTypeSlug: "premium-suite",
    advanceAmount: 1,
    pricePerNight: 9500,
  },
  {
    id: "RM103",
    name: "Room 103",
    property: "mysore",
    roomTypeSlug: "family-villa",
    advanceAmount: 1,
    pricePerNight: 14500,
  },
  {
    id: "RM104",
    name: "Room 104",
    property: "mysore",
    roomTypeSlug: "deluxe-room",
    advanceAmount: 1,
    pricePerNight: 7000,
  },
  {
    id: "RM201",
    name: "Room 201",
    property: "mahadevapura",
    roomTypeSlug: "executive-room",
    advanceAmount: 1,
    pricePerNight: 4500,
  },
  {
    id: "RM202",
    name: "Room 202",
    property: "mahadevapura",
    roomTypeSlug: "premium-suite",
    advanceAmount: 1,
    pricePerNight: 6500,
  },
  {
    id: "RM203",
    name: "Room 203",
    property: "mahadevapura",
    roomTypeSlug: "executive-room",
    advanceAmount: 1,
    pricePerNight: 4500,
  },
];

const DEFAULT_LOCATIONS: Location[] = [];

// Dynamic export Ã¢â‚¬â€ reads from the store so existing code continues to work
export let PHYSICAL_ROOMS: PhysicalRoom[] = [...DEFAULT_PHYSICAL_ROOMS];

const isBrowser = typeof window !== "undefined";

const DEFAULT_ADMIN_USER: StoredUser = {
  id: "u-admin-default",
  name: "VANASURU Admin",
  email: "vanasurumys@gmail.com",
  password: "vanasuru",
  role: "admin",
};

const DEFAULT_USERS: StoredUser[] = [DEFAULT_ADMIN_USER];

const DEFAULT_GALLERY_ITEMS: GalleryItem[] = [];

// IndexedDB persistence helper for high-resolution & base64 photos
const DB_NAME = "vanasuru_gallery_db";
const DB_VERSION = 1;
const STORE_NAME = "items";

function openGalleryDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject("IndexedDB not available");
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getStoredGalleryItems(): Promise<GalleryItem[] | null> {
  try {
    const db = await openGalleryDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const results = req.result as GalleryItem[];
        resolve(results && results.length > 0 ? results : null);
      };
      req.onerror = () => resolve(null);
    });
  } catch (e) {
    return null;
  }
}

export async function saveStoredGalleryItems(items: GalleryItem[]): Promise<void> {
  try {
    const db = await openGalleryDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.clear();
    for (const item of items) {
      store.put(item);
    }
  } catch (e) {
    console.warn("Failed to persist gallery in IndexedDB:", e);
  }
}

const DEFAULT_EVENTS: ResortEvent[] = [
  {
    id: "evt-1",
    title: "Royal Heritage Wedding Gala",
    description:
      "Grand wedding celebrations on our manicured heritage lawns with full banquet catering and floral decor.",
    property: "mysore",
    venue: "Heritage Gardens & Lawns",
    date: "2026-11-15",
    capacity: 350,
    price: 150000,
    image:
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=75",
    isHighlighted: true,
    createdAt: "2026-07-31T08:00:00Z",
  },
  {
    id: "evt-2",
    title: "Monsoon Sunset Symphony & Dinner",
    description:
      "An exclusive acoustic music evening paired with fine farm-to-table dining under the stars.",
    property: "mysore",
    venue: "Courtyard & Dining Pavilion",
    date: "2026-09-20",
    capacity: 120,
    price: 3500,
    image:
      "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=75",
    isHighlighted: true,
    createdAt: "2026-07-31T08:00:00Z",
  },
  {
    id: "evt-3",
    title: "Executive Leadership Summit 2026",
    description:
      "A corporate retreat for executive teams featuring state-of-the-art conference facilities and wellness breaks.",
    property: "mahadevapura",
    venue: "Grand Ballroom & Conference Suite",
    date: "2026-10-05",
    capacity: 200,
    price: 85000,
    image:
      "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=75",
    isHighlighted: true,
    createdAt: "2026-07-31T08:00:00Z",
  },
];

type Listener = () => void;

class Store {
  private listeners = new Set<Listener>();
  private currentUser: User | null = null;
  private users: StoredUser[] = [];
  private bookings: Booking[] = [];
  private locations: Location[] = [];
  private rooms: PhysicalRoom[] = [];
  private galleryItems: GalleryItem[] = [];
  private events: ResortEvent[] = [];
  private eventBookings: EventBooking[] = [];
  private deletedBookingIds = new Set<string>();
  private initPromise: Promise<void> | null = null;
  private hasHydratedRemoteData = false;
  private lastInitAttempt = 0;

  constructor() {
    this.load();
  }

  private ensureAdminUser() {
    const adminIndex = this.users.findIndex(
      (u) => u.email === "vanasurumys@gmail.com" || u.role === "admin",
    );
    if (adminIndex >= 0) {
      this.users[adminIndex] = {
        ...this.users[adminIndex],
        email: "vanasurumys@gmail.com",
        password: "vanasuru",
        role: "admin",
      };
    } else {
      this.users.unshift(DEFAULT_ADMIN_USER);
    }
  }

  async init() {
    if (!isBrowser) return;
    if (this.initPromise) return this.initPromise;

    const now = Date.now();
    if (this.hasHydratedRemoteData || now - this.lastInitAttempt < 30_000) return;
    this.lastInitAttempt = now;

    this.initPromise = this.hydrateRemoteData().finally(() => {
      this.initPromise = null;
    });

    return this.initPromise;
  }

  private async hydrateRemoteData() {
    try {
      const data = await getInitialStoreData();

      const remoteBookings = (data.bookings || []).filter(
        (remoteB) => !this.deletedBookingIds.has(remoteB.id),
      );

      // Create a map of local bookings to preserve local check-in/out statuses, timestamps, payment entries, and custom admin bookings
      const localBookingsMap = new Map<string, Booking>();
      (this.bookings || []).forEach((b) => {
        if (!this.deletedBookingIds.has(b.id)) {
          localBookingsMap.set(b.id, b);
        }
      });

      const mergedBookings: Booking[] = remoteBookings.map((remoteB) => {
        const localB = localBookingsMap.get(remoteB.id);
        if (!localB) return remoteB;

        // Keep local status if checked_in, checked_out, or updated
        const status =
          localB.status === "checked_in" || localB.status === "checked_out"
            ? localB.status
            : localB.status || remoteB.status;

        return {
          ...remoteB,
          status,
          checkedInAt: localB.checkedInAt || remoteB.checkedInAt,
          checkedOutAt: localB.checkedOutAt || remoteB.checkedOutAt,
          emailNotified: localB.emailNotified ?? remoteB.emailNotified,
          paymentsHistory: localB.paymentsHistory || remoteB.paymentsHistory,
          extraCharges: localB.extraCharges || remoteB.extraCharges,
          customGrandTotal: localB.customGrandTotal ?? remoteB.customGrandTotal,
          guestDetails: {
            ...remoteB.guestDetails,
            ...localB.guestDetails,
          },
        };
      });

      // Preserve any locally created bookings (e.g. BK-xxxx or admin direct bookings)
      (this.bookings || []).forEach((localB) => {
        if (
          !this.deletedBookingIds.has(localB.id) &&
          !mergedBookings.some((mb) => mb.id === localB.id)
        ) {
          mergedBookings.push(localB);
        }
      });

      this.bookings = mergedBookings.filter((b) => !this.deletedBookingIds.has(b.id));
      this.locations = data.locations && data.locations.length > 0 ? data.locations : this.locations;
      this.rooms = data.rooms && data.rooms.length > 0 ? data.rooms : this.rooms;
      if (data.users && data.users.length > 0) {
        this.users = data.users;
      }

      this.ensureAdminUser();

      // Sync the exported PHYSICAL_ROOMS so existing code (timeline, availability) works
      PHYSICAL_ROOMS = this.rooms;

      const storedGallery = await getStoredGalleryItems();
      if (storedGallery && storedGallery.length > 0) {
        this.galleryItems = storedGallery;
      }

      this.hasHydratedRemoteData = true;
      this.save();
    } catch (err) {
      console.warn("Failed to load initial data from Supabase, using cache:", err);
      this.ensureAdminUser();
      PHYSICAL_ROOMS = this.rooms;
      this.notify();
    }
  }

  private load() {
    if (!isBrowser) return;

    // Load users
    const storedUsers = localStorage.getItem("vanasuru_users");
    if (storedUsers) {
      this.users = JSON.parse(storedUsers) as StoredUser[];
    } else {
      this.users = [...DEFAULT_USERS];
    }
    this.ensureAdminUser();

    // Load current user
    const storedUser = localStorage.getItem("vanasuru_current_user");
    if (storedUser) {
      this.currentUser = JSON.parse(storedUser) as User;
    }

    // Load deleted booking IDs set
    const storedDeleted = localStorage.getItem("vanasuru_deleted_booking_ids");
    if (storedDeleted) {
      try {
        this.deletedBookingIds = new Set(JSON.parse(storedDeleted));
      } catch {
        this.deletedBookingIds = new Set();
      }
    }

    // Load bookings
    const storedBookings = localStorage.getItem("vanasuru_bookings");
    if (storedBookings) {
      this.bookings = (JSON.parse(storedBookings) as Booking[]).filter(
        (b) => !this.deletedBookingIds.has(b.id),
      );
    } else {
      this.bookings = [];
    }

    // Load locations
    const storedLocations = localStorage.getItem("vanasuru_locations");
    if (storedLocations) {
      this.locations = JSON.parse(storedLocations) as Location[];
    } else {
      this.locations = [...DEFAULT_LOCATIONS];
    }

    // Load rooms (dynamic physical rooms)
    const storedRooms = localStorage.getItem("vanasuru_rooms");
    if (storedRooms) {
      this.rooms = JSON.parse(storedRooms) as PhysicalRoom[];
    } else {
      this.rooms = [...DEFAULT_PHYSICAL_ROOMS];
    }

    // Load gallery items from localStorage first (sync)
    const storedGallery = localStorage.getItem("vanasuru_gallery");
    if (storedGallery) {
      try {
        this.galleryItems = JSON.parse(storedGallery) as GalleryItem[];
      } catch {
        this.galleryItems = [...DEFAULT_GALLERY_ITEMS];
      }
    } else {
      this.galleryItems = [...DEFAULT_GALLERY_ITEMS];
    }

    // Load events
    const storedEvents = localStorage.getItem("vanasuru_events");
    if (storedEvents) {
      try {
        this.events = JSON.parse(storedEvents) as ResortEvent[];
      } catch {
        this.events = [...DEFAULT_EVENTS];
      }
    } else {
      this.events = [...DEFAULT_EVENTS];
    }

    // Load event bookings
    const storedEventBookings = localStorage.getItem("vanasuru_event_bookings");
    if (storedEventBookings) {
      try {
        this.eventBookings = JSON.parse(storedEventBookings) as EventBooking[];
      } catch {
        this.eventBookings = [];
      }
    } else {
      this.eventBookings = [];
    }

    // Also fetch from IndexedDB asynchronously for full image data
    getStoredGalleryItems().then((items) => {
      if (items && items.length > 0) {
        this.galleryItems = items;
        this.notify();
      }
    });

    // Sync the exported PHYSICAL_ROOMS so existing code (timeline, availability) works
    PHYSICAL_ROOMS = this.rooms;
  }

  private save() {
    if (!isBrowser) return;
    try {
      localStorage.setItem("vanasuru_users", JSON.stringify(this.users));
      localStorage.setItem(
        "vanasuru_deleted_booking_ids",
        JSON.stringify(Array.from(this.deletedBookingIds)),
      );
      localStorage.setItem("vanasuru_bookings", JSON.stringify(this.bookings));
      localStorage.setItem("vanasuru_locations", JSON.stringify(this.locations));
      localStorage.setItem("vanasuru_rooms", JSON.stringify(this.rooms));
      localStorage.setItem("vanasuru_events", JSON.stringify(this.events));
      localStorage.setItem("vanasuru_event_bookings", JSON.stringify(this.eventBookings));
      try {
        localStorage.setItem("vanasuru_gallery", JSON.stringify(this.galleryItems));
      } catch {
        // Safe fallback if localStorage quota exceeded
      }
      if (this.currentUser) {
        localStorage.setItem("vanasuru_current_user", JSON.stringify(this.currentUser));
      } else {
        localStorage.removeItem("vanasuru_current_user");
      }
    } catch (e) {
      console.warn("Storage quota warning:", e);
    }

    // Always persist to IndexedDB asynchronously (handles large multi-photo uploads)
    saveStoredGalleryItems(this.galleryItems);

    // Keep exported PHYSICAL_ROOMS in sync
    PHYSICAL_ROOMS = this.rooms;
    this.notify();
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  getCurrentUser() {
    return this.currentUser;
  }

  getBookings() {
    return this.bookings;
  }

  getUsers() {
    return this.users;
  }

  getLocations() {
    return this.locations;
  }

  getRooms() {
    return this.rooms;
  }

  // ---- Location Management ----
  async addLocation(loc: Omit<Location, "id">): Promise<{ success: boolean; error?: string }> {
    const keySlug = loc.key.toLowerCase().trim().replace(/\s+/g, "-");
    if (this.locations.some((l) => l.key === keySlug)) {
      return { success: false, error: "A location with this key already exists" };
    }
    const newLoc: Location = {
      ...loc,
      key: keySlug,
      mapEmbedUrl: extractMapEmbedUrl(loc.mapEmbedUrl || ""),
      photos: loc.photos || [],
      id: "loc-" + Math.random().toString(36).substr(2, 9),
    };
    try {
      await addLocationDb({ data: newLoc });
      this.locations.push(newLoc);
      this.save();
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  async deleteLocation(id: string): Promise<{ success: boolean; error?: string }> {
    const loc = this.locations.find((l) => l.id === id);
    if (!loc) return { success: false, error: "Location not found" };
    // Check if any rooms exist at this location
    const roomsAtLoc = this.rooms.filter((r) => r.property === loc.key);
    if (roomsAtLoc.length > 0) {
      return {
        success: false,
        error: `Cannot delete — ${roomsAtLoc.length} room(s) still assigned to this location. Remove them first.`,
      };
    }
    try {
      await deleteLocationDb({ data: { id } });
      this.locations = this.locations.filter((l) => l.id !== id);
      this.save();
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  updateLocationPhotos(keyOrId: string, photos: string[]): boolean {
    const loc = this.locations.find((l) => l.key === keyOrId || l.id === keyOrId);
    if (loc) {
      loc.photos = photos;
      this.save();
      return true;
    }
    return false;
  }

  updateLocationMapEmbed(keyOrId: string, mapEmbedUrl: string): boolean {
    const loc = this.locations.find((l) => l.key === keyOrId || l.id === keyOrId);
    if (loc) {
      loc.mapEmbedUrl = extractMapEmbedUrl(mapEmbedUrl);
      this.save();
      return true;
    }
    return false;
  }

  updateRoomPhotos(roomId: string, photos: string[]): boolean {
    const room = this.rooms.find((r) => r.id === roomId);
    if (room) {
      room.photos = photos;
      this.save();
      return true;
    }
    return false;
  }

  // ---- Events Management ----
  getEvents() {
    return this.events;
  }

  addEvent(eventData: Omit<ResortEvent, "id" | "createdAt">): ResortEvent {
    const newEvent: ResortEvent = {
      ...eventData,
      id: "evt-" + Math.random().toString(36).substring(2, 9),
      createdAt: new Date().toISOString(),
    };
    this.events = [newEvent, ...this.events];
    this.save();
    return newEvent;
  }

  deleteEvent(id: string): boolean {
    const initLen = this.events.length;
    this.events = this.events.filter((e) => e.id !== id);
    if (this.events.length !== initLen) {
      this.save();
      return true;
    }
    return false;
  }

  toggleHighlightEvent(id: string): boolean {
    const event = this.events.find((e) => e.id === id);
    if (event) {
      event.isHighlighted = !event.isHighlighted;
      this.save();
      return true;
    }
    return false;
  }

  // ---- Event Bookings ----
  getEventBookings() {
    return this.eventBookings;
  }

  createEventBooking(
    data: Omit<EventBooking, "id" | "createdAt" | "status"> & {
      paymentMode?: "Cash" | "UPI" | "Card" | "Bank Transfer" | "Razorpay" | "Other";
      status?: EventBooking["status"];
    },
  ): {
    success: boolean;
    booking?: EventBooking;
    error?: string;
  } {
    const adv = Number(data.advanceAmount || 0);
    const initialPayments: PaymentEntry[] =
      adv > 0
        ? [
            {
              id: "pay-" + Math.random().toString(36).substr(2, 7),
              amount: adv,
              date: new Date().toISOString().split("T")[0],
              mode: data.paymentMode || "UPI",
              notes: "Initial Event Booking Advance",
            },
          ]
        : [];

    const newBooking: EventBooking = {
      ...data,
      id: "EVB-" + Math.floor(1000 + Math.random() * 9000),
      status: data.status || "confirmed",
      totalAmount: Number(data.totalAmount || 50000),
      advanceAmount: adv,
      paymentsHistory: initialPayments,
      extraCharges: [],
      createdAt: new Date().toISOString(),
    };
    this.eventBookings = [newBooking, ...this.eventBookings];
    this.save();
    this.notify();
    return { success: true, booking: newBooking };
  }

  updateEventBookingStatus(id: string, status: EventBooking["status"]): boolean {
    const eb = this.eventBookings.find((b) => b.id === id);
    if (eb) {
      eb.status = status;
      this.save();
      this.notify();
      return true;
    }
    return false;
  }

  checkInEventBooking(id: string): boolean {
    const eb = this.eventBookings.find((b) => b.id === id);
    if (eb && (eb.status === "confirmed" || eb.status === "pending")) {
      eb.status = "checked_in";
      eb.checkedInAt = new Date().toISOString();
      this.save();
      this.notify();
      return true;
    }
    return false;
  }

  checkOutEventBooking(id: string): boolean {
    const eb = this.eventBookings.find((b) => b.id === id);
    if (eb && eb.status === "checked_in") {
      eb.status = "checked_out";
      eb.checkedOutAt = new Date().toISOString();
      this.save();
      this.notify();
      return true;
    }
    return false;
  }

  addEventPaymentEntry(id: string, entry: Omit<PaymentEntry, "id">): boolean {
    const eb = this.eventBookings.find((b) => b.id === id);
    if (eb) {
      if (!eb.paymentsHistory) eb.paymentsHistory = [];
      eb.paymentsHistory.push({
        ...entry,
        id: "pay-" + Math.random().toString(36).substr(2, 7),
      });
      this.save();
      this.notify();
      return true;
    }
    return false;
  }

  addEventExtraCharge(id: string, charge: { amount: number; reason: string }): boolean {
    const eb = this.eventBookings.find((b) => b.id === id);
    if (eb) {
      if (!eb.extraCharges) eb.extraCharges = [];
      eb.extraCharges.push({
        id: "ext-" + Math.random().toString(36).substr(2, 7),
        amount: charge.amount,
        reason: charge.reason,
        date: new Date().toISOString().split("T")[0],
      });
      this.save();
      this.notify();
      return true;
    }
    return false;
  }

  updateEventCustomGrandTotal(id: string, customTotal: number): boolean {
    const eb = this.eventBookings.find((b) => b.id === id);
    if (eb) {
      eb.customGrandTotal = customTotal;
      this.save();
      this.notify();
      return true;
    }
    return false;
  }

  deleteEventBooking(id: string): boolean {
    const initLen = this.eventBookings.length;
    this.eventBookings = this.eventBookings.filter((b) => b.id !== id);
    if (this.eventBookings.length !== initLen) {
      this.save();
      this.notify();
      return true;
    }
    return false;
  }

  // ---- Room Management ----
  async addRoom(room: PhysicalRoom): Promise<{ success: boolean; error?: string }> {
    if (this.rooms.some((r) => r.id === room.id)) {
      return { success: false, error: "A room with this ID already exists" };
    }
    if (!this.locations.some((l) => l.key === room.property)) {
      return { success: false, error: "Selected location does not exist" };
    }
    this.rooms.push(room);
    this.save();
    try {
      await addRoomDb({
        data: {
          id: room.id,
          name: room.name,
          property: room.property,
          room_type_slug: room.roomTypeSlug,
          advance_amount: room.advanceAmount ?? 10,
          price_per_night: room.pricePerNight ?? 3500,
          photos: room.photos ?? [],
          max_guests: room.maxGuests ?? 4,
          max_adults: room.maxAdults ?? 2,
          max_kids: room.maxKids ?? 1,
          bed_type: room.bedType || "King Bed",
        },
      });
    } catch (err: unknown) {
      console.warn("Room add DB sync note:", err);
    }
    return { success: true };
  }

  async updateRoom(room: PhysicalRoom): Promise<{ success: boolean; error?: string }> {
    const idx = this.rooms.findIndex((r) => r.id === room.id);
    if (idx < 0) {
      return { success: false, error: "Room not found" };
    }
    this.rooms[idx] = { ...room };
    this.save();
    try {
      await updateRoomDb({
        data: {
          id: room.id,
          name: room.name,
          property: room.property,
          room_type_slug: room.roomTypeSlug,
          advance_amount: room.advanceAmount ?? 1,
          price_per_night: room.pricePerNight ?? 7000,
          photos: room.photos ?? [],
          max_guests: room.maxGuests ?? 4,
          max_adults: room.maxAdults ?? 2,
          max_kids: room.maxKids ?? 1,
          bed_type: room.bedType || "King Bed",
        },
      });
    } catch (e) {
      console.warn("Database sync note:", e);
    }
    return { success: true };
  }

  async deleteRoom(roomId: string): Promise<{ success: boolean; error?: string }> {
    // Check if there are active bookings for this room
    const activeBookings = this.bookings.filter(
      (b) => b.roomId === roomId && b.status !== "cancelled",
    );
    if (activeBookings.length > 0) {
      return {
        success: false,
        error: `Cannot delete Ã¢â‚¬â€  ${activeBookings.length} active booking(s) assigned to this room.`,
      };
    }
    try {
      await deleteRoomDb({ data: { id: roomId } });
      this.rooms = this.rooms.filter((r) => r.id !== roomId);
      this.save();
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  async updateRoomAdvanceAmount(
    roomId: string,
    advanceAmount: number,
  ): Promise<{ success: boolean; error?: string }> {
    const room = this.rooms.find((r) => r.id === roomId);
    if (!room) {
      return { success: false, error: "Room not found" };
    }
    const cleanAmount = Math.max(0, Number(advanceAmount));
    room.advanceAmount = cleanAmount;
    this.save();
    try {
      await updateRoomAdvanceDb({ data: { id: roomId, advance_amount: cleanAmount } });
    } catch (e) {
      console.warn("Database sync note:", e);
    }
    return { success: true };
  }

  async updateAllRoomsAdvanceAmount(
    advanceAmount: number,
  ): Promise<{ success: boolean; error?: string }> {
    const cleanAmount = Math.max(0, Number(advanceAmount));
    this.rooms.forEach((room) => {
      room.advanceAmount = cleanAmount;
      void updateRoomAdvanceDb({ data: { id: room.id, advance_amount: cleanAmount } }).catch(() => {});
    });
    this.save();
    return { success: true };
  }

  async register(
    name: string,
    email: string,
    password: string,
  ): Promise<{ success: boolean; error?: string }> {
    const formattedEmail = email.toLowerCase().trim();
    if (this.users.some((u) => u.email === formattedEmail)) {
      return { success: false, error: "Email already registered" };
    }
    const newUser = {
      id: "u-" + Math.random().toString(36).substr(2, 9),
      name,
      email: formattedEmail,
      password,
      role: "client" as const,
    };
    try {
      await registerUserDb({ data: newUser });
      this.users.push(newUser);
      this.currentUser = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      };
      this.save();
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  async login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    const formattedEmail = email.toLowerCase().trim();
    const user = this.users.find((u) => u.email === formattedEmail && u.password === password);
    if (!user) {
      return { success: false, error: "Invalid email or password" };
    }
    this.currentUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
    this.save();
    return { success: true };
  }

  logout() {
    this.currentUser = null;
    this.save();
  }

  async updatePasswordWithOldPassword(
    email: string,
    oldPass: string,
    newPass: string,
  ): Promise<{ success: boolean; error?: string }> {
    const formattedEmail = email.toLowerCase().trim();
    const user = this.users.find((u) => u.email === formattedEmail);
    if (!user) {
      return { success: false, error: "Account not found for this email address" };
    }
    if (user.password !== oldPass) {
      return { success: false, error: "Incorrect previous password" };
    }
    user.password = newPass;
    this.currentUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
    this.save();
    return { success: true };
  }

  async updatePasswordWithOtp(
    email: string,
    newPass: string,
  ): Promise<{ success: boolean; error?: string }> {
    const formattedEmail = email.toLowerCase().trim();
    const user = this.users.find((u) => u.email === formattedEmail);
    if (!user) {
      return { success: false, error: "Account not found for this email address" };
    }
    user.password = newPass;
    this.currentUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
    this.save();
    return { success: true };
  }

  /**
   * Room Availability Logic
   * Checks room availability for a date range [checkIn, checkOut] at a specific property.
   * Returns list of room types and their available count.
   */
  checkAvailability(
    property: string,
    checkIn: string,
    checkOut: string,
  ): { roomTypeSlug: string; availableCount: number; availableRoomIds: string[] }[] {
    const allRooms = this.rooms && this.rooms.length > 0 ? this.rooms : PHYSICAL_ROOMS;

    if (!checkIn || !checkOut) {
      // If dates are not set, return all rooms as available
      const counts: Record<string, { count: number; ids: string[] }> = {};
      allRooms
        .filter((r) => isPropertyMatch(r.property, property))
        .forEach((r) => {
          if (!counts[r.roomTypeSlug]) counts[r.roomTypeSlug] = { count: 0, ids: [] };
          counts[r.roomTypeSlug].count++;
          counts[r.roomTypeSlug].ids.push(r.id);
        });
      return Object.entries(counts).map(([slug, val]) => ({
        roomTypeSlug: slug,
        availableCount: val.count,
        availableRoomIds: val.ids,
      }));
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (
      isNaN(checkInDate.getTime()) ||
      isNaN(checkOutDate.getTime()) ||
      checkInDate >= checkOutDate
    ) {
      return [];
    }

    // Find all bookings that overlap with this range
    const overlappingBookings = this.bookings.filter((b) => {
      if (b.status === "cancelled") return false;
      const bIn = new Date(b.checkIn);
      const bOut = new Date(b.checkOut);
      return checkInDate < bOut && checkOutDate > bIn;
    });

    const bookedRoomIds = new Set(overlappingBookings.map((b) => b.roomId));

    // Calculate availability for each room type at this property
    const propertyRooms = allRooms.filter((r) => isPropertyMatch(r.property, property));

    const availabilityMap: Record<string, { count: number; ids: string[] }> = {};

    propertyRooms.forEach((room) => {
      if (!bookedRoomIds.has(room.id)) {
        if (!availabilityMap[room.roomTypeSlug]) {
          availabilityMap[room.roomTypeSlug] = { count: 0, ids: [] };
        }
        availabilityMap[room.roomTypeSlug].count++;
        availabilityMap[room.roomTypeSlug].ids.push(room.id);
      }
    });

    return Object.entries(availabilityMap).map(([slug, val]) => ({
      roomTypeSlug: slug,
      availableCount: val.count,
      availableRoomIds: val.ids,
    }));
  }

  createBooking(bookingData: CreateBookingInput): {
    success: boolean;
    booking?: Booking;
    error?: string;
  } {
    if (!this.currentUser) {
      return { success: false, error: "Must be logged in to book" };
    }

    const availableRoomsInfo = this.checkAvailability(
      bookingData.property,
      bookingData.checkIn,
      bookingData.checkOut,
    );

    const typeInfo = availableRoomsInfo.find((t) => t.roomTypeSlug === bookingData.roomTypeSlug);
    if (!typeInfo || typeInfo.availableCount <= 0 || typeInfo.availableRoomIds.length === 0) {
      return { success: false, error: "Selected room type is no longer available for these dates" };
    }

    // Assign the selected physical room if valid and available, otherwise fallback to the first one
    const assignedRoomId =
      bookingData.roomId && typeInfo.availableRoomIds.includes(bookingData.roomId)
        ? bookingData.roomId
        : typeInfo.availableRoomIds[0];

    const newBooking: Booking = {
      ...bookingData,
      id: "BK-" + Math.floor(1000 + Math.random() * 9000),
      userEmail: this.currentUser.email,
      userName: this.currentUser.name,
      roomId: assignedRoomId,
      status: "pending", // default status
      createdAt: new Date().toISOString(),
    };

    this.bookings.push(newBooking);
    this.save();
    return { success: true, booking: newBooking };
  }

  updateBookingStatus(
    bookingId: string,
    status: "pending" | "confirmed" | "checked_in" | "checked_out" | "cancelled",
  ) {
    const booking = this.bookings.find((b) => b.id === bookingId);
    if (booking) {
      booking.status = status;
      this.save();
      void syncBookingDb({ data: { booking } }).catch(() => {});
      return true;
    }
    return false;
  }

  checkInBooking(bookingId: string) {
    const booking = this.bookings.find((b) => b.id === bookingId);
    if (booking) {
      booking.status = "checked_in";
      booking.checkedInAt = new Date().toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      });
      this.save();
      void syncBookingDb({ data: { booking } }).catch(() => {});
      void sendCheckInEmail({ data: { booking } }).catch((err) => {
        console.error("Failed to send check-in email:", err);
      });
      return { success: true, booking };
    }
    return { success: false, error: "Booking not found" };
  }

  checkOutBooking(bookingId: string) {
    const booking = this.bookings.find((b) => b.id === bookingId);
    if (booking) {
      booking.status = "checked_out";
      booking.checkedOutAt = new Date().toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      });
      this.save();
      void syncBookingDb({ data: { booking } }).catch(() => {});
      void sendCheckOutEmail({ data: { booking } }).catch((err) => {
        console.error("Failed to send check-out email:", err);
      });
      return { success: true, booking };
    }
    return { success: false, error: "Booking not found" };
  }

  addPaymentEntry(
    bookingId: string,
    entry: Omit<PaymentEntry, "id">,
  ): { success: boolean; booking?: Booking; error?: string } {
    const booking = this.bookings.find((b) => b.id === bookingId);
    if (!booking) {
      return { success: false, error: "Booking not found" };
    }

    const newEntry: PaymentEntry = {
      ...entry,
      id: "PAY-" + Math.floor(10000 + Math.random() * 90000),
    };

    if (!booking.paymentsHistory) {
      booking.paymentsHistory = [];
    }

    booking.paymentsHistory.push(newEntry);
    this.save();
    void syncBookingDb({ data: { booking } }).catch(() => {});
    return { success: true, booking };
  }

  addExtraCharge(
    bookingId: string,
    charge: { amount: number; reason: string },
  ): { success: boolean; booking?: Booking; error?: string } {
    const booking = this.bookings.find((b) => b.id === bookingId);
    if (!booking) return { success: false, error: "Booking not found" };

    const newCharge: ExtraCharge = {
      id: "CHG-" + Math.floor(10000 + Math.random() * 90000),
      amount: charge.amount,
      reason: charge.reason,
      date: new Date().toLocaleDateString("en-IN", { dateStyle: "medium" }),
    };

    if (!booking.extraCharges) {
      booking.extraCharges = [];
    }
    booking.extraCharges.push(newCharge);
    this.save();
    void syncBookingDb({ data: { booking } }).catch(() => {});
    return { success: true, booking };
  }

  updateCustomGrandTotal(
    bookingId: string,
    customTotal: number,
  ): { success: boolean; booking?: Booking; error?: string } {
    const booking = this.bookings.find((b) => b.id === bookingId);
    if (!booking) return { success: false, error: "Booking not found" };

    booking.customGrandTotal = customTotal;
    this.save();
    void syncBookingDb({ data: { booking } }).catch(() => {});
    return { success: true, booking };
  }

  adminBookRoom(data: {
    roomId: string;
    checkIn: string;
    checkOut: string;
    guestName: string;
    guestEmail: string;
    guestMobile: string;
    idProofType?: string;
    idProofNumber?: string;
    idProofImage?: string;
    notes?: string;
  }): { success: boolean; booking?: Booking; error?: string } {
    const room = this.rooms.find((r) => r.id === data.roomId);
    if (!room) {
      return { success: false, error: "Selected room does not exist" };
    }

    // Overlapping booking check to prevent double booking
    const targetIn = new Date(data.checkIn);
    const targetOut = new Date(data.checkOut);

    const conflict = this.bookings.find((b) => {
      if (b.status === "cancelled") return false;
      const matchRoom =
        b.roomId === room.id || b.roomId === room.name || room.id.replace("RM", "") === b.roomId;
      if (!matchRoom) return false;
      const bIn = new Date(b.checkIn);
      const bOut = new Date(b.checkOut);
      return targetIn < bOut && targetOut > bIn;
    });

    if (conflict) {
      return {
        success: false,
        error: `Room "${room.name}" is already booked from ${conflict.checkIn} to ${conflict.checkOut} (${conflict.userName}). Please select different dates or another room.`,
      };
    }

    const newBooking: Booking = {
      id: "BK-ADM-" + Math.floor(10000 + Math.random() * 90000),
      userEmail: data.guestEmail,
      userName: data.guestName,
      property: room.property,
      roomTypeSlug: room.roomTypeSlug,
      roomId: room.id,
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      adults: room.maxAdults ?? 2,
      children: room.maxKids ?? 0,
      roomsCount: 1,
      guestDetails: {
        firstName: data.guestName,
        lastName: "(Admin Booking)",
        email: data.guestEmail,
        mobile: data.guestMobile,
        address: "Admin Direct Reservation",
        city: "Mysuru",
        state: "Karnataka",
        pincode: "570022",
        country: "India",
        idProofType: data.idProofType || "Aadhaar Card",
        idProofNumber: data.idProofNumber || "",
        idProofImage: data.idProofImage,
        specialNotes: data.notes || "Admin Direct Booking",
      },
      payment: {
        provider: "razorpay",
        orderId: "ADMIN_BOOKING_DIRECT",
        paymentId: "ADMIN_BOOKING_CONFIRMED",
        amountPaid: room.advanceAmount ?? 1,
        currency: "INR",
        paidAt: new Date().toISOString(),
      },
      status: "confirmed",
      createdAt: new Date().toISOString(),
      emailNotified: true,
    };

    this.bookings.unshift(newBooking);
    this.save();
    void syncBookingDb({ data: { booking: newBooking } }).catch(() => {});
    void sendBookingConfirmationEmail({ data: { booking: newBooking } }).catch((err) => {
      console.error("Failed to send admin booking confirmation email:", err);
    });
    return { success: true, booking: newBooking };
  }

  adminBlockRoom(data: {
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
  }): { success: boolean; booking?: Booking; error?: string } {
    return this.adminBookRoom({
      roomId: data.roomId,
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      guestName: data.guestName || "Admin Guest",
      guestEmail: data.guestEmail || "admin@vanasuru.com",
      guestMobile: data.guestMobile || "+91 99999 99999",
      idProofType: data.idProofType,
      idProofNumber: data.idProofNumber,
      idProofImage: data.idProofImage,
      notes: data.notes,
    });
  }

  recordVerifiedBooking(booking: Booking) {
    this.bookings = [booking, ...this.bookings.filter((existing) => existing.id !== booking.id)];
    this.save();
    void sendBookingConfirmationEmail({ data: { booking } }).catch((err) => {
      console.warn("Failed to send booking confirmation email:", err);
    });
    return true;
  }

  getGalleryItems() {
    return this.galleryItems;
  }

  addGalleryItem(item: Omit<GalleryItem, "id">) {
    const newItem: GalleryItem = {
      ...item,
      id: "g-" + Math.random().toString(36).substring(2, 9),
    };
    this.galleryItems = [newItem, ...this.galleryItems];
    this.save();
    return newItem;
  }

  deleteGalleryItem(id: string) {
    const initialLength = this.galleryItems.length;
    this.galleryItems = this.galleryItems.filter((g) => g.id !== id);
    if (this.galleryItems.length !== initialLength) {
      this.save();
      return true;
    }
    return false;
  }

  async deleteBooking(bookingId: string) {
    this.deletedBookingIds.add(bookingId);
    this.bookings = this.bookings.filter((b) => b.id !== bookingId);
    this.save();
    this.notify();
    try {
      await deleteBookingDb({ data: { id: bookingId } });
    } catch (e) {
      console.warn("Failed to delete booking from database:", e);
    }
    return true;
  }

  async deleteAllBookings() {
    this.bookings.forEach((b) => this.deletedBookingIds.add(b.id));
    this.bookings = [];
    this.save();
    this.notify();
    try {
      await deleteAllBookingsDb();
    } catch (e) {
      console.warn("Failed to wipe bookings from database:", e);
    }
    return true;
  }
}

export const bookingStore = new Store();

// React hook for utilizing the store
export function useBookingStore() {
  const [state, setState] = useState({
    currentUser: bookingStore.getCurrentUser(),
    bookings: bookingStore.getBookings(),
    locations: bookingStore.getLocations(),
    rooms: bookingStore.getRooms(),
    galleryItems: bookingStore.getGalleryItems(),
    events: bookingStore.getEvents(),
    eventBookings: bookingStore.getEventBookings(),
  });

  useEffect(() => {
    const unsubscribe = bookingStore.subscribe(() => {
      setState({
        currentUser: bookingStore.getCurrentUser(),
        bookings: bookingStore.getBookings(),
        locations: bookingStore.getLocations(),
        rooms: bookingStore.getRooms(),
        galleryItems: bookingStore.getGalleryItems(),
        events: bookingStore.getEvents(),
        eventBookings: bookingStore.getEventBookings(),
      });
    });
    void bookingStore.init();
    return unsubscribe;
  }, []);

  return {
    ...state,
    init: () => bookingStore.init(),
    login: (e: string, p: string) => bookingStore.login(e, p),
    logout: () => bookingStore.logout(),
    register: (n: string, e: string, p: string) => bookingStore.register(n, e, p),
    checkAvailability: (prop: string, inD: string, outD: string) =>
      bookingStore.checkAvailability(prop, inD, outD),
    createBooking: (data: CreateBookingInput) => bookingStore.createBooking(data),
    updateBookingStatus: (
      id: string,
      s: "pending" | "confirmed" | "checked_in" | "checked_out" | "cancelled",
    ) => bookingStore.updateBookingStatus(id, s),
    checkInBooking: (id: string) => bookingStore.checkInBooking(id),
    checkOutBooking: (id: string) => bookingStore.checkOutBooking(id),
    addPaymentEntry: (id: string, entry: Omit<PaymentEntry, "id">) =>
      bookingStore.addPaymentEntry(id, entry),
    addExtraCharge: (id: string, charge: { amount: number; reason: string }) =>
      bookingStore.addExtraCharge(id, charge),
    updateCustomGrandTotal: (id: string, customTotal: number) =>
      bookingStore.updateCustomGrandTotal(id, customTotal),
    recordVerifiedBooking: (booking: Booking) => bookingStore.recordVerifiedBooking(booking),
    deleteBooking: (id: string) => bookingStore.deleteBooking(id),
    deleteAllBookings: () => bookingStore.deleteAllBookings(),
    addLocation: (loc: Omit<Location, "id">) => bookingStore.addLocation(loc),
    deleteLocation: (id: string) => bookingStore.deleteLocation(id),
    updateLocationPhotos: (keyOrId: string, photos: string[]) =>
      bookingStore.updateLocationPhotos(keyOrId, photos),
    updateLocationMapEmbed: (keyOrId: string, url: string) =>
      bookingStore.updateLocationMapEmbed(keyOrId, url),
    addRoom: (room: PhysicalRoom) => bookingStore.addRoom(room),
    updateRoom: (room: PhysicalRoom) => bookingStore.updateRoom(room),
    deleteRoom: (roomId: string) => bookingStore.deleteRoom(roomId),
    updateRoomPhotos: (roomId: string, photos: string[]) =>
      bookingStore.updateRoomPhotos(roomId, photos),
    updateRoomAdvanceAmount: (roomId: string, advanceAmount: number) =>
      bookingStore.updateRoomAdvanceAmount(roomId, advanceAmount),
    updateAllRoomsAdvanceAmount: (advanceAmount: number) =>
      bookingStore.updateAllRoomsAdvanceAmount(advanceAmount),
    adminBlockRoom: (data: Parameters<typeof bookingStore.adminBlockRoom>[0]) =>
      bookingStore.adminBlockRoom(data),
    addGalleryItem: (item: Omit<GalleryItem, "id">) => bookingStore.addGalleryItem(item),
    deleteGalleryItem: (id: string) => bookingStore.deleteGalleryItem(id),
    addEvent: (eventData: Omit<ResortEvent, "id" | "createdAt">) =>
      bookingStore.addEvent(eventData),
    deleteEvent: (id: string) => bookingStore.deleteEvent(id),
    toggleHighlightEvent: (id: string) => bookingStore.toggleHighlightEvent(id),
    createEventBooking: (data: Omit<EventBooking, "id" | "createdAt" | "status">) =>
      bookingStore.createEventBooking(data),
    updateEventBookingStatus: (id: string, s: EventBooking["status"]) =>
      bookingStore.updateEventBookingStatus(id, s),
    checkInEventBooking: (id: string) => bookingStore.checkInEventBooking(id),
    checkOutEventBooking: (id: string) => bookingStore.checkOutEventBooking(id),
    addEventPaymentEntry: (id: string, entry: Omit<PaymentEntry, "id">) =>
      bookingStore.addEventPaymentEntry(id, entry),
    addEventExtraCharge: (id: string, charge: { amount: number; reason: string }) =>
      bookingStore.addEventExtraCharge(id, charge),
    updateEventCustomGrandTotal: (id: string, customTotal: number) =>
      bookingStore.updateEventCustomGrandTotal(id, customTotal),
    deleteEventBooking: (id: string) => bookingStore.deleteEventBooking(id),
    updatePasswordWithOldPassword: (e: string, oP: string, nP: string) =>
      bookingStore.updatePasswordWithOldPassword(e, oP, nP),
    updatePasswordWithOtp: (e: string, nP: string) => bookingStore.updatePasswordWithOtp(e, nP),
  };
}
