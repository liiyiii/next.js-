'use client'; // Mark as a Client Component

import { useTranslation } from 'react-i18next'; // Use client-side hook
import { CheckCircle } from 'lucide-react';

interface PricingSectionProps {
  // lang prop is no longer needed as useTranslation gets it from context
}

// PricingCard component structure
const PricingCard = ({ title, description, price, features, ctaText, isFeatured }: {
  title: string;
  description: string;
  price: string;
  features: string[];
  ctaText: string;
  isFeatured?: boolean;
}) => (
  <div className={`p-6 sm:p-8 rounded-xl shadow-2xl flex flex-col ${isFeatured ? 'bg-brand-purple text-white scale-105 transform' : 'bg-gray-800'} border ${isFeatured ? 'border-purple-700' : 'border-gray-700'} hover:shadow-purple-500/30 transition-all duration-300`}>
    <h2 className={`text-2xl font-bold mb-3 ${isFeatured ? '' : 'text-brand-blue'}`}>{title}</h2>
    <p className={`mb-5 text-sm ${isFeatured ? 'text-purple-200' : 'text-gray-400'}`}>{description}</p>
    <p className="text-4xl font-extrabold mb-6">{price}</p>
    <ul className="space-y-3 mb-8 flex-grow">
      {features.map((feature, index) => (
        <li key={index} className="flex items-start">
          <CheckCircle size={20} className={`w-5 h-5 mr-2 mt-1 flex-shrink-0 ${isFeatured ? 'text-green-300' : 'text-brand-green'}`} />
          <span>{feature}</span>
        </li>
      ))}
    </ul>
    <button
      className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors duration-300 ${isFeatured ? 'bg-white text-brand-purple hover:bg-gray-200' : 'bg-brand-blue text-white hover:bg-blue-700'}`}
      onClick={() => alert(`Action for: ${title} - CTA: ${ctaText}`)}
    >
      {ctaText}
    </button>
  </div>
);

export default function PricingSection({}: PricingSectionProps) { // Corrected to be a non-async function
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;

  const plans = [
    {
      title: t('pricingFree'),
      description: "For personal use or trying out the tool's basic capabilities.",
      price: currentLang === 'zh' ? "¥0/月" : "$0/mo",
      features: ["Up to 3 images per month", "Basic OCR", "Watermarked Exports", "Community support"],
      ctaText: currentLang === 'zh' ? "开始使用" : "Get Started"
    },
    {
      title: t('pricingPro'),
      description: "For professionals and frequent users requiring advanced features.",
      price: currentLang === 'zh' ? "¥68/月" : "$10/mo",
      features: ["Unlimited images", "Advanced OCR & Layout Analysis", "Full Editing Suite", "All export formats (No Watermark)", "Priority support"],
      ctaText: currentLang === 'zh' ? "升级专业版" : "Go Pro",
      isFeatured: true
    },
    {
      title: currentLang === 'zh' ? "企业版" : "Enterprise",
      description: "For teams and businesses with custom needs and integrations.",
      price: currentLang === 'zh' ? "联系我们" : "Contact Us",
      features: ["Custom integrations", "Team accounts & Management", "Dedicated support & SLA", "Volume discounts", "API Access (Future)"],
      ctaText: currentLang === 'zh' ? "咨询销售" : "Contact Sales"
    },
  ];

  return (
    <section id="pricing" className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4 text-brand-green">{t('pricingTitle')}</h2>
        <p className="text-lg sm:text-xl text-gray-400 text-center mb-12 max-w-2xl mx-auto">
          Choose the plan that best fits your image translation needs. All paid plans start with a 7-day free trial.
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {plans.map(plan => <PricingCard key={plan.title} {...plan} />)}
        </div>
      </div>
    </section>
  );
}
