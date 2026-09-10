/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          950: "#06080f",
          900: "#0a0e1a",
          850: "#0e1424",
          800: "#131b2e",
          700: "#1c2740",
          600: "#2a3757",
        },
        accent: {
          DEFAULT: "#5b9dff",
          soft: "#8fbcff",
        },
        violet: {
          DEFAULT: "#a78bfa",
        },
        pass: "#3ddc97",
        fail: "#ff6b6b",
        warn: "#ffc857",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(91,157,255,0.22), 0 8px 30px -8px rgba(91,157,255,0.4)",
        card: "0 1px 0 0 rgba(255,255,255,0.03) inset, 0 20px 40px -24px rgba(0,0,0,0.6)",
      },
      keyframes: {
        pulseline: {
          "0%, 100%": { opacity: "0.35" },
          "50%": { opacity: "1" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        pulseline: "pulseline 1.6s ease-in-out infinite",
        shimmer: "shimmer 1.8s infinite",
        "fade-up": "fade-up 0.3s ease-out both",
      },
    },
  },
  plugins: [],
};
