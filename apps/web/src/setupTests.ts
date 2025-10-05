import '@testing-library/jest-dom';

// Minimal i18n init to silence react-i18next warnings in tests
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Only initialize once
if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    lng: 'en',
    fallbackLng: 'en',
    resources: { en: { translation: {} } },
    interpolation: { escapeValue: false },
  });
}
