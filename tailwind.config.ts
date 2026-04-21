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
          DEFAULT: "var(--surface)",
          secondary: "var(--surface-secondary)",
          elevated: "var(--surface-elevated)",
        },

        // Primary brand color — emerald green
        primary: {
          DEFAULT: "var(--primary)",
          light: "var(--primary-light)",
          dark: "var(--primary-dark)",
          foreground: "var(--primary-foreground)",
        },

        // Secondary accent — teal blue
        secondary: {
          DEFAULT: "var(--secondary)",
          light: "var(--secondary-light)",
          dark: "var(--secondary-dark)",
          foreground: "var(--secondary-foreground)",
        },

        // Semantic colors
        success: {
          DEFAULT: "var(--success)",
          light: "var(--success-light)",
          dark: "var(--success-dark)",
          foreground: "var(--success-foreground)",
        },
        warning: {
          DEFAULT: "var(--warning)",
          light: "var(--warning-light)",
          dark: "var(--warning-dark)",
          foreground: "var(--warning-foreground)",
        },
        danger: {
          DEFAULT: "var(--danger)",
          light: "var(--danger-light)",
          dark: "var(--danger-dark)",
          foreground: "var(--danger-foreground)",
        },

        // Text colors
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
          inverse: "var(--text-inverse)",
        },

        // Border & divider
        border: {
          DEFAULT: "var(--border)",
          focus: "var(--border-focus)",
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
