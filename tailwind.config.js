/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#eef7f0",
          100: "#d4ebda",
          500: "#2d7a4f",
          600: "#256641",
          700: "#1c5033",
        },
      },
    },
  },
  plugins: [],
};
