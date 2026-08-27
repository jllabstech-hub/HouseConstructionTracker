import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Coherent Design System Palette
        paper: {
          50: "#F7F6F2", // Warm Background
          100: "#EFECE4",
          200: "#E2DDD2",
          300: "#D0C8B8",
          400: "#B4A994",
        },
        clay: {
          50: "#FBF5F0",
          100: "#F5E6DA",
          200: "#E8CBB3",
          300: "#DBAB87",
          400: "#D08B5B",
          500: "#C56A2D", // Construction Amber (Primary Action)
          600: "#C56A2D", // Construction Amber CTA
          700: "#A75420",
          800: "#864117",
          900: "#602D0E",
        },
        slate: {
          50: "#F4F6F8",
          100: "#E6EAEE",
          200: "#CCD5DD",
          300: "#A8B8C4",
          400: "#7E94A5",
          500: "#587184",
          600: "#415565",
          700: "#31414E",
          800: "#24313A", // Slate (Navigation / Trust)
          900: "#1B252C",
        },
        ink: {
          50: "#F8FAFB",
          100: "#EEF2F4",
          200: "#DFE5E9",
          300: "#C6D0D6",
          400: "#8A9BA8",
          500: "#5D707F",
          600: "#435360",
          700: "#313F4A",
          800: "#24313A", // Trust / Slate
          900: "#1A232A", // Primary text
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
        sans: ["var(--font-plus-jakarta)", "system-ui", "sans-serif"],
        display: ["var(--font-source-serif)", "Georgia", "serif"],
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
