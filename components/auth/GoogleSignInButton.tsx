'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle2, ShieldCheck, X } from 'lucide-react';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: 'standard' | 'icon';
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              text?: 'signin_with' | 'signup_with' | 'continue_with';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              logo_alignment?: 'left' | 'center';
              width?: number | string;
              locale?: string;
            }
          ) => void;
          prompt: () => void;
        };
      };
    };
  }
}

interface GoogleSignInButtonProps {
  isSignUp?: boolean;
  onSuccess?: (customer: any) => void;
  onError?: (error: string) => void;
  className?: string;
}

export default function GoogleSignInButton({
  isSignUp = false,
  onSuccess,
  onError,
  className = '',
}: GoogleSignInButtonProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '';

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
  const buttonContainerRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Account-linking state
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [pendingCredential, setPendingCredential] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const [linkPassword, setLinkPassword] = useState('');
  const [showLinkPassword, setShowLinkPassword] = useState(false);
  const [linkingLoading, setLinkingLoading] = useState(false);
  const [linkError, setLinkError] = useState('');

  // Validate redirect against safe internal whitelist
  const getSafeRedirectUrl = (target: string): string => {
    if (!target) return '/account';
    if (target === 'checkout' || target === '/?checkout=true' || target === '?checkout=true') {
      return '/?checkout=true';
    }
    if (target.startsWith('/account') || target.startsWith('/orders')) {
      return target;
    }
    return '/account';
  };

  const handleAuthSuccess = (customer: any) => {
    if (onSuccess) {
      onSuccess(customer);
    }
    const destination = getSafeRedirectUrl(redirectTarget);
    setTimeout(() => {
      router.push(destination);
    }, 400);
  };

  // Google credential response handler
  const handleCredentialResponse = async (response: { credential: string }) => {
    setErrorMessage('');
    if (!response.credential) {
      const err = 'No credentials received from Google.';
      setErrorMessage(err);
      if (onError) onError(err);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/customer/google-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential }),
      });

      const data = await res.json();

      // Case 1: Existing account requiring verified password link
      if (res.status === 409 && data.requirePasswordLink) {
        setPendingCredential(response.credential);
        setPendingEmail(data.email || '');
        setShowLinkModal(true);
        setLoading(false);
        return;
      }

      // Case 2: Success
      if (res.ok && data.success) {
        handleAuthSuccess(data.customer);
      } else {
        const err = data.message || 'Google sign-in failed. Please try again.';
        setErrorMessage(err);
        if (onError) onError(err);
      }
    } catch (err: any) {
      const message = 'Unable to connect to authentication server. Please check your network.';
      setErrorMessage(message);
      if (onError) onError(message);
    } finally {
      setLoading(false);
    }
  };

  // Verified Account Linking Submission
  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLinkError('');

    if (!linkPassword) {
      setLinkError('Please enter your account password.');
      return;
    }

    try {
      setLinkingLoading(true);
      const res = await fetch('/api/customer/google-auth/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credential: pendingCredential,
          password: linkPassword,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setShowLinkModal(false);
        handleAuthSuccess(data.customer);
      } else {
        setLinkError(data.message || 'Incorrect password. Account linking failed.');
      }
    } catch {
      setLinkError('Network error while linking accounts. Please try again.');
    } finally {
      setLinkingLoading(false);
    }
  };

  // Load Google Identity Services script
  useEffect(() => {
    if (!googleClientId) return;

    if (window.google?.accounts?.id) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => setErrorMessage('Failed to load Google Sign-In SDK.');
    document.body.appendChild(script);

    return () => {
      // clean up script tag if needed
    };
  }, [googleClientId]);

  // Initialize & render Google button once script is ready
  useEffect(() => {
    if (!scriptLoaded || !googleClientId || !window.google?.accounts?.id) return;

    try {
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleCredentialResponse,
        cancel_on_tap_outside: true,
      });

      if (buttonContainerRef.current) {
        buttonContainerRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(buttonContainerRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: isSignUp ? 'signup_with' : 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          width: '100%',
        });
      }
    } catch (initErr) {
      console.warn('Google button initialization failed:', initErr);
    }
  }, [scriptLoaded, googleClientId, isSignUp]);

  return (
    <div className={`w-full ${className}`}>
      {errorMessage && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs sm:text-sm text-red-700 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* If Google Client ID is configured, render official GIS button */}
      {googleClientId ? (
        <div className="w-full relative min-h-[44px] flex items-center justify-center">
          {loading && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex items-center justify-center rounded-xl z-10 text-xs font-semibold text-[#0B3B24]">
              Authenticating with Google...
            </div>
          )}
          <div ref={buttonContainerRef} className="w-full flex justify-center [&>div]:w-full" />
        </div>
      ) : (
        /* Graceful Developer/Setup Hint if key is missing in environment */
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-semibold">Google Sign-In Setup Required</strong>
            <span>
              Add your Google Cloud OAuth Client ID to <code className="bg-amber-100 px-1 py-0.5 rounded text-[11px]">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> in <code className="bg-amber-100 px-1 py-0.5 rounded text-[11px]">.env.local</code> to activate 1-click Google Sign-In.
            </span>
          </div>
        </div>
      )}

      {/* Account Linking Modal for Existing Password Users */}
      {showLinkModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="link-modal-title"
        >
          <div className="bg-white w-full max-w-md rounded-2xl p-6 sm:p-7 shadow-2xl border border-gray-100 relative">
            <button
              type="button"
              onClick={() => setShowLinkModal(false)}
              className="absolute right-4 top-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-2 text-[#0B3B24]">
              <ShieldCheck className="w-6 h-6 text-[#0B3B24]" />
              <h3 id="link-modal-title" className="text-lg font-bold text-gray-900">
                Link Your Google Account
              </h3>
            </div>

            <p className="text-xs sm:text-sm text-gray-600 mb-4 leading-relaxed">
              We found an existing account registered with <strong className="text-gray-900">{pendingEmail}</strong>. To securely connect your Google account, please enter your existing account password.
            </p>

            {linkError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{linkError}</span>
              </div>
            )}

            <form onSubmit={handleLinkSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Account Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showLinkPassword ? 'text' : 'password'}
                    required
                    value={linkPassword}
                    onChange={(e) => setLinkPassword(e.target.value)}
                    placeholder="Enter your existing password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-[#0B3B24] focus:ring-2 focus:ring-[#0B3B24]/10 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLinkPassword(!showLinkPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-1"
                    aria-label={showLinkPassword ? 'Hide password' : 'Show password'}
                  >
                    {showLinkPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={linkingLoading}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-[#0B3B24] hover:bg-[#1C563F] text-white text-xs font-semibold shadow-md transition-all disabled:opacity-60 flex items-center justify-center gap-1.5"
                >
                  {linkingLoading ? 'Verifying...' : 'Verify & Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
