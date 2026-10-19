import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import ta from './locales/ta.json';
import hi from './locales/hi.json';
import te from './locales/te.json';
import ml from './locales/ml.json';

export type LanguageCode = 'en' | 'ta' | 'hi' | 'te' | 'ml';

export interface SupportedLanguage {
  code: LanguageCode;
  label: string;
  englishLabel: string;
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: 'en', label: 'English', englishLabel: 'English' },
  { code: 'ta', label: 'தமிழ்', englishLabel: 'Tamil' },
  { code: 'hi', label: 'हिन्दी', englishLabel: 'Hindi' },
  { code: 'te', label: 'తెలుగు', englishLabel: 'Telugu' },
  { code: 'ml', label: 'മലയാളം', englishLabel: 'Malayalam' },
];

const savedLanguage = (localStorage.getItem('masticare_language') as LanguageCode) || 'en';
const initialLang = ['en', 'ta', 'hi', 'te', 'ml'].includes(savedLanguage) ? savedLanguage : 'en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ta: { translation: ta },
      hi: { translation: hi },
      te: { translation: te },
      ml: { translation: ml },
    },
    lng: initialLang,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes
    },
    detection: {
      order: ['localStorage'],
      caches: ['localStorage'],
    },
  });

// Synchronize <html lang="..."> attribute with the active language and persist to localStorage
if (typeof document !== 'undefined') {
  document.documentElement.lang = initialLang;
  i18n.on('languageChanged', (lng) => {
    const cleanLng = (lng?.split('-')[0] as LanguageCode) || 'en';
    document.documentElement.lang = cleanLng;
    localStorage.setItem('masticare_language', cleanLng);
  });
}

export default i18n;
