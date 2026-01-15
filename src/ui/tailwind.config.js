/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Apple-inspired light theme palette
        cloud: {
          DEFAULT: '#FFFFFF',
          50: '#FFFFFF',
          100: '#FAFAFA',
          200: '#F5F5F7',
          300: '#E8E8ED',
          400: '#D2D2D7',
        },
        // Apple Blue - Primary action color
        apple: {
          DEFAULT: '#007AFF',
          50: '#E5F2FF',
          100: '#CCE5FF',
          200: '#99CBFF',
          300: '#66B2FF',
          400: '#3399FF',
          500: '#007AFF',
          600: '#0066D6',
          700: '#0052AD',
          800: '#003D82',
          900: '#002957',
        },
        // Apple Orange - Secondary accent
        apricot: {
          DEFAULT: '#FF9500',
          50: '#FFF5E5',
          100: '#FFEACC',
          200: '#FFD699',
          300: '#FFC166',
          400: '#FFAD33',
          500: '#FF9500',
          600: '#CC7700',
          700: '#995900',
          800: '#663C00',
          900: '#331E00',
        },
        // Apple Purple - Tertiary accent
        grape: {
          DEFAULT: '#AF52DE',
          50: '#F7EDFC',
          100: '#EFDCF9',
          200: '#DFB9F3',
          300: '#CF96ED',
          400: '#BF73E7',
          500: '#AF52DE',
          600: '#9035C1',
          700: '#6F2994',
          800: '#4E1D68',
          900: '#2D103C',
        },
        // Warm grays for text hierarchy
        ink: {
          DEFAULT: '#1D1D1F',
          50: '#86868B',
          100: '#6E6E73',
          200: '#515154',
          300: '#3A3A3C',
          400: '#2C2C2E',
          500: '#1D1D1F',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['SF Mono', 'Menlo', 'Monaco', 'monospace'],
      },
      animation: {
        'float': 'float 8s ease-in-out infinite',
        'pulse-soft': 'pulse-soft 3s ease-in-out infinite',
        'fade-in': 'fade-in 0.4s ease-out',
        'slide-up': 'slide-up 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down': 'slide-down 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-down': {
          '0%': { opacity: '0', transform: 'translateY(-12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.04)',
        'soft-md': '0 4px 16px rgba(0, 0, 0, 0.06)',
        'soft-lg': '0 8px 32px rgba(0, 0, 0, 0.08)',
        'soft-xl': '0 16px 48px rgba(0, 0, 0, 0.1)',
        'inner-soft': 'inset 0 1px 2px rgba(0, 0, 0, 0.04)',
        'ring-apple': '0 0 0 4px rgba(0, 122, 255, 0.15)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
}
