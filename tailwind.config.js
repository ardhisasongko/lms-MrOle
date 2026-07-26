/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#FFF5F3',
          100: '#FFE8E4',
          200: '#FED1CA',
          300: '#FDBCB4',
          400: '#F5A094',
          500: '#ED8476',
          600: '#E06858',
          700: '#CC4D3D',
          800: '#A63A2D',
          900: '#802B20',
          950: '#591D14',
        },
        secondary: {
          50: '#F0F8FC',
          100: '#E0F0F8',
          200: '#C2E2F0',
          300: '#ADD8E6',
          400: '#8DC4D8',
          500: '#6DB0CA',
          600: '#4D9CBC',
          700: '#3D82A0',
          800: '#2D6884',
          900: '#1D4E68',
          950: '#0D344C',
        },
        cta: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
      },
      fontFamily: {
        sans: ['Geist', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['Geist Mono', 'JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'clay': '0 4px 12px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
        'clay-lg': '0 8px 24px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.03)',
        'clay-xl': '0 12px 36px rgba(0,0,0,0.08), 0 4px 8px rgba(0,0,0,0.04)',
        'inner-soft': 'inset 0 1px 0 rgba(255,255,255,0.5), inset 0 -1px 0 rgba(0,0,0,0.03)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.32, 0.72, 0, 1)',
        'spring-out': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  safelist: [
    'bg-cta-500', 'hover:bg-cta-600', 'focus:ring-cta-500',
    'shadow-clay', 'shadow-clay-lg', 'shadow-clay-xl',
  ],
  plugins: [],
}
