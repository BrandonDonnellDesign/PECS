
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gemini PECS Creator",
  description: "Create custom Picture Exchange Communication System (PECS) boards.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Fonts and other static assets can go here */}
      </head>
      <body className="font-sans antialiased bg-gray-50">
        {children}
      </body>
    </html>
  );
}
