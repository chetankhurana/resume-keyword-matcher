/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./sidepanel.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f8ff',
          100: '#eef3ff',
          200: '#dce6ff',
          300: '#bcccff',
          400: '#92abff',
          500: '#5e7eff',
          600: '#3c58ff',
          700: '#2c40e6',
          800: '#2432b8',
          900: '#233091',
          950: '#161c57',
        },
      },
    },
  },
  plugins: [],
}
