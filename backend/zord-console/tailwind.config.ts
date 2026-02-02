import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Zord Blue - Primary Color System
        'zord-blue': {
          50: '#EFF6FF',   // Selection background (lightest allowed)
          500: '#3B82F6',  // Hover state, links
          600: '#2563EB',   // Primary blue (Zord Blue)
          700: '#1D4ED8',   // Pressed state
          800: '#1E3A8A',   // Selected table rows (subtle)
        },
        // Neutral Base (90% of admin UI)
        'zord-base': {
          main: '#0B1220',      // Background (main)
          panel: '#111827',     // Panel background
          table: '#0F172A',     // Table rows
          border: '#1F2937',    // Borders / dividers
          text: {
            primary: '#E5E7EB',   // Primary text
            secondary: '#9CA3AF', // Secondary text
          },
        },
        // Status Colors (Muted, Not Loud)
        'zord-status': {
          healthy: '#16A34A',   // Muted green
          degraded: '#CA8A04',  // Amber
          failed: '#DC2626',     // Red
          active: '#2563EB',     // Blue
          neutral: '#9CA3AF',    // Gray
        },
        // Destructive (Rare)
        'zord-destructive': {
          bg: '#7F1D1D',
          text: '#FECACA',
        },
      },
      borderRadius: {
        'zord': '4px', // Consistent 4px radius
      },
    },
  },
  plugins: [],
}
export default config
