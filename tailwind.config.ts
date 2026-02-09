import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Mineral blue-green — inspired by Icelandic thermal waters
        mind: {
          50: "#f0f7f6",
          100: "#d5ebe8",
          200: "#b0d8d3",
          300: "#87c0b9",
          400: "#6aada5",
          500: "#4d908a",
          600: "#3d736e",
          700: "#335e5a",
          800: "#2b4d4a",
          900: "#243f3d",
          950: "#122221",
        },
        // Warm stone — volcanic rock, morning alpine light
        warm: {
          50: "#faf8f5",
          100: "#f3efe8",
          200: "#e8e0d4",
          300: "#d6c9b5",
          400: "#c2ab8f",
          500: "#b09575",
          600: "#a58066",
          700: "#8a6a55",
          800: "#715749",
          900: "#5d4a3f",
        },
        // Meditation hall — natural, grounded
        calm: {
          bg: "#f5f3ef",
          card: "#fdfcfa",
          text: "#2a2f2e",
          muted: "#7a8382",
          border: "#e5e2dc",
          accent: "#4d908a",
          accentLight: "#d5ebe8",
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', "system-ui", "sans-serif"],
        serif: ['"Libre Baskerville"', "Georgia", "serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.8s ease-out",
        "slide-up": "slideUp 0.6s ease-out",
        breathe: "breathe 6s ease-in-out infinite",
        "mist": "mist 8s ease-in-out infinite",
        "warmglow": "warmglow 10s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        breathe: {
          "0%, 100%": { transform: "scale(1)", opacity: "0.5" },
          "50%": { transform: "scale(1.12)", opacity: "0.85" },
        },
        mist: {
          "0%, 100%": { opacity: "0.3", transform: "translateY(0)" },
          "50%": { opacity: "0.6", transform: "translateY(-4px)" },
        },
        warmglow: {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "0.7" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
