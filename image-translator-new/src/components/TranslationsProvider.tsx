'use client';

import { I18nextProvider } from 'react-i18next';
import i18nInstance from '@/lib/i18n'; // Your configured i18n instance
import { useEffect, ReactNode } from 'react';

interface TranslationsProviderProps {
  children: ReactNode;
  locale: string;
  // initialTranslations and namespaces are not strictly needed here if
  // i18nInstance in lib/i18n.ts already has resources loaded and
  // the language is correctly set by the path via middleware and then by this provider.
}

export function TranslationsProvider({
  children,
  locale,
}: TranslationsProviderProps) {

  useEffect(() => {
    // This effect ensures that on the client side, after hydration,
    // i18next is definitely set to the language from the URL params.
    if (i18nInstance.language !== locale) {
      i18nInstance.changeLanguage(locale);
    }
  }, [locale]);

  // The i18nInstance from lib/i18n.ts should already be initialized
  // with all resources. If it's not, or if you were passing per-page
  // resources, you'd add them here.
  // Example: i18nInstance.addResourceBundle(locale, namespace, resources, true, true);

  return <I18nextProvider i18n={i18nInstance}>{children}</I18nextProvider>;
}
