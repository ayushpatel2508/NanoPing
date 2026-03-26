/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "secondary-fixed": "#f6d9ff",
        "surface": "#111318",
        "secondary-container": "#7d01b1",
        "on-secondary-fixed-variant": "#7200a3",
        "tertiary-fixed-dim": "#ffb4aa",
        "on-primary": "#00363a",
        "surface-container": "#1e2024",
        "on-surface": "#e2e2e8",
        "surface-container-lowest": "#0c0e12",
        "tertiary-fixed": "#ffdad5",
        "on-tertiary-fixed": "#410001",
        "on-secondary-fixed": "#310048",
        "surface-container-highest": "#333539",
        "secondary-fixed-dim": "#e9b3ff",
        "on-surface-variant": "#b9cacb",
        "primary-fixed-dim": "#00dbe9",
        "surface-container-high": "#282a2e",
        "outline": "#849495",
        "background": "#111318",
        "outline-variant": "#3b494b",
        "on-primary-fixed-variant": "#004f54",
        "error": "#ffb4ab",
        "on-primary-container": "#006970",
        "on-secondary": "#510074",
        "on-tertiary": "#690003",
        "tertiary-container": "#ffcec7",
        "surface-variant": "#333539",
        "inverse-on-surface": "#2f3035",
        "on-error": "#690005",
        "surface-dim": "#111318",
        "tertiary": "#fff3f1",
        "on-secondary-container": "#e5a9ff",
        "surface-bright": "#37393e",
        "surface-tint": "#00dbe9",
        "secondary": "#e9b3ff",
        "inverse-primary": "#006970",
        "on-background": "#e2e2e8",
        "surface-container-low": "#1a1c20",
        "inverse-surface": "#e2e2e8",
        "on-primary-fixed": "#002022",
        "primary": "#dbfcff",
        "on-tertiary-container": "#c1000a",
        "error-container": "#93000a",
        "on-tertiary-fixed-variant": "#930005",
        "primary-container": "#00f0ff",
        "on-error-container": "#ffdad6",
        "primary-fixed": "#7df4ff"
      },
      fontFamily: {
        "headline": ["Manrope", "sans-serif"],
        "body": ["Inter", "sans-serif"],
        "label": ["Inter", "sans-serif"]
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotateX(10deg) rotateY(15deg)' },
          '50%': { transform: 'translateY(-15px) rotateX(12deg) rotateY(18deg)' },
        }
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
