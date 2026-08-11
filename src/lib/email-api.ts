import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const guestDetailsSchema = z.object({
  firstName: z.string().optional().default(""),
  lastName: z.string().optional().default(""),
  email: z.string().optional().default(""),
  mobile: z.string().optional().default(""),
  address: z.string().optional().default(""),
  city: z.string().optional().default(""),
  state: z.string().optional().default(""),
  pincode: z.string().optional().default(""),
  country: z.string().optional().default(""),
  idProofType: z.string().optional(),
  idProofNumber: z.string().optional(),
  idProofImage: z.string().optional(),
  specialNotes: z.string().optional(),
});

const paymentSchema = z
  .object({
    provider: z.string().optional().default("razorpay"),
    orderId: z.string().optional().default(""),
    paymentId: z.string().optional().default(""),
    amountPaid: z.number().optional().default(0),
    currency: z.string().optional().default("INR"),
    paidAt: z.string().optional().default(""),
  })
  .optional();

const bookingSchema = z.object({
  id: z.string(),
  userEmail: z.string(),
  userName: z.string(),
  property: z.string(),
  roomTypeSlug: z.string(),
  roomId: z.string(),
  checkIn: z.string(),
  checkOut: z.string(),
  adults: z.number().optional().default(1),
  children: z.number().optional().default(0),
  roomsCount: z.number().optional().default(1),
  guestDetails: guestDetailsSchema,
  payment: paymentSchema,
  status: z.string().optional().default("confirmed"),
  createdAt: z.string().optional().default(""),
  checkedInAt: z.string().optional(),
  checkedOutAt: z.string().optional(),
});

const PROPERTY_NAMES: Record<string, string> = {
  mudumalai: "VANASURU Mudumalai",
  wayanad: "VANASURU Wayanad",
};

const ROOM_NAMES: Record<string, string> = {
  "deluxe-room": "Deluxe Room",
  "premium-suite": "Premium Suite",
  "family-villa": "Family Villa",
  "executive-suite": "Executive Suite",
  "heritage-cottage": "Heritage Cottage",
  "tree-house": "Treehouse Suite",
};

function formatPropertyName(propKey: string): string {
  if (PROPERTY_NAMES[propKey.toLowerCase()]) return PROPERTY_NAMES[propKey.toLowerCase()];
  return propKey;
}

function formatRoomName(slug: string, roomId?: string): string {
  const baseName = ROOM_NAMES[slug] || slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  if (roomId) return `${baseName} (${roomId})`;
  return baseName;
}

function getSmtpTransporter() {
  const smtpHost = process.env.SMTP_HOST ?? (import.meta as any).env?.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT ?? (import.meta as any).env?.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER ?? (import.meta as any).env?.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS ?? (import.meta as any).env?.SMTP_PASS;
  const smtpFrom =
    process.env.SMTP_FROM ??
    (import.meta as any).env?.SMTP_FROM ??
    "bskoushik30@gmail.com";
  const adminEmail =
    process.env.ADMIN_EMAIL ??
    (import.meta as any).env?.ADMIN_EMAIL ??
    "vanasurumys@gmail.com";

  if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
    console.warn("[SMTP] Email settings missing from process.env / .env");
    return null;
  }

  return {
    host: smtpHost,
    port: parseInt(smtpPort, 10),
    user: smtpUser,
    pass: smtpPass,
    from: smtpFrom,
    adminEmail,
  };
}

// 1. Send Confirmation Email (To Customer & Admin) for both online & manual bookings
export const sendBookingConfirmationEmail = createServerFn({ method: "POST" })
  .validator(z.object({ booking: z.any() }))
  .handler(async ({ data }) => {
    const { booking } = data;
    const config = getSmtpTransporter();

    const isEvent = "eventTitle" in booking || "venue" in booking;
    const customerEmail = (booking.guestDetails?.email || booking.userEmail || "").toLowerCase().trim();
    const guestName = `${booking.guestDetails?.firstName || booking.userName || "Valued Guest"} ${booking.guestDetails?.lastName || ""}`.trim();
    const propertyName = formatPropertyName(booking.property);
    const roomName = isEvent ? `${booking.eventTitle || "Event Function"} (${booking.venue || "Banquet Hall"})` : formatRoomName(booking.roomTypeSlug, booking.roomId);
    const checkInStr = isEvent ? booking.eventDate : booking.checkIn;
    const checkOutStr = isEvent ? booking.eventDate : booking.checkOut;

    let rawAmount = isEvent ? (booking.advanceAmount || 0) : (booking.payment?.amountPaid || 0);
    if (booking.payment?.provider === "razorpay" && rawAmount >= 100) {
      rawAmount = Math.round(rawAmount / 100);
    } else if (rawAmount > 5000 && !isEvent) {
      rawAmount = Math.round(rawAmount / 100);
    }
    const advancePaidStr = rawAmount > 0 ? `₹${rawAmount.toLocaleString("en-IN")}` : "Paid / Confirmed";

    if (!config) {
      console.log(`\n======================================================`);
      console.log(`[DEV MODE] Confirmation Email to ${customerEmail} & ${config?.adminEmail || "Admin"}:`);
      console.log(`Booking ID: ${booking.id} | Property: ${propertyName} | Item: ${roomName}`);
      console.log(`======================================================\n`);
      return { success: true, isDevFallback: true };
    }

    try {
      const nodemailer = await import("nodemailer");
      const transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.port === 465,
        auth: {
          user: config.user,
          pass: config.pass,
        },
      });

      // Customer Confirmation HTML
      const customerHtml = `
        <div style="font-family: 'Manrope', Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 30px; background-color: #faf9f6; color: #2d2d2d; border: 1px solid #e5e0d8;">
          <div style="text-align: center; margin-bottom: 25px;">
            <h1 style="color: #1b4d3e; font-family: Georgia, serif; font-size: 28px; font-weight: bold; letter-spacing: 2px; margin: 0; text-transform: uppercase;">VANASURU</h1>
            <p style="font-size: 11px; text-transform: uppercase; color: #b8860b; margin-top: 4px; letter-spacing: 3px;">Nature Retreats &amp; Suites</p>
          </div>

          <div style="background-color: #1b4d3e; color: #ffffff; padding: 20px; text-align: center; border-radius: 4px; margin-bottom: 25px;">
            <h2 style="margin: 0; font-size: 20px; font-weight: 500;">Reservation Confirmed!</h2>
            <p style="margin: 6px 0 0 0; font-size: 13px; color: #d1e7dd;">Booking ID: <strong>${booking.id}</strong></p>
          </div>

          <p style="font-size: 15px; line-height: 1.6; color: #333333;">Dear <strong>${guestName}</strong>,</p>
          <p style="font-size: 14px; line-height: 1.6; color: #4a4a4a;">
            Thank you for choosing <strong>${propertyName}</strong>. We are delighted to confirm your upcoming stay. Below are your reservation details:
          </p>

          <table style="width: 100%; border-collapse: collapse; margin: 25px 0; background-color: #ffffff; border: 1px solid #e9e5dd; border-radius: 4px;">
            <tr style="border-bottom: 1px solid #f0ece1;">
              <td style="padding: 12px 16px; font-size: 13px; color: #777777; width: 40%;">Property</td>
              <td style="padding: 12px 16px; font-size: 13px; color: #1b4d3e; font-weight: bold;">${propertyName}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f0ece1;">
              <td style="padding: 12px 16px; font-size: 13px; color: #777777;">Room Allocated</td>
              <td style="padding: 12px 16px; font-size: 13px; color: #2d2d2d; font-weight: 600;">${roomName}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f0ece1;">
              <td style="padding: 12px 16px; font-size: 13px; color: #777777;">Check-In Date</td>
              <td style="padding: 12px 16px; font-size: 13px; color: #2d2d2d;"><strong>${booking.checkIn}</strong> (from 12:00 PM)</td>
            </tr>
            <tr style="border-bottom: 1px solid #f0ece1;">
              <td style="padding: 12px 16px; font-size: 13px; color: #777777;">Check-Out Date</td>
              <td style="padding: 12px 16px; font-size: 13px; color: #2d2d2d;"><strong>${booking.checkOut}</strong> (by 11:00 AM)</td>
            </tr>
            <tr style="border-bottom: 1px solid #f0ece1;">
              <td style="padding: 12px 16px; font-size: 13px; color: #777777;">Guests</td>
              <td style="padding: 12px 16px; font-size: 13px; color: #2d2d2d;">${booking.adults} Adult(s), ${booking.children} Child(ren)</td>
            </tr>
            <tr style="border-bottom: 1px solid #f0ece1;">
              <td style="padding: 12px 16px; font-size: 13px; color: #777777;">Mobile Contact</td>
              <td style="padding: 12px 16px; font-size: 13px; color: #2d2d2d;">${booking.guestDetails.mobile || "N/A"}</td>
            </tr>
            <tr>
              <td style="padding: 12px 16px; font-size: 13px; color: #777777;">Advance Payment</td>
              <td style="padding: 12px 16px; font-size: 14px; color: #1b4d3e; font-weight: bold;">${advancePaidStr}</td>
            </tr>
          </table>

          <div style="background-color: #f3f0e6; padding: 16px; border-left: 4px solid #b8860b; margin: 20px 0; font-size: 13px; color: #4a4a4a; line-height: 1.5;">
            <strong>Important Check-In Instructions:</strong><br/>
            Please bring a valid Government-issued Photo ID (Aadhaar, Passport, or Driving License) for all adult guests during check-in.
          </div>

          <p style="font-size: 13px; color: #666666; line-height: 1.5;">
            If you need to make changes or have special requests, please contact our resort helpdesk at <strong>stay@vanasuru.com</strong> or call <strong>+91 94812 34567</strong>.
          </p>

          <hr style="border: 0; border-top: 1px solid #e5e0d8; margin: 30px 0 20px 0;" />
          <div style="text-align: center; font-size: 11px; color: #888888;">
            &copy; ${new Date().getFullYear()} VANASURU Nature Retreats. All rights reserved.
          </div>
        </div>
      `;

      // Admin Alert HTML
      const adminHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; background-color: #ffffff; border: 1px solid #dddddd; color: #333333;">
          <h2 style="color: #1b4d3e; margin-top: 0;">🔔 New Booking Notification</h2>
          <p style="font-size: 14px;">A new reservation has been placed on VANASURU:</p>

          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="background-color: #f9f9f9;"><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Booking ID</td><td style="padding: 8px; border: 1px solid #ddd;">${booking.id}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Guest Name</td><td style="padding: 8px; border: 1px solid #ddd;">${guestName}</td></tr>
            <tr style="background-color: #f9f9f9;"><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Email</td><td style="padding: 8px; border: 1px solid #ddd;">${customerEmail}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Mobile</td><td style="padding: 8px; border: 1px solid #ddd;">${booking.guestDetails.mobile || "N/A"}</td></tr>
            <tr style="background-color: #f9f9f9;"><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Property</td><td style="padding: 8px; border: 1px solid #ddd;">${propertyName}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Room Allocated</td><td style="padding: 8px; border: 1px solid #ddd;">${roomName}</td></tr>
            <tr style="background-color: #f9f9f9;"><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Dates</td><td style="padding: 8px; border: 1px solid #ddd;">${booking.checkIn} to ${booking.checkOut}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Advance Payment</td><td style="padding: 8px; border: 1px solid #ddd; color: #1b4d3e; font-weight: bold;">${advancePaidStr}</td></tr>
          </table>
          <p style="font-size: 12px; color: #666;">View this booking in your VANASURU Admin Dashboard for room assignment and guest operations.</p>
        </div>
      `;

      // 1. Send to Customer (and CC Admin)
      await transporter.sendMail({
        from: `VANASURU Retreats <${config.from}>`,
        to: customerEmail,
        cc: config.adminEmail || "vanasurumys@gmail.com",
        subject: `Booking Confirmed! Welcome to ${propertyName} (${booking.id})`,
        html: customerHtml,
      });

      // 2. Send to Admin Alert
      await transporter.sendMail({
        from: `VANASURU System <${config.from}>`,
        to: config.adminEmail || "vanasurumys@gmail.com",
        subject: `🔔 New Reservation Alert: ${booking.id} - ${guestName} (${propertyName})`,
        html: adminHtml,
      });

      console.log(`[SMTP] Sent booking confirmation emails for ${booking.id} to ${customerEmail} & Admin`);
      return { success: true, isDevFallback: false };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[SMTP Error] Failed to send booking confirmation email:", err);
      return { success: false, error: msg };
    }
  });

// 2. Send Check-In Welcome Email (To Customer when admin presses Check In button)
export const sendCheckInEmail = createServerFn({ method: "POST" })
  .validator(z.object({ booking: z.any() }))
  .handler(async ({ data }) => {
    const { booking } = data;
    const config = getSmtpTransporter();

    const isEvent = "eventTitle" in booking || "venue" in booking;
    const customerEmail = (booking.guestDetails?.email || booking.userEmail || "").toLowerCase().trim();
    const guestName = `${booking.guestDetails?.firstName || booking.userName || "Valued Guest"} ${booking.guestDetails?.lastName || ""}`.trim();
    const propertyName = formatPropertyName(booking.property);
    const roomName = isEvent ? `${booking.eventTitle || "Event Function"} (${booking.venue || "Banquet Hall"})` : formatRoomName(booking.roomTypeSlug, booking.roomId);
    const checkInTimeStr = booking.checkedInAt || new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

    if (!config) {
      console.log(`\n======================================================`);
      console.log(`[DEV MODE] Check-In Email sent to ${customerEmail}:`);
      console.log(`Dear ${guestName}, Thank you for coming to VANASURU! (Booking ID: ${booking.id})`);
      console.log(`======================================================\n`);
      return { success: true, isDevFallback: true };
    }

    try {
      const nodemailer = await import("nodemailer");
      const transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.port === 465,
        auth: {
          user: config.user,
          pass: config.pass,
        },
      });

      const checkInHtml = `
        <div style="font-family: 'Manrope', Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 30px; background-color: #faf9f6; color: #2d2d2d; border: 1px solid #e5e0d8;">
          <div style="text-align: center; margin-bottom: 25px;">
            <h1 style="color: #1b4d3e; font-family: Georgia, serif; font-size: 28px; font-weight: bold; letter-spacing: 2px; margin: 0; text-transform: uppercase;">VANASURU</h1>
            <p style="font-size: 11px; text-transform: uppercase; color: #b8860b; margin-top: 4px; letter-spacing: 3px;">Nature Retreats &amp; Suites</p>
          </div>

          <div style="background-color: #1b4d3e; color: #ffffff; padding: 22px; text-align: center; border-radius: 6px; margin-bottom: 25px;">
            <h2 style="margin: 0; font-size: 22px; font-weight: 500;">Welcome to VANASURU! 🌿</h2>
            <p style="margin: 8px 0 0 0; font-size: 13px; color: #d1e7dd;">Your Check-In Has Been Recorded</p>
          </div>

          <p style="font-size: 15px; line-height: 1.6; color: #333333;">Dear <strong>${guestName}</strong>,</p>
          
          <p style="font-size: 15px; line-height: 1.6; color: #4a4a4a;">
            Thank you for coming to <strong>${propertyName}</strong>! We are absolutely thrilled to welcome you to our resort. Your check-in has been successfully recorded.
          </p>

          <div style="background-color: #ffffff; border: 1px solid #e9e5dd; border-radius: 6px; padding: 20px; margin: 25px 0;">
            <h3 style="margin-top: 0; color: #1b4d3e; font-size: 16px; border-bottom: 1px solid #f0ece1; padding-bottom: 8px;">Reservation Summary</h3>
            <p style="font-size: 13px; margin: 6px 0; color: #555;"><strong>Booking Reference:</strong> ${booking.id}</p>
            <p style="font-size: 13px; margin: 6px 0; color: #555;"><strong>Resort Property:</strong> ${propertyName}</p>
            <p style="font-size: 13px; margin: 6px 0; color: #555;"><strong>${isEvent ? "Venue / Event" : "Allocated Room"}:</strong> ${roomName}</p>
            <p style="font-size: 13px; margin: 6px 0; color: #555;"><strong>Check-In Recorded:</strong> ${checkInTimeStr}</p>
            <p style="font-size: 13px; margin: 6px 0; color: #555;"><strong>Scheduled Check-Out:</strong> ${isEvent ? booking.eventDate : booking.checkOut}</p>
          </div>

          <div style="background-color: #f3f0e6; padding: 18px; border-radius: 6px; margin: 20px 0; font-size: 13px; color: #4a4a4a; line-height: 1.6;">
            <h4 style="margin: 0 0 8px 0; color: #1b4d3e; font-size: 14px;">🌟 Useful Guest Information:</h4>
            • <strong>Front Desk &amp; Operations:</strong> Dial 0 or call +91 94812 34567.<br/>
            • <strong>Wi-Fi Access:</strong> Network: <em>Vanasuru_Guest</em> (Password available at desk).<br/>
            • <strong>Dining Timings:</strong> Breakfast (7:30 - 10:00 AM), Lunch (12:30 - 3:00 PM), Dinner (7:30 - 10:00 PM).<br/>
            • <strong>Nature Trail &amp; Events:</strong> Contact front desk for banquet assistance.
          </div>

          <p style="font-size: 14px; line-height: 1.6; color: #4a4a4a; text-align: center; margin-top: 30px;">
            Relax, unwind, and let the gentle sounds of nature rejuvenate your mind and soul. Enjoy your time with us!
          </p>

          <hr style="border: 0; border-top: 1px solid #e5e0d8; margin: 30px 0 20px 0;" />
          <div style="text-align: center; font-size: 11px; color: #888888;">
            &copy; ${new Date().getFullYear()} VANASURU Nature Retreats. All rights reserved.
          </div>
        </div>
      `;

      await transporter.sendMail({
        from: `VANASURU Retreats <${config.from}>`,
        to: customerEmail,
        subject: `Welcome to ${propertyName}! Thank You for Coming (${booking.id})`,
        html: checkInHtml,
      });

      console.log(`[SMTP] Sent Check-In email for ${booking.id} to ${customerEmail}`);
      return { success: true, isDevFallback: false };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[SMTP Error] Failed to send Check-In email:", err);
      return { success: false, error: msg };
    }
  });

// 3. Send Check-Out Thank You Email (To Customer when admin presses Check Out button)
export const sendCheckOutEmail = createServerFn({ method: "POST" })
  .validator(z.object({ booking: z.any() }))
  .handler(async ({ data }) => {
    const { booking } = data;
    const config = getSmtpTransporter();

    const isEvent = "eventTitle" in booking || "venue" in booking;
    const customerEmail = (booking.guestDetails?.email || booking.userEmail || "").toLowerCase().trim();
    const guestName = `${booking.guestDetails?.firstName || booking.userName || "Valued Guest"} ${booking.guestDetails?.lastName || ""}`.trim();
    const propertyName = formatPropertyName(booking.property);
    const roomName = isEvent ? `${booking.eventTitle || "Event Function"} (${booking.venue || "Banquet Hall"})` : formatRoomName(booking.roomTypeSlug, booking.roomId);
    const checkOutTimeStr = booking.checkedOutAt || new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

    if (!config) {
      console.log(`\n======================================================`);
      console.log(`[DEV MODE] Check-Out Email sent to ${customerEmail}:`);
      console.log(`Dear ${guestName}, Thank you for choosing VANASURU! Visit us again. (Booking ID: ${booking.id})`);
      console.log(`======================================================\n`);
      return { success: true, isDevFallback: true };
    }

    try {
      const nodemailer = await import("nodemailer");
      const transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.port === 465,
        auth: {
          user: config.user,
          pass: config.pass,
        },
      });

      const checkOutHtml = `
        <div style="font-family: 'Manrope', Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 30px; background-color: #faf9f6; color: #2d2d2d; border: 1px solid #e5e0d8;">
          <div style="text-align: center; margin-bottom: 25px;">
            <h1 style="color: #1b4d3e; font-family: Georgia, serif; font-size: 28px; font-weight: bold; letter-spacing: 2px; margin: 0; text-transform: uppercase;">VANASURU</h1>
            <p style="font-size: 11px; text-transform: uppercase; color: #b8860b; margin-top: 4px; letter-spacing: 3px;">Nature Retreats &amp; Suites</p>
          </div>

          <div style="background-color: #1b4d3e; color: #ffffff; padding: 22px; text-align: center; border-radius: 6px; margin-bottom: 25px;">
            <h2 style="margin: 0; font-size: 22px; font-weight: 500;">Thank You for Staying With Us! 🙏</h2>
            <p style="margin: 8px 0 0 0; font-size: 13px; color: #d1e7dd;">Your Check-Out Has Been Completed</p>
          </div>

          <p style="font-size: 15px; line-height: 1.6; color: #333333;">Dear <strong>${guestName}</strong>,</p>
          
          <p style="font-size: 15px; line-height: 1.6; color: #4a4a4a;">
            Thank you for choosing <strong>${propertyName}</strong> for your retreat! We hope your stay was peaceful, comfortable, and filled with memorable experiences amidst nature.
          </p>

          <div style="background-color: #ffffff; border: 1px solid #e9e5dd; border-radius: 6px; padding: 20px; margin: 25px 0;">
            <h3 style="margin-top: 0; color: #1b4d3e; font-size: 16px; border-bottom: 1px solid #f0ece1; padding-bottom: 8px;">Check-Out Details</h3>
            <p style="font-size: 13px; margin: 6px 0; color: #555;"><strong>Booking Reference:</strong> ${booking.id}</p>
            <p style="font-size: 13px; margin: 6px 0; color: #555;"><strong>Resort Property:</strong> ${propertyName}</p>
            <p style="font-size: 13px; margin: 6px 0; color: #555;"><strong>Room:</strong> ${roomName}</p>
            <p style="font-size: 13px; margin: 6px 0; color: #555;"><strong>Stay Dates:</strong> ${booking.checkIn} to ${booking.checkOut}</p>
            <p style="font-size: 13px; margin: 6px 0; color: #555;"><strong>Check-Out Recorded:</strong> ${checkOutTimeStr}</p>
          </div>

          <div style="background-color: #f3f0e6; padding: 18px; border-radius: 6px; margin: 20px 0; text-align: center; font-size: 14px; color: #1b4d3e; line-height: 1.6;">
            <strong>"Nature does not hurry, yet everything is accomplished."</strong><br/>
            <span style="font-size: 13px; color: #555;">We eagerly look forward to hosting you again on your next getaway!</span>
          </div>

          <p style="font-size: 13px; color: #666666; line-height: 1.5;">
            Have feedback or suggestions to make your next stay even better? Please reach out to us at <strong>feedback@vanasuru.com</strong>. Have a safe journey home!
          </p>

          <hr style="border: 0; border-top: 1px solid #e5e0d8; margin: 30px 0 20px 0;" />
          <div style="text-align: center; font-size: 11px; color: #888888;">
            &copy; ${new Date().getFullYear()} VANASURU Nature Retreats. All rights reserved.
          </div>
        </div>
      `;

      await transporter.sendMail({
        from: `VANASURU Retreats <${config.from}>`,
        to: customerEmail,
        subject: `Thank You for Choosing VANASURU! Visit Us Again (${booking.id})`,
        html: checkOutHtml,
      });

      console.log(`[SMTP] Sent Check-Out email for ${booking.id} to ${customerEmail}`);
      return { success: true, isDevFallback: false };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[SMTP Error] Failed to send Check-Out email:", err);
      return { success: false, error: msg };
    }
  });

// 4. Send Tax Invoice Bill Email (To Customer & Admin Copy)
export const sendBillInvoiceEmail = createServerFn({ method: "POST" })
  .validator(
    z.object({
      booking: z.any(),
      additionalNotes: z.string().optional().default(""),
    }),
  )
  .handler(async ({ data }) => {
    const { booking, additionalNotes } = data;
    const config = getSmtpTransporter();

    if (!booking || !booking.id) {
      return { success: false, error: "Invalid booking data" };
    }

    const isEventBooking = "eventTitle" in booking;
    const customerEmail = (
      booking.guestDetails?.email ||
      booking.userEmail ||
      ""
    )
      .toLowerCase()
      .trim();
    const guestName = `${booking.guestDetails?.firstName || booking.userName || "Valued Guest"} ${booking.guestDetails?.lastName || ""}`.trim();
    const propertyName = formatPropertyName(booking.property || "mudumalai");

    let initialAdvance = isEventBooking
      ? booking.advanceAmount || 0
      : typeof booking.payment?.amountPaid === "number"
        ? booking.payment.amountPaid
        : 0;

    if (
      !isEventBooking &&
      booking.payment?.provider === "razorpay" &&
      initialAdvance >= 100
    ) {
      initialAdvance = Math.round(initialAdvance / 100);
    } else if (initialAdvance > 5000) {
      initialAdvance = Math.round(initialAdvance / 100);
    }

    const partialPaymentsTotal = (booking.paymentsHistory || []).reduce(
      (sum: number, p: any) => sum + (p.amount || 0),
      0,
    );
    const totalPaid = initialAdvance + partialPaymentsTotal;

    const extraChargesList = booking.extraCharges || [];
    const extraChargesSum = extraChargesList.reduce(
      (sum: number, c: any) => sum + (c.amount || 0),
      0,
    );

    let baseItemTotal = 0;
    let roomTypeName = "";
    let nights = 1;

    if (isEventBooking) {
      baseItemTotal = booking.totalAmount || 50000;
    } else {
      try {
        if (booking.checkIn && booking.checkOut) {
          const diff = Math.ceil(
            (new Date(booking.checkOut).getTime() -
              new Date(booking.checkIn).getTime()) /
              (1000 * 3600 * 24),
          );
          if (diff > 0) nights = diff;
        }
      } catch {
        nights = 1;
      }
      const pricePerNight = booking.pricePerNight || 3500;
      baseItemTotal = pricePerNight * nights * (booking.roomsCount || 1);
      roomTypeName = formatRoomName(booking.roomTypeSlug || "", booking.roomId);
    }

    const grandTotal =
      booking.customGrandTotal !== undefined &&
      booking.customGrandTotal !== null
        ? booking.customGrandTotal + extraChargesSum
        : baseItemTotal + extraChargesSum;

    const balanceDue = Math.max(0, grandTotal - totalPaid);
    const invoiceNo = `INV-${String(booking.id)
      .replace("BK-", "")
      .replace("EVB-", "EVT-")
      .replace("BLOCK-", "ADM")}`;

    if (!config) {
      console.log(`\n======================================================`);
      console.log(
        `[DEV MODE] Tax Invoice Email sent to ${customerEmail} & ${config?.adminEmail || "Admin"}: Invoice #${invoiceNo} | Total: Rs. ${grandTotal}`,
      );
      console.log(`======================================================\n`);
      return { success: true, isDevFallback: true };
    }

    try {
      const nodemailer = await import("nodemailer");
      const transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.port === 465,
        auth: {
          user: config.user,
          pass: config.pass,
        },
      });

      const billHtml = `
        <div style="font-family: 'Manrope', Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 30px; background-color: #ffffff; color: #2d2d2d; border: 1px solid #e5e0d8;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #1b4d3e; font-family: Georgia, serif; font-size: 28px; font-weight: bold; letter-spacing: 2px; margin: 0; text-transform: uppercase;">VANASURU</h1>
            <p style="font-size: 11px; text-transform: uppercase; color: #b8860b; margin-top: 4px; letter-spacing: 3px;">Nature Retreats &amp; Suites &bull; Official Tax Invoice</p>
          </div>

          <div style="background-color: #1b4d3e; color: #ffffff; padding: 16px 20px; border-radius: 6px; margin-bottom: 20px;">
            <table style="width: 100%; color: #ffffff;">
              <tr>
                <td>
                  <strong style="font-size: 16px;">Tax Invoice #${invoiceNo}</strong><br/>
                  <span style="font-size: 12px; color: #d1e7dd;">Booking Ref: ${booking.id}</span>
                </td>
                <td style="text-align: right;">
                  <span style="font-size: 12px; color: #d1e7dd;">Date: ${new Date().toLocaleDateString("en-IN", { dateStyle: "medium" })}</span><br/>
                  <strong style="font-size: 13px;">${propertyName}</strong>
                </td>
              </tr>
            </table>
          </div>

          <div style="margin-bottom: 20px; font-size: 13px; color: #4a4a4a; line-height: 1.6; background-color: #faf9f6; padding: 15px; border-radius: 6px; border: 1px solid #f0ece1;">
            <strong style="color: #1b4d3e;">Billed To (Guest Details):</strong><br/>
            <strong>Name:</strong> ${guestName}<br/>
            <strong>Email:</strong> ${customerEmail} | <strong>Mobile:</strong> ${booking.guestDetails?.mobile || "N/A"}<br/>
            ${isEventBooking ? `<strong>Event Title:</strong> ${booking.eventTitle} (${booking.eventDate}) &bull; Venue: ${booking.venue}` : `<strong>Reservation:</strong> ${roomTypeName} (${nights} night(s), ${booking.checkIn} to ${booking.checkOut})`}
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
            <thead>
              <tr style="background-color: #f3f0e6; color: #1b4d3e; text-align: left;">
                <th style="padding: 10px; border: 1px solid #e0dbc;">Description</th>
                <th style="padding: 10px; border: 1px solid #e0dbc; text-align: right;">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding: 10px; border: 1px solid #e0dbc;">
                  <strong>${isEventBooking ? booking.eventTitle : `${roomTypeName} Accommodation`}</strong><br/>
                  <span style="font-size: 11px; color: #666;">${isEventBooking ? `Banquet Hall (${booking.guestsCount} Guests)` : `${nights} Night(s) Stay`}</span>
                </td>
                <td style="padding: 10px; border: 1px solid #e0dbc; text-align: right; font-family: monospace; font-weight: bold;">₹${baseItemTotal.toLocaleString("en-IN")}</td>
              </tr>
              ${extraChargesList
                .map(
                  (chg: any) => `
                <tr style="background-color: #fff9e6;">
                  <td style="padding: 8px 10px; border: 1px solid #e0dbc; color: #856404;">Extra: ${chg.reason} (${chg.date})</td>
                  <td style="padding: 8px 10px; border: 1px solid #e0dbc; text-align: right; font-family: monospace; color: #856404;">+₹${chg.amount.toLocaleString("en-IN")}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>

          ${
            additionalNotes && additionalNotes.trim()
              ? `
            <div style="background-color: #fefce8; border-left: 4px solid #b8860b; padding: 12px 15px; margin-bottom: 20px; font-size: 13px; color: #4a4a4a;">
              <strong style="color: #b8860b;">Additional Notes / Special Instructions:</strong><br/>
              <span style="white-space: pre-wrap; font-size: 12px; margin-top: 4px; display: block;">${additionalNotes}</span>
            </div>
          `
              : ""
          }

          <div style="width: 280px; margin-left: auto; font-size: 13px; margin-bottom: 25px; background-color: #faf9f6; padding: 12px; border-radius: 6px; border: 1px solid #e5e0d8;">
            <div style="display: flex; justify-content: space-between; padding: 4px 0; color: #333;">
              <span>Grand Total:</span>
              <strong style="font-family: monospace;">₹${grandTotal.toLocaleString("en-IN")}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 4px 0; color: #1b4d3e;">
              <span>Total Paid to Date:</span>
              <strong style="font-family: monospace;">₹${totalPaid.toLocaleString("en-IN")}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 6px 8px; background-color: ${balanceDue === 0 ? "#e6f4ea" : "#fff3cd"}; border-radius: 4px; color: ${balanceDue === 0 ? "#137333" : "#856404"}; font-weight: bold; margin-top: 6px;">
              <span>Balance Payable:</span>
              <span style="font-family: monospace; font-size: 14px;">₹${balanceDue.toLocaleString("en-IN")}</span>
            </div>
          </div>

          <p style="font-size: 12px; color: #777; text-align: center; border-top: 1px solid #eeeeee; padding-top: 15px; margin-bottom: 0;">
            Thank you for choosing VANASURU Nature Retreats. For invoice assistance, contact <strong>vanasurumys@gmail.com</strong>
          </p>
        </div>
      `;

      if (customerEmail) {
        await transporter.sendMail({
          from: `VANASURU Retreats <${config.from}>`,
          to: customerEmail,
          subject: `Official Tax Invoice - VANASURU (${invoiceNo})`,
          html: billHtml,
        });
      }

      await transporter.sendMail({
        from: `VANASURU System <${config.from}>`,
        to: config.adminEmail,
        subject: `📄 Tax Invoice Copy: ${invoiceNo} - ${guestName} (${propertyName})`,
        html: billHtml,
      });

      console.log(
        `[SMTP] Sent Tax Invoice #${invoiceNo} to ${customerEmail} & Admin (${config.adminEmail})`,
      );
      return { success: true, isDevFallback: false };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[SMTP Error] Failed to send Tax Invoice email:", err);
      return { success: false, error: msg };
    }
  });
