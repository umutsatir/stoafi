import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { IntlProvider } from "@/components/intl-provider";
import { Nav } from "@/components/nav";

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
      <body>
        <IntlProvider>
          <Nav />
          {children}
        </IntlProvider>
      </body>
    </html>
  );
}
