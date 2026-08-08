/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // A shipping/logistics palette: deep navy (trust, cargo/night-freight)
        // with a warm signal-orange accent (used sparingly, for status/action —
        // echoes cargo-hazard marking without literally using safety orange).
        navy: {
          950: "#0B1220",
          900: "#111B2E",
          800: "#1B2A45",
          700: "#28395C",
        },
        signal: {
          500: "#E8863A",
          600: "#CF701F",
        },
        paper: "#F7F5F0",
      },
      fontFamily: {
        display: ["'IBM Plex Sans Condensed'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
    },
  },
  plugins: [],
};
