import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Background & surface colors
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: {
          DEFAULT: "#FFFFFF",
          secondary: "#F0F4F3",
          elevated: "#FFFFFF",
        },

        // Primary brand color — emerald green
        primary: {
          DEFAULT: "#059669",
          light: "#34D399",
          dark: "#047857",
          foreground: "#FFFFFF",
        },

        // Secondary accent — teal blue
        secondary: {
          DEFAULT: "#0891B2",
          light: "#22D3EE",
          dark: "#0E7490",
          foreground: "#FFFFFF",
        },

        // Semantic colors
        success: {
          DEFAULT: "#16A34A",
          light: "#4ADE80",
          dark: "#15803D",
          foreground: "#FFFFFF",
        },
        warning: {
          DEFAULT: "#D97706",
          light: "#FBBF24",
          dark: "#B45309",
          foreground: "#FFFFFF",
        },
        danger: {
          DEFAULT: "#DC2626",
          light: "#F87171",
          dark: "#B91C1C",
          foreground: "#FFFFFF",
        },

        // Text colors
        text: {
          primary: "#1E293B",
          secondary: "#475569",
          muted: "#94A3B8",
          inverse: "#FFFFFF",
        },

        // Border & divider
        border: {
          DEFAULT: "#E2E8F0",
          focus: "#059669",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      fontSize: {
        // Mobile-first type scale
        "display": ["2rem", { lineHeight: "2.5rem", fontWeight: "700" }],
        "heading": ["1.5rem", { lineHeight: "2rem", fontWeight: "600" }],
        "subheading": ["1.125rem", { lineHeight: "1.75rem", fontWeight: "600" }],
        "body": ["1rem", { lineHeight: "1.5rem", fontWeight: "400" }],
        "caption": ["0.875rem", { lineHeight: "1.25rem", fontWeight: "400" }],
        "small": ["0.75rem", { lineHeight: "1rem", fontWeight: "400" }],
      },
      spacing: {
        "safe-bottom": "env(safe-area-inset-bottom)",
      },
      screens: {
        "mobile": "375px",
        "tablet": "768px",
        "desktop": "1024px",
      },
    },
  },
  plugins: [],
};
export default config;
