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
        cafe: {
          primary: '#302019',
          secondary: '#75452F',
          accent: '#D97736',
          'accent-hover': '#C26325',
          cream: '#F5EBDD',
          light: '#FAF8F5',
          dark: '#171411',
          muted: '#817970',
          sand: '#EFE7DA',
          warmgray: '#E6E0D8',
          surface: '#FFFFFF',
          'surface-dark': '#211D19',
          border: '#E8E1D7',
          'border-dark': '#2D2722',
        }
      },
      fontFamily: {
        sans: ['Manrope', 'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Space Grotesk', 'Manrope', 'sans-serif'],
        heading: ['Space Grotesk', 'Manrope', 'sans-serif'],
      },
      boxShadow: {
        'warm-xs': '0 1px 2px rgba(48, 32, 25, 0.04)',
        'warm-sm': '0 1px 3px rgba(48, 32, 25, 0.06), 0 1px 2px rgba(48, 32, 25, 0.04)',
        'warm': '0 4px 14px -2px rgba(48, 32, 25, 0.08), 0 2px 6px -1px rgba(48, 32, 25, 0.04)',
        'warm-md': '0 10px 24px -3px rgba(48, 32, 25, 0.10), 0 4px 10px -2px rgba(48, 32, 25, 0.05)',
        'warm-lg': '0 18px 36px -4px rgba(48, 32, 25, 0.12), 0 8px 18px -3px rgba(48, 32, 25, 0.06)',
        'warm-xl': '0 24px 48px -6px rgba(48, 32, 25, 0.15), 0 12px 24px -4px rgba(48, 32, 25, 0.08)',
        'card': '0 2px 8px rgba(48, 32, 25, 0.05), 0 12px 24px -6px rgba(48, 32, 25, 0.08)',
        'popover': '0 20px 40px -10px rgba(48, 32, 25, 0.18)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleUp: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.6', transform: 'scale(1.05)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.25s ease-out forwards',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-down': 'slideDown 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-up': 'scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'float': 'float 3.5s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s infinite linear',
      },
    },
  },
  plugins: [],
}

