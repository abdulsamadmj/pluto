/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Mirror the web app's palette so the brand feels consistent.
        bg: "#09090b", // zinc-950
        card: "#18181b", // zinc-900
        border: "#27272a", // zinc-800
        muted: "#a1a1aa", // zinc-400
        primary: "#e879b9", // magenta accent
      },
    },
  },
  plugins: [],
};
