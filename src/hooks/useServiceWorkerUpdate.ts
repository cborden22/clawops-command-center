import { useEffect, useState, useCallback } from "react";
import { registerSW } from "virtual:pwa-register";

export function useServiceWorkerUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateSW, setUpdateSW] = useState<((reload?: boolean) => Promise<void>) | null>(null);

  useEffect(() => {
    // Register the service worker only after the window has fully loaded.
    // Registering immediately lets the SW (clientsClaim: true) seize control
    // mid-first-load and abort in-flight media fetches (e.g. the sales video).
    let cleanup: (() => void) | undefined;

    const doRegister = () => {
      const updateFunction = registerSW({
        onNeedRefresh() {
          // New content available - show update prompt
          console.log("PWA: New content available, update ready");
          setUpdateAvailable(true);
        },
        onOfflineReady() {
          console.log("PWA: App ready to work offline");
        },
        onRegisteredSW(swUrl, registration) {
          console.log("PWA: Service worker registered:", swUrl);
          // Check for updates every 30 minutes
          if (registration) {
            setInterval(() => {
              console.log("PWA: Checking for updates...");
              registration.update();
            }, 30 * 60 * 1000);
          }
        },
        onRegisterError(error) {
          console.error("PWA: Service worker registration error:", error);
        },
      });

      setUpdateSW(() => updateFunction);
    };

    if (document.readyState === "complete") {
      doRegister();
    } else {
      window.addEventListener("load", doRegister, { once: true });
      cleanup = () => window.removeEventListener("load", doRegister);
    }

    return cleanup;
  }, []);

  const applyUpdate = useCallback(async () => {
    console.log("PWA: Applying update...");
    
    if (updateSW) {
      try {
        await updateSW(true); // true = reload after update
      } catch (error) {
        console.error("PWA: Update call failed:", error);
      }
      
      // Fallback: force reload if updateSW doesn't trigger reload within 500ms
      setTimeout(() => {
        console.log("PWA: Fallback reload triggered");
        window.location.reload();
      }, 500);
    } else {
      // No updateSW function available, just reload
      console.log("PWA: No updateSW function, forcing reload");
      window.location.reload();
    }
  }, [updateSW]);

  const dismissUpdate = useCallback(() => {
    setUpdateAvailable(false);
  }, []);

  return { updateAvailable, applyUpdate, dismissUpdate };
}
