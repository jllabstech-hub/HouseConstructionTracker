import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        paper: {
          50: "#FBF8F3",
          100: "#F4EEE4",
          200: "#E8DCC8",
        },
        clay: {
          50: "#FBF4EE",
          100: "#F4E0D0",
          200: "#E8C09E",
          300: "#D89A68",
          400: "#C9783C",
          500: "#B85C22",
          600: "#9A4A1B",
          700: "#7A3A16",
          800: "#57290F",
          900: "#3A1B0A",
        },
        timber: {
          50: "#F3F6F3",
          100: "#DCE6DC",
          400: "#6B8F74",
          500: "#3F5D4A",
          600: "#334C3D",
          700: "#26392E",
        },
        ink: {
          50: "#FAFAF9",
          100: "#F5F5F4",
          200: "#E7E5E4",
          300: "#D6D3D1",
          400: "#A8A29E",
          500: "#78716C",
          600: "#57534E",
          700: "#44403C",
          800: "#292524",
          900: "#1C1917",
        },
      },
      fontFamily: {
        sans: ["var(--font-plus-jakarta)", "system-ui", "sans-serif"],
        display: ["var(--font-source-serif)", "Georgia", "serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(28, 25, 23, 0.04), 0 8px 24px rgba(28, 25, 23, 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
