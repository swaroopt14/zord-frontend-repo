/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'zord-blue': {
          50: '#EFF6FF',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E3A8A',
        },
        'zord-base': {
          main: '#0B1220',
          panel: '#111827',
          table: '#0F172A',
          border: '#1F2937',
          text: {
            primary: '#E5E7EB',
            secondary: '#9CA3AF',
          },
        },
        'zord-status': {
          healthy: '#16A34A',
          degraded: '#CA8A04',
          failed: '#DC2626',
          active: '#2563EB',
          neutral: '#9CA3AF',
        },
        'zord-destructive': {
          bg: '#7F1D1D',
          text: '#FECACA',
        },
        'zord-accent': {
          50: '#F0EAFE',
          100: '#E1D5FD',
          200: '#C2AAFB',
          300: '#A480F9',
          400: '#8555F7',
          500: '#6633EE',
          600: '#5229BE',
          700: '#3D1F8E',
          800: '#29145F',
          900: '#140A30',
        },
        'cx-text': '#1F2937',
        'cx-neutral': '#6B7280',
        'cx-danger': {
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
        },
        'cx-energy': {
          500: '#F97316',
          600: '#EA580C',
          700: '#C2410C',
        },
        'cx-success': {
          500: '#14B8A6',
          600: '#0D9488',
          700: '#0F766E',
        },
        'cx-purple': {
          50: '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#7C3AED',
          700: '#6D28D9',
          800: '#5B21B6',
          900: '#4C1D95',
        },
        'cx-teal': {
          50: '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#14B8A6',
          600: '#0D9488',
          700: '#0F766E',
          800: '#115E59',
          900: '#134E4A',
        },
      },
      borderRadius: {
        zord: '4px',
      },
      backgroundImage: {
        'glass-gradient': 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%)',
        'glow-primary': 'radial-gradient(circle, rgba(102, 51, 238, 0.4) 0%, transparent 70%)',
        'glow-primary-strong': 'radial-gradient(circle, rgba(102, 51, 238, 0.7) 0%, transparent 70%)',
      },
    },
  },
  plugins: [],
}

module.exports = config
