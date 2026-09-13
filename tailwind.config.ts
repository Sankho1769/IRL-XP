import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: { "2xl": "1440px" },
    },
    extend: {
      fontFamily: {
        serif: ["Cinzel", "Palatino Linotype", "Book Antiqua", "Palatino", "Georgia", "serif"],
        rpg: ["Cinzel", "Palatino Linotype", "Book Antiqua", "Palatino", "Georgia", "serif"],
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        rpg: {
          void: "#080C14",
          "void-raised": "#0D1322",
          panel: "#111827",
          "panel-raised": "#162035",
          gold: "#E5B869",
          "gold-light": "#F5C362",
          "gold-dark": "#C99738",
          ember: "#F97316",
          arcane: "#38BDF8",
          vital: "#10B981",
          creative: "#A78BFA",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};

export default config;
