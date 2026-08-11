import React, { useState } from "react";
import { X, Printer, ShieldCheck, CheckCircle2, Clock, Download, Mail, Info } from "lucide-react";
import { PROPERTIES, ROOMS } from "@/lib/site-data";
import { useBookingStore, type Booking, type EventBooking } from "@/lib/booking-store";
import { format, parseISO, differenceInDays } from "date-fns";
import { sendBillInvoiceEmail } from "@/lib/email-api";

interface BillInvoiceModalProps {
  booking: Booking | EventBooking | null;
  isOpen: boolean;
  onClose: () => void;
}

export function BillInvoiceModal({ booking, isOpen, onClose }: BillInvoiceModalProps) {
  const store = useBookingStore();
  const [customNotes, setCustomNotes] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailMsg, setEmailMsg] = useState("");

  if (!isOpen || !booking) return null;

  const isEventBooking = "eventTitle" in booking;

  const propertyKey = booking.property || "mysore";
  const propertyInfo = PROPERTIES[propertyKey] || {
    name: "VANASURU Resorts",
    address: "Vanasuru, 227/9, CFTRI layout, Bogadi 2nd Stage, Bogadi, Mysuru, Karnataka 570022",
    phone: "+91 78991 79979",
    email: "vanasurumys@gmail.com",
  };

  const roomTypeInfo = !isEventBooking
    ? ROOMS.find((r) => r.slug === (booking as Booking).roomTypeSlug)
    : null;
  const roomTypeName = roomTypeInfo ? roomTypeInfo.name : !isEventBooking ? (booking as Booking).roomTypeSlug : "";

  // Extract base price per night (check physical assigned room first, then room category)
  const physicalRoom = !isEventBooking
    ? store.rooms.find((r) => r.id === (booking as Booking).roomId || r.name === (booking as Booking).roomId)
    : null;

  let pricePerNight = physicalRoom?.pricePerNight;
  if (!pricePerNight && roomTypeInfo) {
    const matched = roomTypeInfo.price.match(/\d[\d,]*/);
    if (matched) {
      pricePerNight = parseInt(matched[0].replace(/,/g, ""), 10);
    }
  }
  if (!pricePerNight) pricePerNight = 3500;

  // Calculate nights
  let totalNights = 1;
  if (!isEventBooking) {
    try {
      const b = booking as Booking;
      if (b.checkIn && b.checkOut) {
        const nights = differenceInDays(parseISO(b.checkOut), parseISO(b.checkIn));
        totalNights = nights > 0 ? nights : 1;
      }
    } catch {
      totalNights = 1;
    }
  }

  const baseItemTotal = isEventBooking
    ? ((booking as EventBooking).totalAmount || 50000)
    : pricePerNight * totalNights * ((booking as Booking).roomsCount || 1);

  const calculatedBaseGrandTotal = baseItemTotal;

  const extraChargesList = booking.extraCharges || [];
  const extraChargesSum = extraChargesList.reduce((sum, c) => sum + c.amount, 0);

  const grandTotal =
    booking.customGrandTotal !== undefined && booking.customGrandTotal !== null
      ? booking.customGrandTotal + extraChargesSum
      : calculatedBaseGrandTotal + extraChargesSum;

  let initialAdvance = isEventBooking
    ? ((booking as EventBooking).advanceAmount || 0)
    : (typeof (booking as Booking).payment?.amountPaid === "number" ? (booking as Booking).payment!.amountPaid : 0);

  if (!isEventBooking && (booking as Booking).payment?.provider === "razorpay" && initialAdvance >= 100) {
    initialAdvance = Math.round(initialAdvance / 100);
  } else if (initialAdvance > 5000) {
    initialAdvance = Math.round(initialAdvance / 100);
  }

  const partialPaymentsTotal = (booking.paymentsHistory || []).reduce((sum, p) => sum + p.amount, 0);
  const totalPaid = initialAdvance + partialPaymentsTotal;
  const balanceDue = Math.max(0, grandTotal - totalPaid);

  const invoiceNo = `INV-${booking.id.replace("BK-", "").replace("EVB-", "EVT-").replace("BLOCK-", "ADM")}`;
  const invoiceDate = booking.createdAt
    ? format(parseISO(booking.createdAt), "dd MMM yyyy")
    : format(new Date(), "dd MMM yyyy");

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    const originalTitle = document.title;
    document.title = `Tax_Invoice_${invoiceNo}_${booking.userName.replace(/\s+/g, "_")}`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  const handleSendEmailBill = async () => {
    setIsSendingEmail(true);
    setEmailMsg("");
    try {
      const res = await sendBillInvoiceEmail({
        data: {
          booking,
          additionalNotes: customNotes.trim() || undefined,
        },
      });
      if (res.success) {
        setEmailMsg(`Tax Invoice successfully emailed to guest & admin!`);
      } else {
        setEmailMsg(`Email send error: ${res.error || "Check SMTP settings"}`);
      }
    } catch (err: unknown) {
      setEmailMsg(err instanceof Error ? err.message : "Failed to send email");
    } finally {
      setIsSendingEmail(false);
      setTimeout(() => setEmailMsg(""), 5000);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md overflow-y-auto animate-fade-in print:p-0 print:bg-white print:static bill-invoice-modal-root">
      <style>{`
        @media print {
          @page {
            margin: 10mm;
            size: auto;
          }
          header, nav, footer, aside, .print\\:hidden {
            display: none !important;
          }
          .bill-invoice-modal-root {
            position: absolute !important;
            inset: 0 !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: auto !important;
            background: #ffffff !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
            z-index: 999999 !important;
          }
          .bill-invoice-modal-card {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            border-radius: 0 !important;
            background: #ffffff !important;
          }
        }
      `}</style>
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden mt-4 mb-16 sm:mt-6 sm:mb-20 print:shadow-none print:rounded-none print:m-0 border border-sand-dark/20 bill-invoice-modal-card">
        {/* Header Control Bar (Hidden when printing) */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-charcoal text-sand border-b border-gold/20 print:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-gold" />
            <span className="font-serif font-semibold tracking-wide text-xs sm:text-sm">
              VANASURU RESORTS &bull; TAX INVOICE
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <button
              onClick={handleSendEmailBill}
              disabled={isSendingEmail}
              className="flex items-center gap-1.5 text-xs bg-teal-700 hover:bg-teal-800 disabled:bg-gray-500 text-white px-3 py-1.5 rounded-lg font-medium transition-colors shadow-sm cursor-pointer"
              title="Send Tax Invoice PDF to guest email & admin"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>{isSendingEmail ? "Sending..." : "Email Bill"}</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              className="flex items-center gap-1.5 text-xs bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded-lg font-medium transition-colors shadow-sm cursor-pointer"
              title="Download direct PDF file"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span> PDF
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 text-xs bg-gold text-charcoal px-3 py-1.5 rounded-lg font-medium hover:bg-gold/90 transition-colors shadow-sm cursor-pointer"
              title="Print tax receipt"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print</span> Invoice
            </button>

            <button
              onClick={onClose}
              className="flex items-center gap-1 text-xs bg-white/10 hover:bg-white/20 text-sand hover:text-white px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer border border-white/10"
              aria-label="Close modal"
              title="Close window"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline font-semibold">Close</span>
            </button>
          </div>
        </div>

        {/* Email Sending Feedback Alert (Hidden when printing) */}
        {emailMsg && (
          <div className="px-6 py-2.5 bg-teal-50 border-b border-teal-200 text-teal-900 text-xs font-medium flex items-center justify-between animate-fade-in print:hidden">
            <span className="flex items-center gap-1.5 font-semibold">
              <Mail className="w-4 h-4 text-teal-700" /> {emailMsg}
            </span>
            <button onClick={() => setEmailMsg("")} className="text-teal-700 hover:text-teal-900">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Invoice Printable Area */}
        <div className="p-6 sm:p-10 space-y-8 bg-white text-charcoal">
          {/* Header Banner */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-sand-dark/20 gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-serif font-bold tracking-widest text-charcoal">
                VANASURU
              </h1>
              <p className="text-xs uppercase tracking-widest text-gold font-semibold mt-0.5">
                Resorts &amp; Hospitality Group
              </p>
              <p className="text-xs text-charcoal/80 mt-2 max-w-md leading-relaxed font-medium">
                {propertyInfo.address}
              </p>
              <p className="text-xs text-charcoal/70 mt-0.5">
                Phone: <span className="font-medium">{propertyInfo.phone}</span> &bull; Email:{" "}
                <span className="font-medium">{propertyInfo.email}</span>
              </p>
              <p className="text-[11px] text-charcoal/50 mt-0.5">GSTIN: 29AAAAA0000A1Z5</p>
            </div>
            <div className="text-left md:text-right">
              <span className="inline-block px-3 py-1 bg-amber-50 text-amber-800 text-xs font-semibold rounded-full border border-amber-200 uppercase tracking-wider mb-2">
                Official Tax Invoice
              </span>
              <p className="text-sm font-bold text-charcoal">
                Invoice No: <span className="font-mono text-gold-dark">{invoiceNo}</span>
              </p>
              <p className="text-xs text-charcoal/70">Issue Date: {invoiceDate}</p>
              <p className="text-xs text-charcoal/70">
                Booking ID: <span className="font-mono font-semibold">{booking.id}</span>
              </p>
            </div>
          </div>

          {/* Editable Additional Information / Custom Notes Input (Hidden when printing) */}
          <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2 print:hidden">
            <label className="block text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
              <Info size={14} className="text-amber-700" /> Additional Notes / Custom Instructions for Bill (Optional):
            </label>
            <textarea
              rows={2}
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="Add custom notes, special discounts, inclusions, or specific remarks before printing or emailing this bill..."
              className="w-full text-xs p-2.5 bg-white border border-amber-300 rounded-lg focus:border-[color:var(--gold)] focus:outline-none text-charcoal font-medium"
            />
          </div>

          {/* Guest & Stay Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-xl bg-sand/10 border border-sand-dark/10">
            <div>
              <h3 className="text-xs font-semibold text-charcoal/50 uppercase tracking-wider mb-2">
                Billed To (Guest Details)
              </h3>
              <p className="font-semibold text-base text-charcoal">{booking.userName}</p>
              <p className="text-xs text-charcoal/80 mt-1">Email: {booking.userEmail}</p>
              <p className="text-xs text-charcoal/80">
                Mobile: {booking.guestDetails.mobile || "N/A"}
              </p>
              {"idProofType" in booking.guestDetails && (booking.guestDetails as { idProofType?: string }).idProofType && (
                <div className="mt-2 pt-2 border-t border-sand-dark/10">
                  <p className="text-xs text-charcoal/70">
                    <span className="font-semibold text-charcoal">ID Proof:</span>{" "}
                    {(booking.guestDetails as { idProofType?: string }).idProofType} &bull;{" "}
                    <span className="font-mono font-bold text-charcoal/90">
                      {(booking.guestDetails as { idProofNumber?: string }).idProofNumber || "Verified"}
                    </span>
                  </p>
                </div>
              )}
              {booking.guestDetails.address && (
                <p className="text-xs text-charcoal/70 mt-1 leading-relaxed">
                  Address: {booking.guestDetails.address}, {booking.guestDetails.city},{" "}
                  {booking.guestDetails.state}
                </p>
              )}
            </div>

            <div>
              <h3 className="text-xs font-semibold text-charcoal/50 uppercase tracking-wider mb-2">
                {isEventBooking ? "Event & Function Details" : "Reservation & Timestamps"}
              </h3>
              <p className="font-semibold text-sm text-charcoal">{propertyInfo.name}</p>
              {isEventBooking ? (
                <>
                  <p className="text-xs text-charcoal/80">
                    Event / Venue: <span className="font-medium">{(booking as EventBooking).eventTitle}</span> ({(booking as EventBooking).venue})
                  </p>
                  <p className="text-xs text-charcoal/80 mt-1">
                    Event Date: <span className="font-semibold font-mono">{(booking as EventBooking).eventDate}</span> &bull; Guests: {(booking as EventBooking).guestsCount}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xs text-charcoal/80">
                    Room: <span className="font-medium">{roomTypeName}</span> (Room #{(booking as Booking).roomId})
                  </p>
                  <p className="text-xs text-charcoal/80 mt-1">
                    Booked Check-In: <span className="font-semibold">{(booking as Booking).checkIn}</span>
                  </p>
                  <p className="text-xs text-charcoal/80">
                    Booked Check-Out: <span className="font-semibold">{(booking as Booking).checkOut}</span>
                  </p>
                </>
              )}

              {/* Recorded Timestamps */}
              <div className="mt-2 pt-2 border-t border-sand-dark/10 space-y-1">
                {booking.checkedInAt ? (
                  <p className="text-xs text-emerald-800 font-semibold flex items-center gap-1">
                    <CheckCircle2 size={12} className="text-emerald-600" />
                    Actual Check-In: {booking.checkedInAt}
                  </p>
                ) : (
                  <p className="text-[11px] text-amber-800 italic">Actual Check-In: Pending</p>
                )}

                {booking.checkedOutAt ? (
                  <p className="text-xs text-blue-800 font-semibold flex items-center gap-1">
                    <Clock size={12} className="text-blue-600" />
                    Actual Check-Out: {booking.checkedOutAt}
                  </p>
                ) : (
                  <p className="text-[11px] text-charcoal/50 italic">
                    Actual Check-Out: {booking.checkedInAt ? "Event in progress" : "Pending"}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Charges Table */}
          <div className="overflow-x-auto">
            <h3 className="text-xs font-semibold text-charcoal/60 uppercase tracking-wider mb-2">
              1. {isEventBooking ? "Event & Banquet Charges" : "Room & Package Charges"}
            </h3>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-charcoal/20 bg-charcoal/5 text-charcoal font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-center">{isEventBooking ? "Date" : "Nights"}</th>
                  <th className="py-3 px-4 text-center">{isEventBooking ? "Guests" : "Rooms"}</th>
                  <th className="py-3 px-4 text-right">{isEventBooking ? "Type" : "Rate / Night"}</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-dark/10">
                <tr>
                  <td className="py-3 px-4">
                    <p className="font-semibold text-charcoal">
                      {isEventBooking ? (booking as EventBooking).eventTitle : `${roomTypeName} Stay`}
                    </p>
                    <p className="text-[11px] text-charcoal/60">
                      {isEventBooking
                        ? `Venue: ${(booking as EventBooking).venue} (${(booking as EventBooking).property})`
                        : `Room assignment: ${(booking as Booking).roomId}`}
                    </p>
                  </td>
                  <td className="py-3 px-4 text-center font-mono">
                    {isEventBooking ? (booking as EventBooking).eventDate : totalNights}
                  </td>
                  <td className="py-3 px-4 text-center font-mono">
                    {isEventBooking ? (booking as EventBooking).guestsCount : ((booking as Booking).roomsCount || 1)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono">
                    {isEventBooking ? "Flat Banquet Fee" : `Rs. ${pricePerNight.toLocaleString("en-IN")}`}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-medium">
                    Rs. {baseItemTotal.toLocaleString("en-IN")}
                  </td>
                </tr>
                {extraChargesList.map((chg) => (
                  <tr key={chg.id} className="bg-amber-50/40">
                    <td className="py-2.5 px-4 font-medium text-amber-900" colSpan={3}>
                      {chg.reason} ({chg.date})
                    </td>
                    <td className="py-2.5 px-4 text-right text-[11px] text-amber-800 italic">Extra Charge</td>
                    <td className="py-2.5 px-4 text-right font-mono font-semibold text-amber-900">
                      +Rs. {chg.amount.toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Payments Installment Log */}
          <div>
            <h3 className="text-xs font-semibold text-charcoal/60 uppercase tracking-wider mb-2">
              2. Payments Ledger &amp; Installments Log
            </h3>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-charcoal/20 bg-sand/20 text-charcoal/70 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-4">Date &amp; Time</th>
                  <th className="py-2.5 px-4">Payment Mode</th>
                  <th className="py-2.5 px-4">Ref / Notes</th>
                  <th className="py-2.5 px-4 text-right">Amount Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-dark/10">
                {initialAdvance > 0 && (
                  <tr>
                    <td className="py-2.5 px-4 font-mono text-[11px]">
                      {booking.createdAt ? format(parseISO(booking.createdAt), "dd MMM yyyy") : "Initial"}
                    </td>
                    <td className="py-2.5 px-4 font-medium text-emerald-800">
                      {!isEventBooking && (booking as Booking).payment?.provider === "razorpay" ? "Razorpay Online Advance" : "Direct Advance / Booking Payment"}
                    </td>
                    <td className="py-2.5 px-4 text-charcoal/60 font-mono text-[11px]">
                      {!isEventBooking ? ((booking as Booking).payment?.paymentId || "BOOKING_ADVANCE") : "EVENT_ADVANCE"}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-semibold text-emerald-700">
                      Rs. {initialAdvance.toLocaleString("en-IN")}
                    </td>
                  </tr>
                )}

                {(booking.paymentsHistory || []).map((p) => (
                  <tr key={p.id}>
                    <td className="py-2.5 px-4 font-mono text-[11px]">{p.date}</td>
                    <td className="py-2.5 px-4 font-medium text-charcoal">{p.mode}</td>
                    <td className="py-2.5 px-4 text-charcoal/60">{p.notes || "Partial Payment"}</td>
                    <td className="py-2.5 px-4 text-right font-mono font-semibold text-emerald-700">
                      Rs. {p.amount.toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}

                {initialAdvance === 0 && (!booking.paymentsHistory || booking.paymentsHistory.length === 0) && (
                  <tr>
                    <td colSpan={4} className="py-3 px-4 text-center text-charcoal/50 italic">
                      No payments recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Printed Additional Notes / Remarks Block */}
          {customNotes.trim() && (
            <div className="p-3.5 bg-sand/30 border-l-4 border-[color:var(--gold)] rounded-r-lg text-xs text-charcoal space-y-1">
              <p className="font-bold text-charcoal uppercase tracking-wider text-[10px]">Additional Notes &amp; Remarks:</p>
              <p className="whitespace-pre-wrap font-medium">{customNotes}</p>
            </div>
          )}

          {/* Total Breakdown */}
          <div className="flex flex-col md:flex-row justify-between items-start pt-4 border-t border-sand-dark/20 gap-6">
            <div className="text-xs text-charcoal/70 max-w-sm space-y-1">
              <p className="font-semibold text-charcoal">Terms &amp; Payment Status:</p>
              <p className="leading-relaxed">
                Status:{" "}
                <span className="font-semibold text-emerald-700 uppercase">{booking.status.replace("_", " ")}</span>
              </p>
              <p className="text-[11px] text-charcoal/50 italic pt-2">
                Thank you for choosing VANASURU Luxury Retreats. This is an official computer-generated tax receipt.
              </p>
            </div>

            <div className="w-full md:w-72 space-y-2 text-xs">
              <div className="flex justify-between text-charcoal/80">
                <span>{isEventBooking ? "Banquet & Venue Fee:" : "Room Accommodation Tariff:"}</span>
                <span className="font-mono">Rs. {baseItemTotal.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-charcoal/60 text-[11px]">
                <span>Taxes &amp; Service Charges:</span>
                <span className="font-medium text-emerald-800">Included</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-charcoal border-t border-sand-dark/20 pt-2">
                <span>Grand Total:</span>
                <span className="font-mono text-charcoal">
                  Rs. {grandTotal.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between text-emerald-700 font-semibold bg-emerald-50 p-2 rounded border border-emerald-200">
                <span>Total Amount Paid:</span>
                <span className="font-mono">Rs. {totalPaid.toLocaleString("en-IN")}</span>
              </div>
              <div
                className={`flex justify-between font-bold p-2.5 rounded border ${
                  balanceDue === 0
                    ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                    : "bg-amber-50 text-amber-900 border-amber-300"
                }`}
              >
                <span>Balance Payable:</span>
                <span className="font-mono text-sm">
                  Rs. {balanceDue.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Signature */}
          <div className="pt-8 border-t border-dashed border-sand-dark/30 flex justify-between items-end text-xs text-charcoal/60">
            <div>
              <p className="font-medium text-charcoal">VANASURU Hospitality Group</p>
              <p className="text-[11px]">Computer-generated invoice. No physical signature required.</p>
            </div>
            <div className="text-right">
              <div className="w-32 border-b border-charcoal/40 mb-1"></div>
              <p className="font-semibold text-charcoal">Manager / Authorized Signatory</p>
            </div>
          </div>
        </div>

        {/* Footer Bottom Control Bar (Hidden when printing) */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 bg-sand/20 border-t border-sand-dark/20 print:hidden">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-charcoal hover:bg-charcoal/90 text-ivory text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <X size={14} /> Close Invoice Window
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSendEmailBill}
              disabled={isSendingEmail}
              className="px-4 py-2 bg-teal-700 hover:bg-teal-800 disabled:bg-gray-500 text-white text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <Mail size={14} /> {isSendingEmail ? "Sending..." : "Send Bill via Email"}
            </button>
            <button
              onClick={handleDownloadPdf}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <Download size={14} /> Download PDF
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-gold hover:bg-gold/90 text-charcoal text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <Printer size={14} /> Print Invoice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
