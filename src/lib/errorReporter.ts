// ============================================================
// Error Reporter — captures client-side errors and sends to KV
// Shows on /stats dashboard so the admin can see what's breaking
// ============================================================

const ERROR_QUEUE_KEY = "mindmate_error_queue";
const MAX_QUEUE = 10; // batch up to 10 before flushing

export interface ClientError {
  message: string;
  source: string;       // which component/flow triggered it (e.g. "chat", "backup", "extract")
  stack?: string;       // first 500 chars of stack trace
  url?: string;         // page URL
  userAgent?: string;   // browser/device info
  timestamp: string;
  context?: Record<string, string>; // extra info (mode, exchangeCount, etc.)
}

// Report a single error — queues locally then sends to server
export function reportError(
  message: string,
  source: string,
  opts?: {
    stack?: string;
    context?: Record<string, string>;
  }
): void {
  if (typeof window === "undefined") return;

  const error: ClientError = {
    message: message.slice(0, 300), // cap length
    source,
    stack: opts?.stack?.slice(0, 500),
    url: window.location.pathname,
    userAgent: getBrowserInfo(),
    timestamp: new Date().toISOString(),
    context: opts?.context,
  };

  // Send immediately (fire and forget)
  sendError(error);
}

// Extract useful browser info without exposing full user agent
function getBrowserInfo(): string {
  try {
    const ua = navigator.userAgent;
    const isIOS = /iPhone|iPad|iPod/.test(ua);
    const isAndroid = /Android/.test(ua);
    const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua);
    const isChrome = /Chrome/.test(ua) && !/Edg/.test(ua);
    const isFirefox = /Firefox/.test(ua);
    const isPWA = window.matchMedia("(display-mode: standalone)").matches;

    const parts: string[] = [];
    if (isIOS) parts.push("iOS");
    else if (isAndroid) parts.push("Android");
    else parts.push("Desktop");

    if (isSafari) parts.push("Safari");
    else if (isChrome) parts.push("Chrome");
    else if (isFirefox) parts.push("Firefox");

    if (isPWA) parts.push("PWA");

    return parts.join(" · ");
  } catch {
    return "Unknown";
  }
}

// Send error to the server
async function sendError(error: ClientError): Promise<void> {
  try {
    await fetch("/api/errors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(error),
    });
  } catch {
    // If we can't report the error, silently fail — don't cause more errors
  }
}

// ---- Global error handler for uncaught errors ----
export function installGlobalErrorHandler(): void {
  if (typeof window === "undefined") return;

  // Uncaught JS errors
  window.addEventListener("error", (event) => {
    reportError(
      event.message || "Uncaught error",
      "global",
      { stack: event.error?.stack }
    );
  });

  // Unhandled promise rejections
  window.addEventListener("unhandledrejection", (event) => {
    const message = event.reason?.message || event.reason?.toString() || "Unhandled promise rejection";
    reportError(
      message,
      "promise",
      { stack: event.reason?.stack }
    );
  });
}
