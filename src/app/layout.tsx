import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import ErrorBoundaryInit from "@/components/ErrorBoundaryInit";
import "./globals.css";

export const metadata: Metadata = {
  title: "MindM8 — Think clearly about what's on your mind",
  description:
    "Process stress, overwhelm, and difficult emotions through guided reflection. Private, no sign-up, 5-minute sessions. Your thoughts stay on your device.",
  icons: {
    icon: [
      {
        url: "/logo.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/logo.svg",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MindM8",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#f5f3ef",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-calm-bg">
        {children}
        <ErrorBoundaryInit />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
