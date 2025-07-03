// src/app/layout.jsx
import "./globals.css"; // This is crucial
// No Metadata type import needed for JS
import { Geist, Geist_Mono } from "next/font/google";
import { LanguageProvider } from "@/contexts/LanguageContext"; // Assuming .js/.jsx
import { AlertProvider } from "@/contexts/AlertContext";       // Assuming .js/.jsx
import CustomAlertModal from "@/components/CustomAlertModal"; // Assuming .js/.jsx
import DynamicPdfJsWorkerConfigLoader from "@/components/DynamicPdfJsWorkerConfigLoader"; // Assuming .js/.jsx
import StagewiseToolbarWrapper from '@/components/StagewiseToolbar'; // Assuming .js/.jsx

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Metadata can be exported as a plain object in JS
export const metadata = {
  title: "PDF Converter", // Will be adapted later for Image Translator
  description: "Image Translation and PDF Tool", // Will be adapted
};

export default function RootLayout({ children }) { // Removed type annotations
  return (
    <html lang="en"> {/* This lang attribute can be dynamic via LanguageContext if needed later */}
      <body
        className={`
          ${geistSans.variable}
          ${geistMono.variable}
        `}
      >
        <LanguageProvider>
          <AlertProvider>
            <DynamicPdfJsWorkerConfigLoader />
            {process.env.NODE_ENV === 'development' && <StagewiseToolbarWrapper />}
            {children}
            <CustomAlertModal />
          </AlertProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
