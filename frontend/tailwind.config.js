/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        board: { DEFAULT: '#0b4b8a', hover: '#0a3e73' },
      },
    },
  },
  plugins: [],
};
