/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          gold: "#FFD700",
          dark: "#0a0a0a",
          card: "#111111",
          border: "#222222",
        },
      },
    },
  },
  plugins: [],
};
