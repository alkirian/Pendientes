/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark Carbon Theme - Modern & Elegant
        surface: {
          primary: '#121212',    // Main background (almost black)
          secondary: '#1a1a1a',  // Sidebar/panels
          card: '#1e1e1e',       // Card backgrounds
          elevated: '#252525',   // Elevated/hover surfaces
          border: '#2e2e2e',     // Borders (subtle)
          hover: '#2a2a2a',      // Hover states
        },
        // Text colors
        text: {
          primary: '#f5f5f5',    // Main text (off-white)
          secondary: '#a1a1aa',  // Secondary text
          muted: '#71717a',      // Muted text
        },
        // Accent colors - Vibrant on dark
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
        // Badge backgrounds - Darker versions
        badge: {
          pink: '#4a1942',
          blue: '#1e3a5f',
          green: '#14412a',
          yellow: '#4a3c1a',
          purple: '#3b1f5c',
          orange: '#4a2a1a',
          gray: '#2a2a2a',
        },
        // Badge text colors - Brighter on dark
        badgeText: {
          pink: '#f472b6',
          blue: '#60a5fa',
          green: '#4ade80',
          yellow: '#fcd34d',
          purple: '#c084fc',
          orange: '#fb923c',
        }
      },
    },
  },
  plugins: [],
}

