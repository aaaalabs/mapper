import animate from 'tailwindcss-animate';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        tertiary: 'var(--color-tertiary)',
        background: {
          DEFAULT: 'var(--color-background)',
          alt: 'var(--color-background-alt)',
          white: 'var(--color-background-white)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          alt: 'var(--color-accent-alt)',
        },
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" }
        },
        "zoom-in-95": {
          "0%": { transform: "scale(0.95)" },
          "100%": { transform: "scale(1)" }
        }
      },
      animation: {
        "fade-in": "fade-in 0.2s ease-out",
        "zoom-in-95": "zoom-in-95 0.2s ease-out"
      }
    },
  },
  plugins: [
    require("tailwindcss-animate")
  ],
}