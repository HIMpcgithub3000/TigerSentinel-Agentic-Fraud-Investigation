/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkbg: "#0B0F19",
        cardbg: "#111827",
        panelbg: "#1F2937",
        borderline: "#374151"
      }
    },
  },
  plugins: [],
}
