import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

interface PendingOtp {
  otp: string;
  expiresAt: number;
}

// Store pending OTPs on globalThis to prevent loss during Vite HMR reloads
const globalForOtps = globalThis as unknown as {
  pendingOtps?: Map<string, PendingOtp>;
};

const pendingOtps = globalForOtps.pendingOtps || new Map<string, PendingOtp>();

if (process.env.NODE_ENV !== "production") {
  globalForOtps.pendingOtps = pendingOtps;
}

const sendOtpSchema = z.object({
  email: z.string().email(),
});

const verifyOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().min(6).max(6),
});

export const sendRegistrationOtp = createServerFn({ method: "POST" })
  .validator(sendOtpSchema)
  .handler(async ({ data }) => {
    const { email } = data;
    const formattedEmail = email.toLowerCase().trim();

    // Generate a 6-digit code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes expiration

    pendingOtps.set(formattedEmail, { otp, expiresAt });

    const smtpHost = process.env.SMTP_HOST ?? (import.meta as any).env?.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT ?? (import.meta as any).env?.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER ?? (import.meta as any).env?.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS ?? (import.meta as any).env?.SMTP_PASS;
    const smtpFrom = process.env.SMTP_FROM ?? (import.meta as any).env?.SMTP_FROM ?? "no-reply@vanasuru.com";

    // Check if SMTP is configured
    if (smtpHost && smtpPort && smtpUser && smtpPass) {
      try {
        const nodemailer = await import("nodemailer");
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: parseInt(smtpPort, 10),
          secure: parseInt(smtpPort, 10) === 465, // True for 465, false for other ports
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

        await transporter.sendMail({
          from: smtpFrom,
          to: formattedEmail,
          subject: "Your VANASURU Verification Code",
          text: `Your verification code is ${otp}. It will expire in 5 minutes.`,
          html: `
            <div style="font-family: 'Manrope', 'Helvetica', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; border: 1px solid #e2e8f0; border-radius: 0px; background-color: #faf9f6; color: #2d2d2d;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #1b4d3e; font-family: 'Playfair Display', Georgia, serif; font-size: 32px; font-weight: 500; letter-spacing: 0.1em; margin: 0; text-transform: uppercase;">VANASURU</h1>
                <p style="font-size: 10px; tracking: 0.3em; text-transform: uppercase; color: #b8860b; margin-top: 5px; letter-spacing: 3px;">Retreats & Suites</p>
              </div>
              <hr style="border: 0; border-top: 1px solid #e5e5e5; margin-bottom: 30px;" />
              <p style="font-size: 15px; line-height: 1.6; color: #4a4a4a;">Thank you for registering. To complete your account registration, please verify your email address using the One-Time Password (OTP) below:</p>
              <div style="background-color: #f3f1eb; border: 1px solid #d9d4c7; padding: 20px; text-align: center; font-size: 32px; font-weight: 600; letter-spacing: 8px; color: #1b4d3e; font-family: monospace; margin: 30px 0; border-radius: 4px;">
                ${otp}
              </div>
              <p style="font-size: 13px; color: #718096; line-height: 1.5; margin-top: 30px;">This security code is valid for <strong>5 minutes</strong>. If you did not request this verification, please ignore this email.</p>
              <hr style="border: 0; border-top: 1px solid #e5e5e5; margin-top: 30px; margin-bottom: 20px;" />
              <div style="text-align: center; font-size: 11px; color: #a0aec0;">
                &copy; ${new Date().getFullYear()} VANASURU Nature Retreats. All rights reserved.
              </div>
            </div>
          `,
        });

        console.log(`[OTP] Sent verification email to ${formattedEmail}`);
        return { success: true, isDevFallback: false };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("Failed to send OTP email via SMTP:", err);
        throw new Error(`Failed to send verification email: ${msg}`);
      }
    } else {
      // Developer Mode Fallback
      console.log(`\n======================================================`);
      console.log(`[DEV MODE] Email verification OTP for ${formattedEmail}: ${otp}`);
      console.log(`======================================================\n`);
      return { success: true, isDevFallback: true, devOtp: otp };
    }
  });

export const verifyRegistrationOtp = createServerFn({ method: "POST" })
  .validator(verifyOtpSchema)
  .handler(async ({ data }) => {
    const { email, otp } = data;
    const formattedEmail = email.toLowerCase().trim();
    const pending = pendingOtps.get(formattedEmail);

    if (!pending) {
      throw new Error("No verification code found for this email. Please click resend.");
    }

    if (Date.now() > pending.expiresAt) {
      pendingOtps.delete(formattedEmail);
      throw new Error("Verification code has expired. Please click resend.");
    }

    if (pending.otp !== otp.trim()) {
      throw new Error("Invalid verification code. Please check and try again.");
    }

    // Clean up OTP on success
    pendingOtps.delete(formattedEmail);
    return { success: true };
  });
