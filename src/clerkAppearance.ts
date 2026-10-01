import type { ComponentProps } from "react";
import { ClerkProvider } from "@clerk/clerk-react";

type Appearance = NonNullable<ComponentProps<typeof ClerkProvider>["appearance"]>;

/**
 * Brutalist appearance for Clerk's prebuilt components.
 * Mirrors the design tokens in index.css: hard 3px borders,
 * offset shadows, primary #DD614C, JetBrains Mono labels.
 */
export const clerkAppearance: Appearance = {
  variables: {
    colorPrimary: "#dd614c",
    colorText: "#111827",
    colorBackground: "#ffffff",
    colorInputBackground: "#ffffff",
    colorInputText: "#111827",
    borderRadius: "4px",
    fontFamily: '"Darker Grotesque", system-ui, sans-serif',
  },
  elements: {
    card: {
      border: "3px solid #111827",
      boxShadow: "6px 6px 0 0 #111827",
      borderRadius: "8px",
    },
    headerTitle: {
      fontFamily: '"Darker Grotesque", sans-serif',
      fontWeight: 800,
      textTransform: "uppercase",
      letterSpacing: "-0.02em",
    },
    formFieldLabel: {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: "0.75rem",
      textTransform: "uppercase",
      letterSpacing: "0.12em",
    },
    formFieldInput: {
      border: "3px solid #111827",
      borderRadius: "4px",
    },
    formButtonPrimary: {
      fontFamily: '"JetBrains Mono", monospace',
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: "0.06em",
      border: "3px solid #111827",
      borderRadius: "4px",
      boxShadow: "4px 4px 0 0 #111827",
      backgroundColor: "#dd614c",
    },
    socialButtonsBlockButton: {
      border: "3px solid #111827",
      borderRadius: "4px",
    },
  },
};
