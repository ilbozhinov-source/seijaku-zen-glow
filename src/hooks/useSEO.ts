import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const SUPPORTED_LANGUAGES = [
  { code: 'bg', name: 'Bulgarian' },
  { code: 'en', name: 'English' },
  { code: 'el', name: 'Greek' },
  { code: 'ro', name: 'Romanian' }
];

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

    // Update Open Graph locale
    let ogLocale = document.querySelector('meta[property="og:locale"]');
    if (!ogLocale) {
      ogLocale = document.createElement('meta');
      ogLocale.setAttribute('property', 'og:locale');
      document.head.appendChild(ogLocale);
    }
    const localeMap: Record<string, string> = {
      'bg': 'bg_BG',
      'en': 'en_US',
      'el': 'el_GR',
      'ro': 'ro_RO'
    };
    ogLocale.setAttribute('content', localeMap[i18n.language] || 'en_US');

    // Remove existing hreflang tags
    document.querySelectorAll('link[rel="alternate"][hreflang]').forEach(el => el.remove());

    // Get current URL without hash or query params
    const baseUrl = window.location.origin + window.location.pathname;

    // Add hreflang tags for all supported languages
    SUPPORTED_LANGUAGES.forEach(lang => {
      const link = document.createElement('link');
      link.rel = 'alternate';
      link.hreflang = lang.code;
      link.href = `${baseUrl}?lang=${lang.code}`;
      document.head.appendChild(link);
    });

    // Add x-default hreflang (points to English as default)
    const defaultLink = document.createElement('link');
    defaultLink.rel = 'alternate';
    defaultLink.hreflang = 'x-default';
    defaultLink.href = `${baseUrl}?lang=en`;
    document.head.appendChild(defaultLink);

    // Update canonical tag
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', `${baseUrl}?lang=${i18n.language}`);
  }, [i18n.language, t]);
};
