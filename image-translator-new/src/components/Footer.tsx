'use client';

import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-800 text-center p-6 text-sm text-gray-400 border-t border-gray-700 mt-auto">
      <p>&copy; {currentYear} NEXUS-IMAGE TRANSLATOR. {t('footerRights')}</p>
      {/* Add other footer links or information here if needed, e.g., privacy policy, terms of service */}
      {/* <div className="mt-2">
        <Link href="/[lang]/privacy" className="hover:text-brand-blue transition-colors mx-2">Privacy Policy</Link>
        <Link href="/[lang]/terms" className="hover:text-brand-blue transition-colors mx-2">Terms of Service</Link>
      </div> */}
    </footer>
  );
}
