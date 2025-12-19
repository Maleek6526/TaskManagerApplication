/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brandRed: '#e50914',
        brandBlack: '#0b0b0b',
        brandGray: '#1a1a1a',
      },
    },
  },
  plugins: [],
};