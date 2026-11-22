/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cyber: {
          dark: '#070b12',
          card: '#0d1524',
          cardHover: '#131f37',
          border: '#1f2e4d',
          accent: '#00f2fe',
          cyan: '#38bdf8',
          emerald: '#10b981',
          rose: '#f43f5e',
          amber: '#f59e0b',
          purple: '#a855f7',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
      },
      boxShadow: {
        'cyber-cyan': '0 0 20px -3px rgba(56, 189, 248, 0.25)',
        'cyber-rose': '0 0 20px -3px rgba(244, 63, 94, 0.35)',
        'cyber-emerald': '0 0 20px -3px rgba(16, 185, 129, 0.3)',
      },
    },
  },
  plugins: [],
}
