"use client";

import { useState, useEffect, useMemo } from "react";
import {
  X,
  IndianRupee,
  Smartphone,
  QrCode,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  PlusCircle,
} from "lucide-react";
import Link from "next/link";
import { formatINR } from "@/lib/money";
import { cn } from "@/lib/utils";

export type PayRecipient = {
  id: string;
  name: string;
  phone?: string | null;
  type: "VENDOR" | "WORKER";
  notes?: string | null;
};

export function UpiPayModal({
  isOpen,
  onClose,
  recipient,
  language = "en",
}: {
  isOpen: boolean;
  onClose: () => void;
  recipient: PayRecipient | null;
  language?: string;
}) {
  const [amount, setAmount] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [upiHandle, setUpiHandle] = useState<string>("@upi");
  const [customUpiId, setCustomUpiId] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [showQr, setShowQr] = useState<boolean>(true);

  // Detect mobile user agent
  useEffect(() => {
    if (typeof window !== "undefined") {
      const ua = navigator.userAgent.toLowerCase();
      const mobile = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua);
      setIsMobile(mobile);
      // On mobile default to App buttons, on PC default to QR Code
      setShowQr(!mobile);
    }
  }, []);

  // Initialize form when recipient changes
  useEffect(() => {
    if (recipient) {
      const cleanPhone = (recipient.phone || "").replace(/[^\d]/g, "");
      const phoneDigits = cleanPhone.length >= 10 ? cleanPhone.slice(-10) : cleanPhone;
      setCustomUpiId(phoneDigits ? `${phoneDigits}@upi` : "");
      setNote(
        recipient.type === "VENDOR"
          ? `Payment to ${recipient.name}`
          : `Wages payout to ${recipient.name}`
      );
      setAmount("");
      setCopied(false);
    }
  }, [recipient]);

  const activeUpiId = customUpiId.trim();

  // Generate standard UPI deep link URL
  const upiUrl = useMemo(() => {
    if (!recipient) return "";
    const params = new URLSearchParams();
    if (activeUpiId) params.set("pa", activeUpiId);
    params.set("pn", recipient.name);
    if (amount && Number(amount) > 0) params.set("am", Number(amount).toFixed(2));
    params.set("cu", "INR");
    if (note) params.set("tn", note);
    return `upi://pay?${params.toString()}`;
  }, [recipient, activeUpiId, amount, note]);

  // App specific deep links
  const gpayUrl = useMemo(() => upiUrl.replace("upi://pay", "gpay://upi/pay"), [upiUrl]);
  const phonePeUrl = useMemo(() => upiUrl.replace("upi://pay", "phonepe://pay"), [upiUrl]);
  const paytmUrl = useMemo(() => upiUrl.replace("upi://pay", "paytmmp://pay"), [upiUrl]);
  const bhimUrl = useMemo(() => upiUrl.replace("upi://pay", "bhim://pay"), [upiUrl]);

  // QR Code image URL via Google / QR Server API
  const qrCodeUrl = useMemo(() => {
    if (!upiUrl) return "";
    return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(upiUrl)}`;
  }, [upiUrl]);

  if (!isOpen || !recipient) return null;

  const copyUpiLink = async () => {
    try {
      await navigator.clipboard.writeText(upiUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const copyUpiId = async () => {
    try {
      await navigator.clipboard.writeText(activeUpiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const quickAmounts = ["500", "1000", "2000", "5000", "10000", "25000"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-lg rounded-3xl bg-white p-5 sm:p-6 shadow-2xl border border-paper-200 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3 border-b border-paper-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-purple-100 text-purple-700">
              <IndianRupee className="h-5 w-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-display text-base sm:text-lg font-bold text-ink-900 leading-tight">
                {language === "te" ? `${recipient.name} కి UPI చెల్లింపు` : `Pay ${recipient.name}`}
              </h3>
              <p className="text-xs text-ink-500 mt-0.5">
                {recipient.type === "VENDOR" ? "🏪 Hardware / Vendor Shop" : "👷 Worker / Contractor"}
                {recipient.phone ? ` · 📱 ${recipient.phone}` : ""}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-ink-400 hover:bg-paper-100 hover:text-ink-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="py-4 space-y-4">
          {/* Amount Input */}
          <div>
            <label className="block text-xs font-bold text-ink-800 mb-1.5">
              {language === "te" ? "చెల్లించాల్సిన మొత్తం (Amount)" : "Payment Amount (₹)"}
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-sm font-bold text-ink-500">₹</span>
              <input
                type="number"
                min="1"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full rounded-2xl border border-paper-300 bg-paper-50/80 py-2.5 pl-8 pr-4 text-base font-bold text-ink-900 placeholder:text-ink-300 focus:border-purple-500 focus:bg-white focus:outline-none transition"
                autoFocus
              />
            </div>

            {/* Quick Amount Chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {quickAmounts.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAmount(amt)}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-xs font-bold transition",
                    amount === amt
                      ? "bg-purple-600 text-white shadow-2xs"
                      : "bg-paper-100 text-ink-700 hover:bg-purple-50 hover:text-purple-800"
                  )}
                >
                  ₹{Number(amt).toLocaleString("en-IN")}
                </button>
              ))}
            </div>
          </div>

          {/* UPI ID / Phone VPA */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-ink-800">
                {language === "te" ? "గ్రహీత UPI ID / మొబైల్ నంబర్" : "Recipient UPI ID / VPA"}
              </label>
              {activeUpiId && (
                <button
                  type="button"
                  onClick={copyUpiId}
                  className="text-[11px] font-bold text-purple-700 hover:underline inline-flex items-center gap-1"
                >
                  {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                  {copied ? (language === "te" ? "కాపీ అయింది!" : "Copied!") : (language === "te" ? "ID కాపీ చేయండి" : "Copy ID")}
                </button>
              )}
            </div>
            <input
              type="text"
              value={customUpiId}
              onChange={(e) => setCustomUpiId(e.target.value)}
              placeholder="e.g. 9876543210@upi or name@okaxis"
              className="w-full rounded-xl border border-paper-300 bg-paper-50 px-3 py-2 text-xs sm:text-sm font-semibold text-ink-900 focus:border-purple-500 focus:bg-white focus:outline-none"
            />
          </div>

          {/* Note / Purpose */}
          <div>
            <label className="block text-xs font-bold text-ink-800 mb-1">
              {language === "te" ? "వివరణ (Payment Note)" : "Payment Note / Remark"}
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Cement payment / Advance"
              className="w-full rounded-xl border border-paper-300 bg-paper-50 px-3 py-2 text-xs font-medium text-ink-900 focus:border-purple-500 focus:bg-white focus:outline-none"
            />
          </div>

          {/* Device Tabs: Mobile Apps vs Desktop QR Code */}
          <div className="pt-2 border-t border-paper-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-ink-700">
                {language === "te" ? "చెల్లింపు పద్ధతి ఎంచుకోండి:" : "Choose Payment Option:"}
              </span>
              <div className="flex items-center gap-1 bg-paper-100 p-0.5 rounded-lg text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setShowQr(false)}
                  className={cn(
                    "px-2.5 py-1 rounded-md transition",
                    !showQr ? "bg-white text-ink-900 shadow-2xs" : "text-ink-600 hover:text-ink-900"
                  )}
                >
                  📱 Mobile UPI Apps
                </button>
                <button
                  type="button"
                  onClick={() => setShowQr(true)}
                  className={cn(
                    "px-2.5 py-1 rounded-md transition",
                    showQr ? "bg-white text-ink-900 shadow-2xs" : "text-ink-600 hover:text-ink-900"
                  )}
                >
                  📷 Scan QR Code
                </button>
              </div>
            </div>

            {/* View A: Mobile UPI Direct Launch Buttons */}
            {!showQr && (
              <div className="space-y-2.5">
                {/* Universal UPI App Launcher */}
                <a
                  href={upiUrl}
                  className="flex items-center justify-center gap-2 w-full rounded-2xl bg-purple-600 hover:bg-purple-700 p-3 text-sm font-bold text-white shadow-md active:scale-98 transition text-center"
                >
                  <Smartphone className="h-4 w-4" />
                  <span>
                    {language === "te"
                      ? "🚀 మొబైల్‌లో UPI యాప్‌లను తెరవండి (Pay via UPI)"
                      : "🚀 Launch Installed UPI App"}
                  </span>
                </a>

                {/* Popular App Shortcuts */}
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={gpayUrl}
                    className="flex items-center justify-center gap-2 rounded-xl border border-paper-200 bg-white p-2.5 text-xs font-bold text-ink-800 hover:bg-paper-50 transition active:scale-98 shadow-2xs"
                  >
                    <span className="text-base">🟢</span>
                    <span>Google Pay</span>
                  </a>

                  <a
                    href={phonePeUrl}
                    className="flex items-center justify-center gap-2 rounded-xl border border-paper-200 bg-white p-2.5 text-xs font-bold text-ink-800 hover:bg-paper-50 transition active:scale-98 shadow-2xs"
                  >
                    <span className="text-base">🟣</span>
                    <span>PhonePe</span>
                  </a>

                  <a
                    href={paytmUrl}
                    className="flex items-center justify-center gap-2 rounded-xl border border-paper-200 bg-white p-2.5 text-xs font-bold text-ink-800 hover:bg-paper-50 transition active:scale-98 shadow-2xs"
                  >
                    <span className="text-base">🔵</span>
                    <span>Paytm</span>
                  </a>

                  <a
                    href={bhimUrl}
                    className="flex items-center justify-center gap-2 rounded-xl border border-paper-200 bg-white p-2.5 text-xs font-bold text-ink-800 hover:bg-paper-50 transition active:scale-98 shadow-2xs"
                  >
                    <span className="text-base">🏛️</span>
                    <span>BHIM UPI</span>
                  </a>
                </div>

                {!isMobile && (
                  <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-xl border border-amber-200">
                    💡 <strong>Desktop Note:</strong> If UPI apps are not installed on this PC, switch to the <strong>Scan QR Code</strong> tab to scan and pay from your mobile phone.
                  </p>
                )}
              </div>
            )}

            {/* View B: QR Code for Desktop Scan or In-Person Payment */}
            {showQr && (
              <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-paper-50 border border-paper-200 text-center space-y-3">
                <div className="p-2 bg-white rounded-2xl shadow-xs border border-paper-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrCodeUrl}
                    alt="UPI Payment QR Code"
                    className="h-44 w-44 object-contain rounded-xl"
                  />
                </div>

                <div>
                  <p className="text-xs font-bold text-ink-900">
                    {language === "te" ? "మీ మొబైల్ UPI యాప్ ద్వారా ఈ QR కోడ్‌ను స్కాన్ చేయండి" : "Scan this QR code with GPay, PhonePe, or Paytm"}
                  </p>
                  <p className="text-[11px] text-ink-500 mt-0.5">
                    {amount && Number(amount) > 0 ? (
                      <span className="font-bold text-purple-700">Amount: {formatINR(Number(amount))}</span>
                    ) : (
                      "Enter amount in app during payment"
                    )}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={copyUpiLink}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-paper-300 bg-white px-3 py-1.5 text-xs font-bold text-ink-700 hover:bg-paper-100 transition shadow-2xs"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copied ? "Link Copied!" : "Copy Payment Link"}</span>
                  </button>

                  <a
                    href={upiUrl}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-purple-700 transition shadow-2xs"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Open App Link</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer: Quick Log Expense Shortcut */}
        <div className="pt-3 border-t border-paper-100 flex items-center justify-between gap-2">
          <Link
            href={`/expenses/new?${recipient.type === "VENDOR" ? `vendorId=${recipient.id}` : `workerId=${recipient.id}`}${amount ? `&amount=${amount}` : ""}`}
            onClick={onClose}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-clay-700 hover:text-clay-900 transition hover:underline"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>{language === "te" ? "ఈ చెల్లింపును ఖర్చులలో నమోదు చేయండి ➔" : "Record as Expense in Project ➔"}</span>
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-paper-300 bg-white px-3.5 py-1.5 text-xs font-bold text-ink-700 hover:bg-paper-50 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
