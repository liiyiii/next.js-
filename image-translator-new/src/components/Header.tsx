'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useParams, usePathname } from 'next/navigation';
import { Globe } from 'lucide-react';
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from '@/lib/i18n'; // Assuming these are exported

export default function Header() {
  const { t } = useTranslation();
  const params = useParams();
  const pathname = usePathname();

  const currentLang = params.lang as string || DEFAULT_LANGUAGE;

  const getLocalizedPath = (targetLang: string, pathSuffix: string = '') => {
    if (!pathname) return `/${targetLang}${pathSuffix}`;
    const currentLangPath = `/${currentLang}`;

    let basePathWithoutLang = '';
    if (pathname.startsWith(currentLangPath + '/')) {
      basePathWithoutLang = pathname.substring(currentLangPath.length);
    } else if (pathname === currentLangPath) {
      basePathWithoutLang = '/';
    } else { // Pathname does not have current lang prefix, or is just '/'
      basePathWithoutLang = pathname;
    }
    // Ensure suffix starts with / if it's a sub-path, or # if it's an anchor
    if (pathSuffix && !pathSuffix.startsWith('/') && !pathSuffix.startsWith('#')) {
        pathSuffix = '/' + pathSuffix;
    }
    if (pathSuffix.startsWith('#')) { // Anchor link, should be on the root page of the targetLang
        return `/${targetLang}/${pathSuffix}`;
    }
    return `/${targetLang}${pathSuffix || (basePathWithoutLang === '/' ? '' : basePathWithoutLang)}`;
  };

  // Specific helper for homepage anchor links
  const getHomeAnchorLink = (hash: string) => {
    return `/${currentLang}/#${hash.startsWith('#') ? hash.substring(1) : hash}`;
  };

  return (
    <header className="bg-gray-800 shadow-md sticky top-0 z-50 text-foreground">
      <div className="container mx-auto flex justify-between items-center p-4">
        <Link href={`/${currentLang}/`} className="text-2xl font-bold text-brand-purple hover:text-brand-blue transition-colors">
          NEXUS-IT {/* Placeholder Logo/Name */}
        </Link>
        <nav className="space-x-2 sm:space-x-4 flex items-center text-sm sm:text-base">
          <Link href={`/${currentLang}/`} className="hover:text-brand-blue transition-colors">{t('navHome')}</Link>
          <Link href={`/${currentLang}/tool`} className="hover:text-brand-blue transition-colors">{t('navTool')}</Link>
          <Link href={getHomeAnchorLink('pricing')} className="hover:text-brand-blue transition-colors">{t('navPricing')}</Link>
          <Link href={getHomeAnchorLink('faq')} className="hover:text-brand-blue transition-colors">{t('navFAQ')}</Link>
          <Link href={getHomeAnchorLink('about')} className="hover:text-brand-blue transition-colors">{t('navAbout')}</Link>

          <div className="relative group">
            <button className="flex items-center p-1 sm:p-2 rounded-md hover:bg-gray-700 transition-colors">
              <Globe size={20} className="mr-1" />
              <span className="hidden sm:inline">{currentLang.toUpperCase()}</span>
            </button>
            <div className="absolute right-0 mt-1 w-32 bg-gray-700 border border-gray-600 rounded-md shadow-lg py-1 opacity-0 group-hover:opacity-100 transition-all duration-200 ease-in-out invisible group-hover:visible z-20">
              {SUPPORTED_LANGUAGES.map(lang => (
                currentLang !== lang && (
                  <Link
                    key={lang}
                    href={getLocalizedPath(lang, pathname.startsWith(`/${currentLang}/`) ? pathname.substring(`/${currentLang}`.length) : pathname)} // Preserve current sub-path if any
                    locale={lang}
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-600"
                  >
                    {lang === 'en' ? 'English (EN)' : '中文 (ZH)'}
                  </Link>
                )
              ))}
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}
