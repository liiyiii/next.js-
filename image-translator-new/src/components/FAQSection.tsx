'use client'; // Mark as a Client Component

import { useTranslation } from 'react-i18next'; // Use client-side hook
import { ChevronDown } from 'lucide-react';

interface FAQSectionProps {
  // lang prop is no longer needed
}

// FaqItem can remain a simple display component
const FaqItem = ({ question, answer }: { question: string; answer: string; }) => (
  <details className="p-4 bg-gray-800 rounded-lg shadow-lg group transition-all duration-300 open:bg-gray-700 open:shadow-brand-purple/30">
    <summary className="font-semibold text-lg cursor-pointer text-brand-green group-open:text-brand-blue list-none flex justify-between items-center">
      <span>{question}</span>
      {/* Chevron managed by details open state implicitly, or can be client component for explicit control */}
      <ChevronDown className="text-gray-500 group-open:rotate-180 transition-transform duration-300 transform" size={24} />
    </summary>
    <div className="mt-3 text-gray-300 leading-relaxed prose prose-invert prose-sm max-w-none">
      {/* Using prose classes for potentially Markdown-like content in answers later */}
      <p>{answer}</p>
    </div>
  </details>
);

export default function FAQSection({}: FAQSectionProps) { // Removed lang prop
  const { t } = useTranslation();

  const faqs = [
    {
      question: t('faqQ1'),
      answer: t('faqA1') + " Our unique '70% AI + 30% Manual' approach ensures high accuracy while giving you full control over the final output with professional-grade editing tools."
    },
    {
      question: "What makes this tool different from others like translateimages.com?",
      answer: "Key advantages include: 1. **No Re-uploads for Corrections:** Our '框选补漏' (Box selection for missed areas) feature uses coordinate transfer, not image re-uploads. 2. **Professional Text Editor:** Rich styling (font, size, color), free text dragging, and batch operations. 3. **Versatile Export:** Get your work as printable PDFs, structured JSON, or layered JPGs. 4. **Smart State Persistence:** Recover your work after refreshes and easily identify OCR problem areas."
    },
    {
      question: "What languages are supported for OCR and translation?",
      answer: "The current backend scripts primarily support English and Chinese for OCR. The translation capabilities will depend on the specific translation engine integrated. We aim to support a wide range of languages."
    },
    {
      question: "What file formats can I upload for translation?",
      answer: "For the MVP, we are focusing on standard image formats like JPG, PNG, and WEBP. Future enhancements may include direct PDF image processing."
    },
    {
      question: "What are the export options and their benefits?",
      answer: "1. **Printable PDF:** High-quality PDF suitable for printing, preserving layout and text clarity. 2. **Structured JSON:** Contains all text segments, their positions, styles, and translations – ideal for programmatic use or re-importing. 3. **Layered JPG (Conceptual):** A high-quality JPG with text visually embedded. (Actual layers depend on final implementation; may be flattened)."
    },
    {
      question: "How does the '70% AI + 30% Manual' philosophy work?",
      answer: "The AI provides a strong foundation by performing OCR, layout analysis, and initial translation. This gets you about 70% of the way. The remaining 30% is where you, the user, apply your expertise using our intuitive editing tools to refine text, adjust layout, and ensure contextual accuracy, leading to a 100% perfect result."
    },
    {
      question: "Is there a free trial for paid plans?",
      answer: "Yes, all our paid plans (e.g., Pro) typically come with a 7-day free trial so you can experience the full power of the tool before committing."
    }
  ];

  return (
    <section id="faq" className="py-16 md:py-24 bg-gray-800/30 rounded-lg shadow-xl">
      <div className="container mx-auto px-4 max-w-3xl">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4 text-brand-green">{t('faqTitle')}</h2>
        <p className="text-lg sm:text-xl text-gray-400 text-center mb-12">
          Find answers to common questions about our image translation tool.
        </p>
        <div className="space-y-4">
          {faqs.map((faq, index) => <FaqItem key={index} question={faq.question} answer={faq.answer} />)}
        </div>
      </div>
    </section>
  );
}
