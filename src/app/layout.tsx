import "./globals.css"; // This is crucial
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AlertProvider } from "@/contexts/AlertContext";
import CustomAlertModal from "@/components/CustomAlertModal";
import DynamicPdfJsWorkerConfigLoader from "@/components/DynamicPdfJsWorkerConfigLoader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PDF Converter",
  description: "PDF Conversion Tool",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`
          ${geistSans.variable}
          ${geistMono.variable}
          antialiased
          bg-gray-950
          text-gray-200
          font-sans
          min-h-screen
          overflow-x-hidden
        `}
      >
        <LanguageProvider>
          <AlertProvider>
            <DynamicPdfJsWorkerConfigLoader />
            {children}
            <CustomAlertModal />
          </AlertProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}