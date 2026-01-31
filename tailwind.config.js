/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#c9a961',
          dark: '#b8963f',
          light: '#d4b97a',
        },
        background: '#f5f1eb',
        dark: '#1a1311',
        accent: '#2c2420',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
