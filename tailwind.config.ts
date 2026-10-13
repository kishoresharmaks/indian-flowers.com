import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand green shades — primary identity (Botanical Green)
        brand: {
          950: "#17382B",
          900: "#1D4735",
          800: "#24543E",
          700: "#2F6B4F",
          600: "#3F8061",
          100: "#EAF2EC",
          50: "#F4F8F4",
        },
        // Rose accent — floral secondary highlights
        rose: {
          700: "#A83D5A",
          600: "#C85A78",
          100: "#FBECEF",
        },
        // Neutral palette
        ivory: "#FBF9F4",
        text: {
          DEFAULT: "#202722",
          muted: "#5F6861",
          subtle: "#737C75",
        },
        border: {
          DEFAULT: "#E3E7E1",
          strong: "#C6CEC6",
        },
        // Semantic colors
        success: "#236B45",
        "success-bg": "#EAF5EE",
        warning: "#875500",
        "warning-bg": "#FFF4D9",
        error: "#B42332",
        "error-bg": "#FFF0F0",
        sale: "#A52C3B",
        focus: "#2368D8",
      },
      fontFamily: {
        sans: ["var(--font-plus-jakarta)", "var(--font-body)", "system-ui", "-apple-system", "sans-serif"],
        serif: ["var(--font-plus-jakarta)", "var(--font-heading)", "system-ui", "sans-serif"],
        heading: ["var(--font-plus-jakarta)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
