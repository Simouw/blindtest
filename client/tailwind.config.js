/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        paper: {
          DEFAULT: '#0d0d10',
          deck: '#14141c',
          panel: '#1b1b26',
          raised: '#222230',
        },
        rule: {
          subtle: '#1d1d28',
          DEFAULT: '#262635',
          strong: '#35354a',
        },
        ink: {
          DEFAULT: '#f1f5f9',
          muted: '#94a3b8',
          faint: '#64748b',
          dim: '#475569',
        },
        signal: {
          mauve: '#9370db',
          'mauve-hover': '#a382ea',
          'mauve-dim': 'rgba(147, 112, 219, 0.14)',
          green: '#10b981',
          'green-dim': 'rgba(16, 185, 129, 0.14)',
          amber: '#f59e0b',
          'amber-dim': 'rgba(245, 158, 11, 0.14)',
          red: '#ef4444',
          'red-dim': 'rgba(239, 68, 68, 0.14)',
        },
        // Keep charcoal & mauve aliases for backward compatibility where needed
        charcoal: {
          950: '#0d0d10',
          900: '#14141c',
          850: '#1b1b26',
          800: '#222230',
          700: '#2d2d3e',
          600: '#404056',
        },
        mauve: {
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#9370db',
          600: '#8b5cf6',
          700: '#7c3aed',
        }
      },
      letterSpacing: {
        tighter: '-0.04em',
        tight: '-0.03em',
        tactile: '0.08em',
      },
      animation: {
        'meter-pulse': 'pulse 1.2s ease-in-out infinite',
        'spin-slow': 'spin 12s linear infinite',
      }
    },
  },
  plugins: [],
}
