/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "var(--cream)",
        teal: {
          DEFAULT: "var(--teal)",
          dark: "var(--teal-dark)",
          light: "var(--teal-light)",
        },
        ink: {
          DEFAULT: "var(--ink)",
          light: "var(--ink-light)",
        },
        border: "var(--border)",
        danger: "var(--danger)",
      },
      fontFamily: {
        caveat: ["Caveat", "cursive"],
        kalam: ["Kalam", "Segoe UI", "system-ui", "sans-serif"],
      },
      keyframes: {
        "pop-blob": {
          "0%": { transform: "scale(1)" },
          "33%": { transform: "scale(1.2)" },
          "66%": { transform: "scale(0.8)" },
          "100%": { transform: "scale(1)" },
        },
        "border-trail": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "pop-blob": "pop-blob 5s infinite",
        "border-trail": "border-trail 4s linear infinite",
      },
      boxShadow: {
        glow: "0 0 20px rgba(95, 158, 160, 0.55), 0 0 40px rgba(63, 117, 119, 0.35), 0 0 60px rgba(207, 228, 228, 0.3)",
      },
    },
  },
  plugins: [],
};
