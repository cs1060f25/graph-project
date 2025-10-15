import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: "#0E0E0F",
        sidebar: "#1C1C1E",
        graph: "#121214",
        panel: "#1F1F22",
        textPrimary: "#FFFFFF",
        textSecondary: "#B0B0B5",
        accentPurple: "#8A4FFF",
        accentPurpleLight: "#B18CFF",
        accentGray: "#2A2A2D",
        borderColor: "#2F2F33",
      },
      fontFamily: {
        sans: ["Inter", ...defaultTheme.fontFamily.sans],
      },
      boxShadow: {
        focus: "0 0 0 2px rgba(138, 79, 255, 0.3)",
      },
    },
  },
  plugins: [],
};

export default config;
