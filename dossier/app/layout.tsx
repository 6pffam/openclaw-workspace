import type { Metadata, Viewport } from "next";
import "./globals.css";
import BottomNav from "@/components/nav/BottomNav";

export const metadata: Metadata = {
  title: "Dossier — Background Intelligence",
  description: "Background check dashboard",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Dossier",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0d1b2a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="pb-safe">
        {children}

        {/* Bottom nav — mobile only */}
        <div className="block md:hidden">
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
