/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        ppd: {
          background: "#0F172A",
          surface: "#141D33",
          primary: "#3B82F6",
          accent: "#10B981",
          ink: "#F2F5FA",
        },
      },
      fontFamily: {
        condensed: ["Barlow Condensed", "sans-serif"],
        sans: ["Inter", "sans-serif"],
      },
    },
  },
};
