/**
 * Design System Tokens
 * "The Flower House" — Premium botanical e-commerce design
 * 
 * This file centralizes all design tokens to serve as single source of truth
 * for colors, typography, and spacing across the storefront.
 * 
 * Reference: UI.md specification
 */

// ============================================================================
// COLOR TOKENS
// ============================================================================

export const COLOR_TOKENS = {
  // Brand green — botanical primary identity
  brand: {
    950: "#17382B",  // Deepest brand tone
    900: "#1D4735",  // Primary text, strong headings
    800: "#24543E",  // Button hover/pressed state
    700: "#2F6B4F",  // Primary brand color, CTA background
    600: "#3F8061",  // Secondary emphasis, links
    100: "#EAF2EC",  // Quiet botanical tint
    50: "#F4F8F4",   // Very light green section background
  },

  // Rose accent — floral secondary highlights
  rose: {
    700: "#A83D5A",  // Strong floral accent
    600: "#C85A78",  // Secondary floral accent (use sparingly)
    100: "#FBECEF",  // Soft highlight background
  },

  // Neutral palette
  ivory: "#FBF9F4",     // Main editorial canvas, warm section background
  white: "#FFFFFF",     // Product cards, forms, menus, drawers
  
  text: {
    default: "#202722", // Main text
    muted: "#5F6861",   // Supporting copy, metadata
    subtle: "#737C75",  // Secondary metadata only (when contrast sufficient)
  },

  border: {
    default: "#E3E7E1",   // Dividers, input outlines, card edges
    strong: "#C6CEC6",    // Stronger input outlines, selected controls
  },

  // Semantic colors
  success: "#236B45",
  successBg: "#EAF5EE",
  warning: "#875500",
  warningBg: "#FFF4D9",
  error: "#B42332",
  errorBg: "#FFF0F0",
  sale: "#A52C3B",      // Sale price/badge
  focus: "#2368D8",     // Visible keyboard focus ring
} as const;

// ============================================================================
// TYPOGRAPHY TOKENS
// ============================================================================

export const TYPOGRAPHY_TOKENS = {
  fontFamily: {
    sans: 'var(--font-plus-jakarta), system-ui, sans-serif',
    serif: 'var(--font-plus-jakarta), system-ui, sans-serif',
    heading: 'var(--font-plus-jakarta), sans-serif',
  },

  // Size and weight per role
  scale: {
    // Hero heading: Plus Jakarta Sans, 44–52px (desktop), 32–38px (mobile)
    heroHeading: {
      desktop: "44–52px",
      desktopMin: "44px",
      desktopMax: "52px",
      mobile: "32–38px",
      weight: 700,
      lineHeight: "1.15",
      letterSpacing: "-0.035em",
      fontFamily: "sans",
    },

    // Section headings: Plus Jakarta Sans, 28–36px
    sectionHeading: {
      desktop: "28–36px",
      desktopMin: "28px",
      desktopMax: "36px",
      mobile: "24–28px",
      weight: 700,
      lineHeight: "1.2",
      letterSpacing: "-0.03em",
      fontFamily: "sans",
    },

    // Promotional headings: Plus Jakarta Sans, 24–30px
    promotionalHeading: {
      desktop: "24–30px",
      desktopMin: "24px",
      desktopMax: "30px",
      mobile: "20–24px",
      weight: 700,
      lineHeight: "1.25",
      fontFamily: "sans",
    },

    // Product names: Plus Jakarta Sans, 14–16px (0.95rem)
    productName: {
      desktop: "14–16px",
      mobile: "13–15px",
      weight: 600,
      lineHeight: "1.45",
      letterSpacing: "-0.015em",
      fontFamily: "sans",
    },

    // Body descriptions: Plus Jakarta Sans, 14–16px
    bodyDescription: {
      desktop: "14–16px",
      mobile: "13–15px",
      weight: 400,
      lineHeight: "1.65–1.7",
      fontFamily: "sans",
    },

    // Navigation: Plus Jakarta Sans, 13–15px
    navigation: {
      desktop: "13–15px",
      mobile: "13–14px",
      weight: 500,
      lineHeight: "1.2",
      fontFamily: "sans",
    },

    // Product prices: Plus Jakarta Sans, 16–18px (tabular nums)
    productPrice: {
      desktop: "16–18px",
      mobile: "15–17px",
      weight: 700,
      lineHeight: "1.2",
      fontFamily: "sans",
    },

    // Buttons: Plus Jakarta Sans 600, 14–15px
    button: {
      desktop: "14–15px",
      mobile: "13–14px",
      weight: 600,
      lineHeight: "1.2",
      fontFamily: "sans",
    },

    // Labels / badges: Plus Jakarta Sans 500–600, 11–13px
    labelBadge: {
      desktop: "11–13px",
      mobile: "10–12px",
      weight: 600,
      textTransform: "uppercase",
      letterSpacing: "0.08–0.12em",
      lineHeight: "1.3",
      fontFamily: "sans",
    },
  },
} as const;

// ============================================================================
// SPACING TOKENS
// ============================================================================

export const SPACING_TOKENS = {
  // Base unit: 4px
  base: 4,

  // Primary spacing steps (multiples of 4px)
  xs: "4px",    // 1 × base
  sm: "8px",    // 2 × base
  md: "12px",   // 3 × base
  lg: "16px",   // 4 × base
  xl: "20px",   // 5 × base
  "2xl": "24px",   // 6 × base
  "3xl": "32px",   // 8 × base
  "4xl": "40px",   // 10 × base
  "5xl": "48px",   // 12 × base
  "6xl": "64px",   // 16 × base
  "7xl": "80px",   // 20 × base
  "8xl": "96px",   // 24 × base

  // Gutters (page padding)
  gutter: {
    desktop: "24px",   // 1280px+ viewport
    tablet: "20px",    // 768px–1024px viewport
    mobile: "16px",    // <768px viewport
  },
} as const;

// ============================================================================
// LAYOUT TOKENS
// ============================================================================

export const LAYOUT_TOKENS = {
  // Max content widths
  maxWidth: {
    full: "100%",
    editorial: "680px",     // Long-form content measure
    standard: "1280px",     // Main content grid
    wide: "1360px",         // Product grids can extend
  },

  // Border radius
  radius: {
    sm: "8px",      // Small controls, buttons
    md: "12px",     // Product cards
    lg: "16px",     // Dialogs, drawers, large panels
    full: "9999px", // Pill shapes (use sparingly)
  },

  // Shadows
  shadow: {
    xs: "0 1px 2px rgba(0, 0, 0, 0.05)",
    sm: "0 1px 3px rgba(0, 0, 0, 0.1)",
    md: "0 4px 6px rgba(0, 0, 0, 0.1)",
    lg: "0 10px 15px rgba(0, 0, 0, 0.1)",
    xl: "0 20px 25px rgba(0, 0, 0, 0.1)",
  },

  // Responsive breakpoints
  breakpoint: {
    sm: "640px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
    "2xl": "1440px",
  },
} as const;

// ============================================================================
// SEMANTIC TOKEN GROUPS (easier to reference in components)
// ============================================================================

export const BUTTON_TOKENS = {
  primary: {
    background: COLOR_TOKENS.brand[700],
    text: COLOR_TOKENS.white,
    hover: COLOR_TOKENS.brand[800],
    focus: COLOR_TOKENS.focus,
  },
  secondary: {
    background: COLOR_TOKENS.white,
    text: COLOR_TOKENS.brand[700],
    border: COLOR_TOKENS.brand[700],
    hover: COLOR_TOKENS.ivory,
  },
} as const;

export const INPUT_TOKENS = {
  border: COLOR_TOKENS.border.default,
  borderHover: COLOR_TOKENS.border.strong,
  borderFocus: COLOR_TOKENS.brand[700],
  focusRing: COLOR_TOKENS.focus,
  background: COLOR_TOKENS.white,
  placeholder: COLOR_TOKENS.text.muted,
} as const;

export const MOTION_TOKENS = {
  fast: "120ms",
  normal: "180ms",
  slow: "260ms",
  easing: "cubic-bezier(0.4, 0, 0.2, 1)", // Standard easing
} as const;

// ============================================================================
// TYPE HELPERS (Optional: for TypeScript strictness)
// ============================================================================

export type ColorToken = typeof COLOR_TOKENS;
export type TypographyToken = typeof TYPOGRAPHY_TOKENS;
export type SpacingToken = typeof SPACING_TOKENS;
export type LayoutToken = typeof LAYOUT_TOKENS;
