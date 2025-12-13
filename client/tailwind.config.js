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
        // Theme-aware colors using CSS variables
        surface: {
          primary: 'var(--surface-primary)',
          secondary: 'var(--surface-secondary)',
          card: 'var(--surface-card)',
          elevated: 'var(--surface-elevated)',
          border: 'var(--surface-border)',
          hover: 'var(--surface-hover)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
        // Accent colors - same for both themes
        accent: {
          blue: '#3b82f6',
          green: '#22c55e',
          yellow: '#fbbf24',
          red: '#ef4444',
          purple: '#a855f7',
          pink: '#ec4899',
          orange: '#f97316',
          cyan: '#06b6d4',
        },
        // Badge backgrounds
        badge: {
          pink: 'var(--badge-pink)',
          blue: 'var(--badge-blue)',
          green: 'var(--badge-green)',
          yellow: 'var(--badge-yellow)',
          purple: 'var(--badge-purple)',
          orange: 'var(--badge-orange)',
          gray: 'var(--badge-gray)',
        },
        // Badge text colors
        badgeText: {
          pink: 'var(--badge-text-pink)',
          blue: 'var(--badge-text-blue)',
          green: 'var(--badge-text-green)',
          yellow: 'var(--badge-text-yellow)',
          purple: 'var(--badge-text-purple)',
          orange: 'var(--badge-text-orange)',
        }
      },
    },
  },
  plugins: [],
}
