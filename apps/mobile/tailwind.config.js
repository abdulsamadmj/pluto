/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Mirror the web app's palette so the brand feels consistent.
        bg: "#222222", // base background
        card: "#2b2b2b", // surface
        border: "#3a3a3a",
        muted: "#a1a1aa",
        primary: "#00DE6F", // Pluto green
      },
    },
  },
  plugins: [],
};
