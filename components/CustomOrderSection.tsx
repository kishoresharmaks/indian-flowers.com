'use client';

import React, { useState } from 'react';
import {
  Flower2,
  Calendar,
  Send,
  CheckCircle2,
  Phone,
  Mail,
  ShieldCheck,
  Heart,
  Truck,
} from 'lucide-react';

export default function CustomOrderSection() {
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    cityState: '',
    eventDate: '',
    occasion: 'Wedding & Jai Mala Garlands',
    requirements: '',
    budget: '$250 - $500',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedInquiry, setSubmittedInquiry] = useState<{
    inquiryId: string;
    customerName: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (
      !formData.customerName.trim() ||
      !formData.customerEmail.trim() ||
      !formData.customerPhone.trim() ||
      !formData.cityState.trim() ||
      !formData.eventDate.trim() ||
      !formData.requirements.trim()
    ) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/custom-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setSubmittedInquiry({
          inquiryId: data.data.inquiryId,
          customerName: data.data.customerName,
        });
        setFormData({
          customerName: '',
          customerEmail: '',
          customerPhone: '',
          cityState: '',
          eventDate: '',
          occasion: 'Wedding & Jai Mala Garlands',
          requirements: '',
          budget: '$250 - $500',
        });
      } else {
        setErrorMessage(data.message || 'Failed to submit inquiry. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Network error while submitting inquiry. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="custom-orders-section" className="py-14 sm:py-20 bg-[#FAF6F0] border-y border-amber-100/60">
      <div className="w-full max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1680px] 3xl:max-w-[1820px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
        {/* Section Header */}
        <div className="text-center max-w-2xl xl:max-w-3xl mx-auto mb-10 sm:mb-14 space-y-2">
          <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.12em] text-[#C85A78]">
            Bespoke Ceremonies &amp; Celebrations
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl text-[#0B3B24] font-bold tracking-[-0.03em]">
            Custom Floral &amp; Wedding Orders
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 font-normal leading-relaxed">
            Planning a traditional Indian wedding, temple festival, housewarming pooja, or baby shower in the USA? Our master florists handcraft custom Jai Mala garlands and fresh floral arrangements delivered directly to your venue.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Why Choose Us & Trust Badges */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-100/80 shadow-xs space-y-5">
              <h3 className="text-xl sm:text-2xl text-[#134633] font-bold tracking-tight">
                How Custom Orders Work
              </h3>

              <div className="space-y-4 text-xs sm:text-sm text-gray-700">
                <div className="flex gap-3.5 items-start">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-[#0B3B24] flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-100">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Share Your Event Vision</h4>
                    <p className="text-gray-500 font-normal mt-0.5 text-xs">
                      Tell us your date, flower colors, garland length, and quantity requirements.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3.5 items-start">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-[#0B3B24] flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-100">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Custom Quote &amp; Floral Sample Preview</h4>
                    <p className="text-gray-500 font-normal mt-0.5 text-xs">
                      Our floral coordinator sends design options, exact pricing in USD, and photo references.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3.5 items-start">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-[#0B3B24] flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-100">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Handcrafted Fresh in Cold-Chain</h4>
                    <p className="text-gray-500 font-normal mt-0.5 text-xs">
                      Flowers are picked fresh, tied by artisans, and flown in temperature-regulated containers.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3.5 items-start">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-[#0B3B24] flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-100">
                    4
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Guaranteed Morning Delivery</h4>
                    <p className="text-gray-500 font-normal mt-0.5 text-xs">
                      Delivered to your doorstep or venue on the morning of your ceremony, dewy fresh and fragrant.
                    </p>
                  </div>
                </div>
              </div>

              {/* Direct Contact Card */}
              <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <a
                  href="tel:+19093793678"
                  className="flex items-center gap-2 text-gray-700 hover:text-[#0B3B24] font-medium"
                >
                  <Phone className="w-4 h-4 text-[#0B3B24]" />
                  <span>+1 (909) 379-3678</span>
                </a>
                <a
                  href="mailto:indianflowersorder@gmail.com"
                  className="flex items-center gap-2 text-gray-700 hover:text-[#0B3B24] font-medium"
                >
                  <Mail className="w-4 h-4 text-[#0B3B24]" />
                  <span>indianflowersorder@gmail.com</span>
                </a>
              </div>
            </div>

            {/* Trust Assurance Pill */}
            <div className="bg-emerald-900 text-white rounded-2xl p-5 flex items-center gap-4 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <Truck className="w-5 h-5 text-emerald-200" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-semibold">Priority Event Delivery Across USA</h4>
                <p className="text-[11px] text-emerald-100 font-normal mt-0.5">
                  Overnight cold-chain dispatch to California, New York, Texas, New Jersey, and all 50 states.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Contact Form */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-3xl p-6 sm:p-9 border border-gray-200 shadow-sm relative">
              {submittedInquiry ? (
                <div className="py-8 text-center space-y-4 animate-fadeIn">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 text-[#0B3B24] border border-emerald-100 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold tracking-tight text-gray-900">
                    Custom Order Request Received!
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 max-w-md mx-auto font-normal leading-relaxed">
                    Thank you, <strong className="font-semibold text-gray-900">{submittedInquiry.customerName}</strong>! Your custom inquiry reference is{' '}
                    <strong className="text-[#0B3B24] font-bold font-mono">{submittedInquiry.inquiryId}</strong>.
                    Our ceremonial floral specialist will review your specifications and contact you within 4 hours.
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={() => setSubmittedInquiry(null)}
                      className="px-6 py-2.5 rounded-xl bg-[#0B3B24] hover:bg-[#134633] text-white text-xs font-semibold uppercase tracking-wider transition-colors"
                    >
                      Submit Another Request
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="border-b border-gray-100 pb-3">
                    <h3 className="text-xl sm:text-2xl text-[#134633] font-bold tracking-tight">
                      Request a Custom Floral Consultation
                    </h3>
                    <p className="text-xs text-gray-500 font-normal mt-0.5">
                      Fill out your celebration details below and our artisans will tailor a quote.
                    </p>
                  </div>

                  {errorMessage && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-normal">
                      {errorMessage}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-700 block mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Priya Sharma"
                        value={formData.customerName}
                        onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:border-[#0B3B24] font-normal"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-700 block mb-1">
                        Phone Number (WhatsApp Preferred) *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="+1 (510) 555-0199"
                        value={formData.customerPhone}
                        onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:border-[#0B3B24] font-normal"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-700 block mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="priya@example.com"
                        value={formData.customerEmail}
                        onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:border-[#0B3B24] font-normal"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-700 block mb-1">
                        Delivery City &amp; State (US) *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. San Jose, CA"
                        value={formData.cityState}
                        onChange={(e) => setFormData({ ...formData, cityState: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:border-[#0B3B24] font-normal"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-700 block mb-1">
                        Ceremony / Event Date *
                      </label>
                      <input
                        type="date"
                        required
                        min={new Date().toISOString().split('T')[0]}
                        value={formData.eventDate}
                        onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:border-[#0B3B24] font-normal bg-white"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-700 block mb-1">
                        Occasion Type *
                      </label>
                      <select
                        value={formData.occasion}
                        onChange={(e) => setFormData({ ...formData, occasion: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:border-[#0B3B24] font-normal bg-white"
                      >
                        <option value="Wedding & Jai Mala Garlands">Wedding & Jai Mala Garlands</option>
                        <option value="Temple Festival / Utsav">Temple Festival / Utsav</option>
                        <option value="Housewarming (Gruhapravesam)">Housewarming (Gruhapravesam)</option>
                        <option value="Baby Shower (Seemantham)">Baby Shower (Seemantham)</option>
                        <option value="Bulk Jasmine (Mallipoo) Strings">Bulk Jasmine (Mallipoo) Strings</option>
                        <option value="Mandap & Stage Floral Decor">Mandap & Stage Floral Decor</option>
                        <option value="Other Ceremonial Occasion">Other Ceremonial Occasion</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-700 block mb-1">
                      Estimated Budget Range (USD)
                    </label>
                    <select
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:border-[#0B3B24] font-normal bg-white"
                    >
                      <option value="Under $200">Under $200</option>
                      <option value="$200 - $500">$200 – $500</option>
                      <option value="$500 - $1,000">$500 – $1,000</option>
                      <option value="$1,000 - $2,500">$1,000 – $2,500</option>
                      <option value="$2,500+">$2,500+</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-700 block mb-1">
                      Floral Requirements &amp; Specifications *
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Please specify garland lengths (e.g. 2x 4ft rose petal Jai Malas), flower types (marigold, red rose petals, jasmine, lotus), color preferences, or any venue timing notes."
                      value={formData.requirements}
                      onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:border-[#0B3B24] font-normal leading-relaxed"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 rounded-xl bg-[#0B3B24] hover:bg-[#134633] text-white font-medium text-xs sm:text-sm uppercase tracking-wider transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isSubmitting ? 'Submitting Inquiry...' : 'Submit Custom Floral Request'}</span>
                  </button>

                  <p className="text-[11px] text-gray-400 text-center font-normal">
                    We will never share your contact details. All orders confirmed with custom invoice in USD.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
