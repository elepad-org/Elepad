import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Importar archivos de traducción
import enTranslations from './locales/en.json';
import esTranslations from './locales/es.json';

const resources = {
  en: {
    translation: enTranslations,
  },
  es: {
    translation: esTranslations,
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'es', // idioma por defecto
    fallbackLng: 'es',
    interpolation: {
      escapeValue: false, // React ya hace escape
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;