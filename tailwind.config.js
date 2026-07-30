/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: {
          deep: '#ffffff',
          mid: '#fafafa',
          light: '#f5f5f5',
        },
        brand: {
          cyan: '#3b82f6',
          purple: '#a78bfa',
          pink: '#8b5cf6',
          green: '#10b981',
        },
        phantom: {
          bg: '#ffffff',
          surface: '#fafafa',
          elevated: '#f5f5f5',
          border: '#e8e8e8',
          text: '#111827',
          muted: '#6b7280',
          dim: '#9ca3af',
          red: '#ef4444',
          green: '#10b981',
          amber: '#f59e0b',
          blue: '#3b82f6',
        },
        primary: {
          DEFAULT: '#a78bfa',
          dark: '#8b5cf6',
          light: '#ddd6fe',
          pale: '#f3e8ff',
        },
        gray: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e8e8e8',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
          950: '#0a0a0f',
        },
      },
      fontFamily: {
        'space': ['"Space Mono"', 'monospace'],
        'bebas': ['"Bebas Neue"', 'sans-serif'],
        'rajdhani': ['Rajdhani', 'sans-serif'],
        'orbitron': ['Orbitron', 'sans-serif'],
        'ibm-plex': ['"IBM Plex Mono"', 'monospace'],
        'noto': ['"Noto Sans"', 'sans-serif'],
      }
    }
  },
  plugins: [],
}
