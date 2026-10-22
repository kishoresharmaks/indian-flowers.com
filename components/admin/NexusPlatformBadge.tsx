'use client';

import React, { useEffect, useRef } from 'react';

/**
 * NEXUS ECOMM CMS - Permanent Platform Engine Badge
 * Engineered with Shadow DOM encapsulation and MutationObserver persistence
 * to ensure it remains permanently visible in the admin panel even if page code
 * is modified or styled over.
 */
export default function NexusPlatformBadge() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const BADGE_ID = 'nexus-ecomm-cms-permanent-badge';
    const SLOT_ID = 'nexus-platform-badge-slot';

    const renderBadgeInto = (container: HTMLElement) => {
      // Check if shadow root already exists
      let shadow = container.shadowRoot;
      if (!shadow) {
        try {
          shadow = container.attachShadow({ mode: 'open' });
        } catch {
          shadow = container.shadowRoot;
        }
      }
      if (!shadow) return;

      shadow.innerHTML = `
        <style>
          :host {
            display: inline-block !important;
            visibility: visible !important;
            opacity: 1 !important;
          }
          .nexus-badge-pill {
            display: inline-flex !important;
            align-items: center !important;
            gap: 7px !important;
            background: #090D16 !important;
            border: 1px solid rgba(255, 255, 255, 0.15) !important;
            color: #FFFFFF !important;
            padding: 5px 11px !important;
            border-radius: 9999px !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Plus Jakarta Sans", sans-serif !important;
            font-size: 10.5px !important;
            font-weight: 800 !important;
            letter-spacing: 0.07em !important;
            text-transform: uppercase !important;
            line-height: 1 !important;
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(16, 185, 129, 0.2) !important;
            user-select: none !important;
            pointer-events: auto !important;
            transition: transform 0.15s ease, border-color 0.15s ease !important;
          }
          .nexus-badge-pill:hover {
            border-color: rgba(16, 185, 129, 0.5) !important;
            transform: translateY(-1px) !important;
          }
          .pulse-dot {
            width: 6.5px !important;
            height: 6.5px !important;
            background: #10B981 !important;
            border-radius: 9999px !important;
            box-shadow: 0 0 8px #10B981 !important;
            animation: nexusPulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite !important;
            flex-shrink: 0 !important;
          }
          .badge-text {
            color: #F8FAFC !important;
            font-weight: 800 !important;
            white-space: nowrap !important;
          }
          .badge-core {
            color: #10B981 !important;
            font-size: 9px !important;
            font-weight: 700 !important;
            padding-left: 2px !important;
          }
          @keyframes nexusPulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.45; transform: scale(0.85); }
          }
        </style>
        <div class="nexus-badge-pill" title="NEXUS ECOMM CMS Engine Active">
          <span class="pulse-dot"></span>
          <span class="badge-text">NEXUS ECOMM CMS</span>
        </div>
      `;
    };

    // Ensure master host element exists
    let hostElem = document.getElementById(BADGE_ID) as HTMLDivElement | null;
    if (!hostElem) {
      hostElem = document.createElement('div');
      hostElem.id = BADGE_ID;
      document.body.appendChild(hostElem);
    }

    const placeBadge = () => {
      if (!hostElem) return;
      const slot = document.getElementById(SLOT_ID);

      if (slot && slot.isConnected) {
        // Embed inside the admin sidebar slot
        if (hostElem.parentElement !== slot) {
          slot.appendChild(hostElem);
        }
        hostElem.style.cssText =
          'display: block !important; visibility: visible !important; opacity: 1 !important; width: 100% !important; text-align: center !important; pointer-events: auto !important; margin-top: 4px !important;';
      } else {
        // Fallback: If slot was removed from code, float persistently at bottom-left
        if (hostElem.parentElement !== document.body) {
          document.body.appendChild(hostElem);
        }
        hostElem.style.cssText =
          'position: fixed !important; bottom: 12px !important; left: 14px !important; z-index: 999999 !important; display: block !important; visibility: visible !important; opacity: 1 !important; pointer-events: auto !important;';
      }

      renderBadgeInto(hostElem);
    };

    placeBadge();

    // Self-healing MutationObserver: Restores badge if removed from DOM or hidden
    const observer = new MutationObserver(() => {
      if (!document.getElementById(BADGE_ID)) {
        const reCreated = document.createElement('div');
        reCreated.id = BADGE_ID;
        document.body.appendChild(reCreated);
        hostElem = reCreated;
        placeBadge();
      } else {
        // Enforce visibility
        if (
          hostElem &&
          (hostElem.style.display === 'none' ||
            hostElem.style.visibility === 'hidden' ||
            hostElem.style.opacity === '0' ||
            !hostElem.shadowRoot?.innerHTML)
        ) {
          placeBadge();
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class', 'hidden'],
    });

    const interval = setInterval(placeBadge, 2000);

    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, []);

  return null;
}
