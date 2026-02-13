// ============================================================
// Notification & PWA helpers
// ============================================================

export function isNotificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (!isNotificationsSupported()) return "unsupported";
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationsSupported()) return false;
  const permission = await Notification.requestPermission();
  return permission === "granted";
}

export function showNotification(title: string, body: string): void {
  if (getNotificationPermission() !== "granted") return;

  if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: "SHOW_NOTIFICATION",
      title,
      body,
    });
  } else {
    new Notification(title, {
      body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
    });
  }
}

// Register service worker
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return null;

  try {
    const registration = await navigator.serviceWorker.register("/sw.js");
    return registration;
  } catch (err) {
    console.error("Service worker registration failed:", err);
    return null;
  }
}

// PWA install detection & prompt management
// ============================================================

let deferredPrompt: any = null; // Stores the beforeinstallprompt event

export function isAppInstalled(): boolean {
  if (typeof window === "undefined") return false;
  // Check standalone display mode (works for most browsers)
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  // iOS Safari adds navigator.standalone when launched from home screen
  if ((navigator as any).standalone === true) return true;
  return false;
}

export function isIOS(): boolean {
  if (typeof window === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.userAgent.includes("Mac") && "ontouchend" in document);
}

export function isAndroid(): boolean {
  if (typeof window === "undefined") return false;
  return /Android/.test(navigator.userAgent);
}

// Initialise the install prompt listener — call this once on app load
export function initInstallPrompt(onPromptAvailable?: () => void): void {
  if (typeof window === "undefined") return;

  window.addEventListener("beforeinstallprompt", (e: Event) => {
    // Prevent the default mini-infobar on Chrome Android
    e.preventDefault();
    deferredPrompt = e;
    onPromptAvailable?.();
  });

  // Detect when user actually installs
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    localStorage.setItem("mindmate_app_installed", "true");
  });
}

// Returns true if we have a captured native install prompt
export function hasNativeInstallPrompt(): boolean {
  return deferredPrompt !== null;
}

// Trigger the native install dialog (Chrome, Edge, Samsung Internet)
export async function triggerInstallPrompt(): Promise<boolean> {
  if (!deferredPrompt) return false;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  return outcome === "accepted";
}

// Should we show the install banner? Shows until actually installed.
export function shouldPromptInstall(): boolean {
  if (typeof window === "undefined") return false;
  if (isAppInstalled()) return false;
  if (localStorage.getItem("mindmate_app_installed") === "true") return false;
  // Session-level snooze — comes back next visit
  if (sessionStorage.getItem("mindmate_install_snoozed") === "true") return false;
  return true;
}

// Snooze for this session only — banner comes back next visit
export function snoozeInstallPrompt(): void {
  sessionStorage.setItem("mindmate_install_snoozed", "true");
}

// Keep for backwards compat but make it a no-op (we don't permanently dismiss anymore)
export function dismissInstallPrompt(): void {
  snoozeInstallPrompt();
}

// Notification preferences
export function hasSeenNotificationPrompt(): boolean {
  return localStorage.getItem("mindmate_notif_prompted") === "true";
}

export function markNotificationPromptSeen(): void {
  localStorage.setItem("mindmate_notif_prompted", "true");
}
