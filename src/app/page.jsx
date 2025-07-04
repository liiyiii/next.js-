// src/app/page.jsx
'use client';

import Head from 'next/head';
import { useEffect } from 'react'; // Removed useState as old states are gone
// Removed dynamic as AdvancedEditInterface is no longer used here
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ImageTranslator from '@/components/ImageTranslator';
import { useLanguage } from '@/contexts/LanguageContext';
// Removed LanguageKey type import, not needed for JS and old logic gone
import FeatureCard from '@/components/FeatureCard';
import FaqItem from '@/components/FaqItem';
import TestimonialCard from '@/components/TestimonialCard'; // Import the refactored TestimonialCard

// Removed all constants like digitalFeatures, imageFeatures, pricingData, faqData, testimonialData

const gradientTextClass = "bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500"; // Keep for potential use in new hero

const imageTranslationFeatures = [
  {
    iconSVG: '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-scan-search"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><circle cx="12" cy="12" r="3"/><path d="m16 16-1.9-1.9"/></svg>',
    titleKey: "feature1Title",
    descriptionKey: "feature1Desc"
  },
  {
    iconSVG: '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-edit"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>',
    titleKey: "feature2Title",
    descriptionKey: "feature2Desc"
  },
  {
    iconSVG: '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-crop"><path d="M6.13 1L6 16a2 2 0 0 0 2 2h15"/><path d="M1 6.13L16 6a2 2 0 0 1 2 2v15"/></svg>',
    titleKey: "feature3Title",
    descriptionKey: "feature3Desc"
  },
  {
    iconSVG: '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-output"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 12H8v4h2v-4Z"/><path d="m16 12-2.5 2.5L11 12"/></svg>',
    titleKey: "feature4Title",
    descriptionKey: "feature4Desc"
  },
];


export default function Home() {
  const { t, currentLanguage, translationsObject } = useLanguage();

  // All state variables related to PDF conversion, modals, edit mode are removed.
  // If ImageTranslator needs any props passed from page level, they would be defined here.

  useEffect(() => {
    // Lucide icons setup (if still used by Header/Footer or new UI parts)
    if (window.lucide) {
      window.lucide.createIcons();
    }
    document.documentElement.lang = currentLanguage;
  }, [currentLanguage]);

  // Determine page title for the new Image Translator App
  let pageTitle = "Image Translator"; // New default title
  const siteNameKey = "imageTranslatorSiteName"; // New translation key for site name/logo text
  const siteDescriptionKey = "imageTranslatorSiteDescription"; // New translation key for site description

  if (translationsObject && translationsObject[currentLanguage] && translationsObject[currentLanguage][siteNameKey]) {
    pageTitle = translationsObject[currentLanguage][siteNameKey];
  } else if (translationsObject && translationsObject.en && translationsObject.en[siteNameKey]) {
    pageTitle = translationsObject.en[siteNameKey];
  }

  const pageDescription = t(siteDescriptionKey);


  // The old 'AdvancedEditMode' logic is removed as it was tied to PDF editing.
  // The new ImageTranslator component handles its own editing flow.

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        {/* Ensure lucide script is still relevant or remove if not used by remaining components */}
        <script src="https://unpkg.com/lucide@latest" async defer></script>
      </Head>

      <div className="min-h-screen bg-gray-950 text-gray-200 font-sans flex flex-col">
        <Header /> {/* Header will need its nav links updated */}

        <main className="flex-grow w-full">
          {/* New Hero Section for Image Translator */}
          <section id="hero-image-translator" className="text-white py-16 sm:py-24 bg-gray-900">
            <div className="container mx-auto px-4 text-center">
              <h1
                className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-6"
                dangerouslySetInnerHTML={{ __html: t('imageTranslatorHeroTitle').replace(/\$\{gradientTextClass\}/g, gradientTextClass) }}
              ></h1>
              <p className="text-lg sm:text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
                {t('imageTranslatorHeroSubtitle')}
              </p>
              {/* Optional: A call to action button if needed, or directly lead to the tool below */}
              {/* Example:
                <button
                  className="btn btn-primary btn-lg"
                  onClick={() => document.getElementById('image-translator-tool')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  {t('imageTranslatorHeroCTA')}
                </button>
              */}
            </div>
          </section>

          {/* Core Image Translator Tool Section */}
          <section id="image-translator-tool" className="py-10 sm:py-16 bg-gray-800"> {/* Changed background for tool section */}
            <div className="container mx-auto px-4">
              <ImageTranslator />
            </div>
          </section>

          {/* Features Section */}
          <section id="features" className="py-16 sm:py-24 bg-gray-950">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl sm:text-4xl font-bold text-center mb-6 text-white">
                {t('featuresSectionTitle')}
              </h2>
              <p className="text-lg sm:text-xl text-gray-400 text-center mb-12 max-w-2xl mx-auto">
                {t('featuresSectionSubtitle')}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {imageTranslationFeatures.map((feature, index) => (
                  <FeatureCard
                    key={index}
                    iconSVG={feature.iconSVG}
                    titleKey={feature.titleKey}
                    descriptionKey={feature.descriptionKey}
                    idPrefix="it-feature"
                    featureIndex={index + 1}
                  />
                ))}
              </div>
            </div>
          </section>

          {/* Placeholder for How It Works, Use Cases, FAQ, Testimonials sections */}
          {/* These will be added in subsequent steps */}

          {/* How It Works Section */}
          <section id="how-it-works" className="py-16 sm:py-24 bg-gray-800">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl sm:text-4xl font-bold text-center mb-6 text-white">
                {t('howItWorksSectionTitle')}
              </h2>
              {/* <p className="text-lg sm:text-xl text-gray-400 text-center mb-12 max-w-2xl mx-auto">
                {t('howItWorksSectionSubtitle')} // No subtitle defined for this one yet
              </p> */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 text-center">
                {/* Step 1 */}
                <div className="p-6 bg-gray-700 rounded-xl shadow-lg">
                  <div className="text-purple-400 mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-800 text-3xl font-bold">1</div>
                  <h3 className="text-xl font-semibold text-purple-300 mb-2">{t('howItWorksStep1Title')}</h3>
                  <p className="text-gray-300 text-sm">{t('howItWorksStep1Desc')}</p>
                </div>
                {/* Step 2 */}
                <div className="p-6 bg-gray-700 rounded-xl shadow-lg">
                  <div className="text-purple-400 mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-800 text-3xl font-bold">2</div>
                  <h3 className="text-xl font-semibold text-purple-300 mb-2">{t('howItWorksStep2Title')}</h3>
                  <p className="text-gray-300 text-sm">{t('howItWorksStep2Desc')}</p>
                </div>
                {/* Step 3 */}
                <div className="p-6 bg-gray-700 rounded-xl shadow-lg">
                  <div className="text-purple-400 mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-800 text-3xl font-bold">3</div>
                  <h3 className="text-xl font-semibold text-purple-300 mb-2">{t('howItWorksStep3Title')}</h3>
                  <p className="text-gray-300 text-sm">{t('howItWorksStep3Desc')}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Showcase Section */}
          <section id="showcase" className="py-16 sm:py-24 bg-gray-950">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl sm:text-4xl font-bold text-center mb-6 text-white">
                {t('showcaseSectionTitle')}
              </h2>
              <p className="text-lg sm:text-xl text-gray-400 text-center mb-16 max-w-2xl mx-auto">
                {t('showcaseSectionSubtitle')}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Example 1: Comic */}
                <div className="bg-gray-800 p-6 rounded-xl shadow-xl">
                  <h3 className="text-2xl font-semibold text-purple-300 mb-4 text-center">{t('showcaseExample1Title')}</h3>
                  <div className="grid grid-cols-2 gap-4 mb-3 items-center">
                    <div>
                      <p className="text-sm text-center text-gray-400 mb-1">{t('showcaseBeforeLabel')}</p>
                      <img src="https://placehold.co/600x400/gray/white?text=Comic+Before" alt="Comic Before Translation" className="rounded-md shadow-md w-full h-auto aspect-[3/2] object-cover"/>
                    </div>
                    <div>
                      <p className="text-sm text-center text-gray-400 mb-1">{t('showcaseAfterLabel')}</p>
                      <img src="https://placehold.co/600x400/purple/white?text=Comic+After+Translated" alt="Comic After Translation" className="rounded-md shadow-md w-full h-auto aspect-[3/2] object-cover"/>
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm">{t('showcaseExample1Desc')}</p>
                </div>
                {/* Example 2: Social Media */}
                <div className="bg-gray-800 p-6 rounded-xl shadow-xl">
                  <h3 className="text-2xl font-semibold text-purple-300 mb-4 text-center">{t('showcaseExample2Title')}</h3>
                  <div className="grid grid-cols-2 gap-4 mb-3 items-center">
                    <div>
                      <p className="text-sm text-center text-gray-400 mb-1">{t('showcaseBeforeLabel')}</p>
                      <img src="https://placehold.co/600x400/darkblue/white?text=Social+Post+Original" alt="Social Media Before Translation" className="rounded-md shadow-md w-full h-auto aspect-[3/2] object-cover"/>
                    </div>
                    <div>
                      <p className="text-sm text-center text-gray-400 mb-1">{t('showcaseAfterLabel')}</p>
                      <img src="https://placehold.co/600x400/teal/white?text=Social+Post+Translated" alt="Social Media After Translation" className="rounded-md shadow-md w-full h-auto aspect-[3/2] object-cover"/>
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm">{t('showcaseExample2Desc')}</p>
                </div>
                {/* Example 3: Manual */}
                <div className="bg-gray-800 p-6 rounded-xl shadow-xl">
                  <h3 className="text-2xl font-semibold text-purple-300 mb-4 text-center">{t('showcaseExample3Title')}</h3>
                  <div className="grid grid-cols-2 gap-4 mb-3 items-center">
                    <div>
                      <p className="text-sm text-center text-gray-400 mb-1">{t('showcaseBeforeLabel')}</p>
                      <img src="https://placehold.co/600x400/darkslategray/white?text=Manual+Original+Text" alt="Manual Before Translation" className="rounded-md shadow-md w-full h-auto aspect-[3/2] object-cover"/>
                    </div>
                    <div>
                      <p className="text-sm text-center text-gray-400 mb-1">{t('showcaseAfterLabel')}</p>
                      <img src="https://placehold.co/600x400/indigo/white?text=Manual+Translated" alt="Manual After Translation" className="rounded-md shadow-md w-full h-auto aspect-[3/2] object-cover"/>
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm">{t('showcaseExample3Desc')}</p>
                </div>
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section id="faq-it" className="py-16 sm:py-24 bg-gray-800"> {/* Alternating background color */}
            <div className="container mx-auto px-4">
              <h2 className="text-3xl sm:text-4xl font-bold text-center mb-6 text-white">
                {t('faqSectionTitle')}
              </h2>
              <p className="text-lg sm:text-xl text-gray-400 text-center mb-12 max-w-2xl mx-auto">
                {t('faqSectionSubtitle')}
              </p>
              <div className="space-y-5 max-w-3xl mx-auto">
                <FaqItem
                  questionId="it-faq1-q"
                  questionTextKey="itFaq1Question"
                  answerId="it-faq1-a"
                  answerTextKey="itFaq1Answer"
                />
                <FaqItem
                  questionId="it-faq2-q"
                  questionTextKey="itFaq2Question"
                  answerId="it-faq2-a"
                  answerTextKey="itFaq2Answer"
                />
                <FaqItem
                  questionId="it-faq3-q"
                  questionTextKey="itFaq3Question"
                  answerId="it-faq3-a"
                  answerTextKey="itFaq3Answer"
                />
                <FaqItem
                  questionId="it-faq4-q"
                  questionTextKey="itFaq4Question"
                  answerId="it-faq4-a"
                  answerTextKey="itFaq4Answer"
                />
              </div>
            </div>
          </section>

          {/* Testimonials Section */}
          <section id="testimonials-it" className="py-16 sm:py-24 bg-gray-950">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl sm:text-4xl font-bold text-center mb-6 text-white">
                {t('testimonialsSectionTitle')}
              </h2>
              <p className="text-lg sm:text-xl text-gray-400 text-center mb-16 max-w-2xl mx-auto">
                {t('testimonialsSectionSubtitle')}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <TestimonialCard
                  testimonialId="it-testimonial1"
                  textKey="itTestimonial1Text"
                  authorKey="itTestimonial1Author"
                  borderColorClass="border-purple-500"
                />
                <TestimonialCard
                  testimonialId="it-testimonial2"
                  textKey="itTestimonial2Text"
                  authorKey="itTestimonial2Author"
                  borderColorClass="border-teal-500"
                />
                <TestimonialCard
                  testimonialId="it-testimonial3"
                  textKey="itTestimonial3Text"
                  authorKey="itTestimonial3Author"
                  borderColorClass="border-sky-500" // Changed for variety
                />
              </div>
            </div>
          </section>

        </main>

        <Footer />

        {/* DynamicFullScreenModalLoader is removed as it was for PDF/DOCX previews */}
      </div>
    </>
  );
}
