/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'chatrix-primary': '#3b82f6',
        'chatrix-primary-dark': '#0b5ed7',
        'chatrix-darker': '#1e3a8a',
        'chatrix-text': '#ffffff',
        'chatrix-border': '#60a5fa'
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-blue': 'pulseBlue 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseBlue: {
          '0%, 100%': { backgroundColor: '#3b82f6' },
          '50%': { backgroundColor: '#60a5fa' },
        }
      }
    },
  },
  plugins: [],
}
