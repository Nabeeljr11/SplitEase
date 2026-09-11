/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: {
          light: '#FAFAFA',
          dark: '#0A0A0A',
        },
        surface: {
          light: '#FFFFFF',
          dark: '#171717',
          'light-hover': '#F5F5F5',
          'dark-hover': '#1F1F1F',
        },
        border: {
          light: '#E5E5E5',
          dark: '#262626',
        },
        primaryText: {
          light: '#111111',
          dark: '#F5F5F5',
        },
        secondaryText: '#737373',
        signal: {
          green: '#16A34A',
          'green-subtle': 'rgba(22, 163, 74, 0.1)',
          red: '#DC2626',
          'red-subtle': 'rgba(220, 38, 38, 0.1)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      },
      letterSpacing: {
        tighter: '-0.03em',
        tight: '-0.02em',
      },
    },
  },
  plugins: [],
};
