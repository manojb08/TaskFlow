import animate from 'tailwindcss-animate'

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0A0A0A',
        accent: {
          DEFAULT: '#3B82F6',
          foreground: '#FFFFFF',
        },
        success: {
          DEFAULT: '#16A34A',
          bg: '#F0FDF4',
        },
        warning: {
          DEFAULT: '#CA8A04',
          bg: '#FEFCE8',
        },
        destructive: {
          DEFAULT: '#DC2626',
          bg: '#FEF2F2',
          foreground: '#FFFFFF',
        },
        canvas: '#FCFCFC',
        surface: '#F9F9F9',
        border: '#E5E5E5',
        muted: {
          DEFAULT: '#F5F5F5',
          foreground: '#71717A',
        },
      },
      fontFamily: {
        heading: ['Outfit', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Geist', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '8px',
        sm: '6px',
        lg: '10px',
      },
      spacing: {
        sidebar: '215px',
        topbar: '46px',
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgb(0 0 0 / 0.04)',
        md: '0 4px 12px -2px rgb(0 0 0 / 0.08)',
      },
    },
  },
  plugins: [animate],
}
