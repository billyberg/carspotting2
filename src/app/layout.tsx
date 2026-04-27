import type { Metadata, Viewport } from "next";
import "./globals.css";

export const preferredRegion = ["arn1", "fra1"];

export const metadata: Metadata = {
  title: "Carspotting",
  description: "Hitta registreringsplåtar i följd",
  appleWebApp: {
    capable: true,
    title: "Carspotting",
    statusBarStyle: "black-translucent",
  },
  icons: {
    apple: "/icon.svg",
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sv" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-black text-white">
        {children}
      </body>
    </html>
  );
}
