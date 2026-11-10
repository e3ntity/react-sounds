declare global {
  interface Window {
    gtag?: (command: "event", eventName: string, params?: Record<string, unknown>) => void;
  }
}

/**
 * Sends a custom event to Google Analytics. No-op if gtag isn't loaded (e.g. blocked).
 */
export function trackEvent(eventName: string, params?: Record<string, unknown>): void {
  window.gtag?.("event", eventName, params);
}
