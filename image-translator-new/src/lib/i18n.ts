import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
// LanguageDetector can be added if needed, but path-based is primary for app router
// import LanguageDetector from 'i18next-browser-languagedetector';

// Placeholder resources (ideally from public/locales/[lang]/[namespace].json)
export const resources = {
  en: {
    translation: {
      navHome: "Home",
      navTool: "Translator Tool",
      navPricing: "Pricing",
      navFAQ: "FAQ",
      navAbout: "About Us",
      footerRights: "All rights reserved.",
      homeTitle: "NEXUS-IMAGE TRANSLATOR",
      homeSubtitle: "AI Powered + Manual Refinement for Perfect Image Translations.",
      homeCTA: "Try the Tool",
      aboutTitle: "About NEXUS-IMAGE TRANSLATOR",
      aboutText: "We are dedicated to providing the best image translation experience...",
      pricingTitle: "Our Pricing Plans",
      pricingFree: "Free Tier",
      pricingPro: "Pro Tier",
      faqTitle: "Frequently Asked Questions",
      faqQ1: "What is this tool?",
      faqA1: "This tool helps you translate text within images.",
    }
  },
  zh: {
    translation: {
      navHome: "首页",
      navTool: "翻译工具",
      navPricing: "价格",
      navFAQ: "常见问题",
      navAbout: "关于我们",
      footerRights: "版权所有。",
      homeTitle: "NEXUS-IMAGE 翻译器",
      homeSubtitle: "AI驱动 + 人工精修，实现完美图片翻译。",
      homeCTA: "试用工具",
      aboutTitle: "关于 NEXUS-IMAGE 翻译器",
      aboutText: "我们致力于提供最佳的图片翻译体验...",
      pricingTitle: "我们的价格计划",
      pricingFree: "免费版",
      pricingPro: "专业版",
      faqTitle: "常见问题解答",
      faqQ1: "这是什么工具？",
      faqA1: "本工具帮助您翻译图片内的文字。",
    }
  }
};

if (!i18n.isInitialized) {
  i18n
    // .use(LanguageDetector) // Optional: for detecting language from browser settings if no lang in path
    .use(initReactI18next)
    .init({
      resources,
      lng: 'en', // Default language, will be overridden by context/path
      fallbackLng: 'en',
      debug: process.env.NODE_ENV === 'development',
      interpolation: {
        escapeValue: false, // React already protects from XSS
      },
      // detection: { // Example if using LanguageDetector
      //   order: ['path', 'cookie', 'localStorage', 'navigator'],
      //   caches: ['cookie', 'localStorage'],
      // },
    });
}

export const DEFAULT_LANGUAGE = 'en';
export const SUPPORTED_LANGUAGES = ['en', 'zh'];

export default i18n;
