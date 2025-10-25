import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Priority Matrix",
  description: "Eisenhower task manager with Supabase sync",
  applicationName: "Priority Matrix",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Priority Matrix",
  },
  formatDetection: {
    telephone: false,
  },
  themeColor: "#ffffff",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
