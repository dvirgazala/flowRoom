import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg0: "#07071a",
        bg1: "#0e0e24",
        bg2: "#151530",
        bg3: "#1e1e3c",
        border: "#252545",
        purple: { DEFAULT: "#a855f7", light: "#bd85fc", dim: "rgba(168,85,247,0.15)" },
        pink: "#ec4899",
        "text-primary": "#eeeef4",
        "text-secondary": "#9b9eb0",
        "text-muted": "#626576",
        success: "#4ddb80",
        warning: "#fcc928",
        danger: "#f95a5a",
        info: "#62a8fc",
      },
      fontFamily: { sans: ["Inter", "system-ui", "sans-serif"] },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #a855f7, #ec4899)",
        "brand-gradient-v": "linear-gradient(180deg, #a855f7, #ec4899)",
      },
      boxShadow: {
        glow: "0 0 32px rgba(168,85,247,0.3)",
        "glow-sm": "0 0 16px rgba(168,85,247,0.2)",
        card: "0 4px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)",
        surface: "0 2px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)",
        "surface-lg": "0 8px 48px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05)",
      },
    },
  },
  plugins: [],
};
export default config;
