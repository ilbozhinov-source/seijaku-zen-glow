import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export const useSEO = () => {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    // Update html lang attribute
    document.documentElement.lang = i18n.language;

    // Update title
    document.title = t('seo.title');

    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', t('seo.description'));
    }

    // Update Open Graph title
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', t('seo.title'));
    }

    // Update Open Graph description
    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) {
      ogDescription.setAttribute('content', t('seo.description'));
    }
  }, [i18n.language, t]);
};
