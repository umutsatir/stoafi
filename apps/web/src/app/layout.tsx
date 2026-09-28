import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { AppBootstrap } from "@/components/app-bootstrap";
import { IntlProvider } from "@/components/intl-provider";
import { Nav } from "@/components/nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stoafi",
  description: "A local-first personal finance school.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Stoafi",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <IntlProvider>
          <div className="mx-auto flex min-h-screen max-w-5xl flex-col md:flex-row">
            <Nav />
            <div className="flex-1 p-6">
              <AppBootstrap>{children}</AppBootstrap>
            </div>
          </div>
        </IntlProvider>
      </body>
    </html>
  );
}
