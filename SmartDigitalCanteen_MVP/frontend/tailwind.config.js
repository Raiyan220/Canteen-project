/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "system-ui", "-apple-system", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "SFMono-Regular", "monospace"],
      },
      colors: {
        crimson: {
          50: "#fff1f2",
          100: "#ffe4e6",
          200: "#fecdd3",
          300: "#fda4af",
          400: "#fb7185",
          500: "#f43f5e",
          600: "#dc2626",
          700: "#b91c1c",
          800: "#991b1b",
          900: "#7f1d1d",
          950: "#450a0a",
        },
        surface: {
          base: "var(--bg-base)",
          card: "var(--bg-card)",
          elevated: "var(--bg-elevated)",
          subtle: "var(--bg-subtle)",
        },
        ink: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
        },
        line: {
          DEFAULT: "var(--border-color)",
          strong: "var(--border-strong)",
        },
      },
      boxShadow: {
        crimson: "0 10px 30px -10px rgba(185, 28, 28, 0.32)",
        card: "0 4px 20px -4px rgba(15, 5, 8, 0.08)",
      },
    },
  },
  plugins: [],
};
