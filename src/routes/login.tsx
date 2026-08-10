import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useBookingStore, bookingStore } from "@/lib/booking-store";
import { SiteShell } from "@/components/site/SiteShell";
import { Check, Mail, Lock, User, AlertCircle, ArrowLeft, Key, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { sendRegistrationOtp, verifyRegistrationOtp } from "@/lib/otp-api";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

type SearchParams = {
  redirectTo?: string;
};

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): SearchParams => {
    return {
      redirectTo: typeof search.redirectTo === "string" ? search.redirectTo : undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "Login — VANASURU" },
      {
        name: "description",
        content: "Access your VANASURU account to book suites and view reservations.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { redirectTo } = Route.useSearch();
  const navigate = useNavigate();
  const { login, register, currentUser, updatePasswordWithOldPassword, updatePasswordWithOtp } =
    useBookingStore();

  const [isRegister, setIsRegister] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  // Form inputs
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Forgot password flow states
  const [forgotStep, setForgotStep] = useState<
    "choose_method" | "old_password" | "otp_verify" | "set_new_password"
  >("choose_method");
  const [recoveryMethod, setRecoveryMethod] = useState<"old_password" | "otp">("old_password");
  const [oldPasswordInput, setOldPasswordInput] = useState("");
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [confirmPasswordInput, setConfirmPasswordInput] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // OTP Verification States
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [devOtp, setDevOtp] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [cooldown]);

  // If already logged in, redirect away
  useEffect(() => {
    if (currentUser) {
      const target = redirectTo || (currentUser.role === "admin" ? "/admin" : "/");
      const t = setTimeout(() => navigate({ to: target }), 100);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [currentUser, navigate, redirectTo]);

  const resetAllStates = () => {
    setError("");
    setShowOtp(false);
    setOtpCode("");
    setDevOtp("");
    setIsForgotPassword(false);
    setForgotStep("choose_method");
    setOldPasswordInput("");
    setNewPasswordInput("");
    setConfirmPasswordInput("");
  };

  const handleSendRegistrationOtp = async () => {
    setIsSendingOtp(true);
    setError("");
    try {
      const res = await sendRegistrationOtp({ data: { email } });
      if (res.success) {
        setShowOtp(true);
        if (res.isDevFallback && res.devOtp) {
          setDevOtp(res.devOtp);
          toast.success("Dev Mode: OTP generated!");
        } else {
          setDevOtp("");
          toast.success("Verification code sent to your email!");
        }
        setCooldown(30);
      }
    } catch (err: unknown) {
      const errMsg =
        err instanceof Error ? err.message : "Failed to send verification code. Please try again.";
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyRegistrationOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      setError("Please enter the 6-digit verification code");
      return;
    }
    setIsVerifyingOtp(true);
    setError("");
    try {
      const res = await verifyRegistrationOtp({ data: { email, otp: otpCode } });
      if (res.success) {
        const regRes = await register(name, email, password);
        if (regRes.success) {
          setSuccess(true);
          setSuccessMessage("Account registered successfully!");
          toast.success("Email verified and account registered successfully!");
          setTimeout(() => {
            navigate({ to: redirectTo || "/" });
          }, 1500);
        } else {
          setError(regRes.error || "Registration failed");
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Verification failed. Please try again.";
      setError(msg);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (isRegister) {
      if (!name.trim()) {
        setError("Please enter your name");
        return;
      }
      const formattedEmail = email.toLowerCase().trim();
      const existingUsers = bookingStore.getUsers();
      if (existingUsers.some((u) => u.email === formattedEmail)) {
        setError("Email already registered");
        return;
      }
      handleSendRegistrationOtp();
    } else {
      const res = await login(email, password);
      if (res.success) {
        setSuccess(true);
        setSuccessMessage("Welcome back!");
        const user = bookingStore.getCurrentUser();
        setTimeout(() => {
          navigate({ to: redirectTo || (user?.role === "admin" ? "/admin" : "/") });
        }, 1000);
      } else {
        setError(res.error || "Login failed");
      }
    }
  };

  // --- FORGOT PASSWORD FLOW HANDLERS ---
  const handleVerifyPreviousPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const formattedEmail = email.toLowerCase().trim();
    if (!formattedEmail) {
      setError("Please enter your email address");
      return;
    }
    const allUsers = bookingStore.getUsers();
    const existingUser = allUsers.find((u) => u.email === formattedEmail);
    if (!existingUser) {
      setError("No account found associated with this email address");
      return;
    }
    if (existingUser.password !== oldPasswordInput) {
      setError("Incorrect previous password. Please try again or use Email OTP.");
      return;
    }
    setError("");
    setForgotStep("set_new_password");
  };

  const handleSendForgotOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const formattedEmail = email.toLowerCase().trim();
    if (!formattedEmail) {
      setError("Please enter your email address");
      return;
    }
    const allUsers = bookingStore.getUsers();
    const existingUser = allUsers.find((u) => u.email === formattedEmail);
    if (!existingUser) {
      setError("No account found associated with this email address");
      return;
    }

    setIsSendingOtp(true);
    try {
      const res = await sendRegistrationOtp({ data: { email: formattedEmail } });
      if (res.success) {
        if (res.isDevFallback && res.devOtp) {
          setDevOtp(res.devOtp);
          toast.success("Dev Mode: Password Reset OTP generated!");
        } else {
          setDevOtp("");
          toast.success("Password reset code sent to your email!");
        }
        setCooldown(30);
        setForgotStep("otp_verify");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send OTP email";
      setError(msg);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyForgotOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      setError("Please enter the 6-digit verification code");
      return;
    }
    setIsVerifyingOtp(true);
    setError("");
    try {
      const res = await verifyRegistrationOtp({ data: { email, otp: otpCode } });
      if (res.success) {
        setForgotStep("set_new_password");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid or expired OTP code";
      setError(msg);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!newPasswordInput) {
      setError("Please enter a new password");
      return;
    }
    if (newPasswordInput !== confirmPasswordInput) {
      setError("New passwords do not match");
      return;
    }

    let result;
    if (recoveryMethod === "old_password") {
      result = await updatePasswordWithOldPassword(email, oldPasswordInput, newPasswordInput);
    } else {
      result = await updatePasswordWithOtp(email, newPasswordInput);
    }

    if (result.success) {
      setSuccess(true);
      setSuccessMessage("Password reset successfully!");
      toast.success("Password updated and logged in!");
      const user = bookingStore.getCurrentUser();
      setTimeout(() => {
        navigate({ to: redirectTo || (user?.role === "admin" ? "/admin" : "/") });
      }, 1200);
    } else {
      setError(result.error || "Failed to update password");
    }
  };

  return (
    <SiteShell transparentHeader={false}>
      <div className="pt-32 pb-24 px-6 min-h-screen flex items-center justify-center bg-[color:var(--sand)]/20">
        <div className="w-full max-w-lg bg-card border border-[color:var(--gold)]/20 shadow-2xl p-8 md:p-12 relative overflow-hidden">
          {/* Subtle gold line on top */}
          <div className="absolute top-0 inset-x-0 h-1 bg-[color:var(--gold)]" />

          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-[color:var(--gold)]/20 text-[color:var(--gold)] rounded-full flex items-center justify-center mx-auto mb-6">
                <Check size={32} />
              </div>
              <h2 className="font-serif text-3xl text-[color:var(--forest)] mb-3">
                {successMessage || "Welcome to VANASURU!"}
              </h2>
              <p className="text-sm text-charcoal/60">Redirecting to your retreat planner...</p>
            </div>
          ) : isForgotPassword ? (
            /* --- FORGOT PASSWORD WORKFLOW --- */
            <div>
              <button
                onClick={resetAllStates}
                className="absolute top-6 left-6 text-charcoal/50 hover:text-[color:var(--gold)] transition-colors flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider cursor-pointer bg-transparent border-0"
              >
                <ArrowLeft size={14} /> Back to Sign In
              </button>

              <div className="text-center mb-8 pt-4">
                <div className="w-14 h-14 bg-[color:var(--gold)]/10 text-[color:var(--gold)] rounded-full flex items-center justify-center mx-auto mb-3">
                  <ShieldCheck size={28} />
                </div>
                <div className="text-eyebrow">Account Recovery</div>
                <h1 className="mt-2 font-serif text-3xl text-[color:var(--forest)]">
                  Reset Password
                </h1>
                <p className="mt-2 text-xs text-charcoal/60 leading-relaxed max-w-sm mx-auto">
                  Choose your preferred verification method to securely restore access to your
                  account.
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm flex gap-3 items-center">
                  <AlertCircle size={18} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Step 1: Choose Recovery Method & Input Data */}
              {forgotStep === "choose_method" && (
                <div className="space-y-6">
                  {/* Option Selector */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setRecoveryMethod("old_password");
                        setError("");
                      }}
                      className={`p-3.5 text-left border transition-all text-xs font-semibold uppercase tracking-wider flex flex-col gap-1.5 ${
                        recoveryMethod === "old_password"
                          ? "border-[color:var(--gold)] bg-[color:var(--gold)]/10 text-[color:var(--forest)]"
                          : "border-border text-charcoal/60 hover:border-[color:var(--gold)]/40"
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <Key size={14} className="text-[color:var(--gold)]" /> Previous Password
                      </span>
                      <span className="text-[10px] normal-case text-charcoal/50 font-normal">
                        Enter earlier password
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setRecoveryMethod("otp");
                        setError("");
                      }}
                      className={`p-3.5 text-left border transition-all text-xs font-semibold uppercase tracking-wider flex flex-col gap-1.5 ${
                        recoveryMethod === "otp"
                          ? "border-[color:var(--gold)] bg-[color:var(--gold)]/10 text-[color:var(--forest)]"
                          : "border-border text-charcoal/60 hover:border-[color:var(--gold)]/40"
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <Mail size={14} className="text-[color:var(--gold)]" /> Email OTP
                      </span>
                      <span className="text-[10px] normal-case text-charcoal/50 font-normal">
                        Get 6-digit code via email
                      </span>
                    </button>
                  </div>

                  {/* Form depending on selected method */}
                  {recoveryMethod === "old_password" ? (
                    <form onSubmit={handleVerifyPreviousPassword} className="space-y-4">
                      <label className="block">
                        <div className="text-[10px] tracking-[0.28em] uppercase text-charcoal/60 flex items-center gap-2">
                          <Mail size={12} className="text-[color:var(--gold)]" /> Email Address
                        </div>
                        <input
                          required
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="mt-2 w-full bg-transparent border border-border focus:border-[color:var(--gold)] focus:outline-none px-4 py-3 text-sm"
                        />
                      </label>

                      <label className="block">
                        <div className="text-[10px] tracking-[0.28em] uppercase text-charcoal/60 flex items-center gap-2">
                          <Lock size={12} className="text-[color:var(--gold)]" /> Previous Password
                        </div>
                        <input
                          required
                          type="password"
                          placeholder="Enter your previous password"
                          value={oldPasswordInput}
                          onChange={(e) => setOldPasswordInput(e.target.value)}
                          className="mt-2 w-full bg-transparent border border-border focus:border-[color:var(--gold)] focus:outline-none px-4 py-3 text-sm"
                        />
                      </label>

                      <button
                        type="submit"
                        className="w-full mt-4 bg-[color:var(--forest)] hover:bg-[color:var(--gold)] hover:text-[color:var(--forest-deep)] text-ivory py-4 text-[11px] font-semibold tracking-[0.28em] uppercase transition-colors"
                      >
                        Verify Previous Password
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleSendForgotOtp} className="space-y-4">
                      <label className="block">
                        <div className="text-[10px] tracking-[0.28em] uppercase text-charcoal/60 flex items-center gap-2">
                          <Mail size={12} className="text-[color:var(--gold)]" /> Registered Email
                          Address
                        </div>
                        <input
                          required
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="mt-2 w-full bg-transparent border border-border focus:border-[color:var(--gold)] focus:outline-none px-4 py-3 text-sm"
                        />
                      </label>

                      <button
                        type="submit"
                        disabled={isSendingOtp}
                        className="w-full mt-4 bg-[color:var(--forest)] hover:bg-[color:var(--gold)] hover:text-[color:var(--forest-deep)] text-ivory py-4 text-[11px] font-semibold tracking-[0.28em] uppercase transition-colors"
                      >
                        {isSendingOtp ? "Sending Code..." : "Send Verification Code"}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* Step 2: OTP Entry (if OTP method selected) */}
              {forgotStep === "otp_verify" && (
                <div>
                  {devOtp && (
                    <div className="mb-6 p-4 bg-[color:var(--gold)]/15 border border-[color:var(--gold)]/30 text-charcoal text-xs flex flex-col gap-2">
                      <div className="font-semibold uppercase tracking-wider text-[color:var(--gold)] flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--gold)] animate-pulse" />
                        Development Mode Helper
                      </div>
                      <p className="text-charcoal/70">
                        Use the generated OTP code below to verify your password reset:
                      </p>
                      <div className="text-center py-2.5 bg-background font-mono text-xl tracking-[0.3em] font-bold text-[color:var(--forest)] border border-[color:var(--gold)]/20 select-all cursor-pointer">
                        {devOtp}
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleVerifyForgotOtp} className="space-y-6">
                    <div className="flex flex-col items-center justify-center gap-4 py-2">
                      <InputOTP
                        maxLength={6}
                        value={otpCode}
                        onChange={(val) => setOtpCode(val)}
                        disabled={isVerifyingOtp}
                      >
                        <InputOTPGroup className="gap-2">
                          <InputOTPSlot
                            index={0}
                            className="w-12 h-14 text-xl border border-border bg-transparent focus:border-[color:var(--gold)] focus:ring-1 focus:ring-[color:var(--gold)] text-[color:var(--forest)] font-serif font-bold text-center transition-all duration-300"
                          />
                          <InputOTPSlot
                            index={1}
                            className="w-12 h-14 text-xl border border-border bg-transparent focus:border-[color:var(--gold)] focus:ring-1 focus:ring-[color:var(--gold)] text-[color:var(--forest)] font-serif font-bold text-center transition-all duration-300"
                          />
                          <InputOTPSlot
                            index={2}
                            className="w-12 h-14 text-xl border border-border bg-transparent focus:border-[color:var(--gold)] focus:ring-1 focus:ring-[color:var(--gold)] text-[color:var(--forest)] font-serif font-bold text-center transition-all duration-300"
                          />
                          <InputOTPSlot
                            index={3}
                            className="w-12 h-14 text-xl border border-border bg-transparent focus:border-[color:var(--gold)] focus:ring-1 focus:ring-[color:var(--gold)] text-[color:var(--forest)] font-serif font-bold text-center transition-all duration-300"
                          />
                          <InputOTPSlot
                            index={4}
                            className="w-12 h-14 text-xl border border-border bg-transparent focus:border-[color:var(--gold)] focus:ring-1 focus:ring-[color:var(--gold)] text-[color:var(--forest)] font-serif font-bold text-center transition-all duration-300"
                          />
                          <InputOTPSlot
                            index={5}
                            className="w-12 h-14 text-xl border border-border bg-transparent focus:border-[color:var(--gold)] focus:ring-1 focus:ring-[color:var(--gold)] text-[color:var(--forest)] font-serif font-bold text-center transition-all duration-300"
                          />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>

                    <button
                      type="submit"
                      disabled={isVerifyingOtp || otpCode.length !== 6}
                      className="w-full bg-[color:var(--forest)] hover:bg-[color:var(--gold)] hover:text-[color:var(--forest-deep)] disabled:opacity-50 disabled:hover:bg-[color:var(--forest)] disabled:hover:text-ivory text-ivory py-4 text-[11px] font-semibold tracking-[0.28em] uppercase transition-colors"
                    >
                      {isVerifyingOtp ? "Verifying..." : "Verify Code"}
                    </button>
                  </form>
                </div>
              )}

              {/* Step 3: Input New Password */}
              {forgotStep === "set_new_password" && (
                <form onSubmit={handleSetNewPassword} className="space-y-4">
                  <label className="block">
                    <div className="text-[10px] tracking-[0.28em] uppercase text-charcoal/60 flex items-center gap-2">
                      <Lock size={12} className="text-[color:var(--gold)]" /> New Password
                    </div>
                    <input
                      required
                      type="password"
                      placeholder="••••••••"
                      value={newPasswordInput}
                      onChange={(e) => setNewPasswordInput(e.target.value)}
                      className="mt-2 w-full bg-transparent border border-border focus:border-[color:var(--gold)] focus:outline-none px-4 py-3 text-sm"
                    />
                  </label>

                  <label className="block">
                    <div className="text-[10px] tracking-[0.28em] uppercase text-charcoal/60 flex items-center gap-2">
                      <Lock size={12} className="text-[color:var(--gold)]" /> Confirm New Password
                    </div>
                    <input
                      required
                      type="password"
                      placeholder="••••••••"
                      value={confirmPasswordInput}
                      onChange={(e) => setConfirmPasswordInput(e.target.value)}
                      className="mt-2 w-full bg-transparent border border-border focus:border-[color:var(--gold)] focus:outline-none px-4 py-3 text-sm"
                    />
                  </label>

                  <button
                    type="submit"
                    className="w-full mt-4 bg-[color:var(--forest)] hover:bg-[color:var(--gold)] hover:text-[color:var(--forest-deep)] text-ivory py-4 text-[11px] font-semibold tracking-[0.28em] uppercase transition-colors"
                  >
                    Reset Password & Sign In
                  </button>
                </form>
              )}
            </div>
          ) : showOtp ? (
            /* --- REGISTRATION OTP VERIFICATION --- */
            <div>
              <button
                onClick={() => {
                  setShowOtp(false);
                  setError("");
                  setOtpCode("");
                }}
                className="absolute top-6 left-6 text-charcoal/50 hover:text-[color:var(--gold)] transition-colors flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider cursor-pointer bg-transparent border-0"
              >
                <ArrowLeft size={14} /> Back
              </button>

              <div className="text-center mb-8 pt-4">
                <div className="w-16 h-16 bg-[color:var(--gold)]/10 text-[color:var(--gold)] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Key size={28} />
                </div>
                <div className="text-eyebrow">Verify Email</div>
                <h1 className="mt-3 font-serif text-3xl text-[color:var(--forest)]">
                  Enter Verification Code
                </h1>
                <p className="mt-2 text-xs text-charcoal/60 leading-relaxed max-w-sm mx-auto">
                  We've sent a 6-digit code to{" "}
                  <span className="font-semibold text-charcoal">{email}</span>.
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm flex gap-3 items-center">
                  <AlertCircle size={18} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {devOtp && (
                <div className="mb-6 p-4 bg-[color:var(--gold)]/15 border border-[color:var(--gold)]/30 text-charcoal text-xs flex flex-col gap-2">
                  <div className="font-semibold uppercase tracking-wider text-[color:var(--gold)] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--gold)] animate-pulse" />
                    Development Mode Helper
                  </div>
                  <p className="text-charcoal/70">
                    SMTP credentials are not configured. Use the generated OTP code below to verify:
                  </p>
                  <div className="text-center py-2.5 bg-background font-mono text-xl tracking-[0.3em] font-bold text-[color:var(--forest)] border border-[color:var(--gold)]/20 select-all cursor-pointer">
                    {devOtp}
                  </div>
                </div>
              )}

              <form onSubmit={handleVerifyRegistrationOtp} className="space-y-6">
                <div className="flex flex-col items-center justify-center gap-4 py-2">
                  <InputOTP
                    maxLength={6}
                    value={otpCode}
                    onChange={(val) => setOtpCode(val)}
                    disabled={isVerifyingOtp}
                  >
                    <InputOTPGroup className="gap-2">
                      <InputOTPSlot
                        index={0}
                        className="w-12 h-14 text-xl border border-border bg-transparent focus:border-[color:var(--gold)] focus:ring-1 focus:ring-[color:var(--gold)] text-[color:var(--forest)] font-serif font-bold text-center transition-all duration-300"
                      />
                      <InputOTPSlot
                        index={1}
                        className="w-12 h-14 text-xl border border-border bg-transparent focus:border-[color:var(--gold)] focus:ring-1 focus:ring-[color:var(--gold)] text-[color:var(--forest)] font-serif font-bold text-center transition-all duration-300"
                      />
                      <InputOTPSlot
                        index={2}
                        className="w-12 h-14 text-xl border border-border bg-transparent focus:border-[color:var(--gold)] focus:ring-1 focus:ring-[color:var(--gold)] text-[color:var(--forest)] font-serif font-bold text-center transition-all duration-300"
                      />
                      <InputOTPSlot
                        index={3}
                        className="w-12 h-14 text-xl border border-border bg-transparent focus:border-[color:var(--gold)] focus:ring-1 focus:ring-[color:var(--gold)] text-[color:var(--forest)] font-serif font-bold text-center transition-all duration-300"
                      />
                      <InputOTPSlot
                        index={4}
                        className="w-12 h-14 text-xl border border-border bg-transparent focus:border-[color:var(--gold)] focus:ring-1 focus:ring-[color:var(--gold)] text-[color:var(--forest)] font-serif font-bold text-center transition-all duration-300"
                      />
                      <InputOTPSlot
                        index={5}
                        className="w-12 h-14 text-xl border border-border bg-transparent focus:border-[color:var(--gold)] focus:ring-1 focus:ring-[color:var(--gold)] text-[color:var(--forest)] font-serif font-bold text-center transition-all duration-300"
                      />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <button
                  type="submit"
                  disabled={isVerifyingOtp || otpCode.length !== 6}
                  className="w-full bg-[color:var(--forest)] hover:bg-[color:var(--gold)] hover:text-[color:var(--forest-deep)] disabled:opacity-50 disabled:hover:bg-[color:var(--forest)] disabled:hover:text-ivory text-ivory py-4 text-[11px] font-semibold tracking-[0.28em] uppercase transition-colors"
                >
                  {isVerifyingOtp ? "Verifying..." : "Verify & Register"}
                </button>
              </form>

              <div className="mt-6 text-center text-xs text-charcoal/60">
                Didn't receive the code?{" "}
                {cooldown > 0 ? (
                  <span className="text-[color:var(--gold)] font-semibold">
                    Resend in {cooldown}s
                  </span>
                ) : (
                  <button
                    onClick={() => handleSendRegistrationOtp()}
                    disabled={isSendingOtp}
                    className="text-[color:var(--gold)] font-semibold hover:underline cursor-pointer disabled:opacity-50 bg-transparent border-0"
                  >
                    {isSendingOtp ? "Sending..." : "Resend Code"}
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* --- DEFAULT SIGN IN / REGISTER FORM --- */
            <div>
              <div className="text-center mb-8">
                <div className="text-eyebrow">Account</div>
                <h1 className="mt-3 font-serif text-3xl md:text-4xl text-[color:var(--forest)]">
                  {isRegister ? "Create Account" : "Sign In"}
                </h1>
                <p className="mt-2 text-xs text-charcoal/60 leading-relaxed">
                  {isRegister
                    ? "Register to make and manage bookings at our retreats."
                    : "Access your bookings, settings, and itinerary."}
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm flex gap-3 items-center">
                  <AlertCircle size={18} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {isRegister && (
                  <label className="block">
                    <div className="text-[10px] tracking-[0.28em] uppercase text-charcoal/60 flex items-center gap-2">
                      <User size={12} className="text-[color:var(--gold)]" /> Full Name
                    </div>
                    <input
                      required
                      type="text"
                      placeholder="Jane Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="mt-2 w-full bg-transparent border border-border focus:border-[color:var(--gold)] focus:outline-none px-4 py-3 text-sm"
                    />
                  </label>
                )}

                <label className="block">
                  <div className="text-[10px] tracking-[0.28em] uppercase text-charcoal/60 flex items-center gap-2">
                    <Mail size={12} className="text-[color:var(--gold)]" /> Email Address
                  </div>
                  <input
                    required
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-2 w-full bg-transparent border border-border focus:border-[color:var(--gold)] focus:outline-none px-4 py-3 text-sm"
                  />
                </label>

                <label className="block">
                  <div className="flex justify-between items-center text-[10px] tracking-[0.28em] uppercase text-charcoal/60">
                    <span className="flex items-center gap-2">
                      <Lock size={12} className="text-[color:var(--gold)]" /> Password
                    </span>
                    {!isRegister && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsForgotPassword(true);
                          setForgotStep("choose_method");
                          setError("");
                        }}
                        className="text-[color:var(--gold)] hover:underline normal-case tracking-normal text-xs font-medium cursor-pointer bg-transparent border-0"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <input
                    required
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-2 w-full bg-transparent border border-border focus:border-[color:var(--gold)] focus:outline-none px-4 py-3 text-sm"
                  />
                </label>

                <button
                  type="submit"
                  disabled={isSendingOtp}
                  className="w-full mt-4 bg-[color:var(--forest)] hover:bg-[color:var(--gold)] hover:text-[color:var(--forest-deep)] text-ivory py-4 text-[11px] font-semibold tracking-[0.28em] uppercase transition-colors"
                >
                  {isRegister ? (isSendingOtp ? "Sending OTP..." : "Register") : "Sign In"}
                </button>
              </form>

              <div className="mt-8 text-center text-xs text-charcoal/60">
                {isRegister ? (
                  <span>
                    Already have an account?{" "}
                    <button
                      onClick={() => {
                        setIsRegister(false);
                        setError("");
                      }}
                      className="text-[color:var(--gold)] font-semibold hover:underline bg-transparent border-0"
                    >
                      Sign In
                    </button>
                  </span>
                ) : (
                  <span>
                    Don't have an account?{" "}
                    <button
                      onClick={() => {
                        setIsRegister(true);
                        setError("");
                      }}
                      className="text-[color:var(--gold)] font-semibold hover:underline bg-transparent border-0"
                    >
                      Create Account
                    </button>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </SiteShell>
  );
}
