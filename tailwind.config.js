/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#21191a',
        parchment: '#f7efe3',
        ember: '#df6d2d',
        forest: '#25594a',
        gold: '#f0b44c',
        wine: '#6e2f2f',
      },
      boxShadow: {
        panel: '0 18px 45px rgba(34, 21, 16, 0.14)',
      },
    },
  },
  plugins: [],
}
