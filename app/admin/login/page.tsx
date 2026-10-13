'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, User, ArrowRight, ShieldCheck, RefreshCw, AlertCircle } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      setLoading(true);
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (data.success) {
        router.push('/admin/dashboard');
      } else {
        setError(data.message || 'Invalid email or password');
      }
    } catch (err: any) {
      setError('Connection error while logging in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFCFB] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-[#E8EDF2] p-8 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Brand Accent Top Line */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-[#ED3500]"></div>

        <div className="text-center space-y-2">
          <img
            src="/nexus-mark.svg"
            alt="Nexus Ecom CMS admin logo"
            className="w-16 h-16 object-contain rounded-2xl mx-auto shadow-md border border-[#E8EDF2]"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <h2 className="text-2xl font-black text-[#163B5C]">Nexus Ecom CMS</h2>
          <p className="text-xs text-[#64748B]">
            Sign in with registered admin credentials to manage products & orders
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#163B5C] uppercase tracking-wider">
              Admin Email Address
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
              <input
                type="email"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E8EDF2] text-sm focus:outline-none focus:border-[#ED3500] text-[#163B5C]"
                placeholder="admin@example.com"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#163B5C] uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E8EDF2] text-sm focus:outline-none focus:border-[#ED3500] text-[#163B5C]"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-[#ED3500] hover:bg-[#D02E00] text-white font-bold text-sm uppercase tracking-wider shadow-lg shadow-[#ED3500]/25 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Sign In to Dashboard <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2">
          <Link
            href="/"
            className="text-xs text-[#64748B] hover:text-[#163B5C] font-semibold underline"
          >
            ← Return to Customer Store
          </Link>
        </div>
      </div>
    </div>
  );
}
