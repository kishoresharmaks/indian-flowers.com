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
    <div className="min-h-screen bg-[#FAF6F0] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-[#E5E7EB] p-8 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Brand Accent Top Line */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#0B3B24] via-[#1C563F] to-[#C85A78]"></div>

        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl mx-auto shadow-md border border-[#E5E7EB] bg-[#F4F8F4] flex items-center justify-center p-2.5 overflow-hidden">
            <img
              src="/indian-flowers-logo.svg"
              alt="The Indian Flowers logo"
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <h2 className="text-2xl font-bold text-[#0B3B24] tracking-tight">The Indian Flowers</h2>
          <p className="text-xs text-[#6B7280]">
            Sign in with admin credentials to manage products, orders & store settings
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
            <label className="text-xs font-bold text-[#0B3B24] uppercase tracking-wider">
              Admin Email or Username
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E5E7EB] text-sm focus:outline-none focus:border-[#2F6B4F] text-[#111827] focus:ring-1 focus:ring-[#2F6B4F]"
                placeholder="admin@example.com"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#0B3B24] uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E5E7EB] text-sm focus:outline-none focus:border-[#2F6B4F] text-[#111827] focus:ring-1 focus:ring-[#2F6B4F]"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-[#0B3B24] hover:bg-[#1C563F] text-white font-semibold text-sm tracking-wider shadow-lg shadow-[#0B3B24]/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
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

        <div className="pt-4 border-t border-[#E5E7EB] flex items-center justify-between text-xs text-[#6B7280]">
          <Link
            href="/"
            className="hover:text-[#0B3B24] font-semibold underline text-[11px]"
          >
            ← Return to Store
          </Link>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
            <span>Powered by</span>
            <span className="font-bold text-slate-800 tracking-wider">NEXUS CMS</span>
          </div>
        </div>
      </div>

      <div className="mt-4 text-center text-xs text-slate-400 select-none">
        NEXUS CMS Enterprise Commerce Platform • Secure Admin Gateway
      </div>
    </div>
  );
}
