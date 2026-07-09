import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#152033",
        canvas: "#f4f1ec",
        panel: "#fffdf9",
        line: "#e6dfd4",
        muted: "#6d7787",
        brand: {
          DEFAULT: "#d94835",
          dark: "#b53627",
          soft: "#fde8e4"
        },
        ocean: {
          DEFAULT: "#1d4f91",
          dark: "#163d72",
          soft: "#e8f0fb"
        },
        pine: {
          DEFAULT: "#0f766e",
          dark: "#0b5c56",
          soft: "#e4f5f2"
        }
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "system-ui", "sans-serif"]
      },
      boxShadow: {
        panel: "0 24px 60px -36px rgba(21, 32, 51, 0.45)",
        float: "0 12px 30px -18px rgba(21, 32, 51, 0.28)"
      },
      backgroundImage: {
        mesh: "radial-gradient(circle at 12% 18%, rgba(217, 72, 53, 0.12), transparent 34%), radial-gradient(circle at 88% 8%, rgba(29, 79, 145, 0.14), transparent 30%), radial-gradient(circle at 50% 100%, rgba(15, 118, 110, 0.08), transparent 40%)"
      }
    }
  },
  plugins: []
};

export default config;
