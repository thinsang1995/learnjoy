/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary colors
        primary: {
          DEFAULT: '#4F46E5',
          50: '#EBEAFC',
          100: '#D7D5F9',
          200: '#AFABF3',
          300: '#8781ED',
          400: '#5F57E7',
          500: '#4F46E5',
          600: '#2A20D9',
          700: '#2119A8',
          800: '#181377',
          900: '#0F0C46',
        },
        secondary: {
          DEFAULT: '#818CF8',
          50: '#FFFFFF',
          100: '#F8F8FE',
          200: '#D7DAFD',
          300: '#B5BCFB',
          400: '#949EFA',
          500: '#818CF8',
          600: '#525FF5',
          700: '#2332F2',
          800: '#0E1DD0',
          900: '#0B16A1',
        },
        cta: {
          DEFAULT: '#F97316',
          50: '#FEE8D6',
          100: '#FDDCC2',
          200: '#FCC49B',
          300: '#FBAB73',
          400: '#FA934C',
          500: '#F97316',
          600: '#D25506',
          700: '#9B3F04',
          800: '#642803',
          900: '#2D1201',
        },
        // Background
        background: '#EEF2FF',
        text: '#1E1B4B',
        // Topic colors
        'soft-peach': '#FDBCB4',
        'baby-blue': '#ADD8E6',
        'mint': '#98FF98',
        'lilac': '#E6E6FA',
      },
      fontFamily: {
        fredoka: ['Fredoka', 'sans-serif'],
        nunito: ['Nunito', 'sans-serif'],
      },
      boxShadow: {
        clay: '8px 8px 16px rgba(0, 0, 0, 0.1), -4px -4px 12px rgba(255, 255, 255, 0.8), inset 2px 2px 4px rgba(255, 255, 255, 0.5)',
        'clay-pressed': 'inset 4px 4px 8px rgba(0, 0, 0, 0.1), inset -2px -2px 6px rgba(255, 255, 255, 0.7)',
      },
      borderRadius: {
        'clay': '24px',
      },
    },
  },
  plugins: [],
};
