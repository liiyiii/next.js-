import { getTranslationsDictionary } from '@/lib/getTranslationsDictionary';
import Link from 'next/link';
import AboutSection from '@/components/AboutSection';
import PricingSection from '@/components/PricingSection';
import FAQSection from '@/components/FAQSection';

export default async function HomePage({ params: { lang } }: { params: { lang: string } }) {
  const t = getTranslationsDictionary(lang);

  return (
    <div className="space-y-12 md:space-y-20"> {/* Add spacing between sections */}
      {/* Hero Section */}
      <section id="hero" className="text-center py-16 md:py-24 bg-gray-900/50 rounded-xl shadow-2xl mt-8">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-6 text-brand-purple animate-fade-in-down">
            {t.homeTitle || "NEXUS-IMAGE TRANSLATOR"}
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-gray-300 mb-10 max-w-3xl mx-auto animate-fade-in-down animation-delay-300">
            {t.homeSubtitle || "AI Powered + Manual Refinement for Perfect Image Translations."}
          </p>
          <Link
            href={`/${lang}/tool`}
            className="bg-brand-blue text-white px-8 py-3 sm:px-10 sm:py-4 rounded-full text-lg font-semibold hover:bg-blue-700 transition-all duration-300 shadow-lg transform hover:scale-105 animate-slide-in-up animation-delay-600"
          >
            {t.homeCTA || "Try the Tool"}
          </Link>
        </div>
      </section>

      {/* Features Section (Placeholder) */}
      <section id="features" className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-bold mb-12 text-center text-gray-100">Key Features (Placeholder)</h2>
          <div className="grid md:grid-cols-3 gap-8 text-left">
            <div className="p-6 bg-gray-800 rounded-lg shadow-lg hover:shadow-brand-blue/30 transition-shadow duration-300">
              <h3 className="text-xl font-semibold text-brand-green mb-2">Advanced OCR</h3>
              <p className="text-gray-400">Accurate text detection in various image types.</p>
            </div>
            <div className="p-6 bg-gray-800 rounded-lg shadow-lg hover:shadow-brand-green/30 transition-shadow duration-300">
              <h3 className="text-xl font-semibold text-brand-green mb-2">Intuitive Editor</h3>
              <p className="text-gray-400">Fine-tune translations with powerful on-canvas editing tools.</p>
            </div>
            <div className="p-6 bg-gray-800 rounded-lg shadow-lg hover:shadow-brand-purple/30 transition-shadow duration-300">
              <h3 className="text-xl font-semibold text-brand-green mb-2">Multiple Export Options</h3>
              <p className="text-gray-400">Export as editable PPTX, structured JSON, or high-quality JPG/PDF.</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <AboutSection lang={lang} />

      {/* Pricing Section */}
      <PricingSection lang={lang} />

      {/* FAQ Section */}
      <FAQSection lang={lang} />

      {/* Add style for animation delays if not globally defined or via utility */}
      <style jsx global>{`
        .animation-delay-300 { animation-delay: 0.3s; }
        .animation-delay-600 { animation-delay: 0.6s; }
      `}</style>
    </div>
  );
}
