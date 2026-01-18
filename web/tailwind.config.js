/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        montserrat: ["Montserrat", "sans-serif"],
        lobster: ["Lobster", "cursive"],
      },
      colors: {
        primary: "#9ca0cf",
        secondary: "#424a70",
        accent: "#9eadc8",
      },
    },
  },
  plugins: [],
};
