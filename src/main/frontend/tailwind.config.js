/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#F4F6F9',
        'primaryText': '#000000DE',
        'secondaryText': '#00000099',
        'blue': '#4454A1',
        'blue-darker': '#3C4B8F',
        'blue-dark': '#2C3A7A',
        'purple': '#922A8E',
        'purple-darker': '#7A248A',
        'purple-dark': '#5A1C7A',
        'purple-light': '#CD92D7',
        'green': '#329A46',
        'green-darker': '#2F8A3D',
        'green-dark': '#2A7A3A',
        'gray-lightest': '#0000000A',
        'gray-lighter': '#BDBDBD',
        'gray-light': '#9EA0A5',
        'gray': '#9EA0A5',
        'gray-dark': '#323232',
        'red': '#BE1C39',
        'red-darker': '#AE1A38',
        'red-dark': '#9E1A38',
      },
      fontFamily: {
        'rajdhani': ['Rajdhani', 'sans-serif'],
        'open-sans': ['Open Sans', 'sans-serif'],
        'roboto': ['Roboto', 'sans-serif'],
      },
      fontSize: {
        'heading': '3rem', // 48px
        'title': '2rem', // 32px
        'subtitle': '1.5rem', // 24px
        'redactor': '1.2rem', // 19px
        'small': '1rem',  // 16px
      },
      keyframes: {
        slideInFromBottomLeft: {
          '0%': {
            transform: 'translate(0, 0) scale(0)',
            opacity: '0',
          },
          '100%': {
            transform: 'translate(0, 0) scale(1)',
            opacity: '1',
          },
        },
      },
      animation: {
        'slide-in-bottom-left': 'slideInFromBottomLeft 0.2s ease-out',
      },
    },
  },
  plugins: [],
  darkMode: 'class',
}