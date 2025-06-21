/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
    './src/**/*.vue',
    './src/components/**/*.vue',
    './src/views/**/*.vue',
    './src/layouts/**/*.vue',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
