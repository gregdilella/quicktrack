/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#ef4444',
          600: '#dc2626', // lipstick red (login)
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          DEFAULT: '#dc2626'
        }
      },
      borderRadius: {
        xl: '16px',
        '2xl': '20px',
        '3xl': '24px'
      },
      boxShadow: {
        soft: '0 8px 24px rgba(0,0,0,0.06)',
        card: '0 10px 30px rgba(0,0,0,0.08)'
      },
      backdropBlur: {
        xs: '2px'
      },
      keyframes: {
        fadein: {
          '0%': { opacity: 0, transform: 'translateY(4px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' }
        }
      },
      animation: {
        fadein: 'fadein .3s ease-out both',
        float: 'float 6s ease-in-out infinite'
      }
    }
  },
  plugins: []
};