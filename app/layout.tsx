
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PECS Creator",
  description: "Create custom Picture Exchange Communication System (PECS) boards.",
  manifest: "/manifest.json",
  themeColor: "#2563eb",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PECS Creator"
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Fonts and other static assets can go here */}
      </head>
      <body className="font-sans antialiased bg-gray-50">
        {children}
      </body>
    </html>
  );
}
