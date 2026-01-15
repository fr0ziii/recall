/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        void: {
          DEFAULT: '#0a0a0f',
          50: '#12121a',
          100: '#1a1a24',
          200: '#22222e',
          300: '#2a2a38',
        },
        cyan: {
          DEFAULT: '#00f0ff',
          50: '#e6feff',
          100: '#b3fcff',
          200: '#80faff',
          300: '#4df8ff',
          400: '#1af6ff',
          500: '#00f0ff',
          600: '#00c0cc',
          700: '#009099',
          800: '#006066',
          900: '#003033',
        },
        amber: {
          DEFAULT: '#ffb347',
          400: '#ffc570',
          500: '#ffb347',
          600: '#ff9f1a',
        },
        violet: {
          DEFAULT: '#a78bfa',
          400: '#b8a0fb',
          500: '#a78bfa',
          600: '#8b5cf6',
        },
      },
      fontFamily: {
        sans: ['Instrument Sans', 'system-ui', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'orbit': 'orbit 20s linear infinite',
        'fade-in': 'fade-in 0.5s ease-out',
        'slide-up': 'slide-up 0.4s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.05)' },
        },
        orbit: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(0, 240, 255, 0.3)',
        'glow-amber': '0 0 20px rgba(255, 179, 71, 0.3)',
        'glow-violet': '0 0 20px rgba(167, 139, 250, 0.3)',
      },
    },
  },
  plugins: [],
}
