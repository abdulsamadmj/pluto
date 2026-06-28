/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Mirror the web app's palette so the brand feels consistent.
        bg: "#181818", // base background
        card: "#202020", // surface
        border: "#303030",
        muted: "#a1a1aa",
        primary: "#00DE6F", // Pluto green
      },
    },
  },
  plugins: [],
};
