'use client';

import React, { useState } from 'react';
import { getMinDeliveryDateString, MIN_DELIVERY_LEAD_DAYS } from '@/lib/dateUtils';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Truck,
  ShieldCheck,
  Send,
  CheckCircle2,
  AlertCircle,
  Building2,
  MessageSquare,
} from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'Wedding & Jai Mala Consultation',
    eventDate: '',
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedReference, setSubmittedReference] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim() || !formData.message.trim()) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSubmittedReference(data.data?.referenceId || 'RECEIVED');
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: 'Wedding & Jai Mala Consultation',
          eventDate: '',
          message: '',
        });
      } else {
        setErrorMessage(data.message || 'Failed to submit message. Please try again.');
      }
    } catch (err: any) {
      setErrorMessage('Network error while sending message. Please try again or call us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const minEventDate = getMinDeliveryDateString(MIN_DELIVERY_LEAD_DAYS);

  return (
    <div className="min-h-screen bg-[#FAF6F0] flex flex-col justify-between font-sans">
      <Header />

      <main className="flex-1">
        {/* Hero Header */}
        <section className="bg-[#0B3B24] text-white py-12 sm:py-16 border-b border-emerald-900/60">
          <div className="w-full max-w-7xl xl:max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.16em] text-[#8FE7B8]">
              We Are Here To Help
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
              Contact The Indian Flowers
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 max-w-2xl mx-auto leading-relaxed">
              Have questions about fresh wedding garlands, jasmine strands, temple deliveries, or bespoke arrangements? Our US floral coordinators are ready to assist you.
            </p>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-12 sm:py-16">
          <div className="w-full max-w-7xl xl:max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
              
              {/* Left Column: Direct Contact Info & Pickup Hubs */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Contact Card */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-xs space-y-6">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-[#0B3B24] tracking-tight">
                      Get In Touch
                    </h3>
                    <p className="text-xs text-stone-500 mt-1">
                      Reach our floral team directly by phone, WhatsApp, or email.
                    </p>
                  </div>

                  <div className="space-y-4 text-xs sm:text-sm text-stone-700">
                    <a
                      href="tel:+19093793678"
                      className="flex items-start gap-3.5 p-3 rounded-2xl hover:bg-[#F4F8F4] transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-full bg-emerald-50 text-[#0B3B24] flex items-center justify-center shrink-0 border border-emerald-100 group-hover:scale-105 transition-transform">
                        <Phone className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-stone-400 block uppercase tracking-wider">
                          Phone &amp; WhatsApp
                        </span>
                        <span className="text-sm font-bold text-stone-900 group-hover:text-[#0B3B24]">
                          +1 (909) 379-3678
                        </span>
                        <span className="text-[11px] text-stone-500 block">Mon – Sun: 7:00 AM – 8:00 PM PST</span>
                      </div>
                    </a>

                    <a
                      href="mailto:indianflowersorder@gmail.com"
                      className="flex items-start gap-3.5 p-3 rounded-2xl hover:bg-[#F4F8F4] transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-full bg-emerald-50 text-[#0B3B24] flex items-center justify-center shrink-0 border border-emerald-100 group-hover:scale-105 transition-transform">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-stone-400 block uppercase tracking-wider">
                          Email Support
                        </span>
                        <span className="text-sm font-bold text-stone-900 group-hover:text-[#0B3B24]">
                          indianflowersorder@gmail.com
                        </span>
                        <span className="text-[11px] text-stone-500 block">Typical response within 2 hours</span>
                      </div>
                    </a>

                    <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-[#F4F8F4]/60 border border-emerald-100/60">
                      <div className="w-10 h-10 rounded-full bg-emerald-50 text-[#0B3B24] flex items-center justify-center shrink-0 border border-emerald-100">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-emerald-800 block uppercase tracking-wider">
                          Headquarters (CA)
                        </span>
                        <span className="text-sm font-bold text-stone-900">
                          14922 Bobcat Lane, Fontana, CA 92336, USA
                        </span>
                        <span className="text-[11px] text-stone-500 block mt-0.5">Primary California cold-chain facility</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-[#F4F8F4]/60 border border-emerald-100/60">
                      <div className="w-10 h-10 rounded-full bg-emerald-50 text-[#0B3B24] flex items-center justify-center shrink-0 border border-emerald-100">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-emerald-800 block uppercase tracking-wider">
                          Midwest Facility (MN)
                        </span>
                        <span className="text-sm font-bold text-stone-900">
                          6893 Alverno ln, Inver Grove Heights, MN 55077
                        </span>
                        <span className="text-[11px] text-stone-500 block mt-0.5">Regional dispatch hub</span>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Trust Callout */}
                  <div className="pt-4 border-t border-stone-100 flex items-center gap-3 text-xs text-stone-600">
                    <Truck className="w-5 h-5 text-emerald-700 shrink-0" />
                    <span>Fast and secure delivery via <strong>FedEx</strong> and <strong>Southwest</strong> across all 50 states.</span>
                  </div>
                </div>

              </div>

              {/* Right Column: Interactive Contact & Enquiry Form */}
              <div className="lg:col-span-7">
                <div className="bg-white rounded-3xl p-6 sm:p-8 md:p-10 border border-stone-200/90 shadow-sm">
                  <div className="mb-6 space-y-1">
                    <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.14em] text-[#C85A78]">
                      Online Enquiry Form
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-bold text-[#0B3B24] tracking-tight">
                      Send Us a Message
                    </h2>
                    <p className="text-xs sm:text-sm text-stone-500">
                      Fill out the form below and our team will get back to you promptly with pricing, sample photos, and delivery schedules.
                    </p>
                  </div>

                  {submittedReference ? (
                    <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3 animate-fadeIn">
                      <div className="w-14 h-14 rounded-full bg-emerald-100 text-[#0B3B24] flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-8 h-8" />
                      </div>
                      <h3 className="text-xl font-bold text-emerald-950">Message Sent Successfully!</h3>
                      <p className="text-xs sm:text-sm text-emerald-800">
                        Thank you for reaching out. Your enquiry has been received under reference ID:{' '}
                        <strong className="text-[#0B3B24] font-bold">{submittedReference}</strong>.
                      </p>
                      <p className="text-xs text-emerald-700">
                        A confirmation email has been dispatched via MSG91 to your inbox.
                      </p>
                      <button
                        type="button"
                        onClick={() => setSubmittedReference(null)}
                        className="mt-3 px-5 py-2.5 rounded-xl bg-[#0B3B24] text-white text-xs font-semibold hover:bg-[#134633] transition-colors"
                      >
                        Send Another Message
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      {errorMessage && (
                        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>{errorMessage}</span>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-semibold text-stone-700 block mb-1">
                            Full Name *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Priya Sharma"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs sm:text-sm focus:outline-none focus:border-[#0B3B24] focus:ring-1 focus:ring-[#0B3B24]/20 bg-white"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-stone-700 block mb-1">
                            Phone Number *
                          </label>
                          <input
                            type="tel"
                            required
                            placeholder="+1 (510) 555-0199"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs sm:text-sm focus:outline-none focus:border-[#0B3B24] focus:ring-1 focus:ring-[#0B3B24]/20 bg-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-semibold text-stone-700 block mb-1">
                            Email Address *
                          </label>
                          <input
                            type="email"
                            required
                            placeholder="priya@example.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs sm:text-sm focus:outline-none focus:border-[#0B3B24] focus:ring-1 focus:ring-[#0B3B24]/20 bg-white"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-stone-700 block mb-1">
                            Target Event Date (Optional)
                          </label>
                          <input
                            type="date"
                            min={minEventDate}
                            value={formData.eventDate}
                            onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs sm:text-sm focus:outline-none focus:border-[#0B3B24] focus:ring-1 focus:ring-[#0B3B24]/20 bg-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-stone-700 block mb-1">
                          Inquiry Subject / Topic *
                        </label>
                        <select
                          value={formData.subject}
                          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs sm:text-sm focus:outline-none focus:border-[#0B3B24] bg-white font-normal"
                        >
                          <option value="Wedding & Jai Mala Consultation">Wedding &amp; Jai Mala Consultation</option>
                          <option value="Temple Festival / Puja Flowers">Temple Festival / Puja Flowers</option>
                          <option value="Bulk Jasmine Strings (Mallipoo)">Bulk Jasmine Strings (Mallipoo)</option>
                          <option value="Housewarming & Decor Garlands">Housewarming &amp; Decor Garlands</option>
                          <option value="Order Tracking & Shipping Status">Order Tracking &amp; Shipping Status</option>
                          <option value="General Question / Other">General Question / Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-stone-700 block mb-1">
                          Message / Floral Requirements *
                        </label>
                        <textarea
                          required
                          rows={4}
                          placeholder="Please describe your requirements, desired garland colors/lengths, venue location in the USA, or any questions."
                          value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs sm:text-sm focus:outline-none focus:border-[#0B3B24] leading-relaxed bg-white"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3.5 rounded-xl bg-[#0B3B24] hover:bg-[#134633] text-white text-xs sm:text-sm font-semibold uppercase tracking-wider transition-all shadow-md hover:shadow-lg disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Send className="w-4 h-4" />
                        <span>{isSubmitting ? 'Sending Message...' : 'Submit Contact Enquiry'}</span>
                      </button>

                      <p className="text-[11px] text-stone-400 text-center">
                        All information is kept strictly confidential. Automatic confirmation sent to your email.
                      </p>
                    </form>
                  )}
                </div>
              </div>

            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
