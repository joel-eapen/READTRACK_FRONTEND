import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import "./index.css";
import App from "./App.tsx";
import { clerkAppearance } from "./clerkAppearance";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error(
    "Missing VITE_CLERK_PUBLISHABLE_KEY. Add it to your .env file.",
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      afterSignOutUrl="/signin"
      appearance={clerkAppearance}
    >
      <App />
    </ClerkProvider>
  </StrictMode>,
);
