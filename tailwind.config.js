/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          deep: '#030308',
          mid: '#0a0a12',
          light: '#12121f',
        },
        brand: {
          cyan: '#00f5ff',
          purple: '#a855f7',
          pink: '#ec4899',
          green: '#10b981',
        }
      },
      fontFamily: {
        'space': ['"Space Mono"', 'monospace'],
        'bebas': ['"Bebas Neue"', 'sans-serif'],
        'rajdhani': ['Rajdhani', 'sans-serif'],
        'orbitron': ['Orbitron', 'sans-serif'],
      }
    }
  },
  plugins: [],
}
