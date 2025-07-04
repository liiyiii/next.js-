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
// Note: For dynamic metadata based on language, this static export might need
// to be handled differently, or the title/description can be primarily set
// via the <Head> component in page.jsx using the t() function.
// For simplicity of this static export, we'll use hardcoded English as a base,
// but the <Head> tag in page.jsx will provide the dynamic, translated version.
export const metadata = {
  title: "Instant Image Translator", // Fallback title
  description: "Translate text within your images accurately and edit them with ease.", // Fallback description
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
