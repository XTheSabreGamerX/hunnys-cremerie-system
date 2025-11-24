/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: "#881337", // The deep burgundy from your header
          primary: "#be123c", // A vibrant pink-red
          light: "#ffe4e6", // The soft background pink
          accent: "#fda4af", // The button pink
        },
      },
    },
  },
  plugins: [],
};
