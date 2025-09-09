/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'chatrix-red': '#ff0000',
        'chatrix-dark-red': '#c10a0a',
        'chatrix-darker-red': '#8b0000',
        'chatrix-light-red': '#ff4444',
        'chatrix-text': '#ffffff',
        'chatrix-border': '#ff6666'
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-red': 'pulseRed 2s infinite',
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
        pulseRed: {
          '0%, 100%': { backgroundColor: '#ff0000' },
          '50%': { backgroundColor: '#ff4444' },
        }
      }
    },
  },
  plugins: [],
}
