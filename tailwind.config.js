/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
        anton: ['Anton', 'sans-serif'],
      },
    },
  },
  plugins: [
    require("daisyui"), require('tailwindcss-animated')
  ],

};
