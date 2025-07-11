import type { Metadata } from "next";
// Removed Inter font import from here, it's in the root layout
// import "../globals.css"; // globals.css is imported in the root layout

import { TranslationsProvider } from "@/components/TranslationsProvider";
import { SUPPORTED_LANGUAGES } from "@/lib/i18n"; // Or from middleware

// Components for Header and Footer will be created in the next step
import Header from "@/components/Header"; // Placeholder, to be created
import Footer from "@/components/Footer"; // Placeholder, to be created


// This function can be used to generate static params for SSG
export async function generateStaticParams() {
  return SUPPORTED_LANGUAGES.map((lang) => ({ lang }));
}

// Metadata can be localized if needed, but keeping it simple for now
export const metadata: Metadata = {
  title: "NEXUS-IMAGE TRANSLATOR", // Will be translated by Head component in pages if needed
  description: "AI Powered + Manual Refinement for Perfect Image Translations.",
};

export default function LangLayout({
  children,
  params: { lang },
}: Readonly<{
  children: React.ReactNode;
  params: { lang: string };
}>) {
  return (
    <TranslationsProvider locale={lang}>
      <div className="flex flex-col min-h-screen bg-background text-foreground">
        <Header /> {/* Header will use useTranslation hook */}
        <main className="flex-grow container mx-auto px-4 py-8">
          {children}
        </main>
        <Footer /> {/* Footer will use useTranslation hook */}
      </div>
    </TranslationsProvider>
  );
}
