/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        sunset: {
          100: "rgba(249,221,185,1)",
          200: "rgba(244,188,150,1)",
          300: "rgba(238,129,111,1)",
          400: "rgba(163,95,94,1)",
          500: "rgba(84,77,98,1)",
          600: "#182542",
        }
      },
      fontFamily: {
        "serif": ["Lora", "serif"],
        "sans": ["Nunito", "sans-serif"],
      },
      fontWeight: {
        "light": 500,
        "normal": 600,
        "medium": 700,
        "semibold": 800,
        "bold": 900,
      },
    }
  },
  plugins: []
};
