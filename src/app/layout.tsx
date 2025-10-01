import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Priority Matrix",
  description: "Eisenhower task manager with Supabase sync",
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
