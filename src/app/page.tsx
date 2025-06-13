// src/app/page.tsx
'use client';

import Head from 'next/head';
import { useEffect, useState } from 'react'; 
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ConverterSection from '@/components/ConverterSection';
import ShowcaseSection from '@/components/ShowcaseSection';
import PreviewArea from '@/components/PreviewArea';
import PricingCard from '@/components/PricingCard';
import FaqItem from '@/components/FaqItem';
import TestimonialCard from '@/components/TestimonialCard';
import DynamicFullScreenModalLoader from '@/components/DynamicFullScreenModalLoader'; 
import { useLanguage } from '@/contexts/LanguageContext';
import type { LanguageKey } from '@/translations'; // Import LanguageKey type

const digitalFeatures = [
  { iconSVG: '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-text text-purple-400"><path d="M15 2H8a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>', titleKey: "digitalFeature1Title", descriptionKey: "digitalFeature1Desc" },
  { iconSVG: '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-code text-orange-400"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>', titleKey: "digitalFeature4Title", descriptionKey: "digitalFeature4Desc" },
  { iconSVG: '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-layers text-yellow-400"><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.17a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.17a2 2 0 0 1-1.66 0L2 12.65"/></svg>', titleKey: "digitalFeature3Title", descriptionKey: "digitalFeature3Desc" },
  { iconSVG: '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-zap text-teal-400"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>', titleKey: "digitalFeature2Title", descriptionKey: "digitalFeature2Desc" },
];

const imageFeatures = [
  { iconSVG: '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-cpu text-orange-400"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M9 2v2"/><path d="M9 20v2"/><path d="M2 9h2"/><path d="M20 9h2"/><path d="M2 15h2"/><path d="M20 15h2"/></svg>', titleKey: "imageFeature1Title", descriptionKey: "imageFeature1Desc" },
  { iconSVG: '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-table text-yellow-400"><path d="M12 3v18"/><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/></svg>', titleKey: "imageFeature2Title", descriptionKey: "imageFeature2Desc" },
  { iconSVG: '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-globe text-teal-400"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>', titleKey: "imageFeature3Title", descriptionKey: "imageFeature3Desc" },
  { iconSVG: '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye text-purple-400"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>', titleKey: "imageFeature4Title", descriptionKey: "imageFeature4Desc" },
];

const pricingData = [
  { planTitleKey: "pricingFreeTitle", planDescriptionKey: "pricingFreeDesc", buttonTextKey: "uploadBtn", buttonId: "pricing-free-btn", idPrefix: "pricing-free", borderColor: 'border-gray-600', bgColor: 'bg-gray-700', textColor: 'text-gray-100', buttonBgColor: 'bg-gray-600', buttonTextColor: 'text-gray-200', buttonHoverBgColor: 'hover:bg-gray-500', sectionTarget: 'digital-converter' },
  { planTitleKey: "pricingProTitle", planDescriptionKey: "pricingProDesc", buttonTextKey: "pricingPayBtn", buttonId: "pricing-pro-btn", idPrefix: "pricing-pro", isFeatured: true, borderColor: 'border-purple-600', bgColor: 'bg-purple-800', textColor: 'text-white', buttonBgColor: 'bg-white', buttonTextColor: 'text-purple-700', buttonHoverBgColor: 'hover:bg-gray-200', sectionTarget: 'pricing' }, 
  { planTitleKey: "pricingCountTitle", planDescriptionKey: "pricingCountDesc", buttonTextKey: "pricingPayBtn", buttonId: "pricing-count-btn", idPrefix: "pricing-count", borderColor: 'border-orange-600', bgColor: 'bg-gray-700', textColor: 'text-gray-100', buttonBgColor: 'bg-orange-500', buttonTextColor: 'text-white', buttonHoverBgColor: 'hover:bg-orange-600', sectionTarget: 'pricing' }, 
];

const faqData = [
  { questionId: "faq1-question", questionTextKey: "faq1Question", answerId: "faq1-answer", answerTextKey: "faq1Answer" },
  { questionId: "faq2-question", questionTextKey: "faq2Question", answerId: "faq2-answer", answerTextKey: "faq2Answer" },
  { questionId: "faq3-question", questionTextKey: "faq3Question", answerId: "faq3-answer", answerTextKey: "faq3Answer" },
  { questionId: "faq4-question", questionTextKey: "faq4Question", answerId: "faq4-answer", answerTextKey: "faq4Answer" },
  { questionId: "faq5-question", questionTextKey: "faq5Question", answerId: "faq5-answer", answerTextKey: "faq5Answer" },
  { questionId: "faq6-question", questionTextKey: "faq6Question", answerId: "faq6-answer", answerTextKey: "faq6Answer" },
  { questionId: "faq7-question", questionTextKey: "faq7Question", answerId: "faq7-answer", answerTextKey: "faq7Answer" },
  { questionId: "faq8-question", questionTextKey: "faq8Question", answerId: "faq8-answer", answerTextKey: "faq8Answer" },
];

const testimonialData = [
  { testimonialId: "testimonial1-text", textKey: "testimonial1Text", borderColorClass: "border-purple-600" },
  { testimonialId: "testimonial2-text", textKey: "testimonial2Text", borderColorClass: "border-orange-600" },
];

const gradientTextClass = "bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500";

export default function Home() {
  const { t, currentLanguage, translationsObject } = useLanguage(); // Get translationsObject

  // States for PreviewArea
  const [globalUploadedPdfFile, setGlobalUploadedPdfFile] = useState<File | null>(null);
  const [globalDocxPreviewImageUrls, setGlobalDocxPreviewImageUrls] = useState<string[] | null>(null);
  const [globalDocxDownloadUrl, setGlobalDocxDownloadUrl] = useState<string | null>(null);
  const [globalIsLoading, setGlobalIsLoading] = useState<boolean>(false);
  const [globalConversionHasOccurred, setGlobalConversionHasOccurred] = useState<boolean>(false);
  const [activeConverter, setActiveConverter] = useState<'digital' | 'image' | null>(null);

  // States for FullScreenPreviewModal
  const [isFullScreenOpen, setIsFullScreenOpen] = useState(false);
  const [fullScreenDocType, setFullScreenDocType] = useState<'pdf' | 'docx' | null>(null);
  const [currentPdfFileForFullScreen, setCurrentPdfFileForFullScreen] = useState<File | null>(null);
  const [currentDocxImagesForFullScreen, setCurrentDocxImagesForFullScreen] = useState<string[] | null>(null);
  const [initialFullScreenPage, setInitialFullScreenPage] = useState<number>(1);


  useEffect(() => {
    if (window.lucide) {
      window.lucide.createIcons();
    }
    document.documentElement.lang = currentLanguage;
  }, [currentLanguage]);
  
  let pageTitle = "PDF Converter"; 
  const langKey = currentLanguage as LanguageKey; 

  if (translationsObject && translationsObject[langKey] && translationsObject[langKey].logo) {
    pageTitle = translationsObject[langKey].logo;
  } else if (translationsObject && translationsObject.en && translationsObject.en.logo) { 
    pageTitle = translationsObject.en.logo;
  }


  // Callbacks to update global state from ConverterSection
  const handleConversionStart = (converterType: 'digital' | 'image') => {
    setActiveConverter(converterType);
    setGlobalIsLoading(true);
    setGlobalConversionHasOccurred(true); 
    setGlobalDocxPreviewImageUrls(null); 
    setGlobalDocxDownloadUrl(null);
  };

  const handleConversionSuccess = (converterType: 'digital' | 'image', downloadUrl: string, previewImageUrls: string[] | null, originalPdfFile: File | null) => {
    if (activeConverter === converterType) {
      setGlobalDocxDownloadUrl(downloadUrl);
      setGlobalDocxPreviewImageUrls(previewImageUrls);
      setGlobalUploadedPdfFile(originalPdfFile); 
      setGlobalIsLoading(false);
    }
  };

  const handleConversionError = (converterType: 'digital' | 'image', errorMessage: string) => {
    if (activeConverter === converterType) {
      setGlobalIsLoading(false);
      setGlobalDocxPreviewImageUrls(null);
      setGlobalDocxDownloadUrl(null);
    }
  };
  
  const handleFileSelectedInPage = (converterType: 'digital' | 'image', file: File | null) => {
    setActiveConverter(converterType); 
    setGlobalUploadedPdfFile(file);
    setGlobalDocxPreviewImageUrls(null);
    setGlobalDocxDownloadUrl(null);
    setGlobalConversionHasOccurred(false);
    setGlobalIsLoading(false);
  };

  // Functions to open the full-screen modal
  const openPdfInFullScreen = (file: File | null, page: number = 1) => {
    if (!file) return;
    setCurrentPdfFileForFullScreen(file);
    setFullScreenDocType('pdf');
    setInitialFullScreenPage(page);
    setIsFullScreenOpen(true);
  };

  const openDocxInFullScreen = (urls: string[] | null, page: number = 1) => {
    if (!urls || urls.length === 0) return;
    setCurrentDocxImagesForFullScreen(urls);
    setFullScreenDocType('docx');
    setInitialFullScreenPage(page);
    setIsFullScreenOpen(true);
  };

  const closeFullScreenModal = () => {
    setIsFullScreenOpen(false);
    setTimeout(() => {
      setFullScreenDocType(null);
      setCurrentPdfFileForFullScreen(null);
      setCurrentDocxImagesForFullScreen(null);
    }, 300); 
  };

  const handlePricingCardClick = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };


  return (
    <>
      <Head>
        <title>{pageTitle}</title>
         <script src="https://unpkg.com/lucide@latest" async defer></script>
      </Head>

      <div className="min-h-screen bg-gray-950 text-gray-200 font-sans overflow-x-hidden">
        <Header />

        <main>
          <section id="hero" className="text-white py-24">
            <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between space-y-8 md:space-y-0 md:space-x-12">
              <div className="w-full md:w-1/2 text-center md:text-left">
                  <h1 
                    className="text-4xl md:text-6xl font-extrabold mb-4 animate-slide-in-up text-purple-300 bg-red-500" 
                    id="hero-main-message"
                    dangerouslySetInnerHTML={{ __html: t('heroMainMessage').replace(/\$\{gradientTextClass\}/g, gradientTextClass) }}
                  ></h1>
                  <div className="inline-flex items-center bg-gray-800 text-gray-300 text-sm px-4 py-2 rounded-full mb-6 shadow-md animate-fade-in-down">
                      <span className="w-2 h-2 bg-orange-400 rounded-full mr-2 animate-pulse-subtle"></span>
                      <span 
                        id="hero-tag-message"
                        dangerouslySetInnerHTML={{ __html: t('heroTag').replace(/\$\{gradientTextClass\}/g, gradientTextClass) }}
                      ></span>
                  </div>
                  <div className="flex flex-col md:flex-row justify-center md:justify-start space-y-4 md:space-y-0 md:space-x-6 animate-slide-in-up delay-200">
                      <button 
                        className="bg-white text-purple-700 px-8 py-3 rounded-full text-lg font-semibold hover:bg-gray-200 transition-all duration-300 shadow-lg transform hover:scale-105" 
                        id="hero-digital-btn"
                        onClick={(e) => { e.preventDefault(); document.getElementById('digital-converter')?.scrollIntoView({ behavior: 'smooth' }); }}
                      >
                        {t('heroDigitalBtn')}
                      </button>
                      <button 
                        className="bg-white text-indigo-700 px-8 py-3 rounded-full text-lg font-semibold hover:bg-gray-200 transition-all duration-300 shadow-lg transform hover:scale-105" 
                        id="hero-image-btn"
                        onClick={(e) => { e.preventDefault(); document.getElementById('image-converter')?.scrollIntoView({ behavior: 'smooth' }); }}
                      >
                        {t('heroImageBtn')}
                      </button>
                  </div>
                  <input type="file" id="file-input" className="hidden" accept="application/pdf" />
              </div>
              <div className="w-full md:w-1/2 h-80 md:h-90 bg-cover bg-center rounded-xl shadow-lg relative hero-image-container" style={{ backgroundImage: "url('/2.png')" }}>
              </div>
            </div>
          </section>

          <ConverterSection
            id="digital-converter"
            sectionTitleKey="digitalConverterTitle"
            sectionSubtitleKey="digitalConverterSubtitle"
            featuresData={digitalFeatures}
            dropzoneId="digital-dropzone"
            selectedFileId="digital-selected-file"
            conversionAreaId="digital-conversion-area"
            convertBtnId="digital-convert-btn"
            loadingSpinnerId="digital-loading-spinner"
            // downloadConvertedBtnId prop removed
            // editOnlineBtnId prop removed
            // summarizeBtnId prop removed (as it was removed in ConverterSection)
            progressBarContainerId="digital-progress-bar-container"
            progressBarId="digital-progress-bar"
            statusMessageId="digital-status-message"
            isImageConverterType={false}
            conversionType="digital"
            onFileSelected={handleFileSelectedInPage}
            onConversionStart={handleConversionStart}
            onConversionSuccess={handleConversionSuccess} 
            onConversionError={handleConversionError}
            // showGlobalLoading={activeConverter === 'digital' && globalIsLoading}
          />

          <ConverterSection
            id="image-converter"
            sectionTitleKey="imageConverterTitle"
            sectionSubtitleKey="imageConverterSubtitle"
            featuresData={imageFeatures}
            dropzoneId="image-dropzone"
            selectedFileId="image-selected-file"
            conversionAreaId="image-conversion-area"
            convertBtnId="image-convert-btn"
            loadingSpinnerId="image-loading-spinner"
            // downloadConvertedBtnId prop removed
            // editOnlineBtnId prop removed
            // summarizeBtnId prop removed
            progressBarContainerId="image-progress-bar-container"
            progressBarId="image-progress-bar"
            statusMessageId="image-status-message"
            isImageConverterType={true}
            conversionType="image"
            onFileSelected={handleFileSelectedInPage}
            onConversionStart={handleConversionStart}
            onConversionSuccess={handleConversionSuccess}
            onConversionError={handleConversionError}
            // showGlobalLoading={activeConverter === 'image' && globalIsLoading}
          />

          <ShowcaseSection />
          <PreviewArea 
            uploadedPdfFile={globalUploadedPdfFile}
            docxPreviewImageUrls={globalDocxPreviewImageUrls}
            docxDownloadUrl={globalDocxDownloadUrl}
            isLoading={globalIsLoading && activeConverter !== null} 
            conversionHasOccurred={globalConversionHasOccurred}
            onPdfPaneClick={() => openPdfInFullScreen(globalUploadedPdfFile)}
            onDocxPaneClick={() => openDocxInFullScreen(globalDocxPreviewImageUrls)}
          />

          <section id="pricing" className="py-20 bg-gray-800">
            <div className="container mx-auto px-4">
                <h2 className="text-3xl md:text-4xl font-bold text-center mb-8 text-gray-100" id="pricing-title">{t('pricingTitle')}</h2>
                <p className="text-xl text-gray-300 text-center mb-16 max-w-3xl mx-auto" id="pricing-subtitle">{t('pricingSubtitle')}</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    {pricingData.map(plan => (
                        <PricingCard
                            key={plan.idPrefix}
                            planTitleKey={plan.planTitleKey}
                            planDescriptionKey={plan.planDescriptionKey}
                            buttonTextKey={plan.buttonTextKey}
                            buttonId={plan.buttonId}
                            isFeatured={plan.isFeatured}
                            borderColor={plan.borderColor}
                            bgColor={plan.bgColor}
                            textColor={plan.textColor}
                            buttonBgColor={plan.buttonBgColor}
                            buttonTextColor={plan.buttonTextColor}
                            buttonHoverBgColor={plan.buttonHoverBgColor}
                            idPrefix={plan.idPrefix}
                            onClick={() => handlePricingCardClick(plan.sectionTarget)}
                        />
                    ))}
                </div>
                <div className="text-center mt-12">
                    <button 
                      className="bg-green-600 text-white px-10 py-4 rounded-lg text-xl font-semibold hover:bg-green-700 transition-colors duration-300 shadow-lg transform hover:scale-105" 
                      id="pricing-pay-btn"
                      onClick={() => handlePricingCardClick('pricing')} 
                    >
                      {t('pricingPayBtn')}
                    </button>
                </div>
            </div>
          </section>

          <section id="about" className="py-20 bg-gray-900">
            <div className="container mx-auto px-4 text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-center mb-8 text-gray-100" id="about-title">{t('aboutTitle')}</h2>
                <p className="text-xl text-gray-300 text-center mb-16 max-w-3xl mx-auto" id="about-subtitle">{t('aboutSubtitle')}</p>
                <div className="flex justify-center space-x-8 mb-8">
                    <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center text-gray-400 text-sm font-medium shadow-md">
                        <img src="https://placehold.co/96x96/4B5563/D1D5DB?text=Team+Member" alt="Team Member" className="w-full h-full object-cover rounded-full" />
                    </div>
                    <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center text-gray-400 text-sm font-medium shadow-md">
                        <img src="https://placehold.co/96x96/4B5563/D1D5DB?text=Team+Member" alt="Team Member" className="w-full h-full object-cover rounded-full" />
                    </div>
                    <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center text-gray-400 text-sm font-medium shadow-md">
                        <img src="https://placehold.co/96x96/4B5563/D1D5DB?text=Team+Member" alt="Team Member" className="w-full h-full object-cover rounded-full" />
                    </div>
                </div>
                <p className="text-gray-300 text-lg mb-6" id="about-members">{t('aboutMembers')}</p>
                <p className="text-2xl font-semibold text-purple-500 mb-6" id="about-mission">{t('aboutMission')}</p>
                <p className="text-gray-400 max-w-3xl mx-auto" id="about-story">{t('aboutStory')}</p>
            </div>
          </section>
          
          <section id="testimonials" className="py-20 bg-gray-800">
            <div className="container mx-auto px-4">
                <h2 className="text-3xl md:text-4xl font-bold text-center mb-8 text-gray-100" id="testimonials-title">{t('testimonialsTitle')}</h2>
                <p className="text-xl text-gray-300 text-center mb-16 max-w-3xl mx-auto" id="testimonials-subtitle">{t('testimonialsSubtitle')}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {testimonialData.map(testimonial => (
                        <TestimonialCard
                            key={testimonial.testimonialId}
                            testimonialId={testimonial.testimonialId}
                            textKey={testimonial.textKey}
                            borderColorClass={testimonial.borderColorClass}
                        />
                    ))}
                </div>
            </div>
          </section>

          <section id="faq" className="py-20 bg-gray-900">
            <div className="container mx-auto px-4">
                <h2 className="text-3xl md:text-4xl font-bold text-center mb-8 text-gray-100" id="faq-title">{t('faqTitle')}</h2>
                <p className="text-xl text-gray-300 text-center mb-16 max-w-3xl mx-auto" id="faq-subtitle">{t('faqSubtitle')}</p>
                <div className="space-y-8 max-w-3xl mx-auto">
                    {faqData.map(faq => (
                        <FaqItem
                            key={faq.questionId}
                            questionId={faq.questionId}
                            questionTextKey={faq.questionTextKey}
                            answerId={faq.answerId}
                            answerTextKey={faq.answerTextKey}
                        />
                    ))}
                </div>
            </div>
          </section>

          <section id="start-converting" className="py-20 bg-gray-800 text-center">
            <div className="container mx-auto px-4">
                <h2 className="text-3xl md:text-4xl font-bold text-center mb-8 text-gray-100" id="start-converting-title">{t('startConvertingTitle')}</h2>
                <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto" id="start-converting-subtitle">{t('startConvertingSubtitle')}</p>
                <div className="flex flex-col md:flex-row justify-center space-y-6 md:space-y-0 md:space-x-8">
                    <button 
                        className="bg-purple-600 text-white px-8 py-3 rounded-lg text-xl font-semibold hover:bg-purple-700 transition-colors duration-300 shadow-lg transform hover:scale-105 flex items-center justify-center" 
                        id="start-digital-btn"
                        onClick={(e) => { e.preventDefault(); document.getElementById('digital-converter')?.scrollIntoView({ behavior: 'smooth' }); }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-digit mr-3 w-6 h-6"><line x1="9" x2="9" y1="12" y2="18"/><line x1="15" x2="15" y1="6" y2="18"/><path d="M12 12a4 4 0 0 0-4 4v2a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-2a4 4 0 0 0-4-4Z"/><path d="M4 22h16a2 2 0 0 0 2-2V8L14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2Z"/><path d="M14 2v6h6"/></svg>
                        <span id="start-digital-btn-text">{t('startDigitalBtn')}</span>
                    </button>
                    <button 
                        className="bg-indigo-600 text-white px-8 py-3 rounded-lg text-xl font-semibold hover:bg-indigo-700 transition-colors duration-300 shadow-lg transform hover:scale-105 flex items-center justify-center" 
                        id="start-image-btn"
                        onClick={(e) => { e.preventDefault(); document.getElementById('image-converter')?.scrollIntoView({ behavior: 'smooth' }); }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-scan-text mr-3 w-6 h-6"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M7 12h10"/><path d="M12 17v-5"/></svg>
                        <span id="start-image-btn-text">{t('startImageBtn')}</span>
                    </button>
                </div>
            </div>
          </section>
        </main>

        <Footer />

        <DynamicFullScreenModalLoader
          isOpen={isFullScreenOpen}
          onClose={closeFullScreenModal}
          documentType={fullScreenDocType}
          pdfFile={currentPdfFileForFullScreen}
          docxImageUrls={currentDocxImagesForFullScreen}
          initialPage={initialFullScreenPage}
        />
        
      </div>
    </>
  );
}
