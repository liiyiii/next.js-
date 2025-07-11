import { resources, DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from './i18n'; // Assuming SUPPORTED_LANGUAGES is also exported or defined here

// Helper function to get translations for server components
// In a real app, this might read from JSON files based on locale and namespace.
export const getTranslationsDictionary = (locale: string) => {
  if (SUPPORTED_LANGUAGES.includes(locale) && resources[locale as keyof typeof resources]) {
    return resources[locale as keyof typeof resources].translation;
  }
  return resources[DEFAULT_LANGUAGE as keyof typeof resources].translation; // Fallback
};
