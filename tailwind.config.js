/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#1D3640',
        secondary: '#3D4F4F',
        tertiary: '#A3A692',
        background: '#F3EDE5',
        'background-alt': '#F2E2CE',
        'background-white': '#FFFFFF',
        accent: '#E9B893',
        'accent-alt': '#F99D7C',
      },
      boxShadow: {
        'soft': '0 2px 15px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [],
};