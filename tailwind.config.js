/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        rider: {
          orange: '#E7532E',
          'orange-hover': '#D44723',
          'orange-active': '#BE3C1C',
          'orange-light': '#FDEEE9',
          gold: '#F1B643',
          'gold-light': '#FCD34D',
          cream: '#F8F5EE',
          'cream-card': '#FAF8F3',
          'dark-teal': '#183129',
          'dark-forest': '#102620',
          dark: '#131922',
          muted: '#6B7280',
          subtle: '#9CA3AF',
          border: '#E2DED5',
          'border-focus': '#E7532E',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'card-soft': '0 4px 20px -2px rgba(19, 25, 34, 0.05)',
        'btn-hover': '0 8px 20px -4px rgba(231, 83, 46, 0.35)',
      }
    },
  },
  plugins: [],
}
