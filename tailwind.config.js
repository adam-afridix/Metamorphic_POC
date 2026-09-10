/** @type {import('tailwindcss').Config} */
const c = (v) => `rgb(var(${v}) / <alpha-value>)`;

export default {
  darkMode: ['selector', '[data-theme="dark"]'],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // surfaces (consumed via base-*)
        base: {
          950: c("--bg"),
          900: c("--bg-2"),
          850: c("--surface"),
          800: c("--surface-2"),
          700: c("--border"),
          600: c("--border-strong"),
        },
        sidebar: c("--sidebar"),
        // text (consumed via slate-*)
        slate: {
          50: c("--text"),
          100: c("--text"),
          200: c("--text"),
          300: c("--text-2"),
          400: c("--text-2"),
          500: c("--text-3"),
          600: c("--text-faint"),
          700: c("--text-faint"),
        },
        // semantic accents
        accent: { DEFAULT: c("--accent"), soft: c("--accent") },
        violet: c("--indigo"),
        indigo: c("--indigo"),
        pass: c("--teal"),
        fail: c("--danger"),
        warn: c("--warn"),
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      keyframes: {
        pulseline: {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "1" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        pulseline: "pulseline 1.6s ease-in-out infinite",
        shimmer: "shimmer 1.8s infinite",
      },
    },
  },
  plugins: [],
};
