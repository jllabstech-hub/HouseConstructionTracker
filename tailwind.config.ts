import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Coherent Editorial Design System Palette (Warm Linen & Rich Terracotta)
        paper: {
          50: "#F8F5EE", // Warm Linen Canvas Background
          100: "#F1ECE3",
          200: "#E5DFD4",
          300: "#D5CDC0",
          400: "#B8AEA0",
        },
        clay: {
          50: "#FAF3EC",
          100: "#F4E4D4",
          200: "#E6C4A8",
          300: "#D69F77",
          400: "#C37B47",
          500: "#9C5127", // Rich Terracotta Brown (Primary Action)
          600: "#91491F", // Terracotta CTA
          700: "#7A3B16",
          800: "#622E0F",
          900: "#482008",
        },
        slate: {
          50: "#F7F8FA",
          100: "#EEF0F4",
          200: "#D8DCE4",
          300: "#B6BECB",
          400: "#8692A4",
          500: "#5D6A7E",
          600: "#424D5E",
          700: "#2D3643",
          800: "#1E2530", // Deep Slate / Header / Badges
          900: "#131821",
        },
        ink: {
          50: "#F9F8F6",
          100: "#F0EDE8",
          200: "#E2DDD6",
          300: "#C4BCB1",
          400: "#8C8276",
          500: "#635A4F",
          600: "#473F36",
          700: "#322B24",
          800: "#231D17", // Primary Text
          900: "#181410", // High-Contrast Headings
        },
        success: {
          DEFAULT: "#39745A", // Green (healthy / under budget)
          50: "#F0F7F3",
          100: "#DCEDE3",
          200: "#BADDCB",
          600: "#39745A",
          700: "#2C5B46",
        },
        warning: {
          DEFAULT: "#B7791F", // Amber (warning)
          50: "#FEF9EE",
          100: "#FDF0D2",
          600: "#B7791F",
          700: "#976217",
        },
        danger: {
          DEFAULT: "#B94A48", // Red (over budget / error)
          50: "#FDF4F4",
          100: "#FBE6E6",
          600: "#B94A48",
          700: "#9C3B39",
        },
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        display: ["Georgia", "Cambria", "Times New Roman", "serif"],
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgba(36, 49, 58, 0.04)",
        card: "0 1px 3px 0 rgba(36, 49, 58, 0.04), 0 1px 2px -1px rgba(36, 49, 58, 0.03)",
        cardHover: "0 4px 12px -2px rgba(36, 49, 58, 0.06), 0 2px 4px -2px rgba(36, 49, 58, 0.03)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
    },
  },
  plugins: [],
};

export default config;
