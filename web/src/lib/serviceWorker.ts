export function registerServiceWorker(): void {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      const swPath = `${import.meta.env.BASE_URL}sw.js`;
      navigator.serviceWorker.register(swPath).catch((error) => {
        console.error("Service worker registration failed", error);
      });
    });
  }
}
