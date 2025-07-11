import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // Global styles apply here

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "NEXUS-IMAGE TRANSLATOR", // This can be a generic title
  description: "Professional Image Translation Tool", // Generic description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning> {/* Default lang, actual lang set in [lang]/layout.tsx or by middleware for head tags */}
      <body className={`${inter.variable} font-sans antialiased`}>
        {children} {/* This will render the [lang]/layout.tsx content */}
      </body>
    </html>
  );
}
