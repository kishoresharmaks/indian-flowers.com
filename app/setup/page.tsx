'use client';

import React, { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Check,
  CheckCircle2,
  Database,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Store,
  ShieldCheck,
  AlertCircle,
  Copy,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';

type StepKey = 'database' | 'license' | 'business' | 'done';

interface StepItem {
  id: StepKey;
  number: number;
  title: string;
  subtitle: string;
}

const STEPS: StepItem[] = [
  {
    id: 'database',
    number: 1,
    title: 'Database connection',
    subtitle: 'Connect your MongoDB database',
  },
  {
    id: 'license',
    number: 2,
    title: 'Software license',
    subtitle: 'Activate your commercial key',
  },
  {
    id: 'business',
    number: 3,
    title: 'Store and admin account',
    subtitle: 'Store profile, currency, and root login',
  },
  {
    id: 'done',
    number: 4,
    title: 'Ready to launch',
    subtitle: 'Installation completed and secured',
  },
];

const CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'US Dollar (USD)' },
];

const LOCALES = [
  { code: 'en-US', label: 'English (United States)' },
];

const TIMEZONES = [
  { code: 'Asia/Kolkata', label: 'Asia/Kolkata (IST • UTC+05:30)' },
  { code: 'Asia/Tokyo', label: 'Asia/Tokyo (JST • UTC+09:00)' },
  { code: 'Australia/Sydney', label: 'Australia/Sydney (AEST • UTC+10:00)' },
  { code: 'UTC', label: 'Coordinated Universal Time (UTC)' },
];

export default function SetupPage() {
  const [step, setStep] = useState<StepKey>('database');
  const [unlockedStepIndex, setUnlockedStepIndex] = useState<number>(0);
  const [isCompletedInstance, setIsCompletedInstance] = useState(false);

  const [uri, setUri] = useState('');
  const [databaseName, setDatabaseName] = useState('');
  const [showUriPassword, setShowUriPassword] = useState(false);

  const [licenseKey, setLicenseKey] = useState('');
  const [clientHost, setClientHost] = useState('');

  const [details, setDetails] = useState({
    siteName: '',
    businessName: '',
    tagline: '',
    domain: '',
    contactEmail: '',
    contactPhone: '',
    adminEmail: '',
    password: '',
    currency: 'USD',
    locale: 'en-US',
    timezone: 'Asia/Kolkata',
    logoDataUrl: '',
    faviconDataUrl: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  // Feedback states
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [environmentDownloaded, setEnvironmentDownloaded] = useState(false);

  const stepIndexMap: Record<StepKey, number> = {
    database: 0,
    license: 1,
    business: 2,
    done: 3,
  };
  const currentStepIndex = stepIndexMap[step];

  // Initial status check & prefill details
  useEffect(() => {
    let host = '';
    if (typeof window !== 'undefined') {
      host = window.location.host;
      setClientHost(host);
    }

    fetch('/api/install/status')
      .then((res) => res.json())
      .then((data) => {
        // Prefill Database fields
        if (data.database) {
          if (data.database.databaseName) setDatabaseName(data.database.databaseName);
        }

        // Prefill Business and Admin fields
        if (data.config) {
          setDetails({
            siteName: data.config.siteName || '',
            businessName: data.config.businessName || '',
            tagline: data.config.tagline || '',
            domain: data.config.domain || host || '',
            contactEmail: data.config.contactEmail || '',
            contactPhone: data.config.contactPhone || '',
            adminEmail: data.config.adminEmail || '',
            password: data.complete ? '••••••••••••••••' : '',
            currency: data.config.currency || 'USD',
            locale: data.config.locale || 'en-US',
            timezone: data.config.timezone || 'Asia/Kolkata',
            logoDataUrl: data.config.logoDataUrl || '',
            faviconDataUrl: data.config.faviconDataUrl || '',
          });
        } else if (host) {
          setDetails((prev) => ({ ...prev, domain: prev.domain || host }));
        }

        // Check completion state
        if (data.complete) {
          setIsCompletedInstance(true);
          setStep('done');
          setUnlockedStepIndex(3);
        } else if (data.state === 'LICENSE_ACTIVATED') {
          setStep('business');
          setUnlockedStepIndex(2);
        } else if (data.state === 'DATABASE_VERIFIED') {
          setStep('license');
          setUnlockedStepIndex(1);
        }
      })
      .catch(() => undefined);
  }, []);

  // Update unlocked step when advancing
  useEffect(() => {
    if (currentStepIndex > unlockedStepIndex) {
      setUnlockedStepIndex(currentStepIndex);
    }
  }, [currentStepIndex, unlockedStepIndex]);

  // Suggest database name from URI if entered
  const handleUriChange = (value: string) => {
    if (isCompletedInstance) return;
    setUri(value);
    try {
      if (value.includes('/') && !databaseName) {
        const withoutQuery = value.split('?')[0];
        const parts = withoutQuery.split('/');
        const lastPart = parts[parts.length - 1];
        if (lastPart && !lastPart.includes('@') && !lastPart.includes(':')) {
          setDatabaseName(decodeURIComponent(lastPart));
        }
      }
    } catch {
      // quiet parse fallback
    }
  };

  const handleCopy = (text: string, fieldId: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const handlePaste = async (onValue: (text: string) => void) => {
    if (isCompletedInstance) return;
    try {
      if (navigator?.clipboard) {
        const text = await navigator.clipboard.readText();
        if (text) onValue(text.trim());
      }
    } catch {
      // clipboard permission fallback
    }
  };

  const readBrandImage = (file: File | undefined, field: 'logoDataUrl' | 'faviconDataUrl') => {
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 500 * 1024) {
      setError('Use a PNG, JPEG, or WebP image smaller than 500 KB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setDetails((current) => ({ ...current, [field]: String(reader.result || '') }));
    reader.readAsDataURL(file);
  };

  const downloadEnvironment = (content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = '.env'; link.click();
    URL.revokeObjectURL(url);
  };

  const makePostRequest = async (path: string, body: unknown) => {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Request failed.');
    }
    return data;
  };

  const submitDatabase = async (e: FormEvent) => {
    e.preventDefault();
    if (isCompletedInstance) {
      setStep('license');
      return;
    }
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const data = await makePostRequest('/api/install/database', { uri, databaseName });
      setMessage(data.message || 'Database verified.');
      setStep('license');
    } catch (err: any) {
      setError(err.message || 'Could not connect to MongoDB. Check credentials and access.');
    } finally {
      setBusy(false);
    }
  };

  const submitLicense = async (e: FormEvent) => {
    e.preventDefault();
    if (isCompletedInstance) {
      setStep('business');
      return;
    }
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const data = await makePostRequest('/api/license/activate', { licenseKey });
      setMessage(data.message || 'License activated successfully.');
      setStep('business');
    } catch (err: any) {
      setError(err.message || 'License key validation failed.');
    } finally {
      setBusy(false);
    }
  };

  const submitBusiness = async (e: FormEvent) => {
    e.preventDefault();
    if (isCompletedInstance) {
      setStep('done');
      return;
    }
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const data = await makePostRequest('/api/install/complete', details);
      if (data.environment) { downloadEnvironment(data.environment); setEnvironmentDownloaded(true); }
      setMessage(data.message || 'Setup completed.');
      setIsCompletedInstance(true);
      setStep('done');
    } catch (err: any) {
      setError(err.message || 'Could not finalize configuration.');
    } finally {
      setBusy(false);
    }
  };

  // Human password quality checks (12+ characters required by API)
  const isLengthValid = details.password.length >= 12;
  const hasNumbers = /[0-9]/.test(details.password);
  const hasMixedCase = /[a-z]/.test(details.password) && /[A-Z]/.test(details.password);

  return (
    <div className="min-h-screen bg-[#FFFCFB] text-[#163B5C] font-sans antialiased flex flex-col justify-between selection:bg-[#ED3500]/15 selection:text-[#163B5C]">

      {/* Editorial Top Navigation */}
      <header className="border-b border-[#E8EDF2] bg-white/90 backdrop-blur-md sticky top-0 z-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-[#163B5C] flex items-center justify-center text-white font-bold text-sm shadow-sm">
              N
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#163B5C] text-sm tracking-tight">Nexus Ecom CMS</span>
                <span className="text-[11px] font-medium text-[#64748B] bg-[#F1F5F9] px-2 py-0.5 rounded-md">
                  {isCompletedInstance ? 'Configuration (Active)' : 'Installation'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="hidden sm:inline text-[#64748B]">
              Instance: <span className="font-mono text-[#163B5C] font-medium">{clientHost || 'localhost'}</span>
            </span>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#163B5C] hover:text-[#ED3500] transition-colors"
            >
              <span>Storefront</span>
              <ExternalLink className="h-3.5 w-3.5 text-[#64748B]" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Guided Experience */}
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

          {/* ========================================================= */}
          {/* LEFT RAIL: The Guided Journey & Information Spine         */}
          {/* ========================================================= */}
          <aside className="lg:col-span-4 space-y-6">

            {/* Header intro */}
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#163B5C]">
                {isCompletedInstance ? 'Store configuration' : 'Initial store setup'}
              </h1>
              <p className="mt-1.5 text-xs text-[#64748B] leading-relaxed">
                {isCompletedInstance
                  ? 'Your store is active and verified. View your configured database, software license, and business profile below.'
                  : 'Connect your database, activate your commercial software license, and establish root administrative credentials.'}
              </p>
            </div>

            {/* Stepped Timeline */}
            <nav aria-label="Installation Progress" className="space-y-1.5 pt-2">
              {STEPS.map((s, idx) => {
                const isActive = step === s.id;
                const isPassed = idx < currentStepIndex || (isCompletedInstance && s.id !== step);
                const isAccessible = idx <= unlockedStepIndex || isCompletedInstance;

                return (
                  <button
                    key={s.id}
                    type="button"
                    disabled={!isAccessible}
                    onClick={() => {
                      if (isAccessible) {
                        setStep(s.id);
                        setError('');
                        setMessage('');
                      }
                    }}
                    className={`w-full text-left p-3.5 rounded-xl transition-all flex items-start gap-3.5 border ${
                      isActive
                        ? 'bg-white border-[#163B5C] shadow-sm ring-1 ring-[#163B5C]/10'
                        : isPassed
                        ? 'bg-transparent border-transparent hover:bg-white hover:border-[#E8EDF2]'
                        : 'bg-transparent border-transparent opacity-50 cursor-not-allowed'
                    }`}
                  >
                    {/* Step indicator circle */}
                    <div
                      className={`h-7 w-7 rounded-lg flex items-center justify-center text-xs font-semibold shrink-0 transition-colors ${
                        isActive
                          ? 'bg-[#163B5C] text-white'
                          : isPassed
                          ? 'bg-[#E8EDF2] text-[#163B5C]'
                          : 'bg-[#F1F5F9] text-[#94A3B8]'
                      }`}
                    >
                      {isPassed ? <Check className="h-4 w-4 stroke-[2.5]" /> : s.number}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-[#163B5C] leading-snug flex items-center justify-between">
                        <span>{s.title}</span>
                        {isCompletedInstance && (
                          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-normal">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#64748B] leading-tight mt-0.5 truncate">
                        {s.subtitle}
                      </div>
                    </div>
                  </button>
                );
              })}
            </nav>

            {/* Contextual Guidance Card */}
            <div className="rounded-2xl border border-[#E8EDF2] bg-white p-5 space-y-3 shadow-xs">
              <div className="text-xs font-bold text-[#163B5C] flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#ED3500]" />
                <span>Security and protection</span>
              </div>
              <p className="text-xs text-[#64748B] leading-relaxed">
                {isCompletedInstance
                  ? 'All parameters are locked in read-only mode to safeguard the production store against tampering or accidental re-initialization.'
                  : 'Database connection strings and administrator passwords are verified strictly in your local Node.js environment and never exposed to browser APIs.'}
              </p>
              <div className="pt-2 border-t border-[#E8EDF2] text-[11px] text-[#64748B] flex items-center justify-between">
                <span>Self-hosted instance</span>
                <span className="font-semibold text-[#163B5C]">
                  {isCompletedInstance ? 'Status: Active' : 'v2.4 Production'}
                </span>
              </div>
            </div>

            {/* Quick Action when already completed */}
            {isCompletedInstance && step !== 'done' && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-[#163B5C] space-y-2">
                <div className="font-bold flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-[#ED3500]" />
                  <span>Read-only inspection</span>
                </div>
                <p className="text-[11px] text-[#64748B] leading-relaxed">
                  You are reviewing saved configuration values. You can navigate through steps or return to the launchpad.
                </p>
                <button
                  type="button"
                  onClick={() => setStep('done')}
                  className="font-bold text-[#163B5C] hover:text-[#ED3500] underline text-[11px] pt-1 block"
                >
                  Return to launch certificate
                </button>
              </div>
            )}
          </aside>

          {/* ========================================================= */}
          {/* RIGHT WORKSTATION: Active Form Panel                      */}
          {/* ========================================================= */}
          <section className="lg:col-span-8">
            <div className="bg-white rounded-3xl border border-[#E8EDF2] p-6 sm:p-10 shadow-sm relative">

              {/* Top Accent Line */}
              <div className="absolute top-0 left-8 right-8 h-[2px] bg-[#ED3500]" />

              {/* Read-Only Mode Banner */}
              {isCompletedInstance && (
                <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/60 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 text-xs text-amber-950">
                    <Lock className="h-4 w-4 text-[#ED3500] shrink-0" />
                    <div>
                      <span className="font-bold">Store is active:</span> Fields are filled with active configuration in read-only mode.
                    </div>
                  </div>
                  {step !== 'done' && (
                    <button
                      type="button"
                      onClick={() => setStep('done')}
                      className="text-xs font-bold text-amber-900 hover:text-black underline shrink-0"
                    >
                      Return to launch overview
                    </button>
                  )}
                </div>
              )}

              {/* Server Notifications */}
              {message && (
                <div className="mb-6 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-xs sm:text-sm text-emerald-800 flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>{message}</div>
                </div>
              )}

              {error && (
                <div className="mb-6 rounded-xl bg-rose-50 border border-rose-200 p-4 text-xs sm:text-sm text-rose-800 flex items-start gap-3">
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold">Setup notice</div>
                    <div className="mt-0.5 leading-relaxed">{error}</div>
                  </div>

                  {environmentDownloaded && <p className="mx-auto max-w-md rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">Your one-time <code className="font-mono">.env</code> download has started. Replace the deployment’s existing <code className="font-mono">.env</code> file with it, keep it private, then restart the application.</p>}
                </div>
              )}

              {/* ===================================================== */}
              {/* STEP 1: Connect Database                              */}
              {/* ===================================================== */}
              {step === 'database' && (
                <form onSubmit={submitDatabase} className="space-y-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-[#163B5C] tracking-tight">
                        MongoDB database connection
                      </h2>
                      <p className="mt-1 text-xs sm:text-sm text-[#64748B] leading-relaxed">
                        {isCompletedInstance
                          ? 'The primary MongoDB database connected to this store instance.'
                          : 'Nexus stores products, categories, orders, customers, and administrative configurations in MongoDB.'}
                      </p>
                    </div>
                    {isCompletedInstance && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md shrink-0">
                        <Check className="h-3.5 w-3.5" />
                        <span>Connected</span>
                      </span>
                    )}
                  </div>

                  {/* Preset Quick Starters (Only shown when not completed) */}
                  {!isCompletedInstance && (
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-[#163B5C] block">
                        Common connection templates
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setUri('mongodb+srv://admin:password@cluster0.example.mongodb.net/nexus_store?retryWrites=true&w=majority');
                            setDatabaseName('nexus_store');
                          }}
                          className="text-left p-3 rounded-xl border border-[#E8EDF2] hover:border-[#163B5C] hover:bg-[#F8FAFC] transition-colors"
                        >
                          <div className="text-xs font-bold text-[#163B5C]">MongoDB Atlas</div>
                          <div className="text-[11px] text-[#64748B] truncate font-mono mt-0.5">mongodb+srv://...</div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setUri('mongodb://127.0.0.1:27017/nexus_store');
                            setDatabaseName('nexus_store');
                          }}
                          className="text-left p-3 rounded-xl border border-[#E8EDF2] hover:border-[#163B5C] hover:bg-[#F8FAFC] transition-colors"
                        >
                          <div className="text-xs font-bold text-[#163B5C]">Local MongoDB</div>
                          <div className="text-[11px] text-[#64748B] truncate font-mono mt-0.5">localhost:27017</div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setUri('mongodb://mongo1:27017,mongo2:27017/nexus_store?replicaSet=rs0');
                            setDatabaseName('nexus_store');
                          }}
                          className="text-left p-3 rounded-xl border border-[#E8EDF2] hover:border-[#163B5C] hover:bg-[#F8FAFC] transition-colors"
                        >
                          <div className="text-xs font-bold text-[#163B5C]">Docker or replica</div>
                          <div className="text-[11px] text-[#64748B] truncate font-mono mt-0.5">replicaSet=rs0</div>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Form fields */}
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label htmlFor="mongo-uri" className="text-xs font-bold text-[#163B5C]">
                          Connection string URI {!isCompletedInstance && <span className="text-[#ED3500]">*</span>}
                        </label>
                        {!isCompletedInstance && (
                          <button
                            type="button"
                            onClick={() => handlePaste(handleUriChange)}
                            className="text-[11px] font-medium text-[#64748B] hover:text-[#163B5C] flex items-center gap-1"
                          >
                            <Copy className="h-3 w-3" />
                            <span>Paste</span>
                          </button>
                        )}
                        {isCompletedInstance && (
                          <button
                            type="button"
                            onClick={() => handleCopy(uri, 'uri')}
                            className="text-[11px] font-medium text-[#64748B] hover:text-[#163B5C] flex items-center gap-1"
                          >
                            <Copy className="h-3 w-3" />
                            <span>{copiedField === 'uri' ? 'Copied' : 'Copy URI'}</span>
                          </button>
                        )}
                      </div>

                      <div className="relative">
                        <input
                          id="mongo-uri"
                          required
                          readOnly={isCompletedInstance}
                          type={showUriPassword ? 'text' : 'password'}
                          value={uri}
                          onChange={(e) => handleUriChange(e.target.value)}
                          placeholder="mongodb+srv://username:password@cluster.mongodb.net/nexus_store"
                          className={`w-full rounded-xl border px-3.5 py-3 pr-12 font-mono text-xs sm:text-sm outline-none transition ${
                            isCompletedInstance
                              ? 'bg-[#F8FAFC] border-[#E8EDF2] text-[#163B5C] cursor-default'
                              : 'bg-white border-[#E8EDF2] text-[#163B5C] placeholder-[#94A3B8] focus:border-[#163B5C] focus:ring-1 focus:ring-[#163B5C]'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowUriPassword(!showUriPassword)}
                          className="absolute inset-y-0 right-0 px-3 text-[#64748B] hover:text-[#163B5C]"
                          aria-label={showUriPassword ? 'Hide URI' : 'Show URI'}
                        >
                          {showUriPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <p className="mt-1.5 text-[11px] text-[#64748B]">
                        {isCompletedInstance
                          ? 'This URI is persisted in your deployment environment and secured.'
                          : 'Provide a database user with read and write permissions to the specified database.'}
                      </p>
                    </div>

                    <div>
                      <label htmlFor="db-name" className="text-xs font-bold text-[#163B5C] block mb-1.5">
                        Database name {!isCompletedInstance && <span className="text-[#ED3500]">*</span>}
                      </label>
                      <input
                        id="db-name"
                        required
                        readOnly={isCompletedInstance}
                        type="text"
                        value={databaseName}
                        onChange={(e) => setDatabaseName(e.target.value)}
                        placeholder="nexus_store"
                        className={`w-full rounded-xl border px-3.5 py-3 font-mono text-xs sm:text-sm outline-none transition ${
                          isCompletedInstance
                            ? 'bg-[#F8FAFC] border-[#E8EDF2] text-[#163B5C] cursor-default'
                            : 'bg-white border-[#E8EDF2] text-[#163B5C] placeholder-[#94A3B8] focus:border-[#163B5C] focus:ring-1 focus:ring-[#163B5C]'
                        }`}
                      />
                      <p className="mt-1.5 text-[11px] text-[#64748B]">
                        {isCompletedInstance
                          ? 'Active database currently hosting store collections.'
                          : 'Must match the target database in your MongoDB connection path.'}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2">
                    {isCompletedInstance ? (
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="inline-flex items-center gap-2 rounded-xl bg-slate-100 border border-slate-200 px-4 py-3 text-xs font-semibold text-slate-700">
                          <Lock className="h-3.5 w-3.5 text-slate-500" />
                          <span>Database locked (Read-only)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setStep('license')}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-[#E8EDF2] hover:bg-slate-50 px-4 py-3 text-xs font-semibold text-[#163B5C] transition"
                        >
                          <span>Next: Software license</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="submit"
                        disabled={busy}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#ED3500] hover:bg-[#D02E00] px-6 py-3.5 font-bold text-xs sm:text-sm uppercase tracking-wider text-white transition disabled:opacity-60 shadow-sm"
                      >
                        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                        <span>Test connection and proceed</span>
                      </button>
                    )}
                  </div>
                </form>
              )}

              {/* ===================================================== */}
              {/* STEP 2: Software License Activation                   */}
              {/* ===================================================== */}
              {step === 'license' && (
                <form onSubmit={submitLicense} className="space-y-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-[#163B5C] tracking-tight">
                        Commercial software license
                      </h2>
                      <p className="mt-1 text-xs sm:text-sm text-[#64748B] leading-relaxed">
                        {isCompletedInstance
                          ? 'Commercial license registered and tokenized for this instance.'
                          : 'Every independent deployment of Nexus Ecom CMS is authenticated by your designated licensing authority.'}
                      </p>
                    </div>
                    {isCompletedInstance && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md shrink-0">
                        <Check className="h-3.5 w-3.5" />
                        <span>Active</span>
                      </span>
                    )}
                  </div>

                  {/* Host Binding Info */}
                  <div className="rounded-xl border border-[#E8EDF2] bg-[#F8FAFC] p-4 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[#64748B] block">Licensed host domain:</span>
                      <span className="font-mono font-bold text-[#163B5C] text-sm">{clientHost || 'localhost'}</span>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-md">
                      Verified
                    </span>
                  </div>

                  {/* License Key Input */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label htmlFor="license-key" className="text-xs font-bold text-[#163B5C]">
                        Commercial license key {!isCompletedInstance && <span className="text-[#ED3500]">*</span>}
                      </label>
                      {!isCompletedInstance ? (
                        <button
                          type="button"
                          onClick={() => handlePaste((val) => setLicenseKey(val.toUpperCase()))}
                          className="text-[11px] font-medium text-[#64748B] hover:text-[#163B5C] flex items-center gap-1"
                        >
                          <Copy className="h-3 w-3" />
                          <span>Paste</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleCopy(licenseKey, 'licenseKey')}
                          className="text-[11px] font-medium text-[#64748B] hover:text-[#163B5C] flex items-center gap-1"
                        >
                          <Copy className="h-3 w-3" />
                          <span>{copiedField === 'licenseKey' ? 'Copied' : 'Copy key'}</span>
                        </button>
                      )}
                    </div>

                    <input
                      id="license-key"
                      required
                      readOnly={isCompletedInstance}
                      value={licenseKey}
                      onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                      placeholder="NEXUS-XXXX-XXXX-XXXX"
                      className={`w-full rounded-xl border px-4 py-3.5 font-mono text-sm sm:text-base font-bold uppercase outline-none transition ${
                        isCompletedInstance
                          ? 'bg-[#F8FAFC] border-[#E8EDF2] text-[#163B5C] cursor-default'
                          : 'bg-white border-[#E8EDF2] text-[#163B5C] placeholder-[#94A3B8] focus:border-[#163B5C] focus:ring-1 focus:ring-[#163B5C]'
                      }`}
                    />
                    <p className="text-[11px] text-[#64748B]">
                      {isCompletedInstance
                        ? 'Key authenticated and cryptographically bound to this domain.'
                        : 'Enter the key provided with your client license agreement.'}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="pt-2">
                    {isCompletedInstance ? (
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setStep('database')}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-[#E8EDF2] hover:bg-slate-50 px-4 py-3 text-xs font-semibold text-[#163B5C] transition"
                        >
                          <ChevronLeft className="h-3.5 w-3.5" />
                          <span>Previous: Database</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setStep('business')}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-[#E8EDF2] hover:bg-slate-50 px-4 py-3 text-xs font-semibold text-[#163B5C] transition"
                        >
                          <span>Next: Store profile</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="submit"
                        disabled={busy}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#ED3500] hover:bg-[#D02E00] px-6 py-3.5 font-bold text-xs sm:text-sm uppercase tracking-wider text-white transition disabled:opacity-60 shadow-sm"
                      >
                        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                        <span>Activate license</span>
                      </button>
                    )}
                  </div>
                </form>
              )}

              {/* ===================================================== */}
              {/* STEP 3: Store Profile & Administrator Account         */}
              {/* ===================================================== */}
              {step === 'business' && (
                <form onSubmit={submitBusiness} className="space-y-8">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-[#163B5C] tracking-tight">
                        Store profile and administrator
                      </h2>
                      <p className="mt-1 text-xs sm:text-sm text-[#64748B] leading-relaxed">
                        {isCompletedInstance
                          ? 'Saved public storefront identity and root administrator details.'
                          : 'Configure your storefront identity, regional commerce standards, and the root administrator login.'}
                      </p>
                    </div>
                    {isCompletedInstance && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md shrink-0">
                        <Check className="h-3.5 w-3.5" />
                        <span>Configured</span>
                      </span>
                    )}
                  </div>

                  {/* Section 1: Storefront Identity */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B] pb-1 border-b border-[#E8EDF2]">
                      Store identity
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="site-name" className="text-xs font-bold text-[#163B5C] block mb-1.5">
                          Website name {!isCompletedInstance && <span className="text-[#ED3500]">*</span>}
                        </label>
                        <input
                          id="site-name"
                          required
                          readOnly={isCompletedInstance}
                          value={details.siteName}
                          onChange={(e) => setDetails({ ...details, siteName: e.target.value })}
                          placeholder="e.g. Nexus Apparel"
                          className={`w-full rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm outline-none transition ${
                            isCompletedInstance
                              ? 'bg-[#F8FAFC] border-[#E8EDF2] text-[#163B5C] cursor-default'
                              : 'bg-white border-[#E8EDF2] text-[#163B5C] placeholder-[#94A3B8] focus:border-[#163B5C] focus:ring-1 focus:ring-[#163B5C]'
                          }`}
                        />
                      </div>

                      <div>
                        <label htmlFor="business-name" className="text-xs font-bold text-[#163B5C] block mb-1.5">
                          Business entity name {!isCompletedInstance && <span className="text-[#ED3500]">*</span>}
                        </label>
                        <input
                          id="business-name"
                          required
                          readOnly={isCompletedInstance}
                          value={details.businessName}
                          onChange={(e) => setDetails({ ...details, businessName: e.target.value })}
                          placeholder="e.g. Nexus Retail Pvt Ltd"
                          className={`w-full rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm outline-none transition ${
                            isCompletedInstance
                              ? 'bg-[#F8FAFC] border-[#E8EDF2] text-[#163B5C] cursor-default'
                              : 'bg-white border-[#E8EDF2] text-[#163B5C] placeholder-[#94A3B8] focus:border-[#163B5C] focus:ring-1 focus:ring-[#163B5C]'
                          }`}
                        />
                      </div>

                      <div>
                        <label htmlFor="tagline" className="text-xs font-bold text-[#163B5C] block mb-1.5">
                          Store tagline
                        </label>
                        <input
                          id="tagline"
                          readOnly={isCompletedInstance}
                          value={details.tagline}
                          onChange={(e) => setDetails({ ...details, tagline: e.target.value })}
                          placeholder="e.g. Curated clothing and lifestyle"
                          className={`w-full rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm outline-none transition ${
                            isCompletedInstance
                              ? 'bg-[#F8FAFC] border-[#E8EDF2] text-[#163B5C] cursor-default'
                              : 'bg-white border-[#E8EDF2] text-[#163B5C] placeholder-[#94A3B8] focus:border-[#163B5C] focus:ring-1 focus:ring-[#163B5C]'
                          }`}
                        />
                      </div>

                      <div>
                        <label htmlFor="domain" className="text-xs font-bold text-[#163B5C] block mb-1.5">
                          Canonical domain
                        </label>
                        <input
                          id="domain"
                          readOnly={isCompletedInstance}
                          value={details.domain}
                          onChange={(e) => setDetails({ ...details, domain: e.target.value })}
                          placeholder={clientHost || 'store.example.com'}
                          className={`w-full rounded-xl border px-3.5 py-2.5 font-mono text-xs sm:text-sm outline-none transition ${
                            isCompletedInstance
                              ? 'bg-[#F8FAFC] border-[#E8EDF2] text-[#163B5C] cursor-default'
                              : 'bg-white border-[#E8EDF2] text-[#163B5C] placeholder-[#94A3B8] focus:border-[#163B5C] focus:ring-1 focus:ring-[#163B5C]'
                          }`}
                        />
                      </div>

                      <div>
                        <label htmlFor="contact-email" className="text-xs font-bold text-[#163B5C] block mb-1.5">
                          Contact email
                        </label>
                        <input
                          id="contact-email"
                          type="email"
                          readOnly={isCompletedInstance}
                          value={details.contactEmail}
                          onChange={(e) => setDetails({ ...details, contactEmail: e.target.value })}
                          placeholder="support@example.com"
                          className={`w-full rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm outline-none transition ${
                            isCompletedInstance
                              ? 'bg-[#F8FAFC] border-[#E8EDF2] text-[#163B5C] cursor-default'
                              : 'bg-white border-[#E8EDF2] text-[#163B5C] placeholder-[#94A3B8] focus:border-[#163B5C] focus:ring-1 focus:ring-[#163B5C]'
                          }`}
                        />
                      </div>

                      <div>
                        <label htmlFor="contact-phone" className="text-xs font-bold text-[#163B5C] block mb-1.5">
                          Contact phone
                        </label>
                        <input
                          id="contact-phone"
                          type="tel"
                          readOnly={isCompletedInstance}
                          value={details.contactPhone}
                          onChange={(e) => setDetails({ ...details, contactPhone: e.target.value })}
                          placeholder="+91 98765 43210"
                          className={`w-full rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm outline-none transition ${
                            isCompletedInstance
                              ? 'bg-[#F8FAFC] border-[#E8EDF2] text-[#163B5C] cursor-default'
                              : 'bg-white border-[#E8EDF2] text-[#163B5C] placeholder-[#94A3B8] focus:border-[#163B5C] focus:ring-1 focus:ring-[#163B5C]'
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {([
                      ['logoDataUrl', 'Store logo', 'Primary logo used in the storefront header.'],
                      ['faviconDataUrl', 'Browser icon', 'Square icon used for browser tabs and shortcuts.'],
                    ] as const).map(([field, label, helper]) => (
                      <div key={field} className="rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-4">
                        <div className="flex items-center gap-3">
                          {details[field] ? <img src={details[field]} alt="Brand preview" className="h-10 w-10 rounded-lg object-contain bg-white border border-[#E8EDF2]" /> : <div className="h-10 w-10 rounded-lg bg-white border border-[#E8EDF2] grid place-items-center font-bold text-[#64748B]">N</div>}
                          <div className="min-w-0"><p className="text-xs font-bold text-[#163B5C]">{label}</p><p className="mt-0.5 text-[11px] text-[#64748B]">{helper}</p></div>
                        </div>
                        {!isCompletedInstance && <label className="mt-3 inline-flex cursor-pointer items-center rounded-lg bg-white border border-[#CBD5E1] px-3 py-2 text-xs font-semibold text-[#163B5C] hover:border-[#163B5C]">Choose image<input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => readBrandImage(event.target.files?.[0], field)} /></label>}
                      </div>
                    ))}
                  </div>

                  {/* Section 2: Regional Defaults */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B] pb-1 border-b border-[#E8EDF2]">
                      Regional format
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label htmlFor="currency" className="text-xs font-bold text-[#163B5C] block mb-1.5">
                          Currency {!isCompletedInstance && <span className="text-[#ED3500]">*</span>}
                        </label>
                        <select
                          id="currency"
                          required
                          disabled={isCompletedInstance}
                          value={details.currency}
                          onChange={(e) => setDetails({ ...details, currency: e.target.value })}
                          className={`w-full rounded-xl border px-3 py-2.5 text-xs sm:text-sm outline-none transition ${
                            isCompletedInstance
                              ? 'bg-[#F8FAFC] border-[#E8EDF2] text-[#163B5C] cursor-default opacity-100'
                              : 'bg-white border-[#E8EDF2] text-[#163B5C] focus:border-[#163B5C] focus:ring-1 focus:ring-[#163B5C]'
                          }`}
                        >
                          {CURRENCIES.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.symbol} {c.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="locale" className="text-xs font-bold text-[#163B5C] block mb-1.5">
                          Locale {!isCompletedInstance && <span className="text-[#ED3500]">*</span>}
                        </label>
                        <select
                          id="locale"
                          required
                          disabled={isCompletedInstance}
                          value={details.locale}
                          onChange={(e) => setDetails({ ...details, locale: e.target.value })}
                          className={`w-full rounded-xl border px-3 py-2.5 text-xs sm:text-sm outline-none transition ${
                            isCompletedInstance
                              ? 'bg-[#F8FAFC] border-[#E8EDF2] text-[#163B5C] cursor-default opacity-100'
                              : 'bg-white border-[#E8EDF2] text-[#163B5C] focus:border-[#163B5C] focus:ring-1 focus:ring-[#163B5C]'
                          }`}
                        >
                          {LOCALES.map((l) => (
                            <option key={l.code} value={l.code}>
                              {l.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="timezone" className="text-xs font-bold text-[#163B5C] block mb-1.5">
                          Time zone {!isCompletedInstance && <span className="text-[#ED3500]">*</span>}
                        </label>
                        <select
                          id="timezone"
                          required
                          disabled={isCompletedInstance}
                          value={details.timezone}
                          onChange={(e) => setDetails({ ...details, timezone: e.target.value })}
                          className={`w-full rounded-xl border px-3 py-2.5 text-xs sm:text-sm outline-none transition ${
                            isCompletedInstance
                              ? 'bg-[#F8FAFC] border-[#E8EDF2] text-[#163B5C] cursor-default opacity-100'
                              : 'bg-white border-[#E8EDF2] text-[#163B5C] focus:border-[#163B5C] focus:ring-1 focus:ring-[#163B5C]'
                          }`}
                        >
                          {TIMEZONES.map((t) => (
                            <option key={t.code} value={t.code}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Root Administrator Account */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B] pb-1 border-b border-[#E8EDF2]">
                      Administrator login
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="admin-email" className="text-xs font-bold text-[#163B5C] block mb-1.5">
                          Administrator email {!isCompletedInstance && <span className="text-[#ED3500]">*</span>}
                        </label>
                        <input
                          id="admin-email"
                          required
                          type="email"
                          readOnly={isCompletedInstance}
                          value={details.adminEmail}
                          onChange={(e) => setDetails({ ...details, adminEmail: e.target.value })}
                          placeholder="admin@example.com"
                          className={`w-full rounded-xl border px-3.5 py-2.5 font-mono text-xs sm:text-sm outline-none transition ${
                            isCompletedInstance
                              ? 'bg-[#F8FAFC] border-[#E8EDF2] text-[#163B5C] cursor-default'
                              : 'bg-white border-[#E8EDF2] text-[#163B5C] placeholder-[#94A3B8] focus:border-[#163B5C] focus:ring-1 focus:ring-[#163B5C]'
                          }`}
                        />
                        <p className="mt-1 text-[11px] text-[#64748B]">
                          {isCompletedInstance
                            ? 'Root account registered with full access permissions.'
                            : 'You will use this address to log in to the management dashboard.'}
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label htmlFor="admin-password" className="text-xs font-bold text-[#163B5C]">
                            Administrator password {!isCompletedInstance && <span className="text-[#ED3500]">*</span>}
                          </label>
                          {!isCompletedInstance && (
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                              details.password.length === 0
                                ? 'bg-slate-100 text-slate-600'
                                : isLengthValid
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}>
                              {details.password.length === 0
                                ? 'Minimum 12 characters'
                                : isLengthValid
                                ? 'Length requirement met'
                                : `${12 - details.password.length} more characters needed`}
                            </span>
                          )}
                          {isCompletedInstance && (
                            <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                              Encrypted (bcrypt)
                            </span>
                          )}
                        </div>

                        <div className="relative">
                          <input
                            id="admin-password"
                            required
                            readOnly={isCompletedInstance}
                            type={isCompletedInstance ? 'password' : showPassword ? 'text' : 'password'}
                            value={details.password}
                            onChange={(e) => setDetails({ ...details, password: e.target.value })}
                            placeholder="At least 12 characters"
                            className={`w-full rounded-xl border px-3.5 py-2.5 pr-10 text-xs sm:text-sm outline-none transition ${
                              isCompletedInstance
                                ? 'bg-[#F8FAFC] border-[#E8EDF2] text-[#163B5C] cursor-default font-mono'
                                : 'bg-white border-[#E8EDF2] text-[#163B5C] placeholder-[#94A3B8] focus:border-[#163B5C] focus:ring-1 focus:ring-[#163B5C]'
                            }`}
                          />
                          {!isCompletedInstance && (
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute inset-y-0 right-0 px-3 text-[#64748B] hover:text-[#163B5C]"
                              aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          )}
                        </div>

                        {/* Password guidance checklist */}
                        {!isCompletedInstance && (
                          <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-[#64748B]">
                            <span className={`inline-flex items-center gap-1 ${isLengthValid ? 'text-emerald-700 font-medium' : ''}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${isLengthValid ? 'bg-emerald-600' : 'bg-slate-300'}`} />
                              12+ characters
                            </span>
                            <span className={`inline-flex items-center gap-1 ${hasMixedCase ? 'text-emerald-700 font-medium' : ''}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${hasMixedCase ? 'bg-emerald-600' : 'bg-slate-300'}`} />
                              Upper and lower case
                            </span>
                            <span className={`inline-flex items-center gap-1 ${hasNumbers ? 'text-emerald-700 font-medium' : ''}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${hasNumbers ? 'bg-emerald-600' : 'bg-slate-300'}`} />
                              Numbers
                            </span>
                          </div>
                        )}
                        {isCompletedInstance && (
                          <p className="mt-1 text-[11px] text-[#64748B]">
                            Password is encrypted and stored securely in the database.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2">
                    {isCompletedInstance ? (
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setStep('license')}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-[#E8EDF2] hover:bg-slate-50 px-4 py-3 text-xs font-semibold text-[#163B5C] transition"
                        >
                          <ChevronLeft className="h-3.5 w-3.5" />
                          <span>Previous: Software license</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setStep('done')}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-[#163B5C] text-white hover:bg-[#0F2438] px-5 py-3 text-xs font-semibold transition"
                        >
                          <span>Return to launch certificate</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="submit"
                        disabled={busy}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#ED3500] hover:bg-[#D02E00] px-6 py-3.5 font-bold text-xs sm:text-sm uppercase tracking-wider text-white transition disabled:opacity-60 shadow-sm"
                      >
                        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                        <span>Complete installation</span>
                      </button>
                    )}
                  </div>
                </form>
              )}

              {/* ===================================================== */}
              {/* STEP 4: Installation Completed Screen                 */}
              {/* ===================================================== */}
              {step === 'done' && (
                <div className="text-center py-6 sm:py-10 space-y-6">
                  <div className="h-16 w-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                    <CheckCircle2 className="h-8 w-8 stroke-[2.2]" />
                  </div>

                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-[#163B5C] tracking-tight">
                      Nexus Ecom CMS is ready
                    </h2>
                    <p className="mt-2 text-xs sm:text-sm text-[#64748B] max-w-md mx-auto leading-relaxed">
                      Your database is connected, license is active, and administrator account is created. The public setup route is now sealed.
                    </p>
                  </div>

                  {/* Summary Card */}
                  <div className="max-w-md mx-auto rounded-2xl border border-[#E8EDF2] bg-[#F8FAFC] p-5 text-left space-y-2.5">
                    <div className="text-xs font-bold text-[#163B5C] pb-2 border-b border-[#E8EDF2] flex items-center justify-between">
                      <span>Deployment status</span>
                      <span className="text-emerald-700 font-semibold text-[11px] bg-emerald-100 px-2 py-0.5 rounded">
                        Active & Verified
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-[#64748B]">
                      <span>Store name:</span>
                      <span className="font-semibold text-[#163B5C]">{details.siteName || 'Nexus Store'}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-[#64748B]">
                      <span>Database:</span>
                      <span className="font-mono text-xs text-[#163B5C] font-semibold">{databaseName || 'Connected'}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-[#64748B]">
                      <span>Software license:</span>
                      <span className="font-semibold text-emerald-700">Active</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-[#64748B]">
                      <span>Administrator:</span>
                      <span className="font-mono text-xs text-[#163B5C]">{details.adminEmail || 'Configured'}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="max-w-xs mx-auto space-y-3 pt-2">
                    <Link
                      href="/admin/login"
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#ED3500] hover:bg-[#D02E00] px-6 py-3.5 font-bold text-xs sm:text-sm uppercase tracking-wider text-white shadow-sm transition"
                    >
                      <span>Sign in to dashboard</span>
                      <ChevronRight className="h-4 w-4" />
                    </Link>

                    <Link
                      href="/"
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-[#E8EDF2] bg-white hover:bg-[#F8FAFC] px-4 py-2.5 text-xs font-semibold text-[#163B5C] transition"
                    >
                      <span>View customer storefront</span>
                    </Link>

                    {/* Button to review filled parameters in read-only mode */}
                    <button
                      type="button"
                      onClick={() => setStep('database')}
                      className="w-full text-center text-xs text-[#64748B] hover:text-[#163B5C] font-medium pt-2 block underline transition"
                    >
                      Review configured parameters in read-only mode
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Editorial Footer */}
      <footer className="border-t border-[#E8EDF2] bg-white py-4 text-center text-xs text-[#64748B]">
        <div className="mx-auto max-w-6xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Nexus Ecom CMS · Configurable commerce for independent business</span>
          <span className="text-[11px] text-[#94A3B8]">Production-ready installation wizard</span>
        </div>
      </footer>
    </div>
  );
}
