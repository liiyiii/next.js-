'use client'; // Mark as a Client Component

import { useTranslation } from 'react-i18next'; // Use client-side hook

interface AboutSectionProps {
  // lang prop is no longer needed
}

export default function AboutSection({}: AboutSectionProps) {
  const { t } = useTranslation();

  return (
    <section id="about" className="py-16 md:py-24 bg-gray-800/30 rounded-lg shadow-xl">
      <div className="container mx-auto px-4 max-w-3xl text-center">
        <h2 className="text-3xl sm:text-4xl font-bold mb-8 text-brand-blue">
          {t('aboutTitle')}
        </h2>
        <div className="space-y-6 text-lg leading-relaxed text-gray-300">
          <p>{t('aboutText')}</p>
          <p>{"More placeholder text here to describe the company's mission, vision, and values. We aim to break down language barriers in visual content, making information accessible to everyone, everywhere. Our innovative approach combines cutting-edge AI with intuitive manual refinement tools, empowering users to achieve perfect translations with ease."}</p>
          {/* Placeholder for team or more info */}
        </div>
      </div>
    </section>
  );
}
