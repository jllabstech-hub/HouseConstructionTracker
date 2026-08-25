"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, ChevronRight, Send, Sparkles } from "lucide-react";
import { createLead } from "@/lib/actions/leads";
import { Field, TextInput, Select } from "@/components/ui/fields";

export function EstimateRequestForm() {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);

    start(async () => {
      const res = await createLead(form);
      if (res.error) {
        setError(res.error);
        return;
      }
      setSubmitted(true);
    });
  };

  if (submitted) {
    return (
      <div className="rounded-3xl border border-emerald-200 bg-emerald-50/50 p-8 sm:p-10 text-center space-y-4 shadow-card">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <div className="space-y-1">
          <h3 className="font-display text-2xl font-bold text-ink-900">
            Consultation Request Received!
          </h3>
          <p className="text-xs sm:text-sm text-ink-600 max-w-md mx-auto">
            Thank you. Our senior construction engineer will review your project parameters and contact you within 24 hours with a transparent cost breakdown.
          </p>
        </div>
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setSubmitted(false)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-clay-700 hover:text-clay-900 transition"
          >
            <span>Submit another project request</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-paper-200 bg-white p-6 sm:p-10 shadow-card space-y-6">
      <div className="border-b border-paper-100 pb-5">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-md bg-clay-100 px-2 py-0.5 text-xs font-bold text-clay-800">
            <Sparkles className="h-3 w-3" />
            Transparent Construction
          </span>
        </div>
        <h3 className="font-display text-2xl sm:text-3xl font-bold text-ink-900 mt-2">
          Request a Detailed Construction Estimate
        </h3>
        <p className="text-xs sm:text-sm text-ink-500 mt-1">
          Get transparent costing with strict material and labour breakdown for your house.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-semibold text-red-800">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Row 1: Name & Phone */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Your Name *">
            <TextInput
              name="name"
              required
              placeholder="e.g. Rajesh Sharma"
            />
          </Field>

          <Field label="Phone Number *">
            <TextInput
              name="phone"
              type="tel"
              required
              placeholder="10-digit mobile number"
            />
          </Field>
        </div>

        {/* Row 2: Location & Email */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Plot / Project Location *">
            <TextInput
              name="location"
              required
              placeholder="City, Locality (e.g. Bangalore, Whitefield)"
            />
          </Field>

          <Field label="Email Address (Optional)">
            <TextInput
              name="email"
              type="email"
              placeholder="name@example.com"
            />
          </Field>
        </div>

        {/* Row 3: Dimensions */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Plot Area (Sq.ft)">
            <TextInput
              name="plotArea"
              placeholder="e.g. 1200 / 30x40"
            />
          </Field>

          <Field label="Built-up Area (Sq.ft)">
            <TextInput
              name="builtUpArea"
              placeholder="e.g. 2400 sq.ft"
            />
          </Field>

          <Field label="Number of Floors">
            <Select name="floors" defaultValue="G+1">
              <option value="Ground Only (G)">Ground Only (G)</option>
              <option value="G+1 (Duplex / 2-Floor)">G+1 (Duplex / 2-Floor)</option>
              <option value="G+2 (3-Floor)">G+2 (3-Floor)</option>
              <option value="G+3 or Above">G+3 or Above</option>
              <option value="Commercial / Mixed">Commercial / Mixed</option>
            </Select>
          </Field>
        </div>

        {/* Row 4: Budget & Current Stage */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Expected Budget Range">
            <Select name="budget" defaultValue="40L-60L">
              <option value="Under ₹30 Lakhs">Under ₹30 Lakhs</option>
              <option value="₹30L – ₹50 Lakhs">₹30L – ₹50 Lakhs</option>
              <option value="₹50L – ₹80 Lakhs">₹50L – ₹80 Lakhs</option>
              <option value="₹80L – ₹1.2 Crore">₹80L – ₹1.2 Crore</option>
              <option value="₹1.2 Crore+">₹1.2 Crore+</option>
            </Select>
          </Field>

          <Field label="Current Construction Stage">
            <Select name="constructionStage" defaultValue="Planning / Plot Purchased">
              <option value="Planning / Plot Purchased">Planning / Plot Purchased</option>
              <option value="Architectural Drawings Ready">Architectural Drawings Ready</option>
              <option value="Excavation / Foundation Stage">Excavation / Foundation Stage</option>
              <option value="Structure / Brickwork Ongoing">Structure / Brickwork Ongoing</option>
              <option value="Finishing / Interiors Stage">Finishing / Interiors Stage</option>
            </Select>
          </Field>
        </div>

        {/* Row 5: Notes & Requirements */}
        <Field label="Specific Requirements / Architecture Notes">
          <textarea
            name="requirements"
            rows={3}
            placeholder="e.g. Looking for RCC framed structure, red brick masonry, Italian marble in living room, premium plumbing fittings."
            className="w-full rounded-xl border border-paper-300 bg-paper-50/50 p-3 text-xs text-ink-900 placeholder:text-ink-400 focus:border-clay-600 focus:bg-white focus:outline-hidden transition"
          />
        </Field>

        {/* Submit Action */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={pending}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-clay-600 py-3.5 px-6 font-bold text-white shadow-xs hover:bg-clay-700 active:scale-98 transition disabled:opacity-50 text-sm sm:text-base cursor-pointer"
          >
            <Send className="h-4 w-4" />
            <span>{pending ? "Submitting Request…" : "Request Free Consultation & Cost Estimate"}</span>
          </button>
          <p className="text-[11px] text-ink-400 text-center mt-2">
            No spam. We respect your privacy. All consultations are 100% transparent with zero obligation.
          </p>
        </div>
      </form>
    </div>
  );
}
