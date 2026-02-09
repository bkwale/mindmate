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

// PWA install detection
export function isAppInstalled(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches;
}

export function shouldPromptInstall(): boolean {
  if (typeof window === "undefined") return false;
  if (isAppInstalled()) return false;
  if (localStorage.getItem("mindmate_install_dismissed") === "true") return false;
  return true;
}

export function dismissInstallPrompt(): void {
  localStorage.setItem("mindmate_install_dismissed", "true");
}

// Notification preferences
export function hasSeenNotificationPrompt(): boolean {
  return localStorage.getItem("mindmate_notif_prompted") === "true";
}

export function markNotificationPromptSeen(): void {
  localStorage.setItem("mindmate_notif_prompted", "true");
}
