/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          DEFAULT: '#244D38',
          hover: '#1d3e2d',
          deep: '#183629',
        },
        deep: '#183629',
        sage: {
          DEFAULT: '#A9BCA3',
          light: '#E7ECE5',
          dark: '#7e9576',
        },
        ivory: {
          DEFAULT: '#F7F6EF',
          warm: '#FAF9F3',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
