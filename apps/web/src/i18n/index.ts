import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      actions: {
        create: 'Create',
        cancel: 'Cancel',
        delete: 'Delete',
        edit: 'Edit',
        back: 'Back',
        addComponent: 'Add Component',
      },
      dashboards: {
        title: 'Dashboards',
        createTitle: 'Create Dashboard',
        searchPlaceholder: 'Search dashboards',
        shared: 'Shared',
      },
      builder: {
        configPanel: {
          title: 'Configuration',
          selectPrompt: 'Select a component to configure',
          dataBinding: 'Data Binding',
          appearance: 'Appearance',
          colorScheme: 'Color Scheme',
          default: 'Default',
          cool: 'Cool',
          warm: 'Warm',
        },
      },
    },
  },
} as const;

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
