import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Service Worker Registration Guard for Lovable Preview
// Prevents service worker from running in iframe/preview environments
const isInIframe = (() => {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true; // Assume iframe if cross-origin security blocks access
  }
})();

const isPreviewHost =
  window.location.hostname.includes("id-preview--") ||
  window.location.hostname.includes("lovableproject.com") ||
  window.location.hostname.includes("lovable.app");

if (isPreviewHost || isInIframe) {
  // Unregister any existing service workers in preview/iframe contexts
  navigator.serviceWorker?.getRegistrations().then((registrations) => {
    registrations.forEach((r) => r.unregister());
  });
  console.log("[PWA] Service workers disabled in preview/iframe environment");
} else {
  // Register service worker for production
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("[PWA] Service Worker registered:", registration);
      })
      .catch((error) => {
        console.error("[PWA] Service Worker registration failed:", error);
      });
  }
}

createRoot(document.getElementById("root")!).render(<App />);
