import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export const FAQSchema = () => {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const questions = t("faqSection.questions", { returnObjects: true }) as Array<{
      question: string;
      answer: string;
    }>;

    const schema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "inLanguage": i18n.language,
      "mainEntity": questions.map((item) => ({
        "@type": "Question",
        "name": item.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": item.answer
        }
      }))
    };

    const scriptId = 'faq-schema';
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }

    script.textContent = JSON.stringify(schema);

    return () => {
      const existingScript = document.getElementById(scriptId);
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [t, i18n.language]);

  return null;
};
