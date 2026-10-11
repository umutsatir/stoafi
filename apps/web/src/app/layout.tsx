import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { AppBootstrap } from "@/components/app-bootstrap";
import { IntlProvider } from "@/components/intl-provider";
import { Nav } from "@/components/nav";
import { PageTransition } from "@/components/page-transition";
import { Toaster } from "@/components/ui/toaster";
import { CONTENT_SECURITY_POLICY } from "@/lib/csp";
import { THEME_BOOT_SCRIPT } from "@/lib/theme";
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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f9f8" },
    { media: "(prefers-color-scheme: dark)", color: "#0a1412" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {process.env.NODE_ENV === "production" && (
          <meta httpEquiv="Content-Security-Policy" content={CONTENT_SECURITY_POLICY} />
        )}
        <link
          rel="preload"
          href="/fonts/inter-latin-wght-normal.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <IntlProvider>
          <div className="flex min-h-screen">
            <Nav />
            <div className="min-w-0 flex-1 px-4 pb-24 pt-6 md:px-8 md:pb-10">
              <div className="mx-auto max-w-5xl">
                <AppBootstrap>
                  <PageTransition>{children}</PageTransition>
                </AppBootstrap>
              </div>
            </div>
          </div>
          <Toaster />
        </IntlProvider>
      </body>
    </html>
  );
}
