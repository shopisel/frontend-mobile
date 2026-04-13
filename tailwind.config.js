/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  "#EEF2FF",
          100: "#E0E7FF",
          500: "#6366F1",
          600: "#6366F1",
          700: "#4F46E5",
        },
        success: {
          50:  "#ECFDF5",
          500: "#10B981",
        },
        warning: {
          50:  "#FFFBEB",
          500: "#F59E0B",
        },
        surface: "#F8F9FC",
      },
    },
  },
  plugins: [],
};
