import { getTranslationsDictionary } from '@/lib/getTranslationsDictionary';

interface AboutSectionProps {
  lang: string;
}

export default async function AboutSection({ lang }: AboutSectionProps) {
  const t = getTranslationsDictionary(lang);

  return (
    <section id="about" className="py-16 md:py-24 bg-gray-800/30 rounded-lg shadow-xl">
      <div className="container mx-auto px-4 max-w-3xl text-center">
        <h2 className="text-3xl sm:text-4xl font-bold mb-8 text-brand-blue">
          {t.aboutTitle || "About Us"}
        </h2>
        <div className="space-y-6 text-lg leading-relaxed text-gray-300">
          <p>{t.aboutText || "This is a placeholder for the About Us page content. We are a team dedicated to providing the best image translation services."}</p>
          <p>{"More placeholder text here to describe the company's mission, vision, and values. We aim to break down language barriers in visual content, making information accessible to everyone, everywhere. Our innovative approach combines cutting-edge AI with intuitive manual refinement tools, empowering users to achieve perfect translations with ease."}</p>
          {/* Placeholder for team or more info */}
        </div>
      </div>
    </section>
  );
}
