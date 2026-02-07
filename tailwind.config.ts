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
        mind: {
          50: "#f0f5f4",
          100: "#dbe8e5",
          200: "#b8d1cd",
          300: "#8eb5ae",
          400: "#6a978f",
          500: "#507b74",
          600: "#3f625d",
          700: "#35504c",
          800: "#2d413e",
          900: "#283735",
          950: "#131f1e",
        },
        warm: {
          50: "#faf8f5",
          100: "#f2ede6",
          200: "#e5dccf",
          300: "#d4c5b0",
          400: "#c0a88e",
          500: "#b29375",
          600: "#a58066",
          700: "#8a6a55",
          800: "#715749",
          900: "#5d4a3f",
        },
        calm: {
          bg: "#f7f6f3",
          card: "#ffffff",
          text: "#2d3436",
          muted: "#636e72",
          border: "#dfe6e9",
          accent: "#507b74",
          accentLight: "#dbe8e5",
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', "system-ui", "sans-serif"],
        serif: ['"Libre Baskerville"', "Georgia", "serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        breathe: "breathe 4s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        breathe: {
          "0%, 100%": { transform: "scale(1)", opacity: "0.6" },
          "50%": { transform: "scale(1.08)", opacity: "0.9" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
