import { useTranslation } from 'react-i18next';
import { ArrowLeft, Cookie, Shield, BarChart3, Megaphone, Settings, Trash2, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Footer from '@/components/Footer';

const Cookies = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <Link to="/">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              {t('cookies.back')}
            </Button>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-12">
          <Cookie className="w-16 h-16 text-primary mx-auto mb-6" />
          <h1 className="text-4xl font-bold text-foreground mb-4">{t('cookies.title')}</h1>
          <p className="text-lg text-muted-foreground">{t('cookies.subtitle')}</p>
        </div>

        {/* Introduction */}
        <section className="mb-12 bg-card rounded-2xl p-8 border border-border">
          <p className="text-muted-foreground">{t('cookies.intro')}</p>
        </section>

        {/* What are cookies */}
        <section className="mb-12 bg-card rounded-2xl p-8 border border-border">
          <div className="flex items-center gap-3 mb-6">
            <Cookie className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground m-0">{t('cookies.whatTitle')}</h2>
          </div>
          <p className="text-muted-foreground">{t('cookies.whatDesc')}</p>
        </section>

        {/* Why we use cookies */}
        <section className="mb-12 bg-card rounded-2xl p-8 border border-border">
          <div className="flex items-center gap-3 mb-6">
            <Settings className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground m-0">{t('cookies.whyTitle')}</h2>
          </div>
          <p className="text-muted-foreground">{t('cookies.whyDesc')}</p>
        </section>

        {/* Types of cookies */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">{t('cookies.typesTitle')}</h2>
          
          {/* Essential cookies */}
          <div className="bg-card rounded-2xl p-8 border border-border mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-primary" />
              <h3 className="text-xl font-semibold text-foreground m-0">{t('cookies.essentialTitle')}</h3>
            </div>
            <p className="text-muted-foreground mb-4">{t('cookies.essentialDesc')}</p>
            <p className="text-muted-foreground text-sm italic">{t('cookies.essentialWarning')}</p>
          </div>

          {/* Performance cookies */}
          <div className="bg-card rounded-2xl p-8 border border-border mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Settings className="w-6 h-6 text-primary" />
              <h3 className="text-xl font-semibold text-foreground m-0">{t('cookies.performanceTitle')}</h3>
            </div>
            <p className="text-muted-foreground mb-4">{t('cookies.performanceDesc')}</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>{t('cookies.performanceItem1')}</li>
              <li>{t('cookies.performanceItem2')}</li>
              <li>{t('cookies.performanceItem3')}</li>
              <li>{t('cookies.performanceItem4')}</li>
              <li>{t('cookies.performanceItem5')}</li>
              <li>{t('cookies.performanceItem6')}</li>
            </ul>
          </div>

          {/* Analytics cookies */}
          <div className="bg-card rounded-2xl p-8 border border-border mb-6">
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 className="w-6 h-6 text-primary" />
              <h3 className="text-xl font-semibold text-foreground m-0">{t('cookies.analyticsTitle')}</h3>
            </div>
            <p className="text-muted-foreground mb-4">{t('cookies.analyticsDesc')}</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Google Analytics</li>
              <li>Google Tag Manager</li>
              <li>Gemius</li>
              <li>eXTReMe Tracking</li>
            </ul>
          </div>

          {/* Advertising cookies */}
          <div className="bg-card rounded-2xl p-8 border border-border mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Megaphone className="w-6 h-6 text-primary" />
              <h3 className="text-xl font-semibold text-foreground m-0">{t('cookies.advertisingTitle')}</h3>
            </div>
            <p className="text-muted-foreground mb-4">{t('cookies.advertisingDesc')}</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Google Ads (AdWords)</li>
              <li>Facebook Ads</li>
              <li>Criteo</li>
              <li>AdWise</li>
            </ul>
          </div>

          {/* Functionality cookies */}
          <div className="bg-card rounded-2xl p-8 border border-border mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Settings className="w-6 h-6 text-primary" />
              <h3 className="text-xl font-semibold text-foreground m-0">{t('cookies.functionalityTitle')}</h3>
            </div>
            <p className="text-muted-foreground mb-4">{t('cookies.functionalityDesc')}</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 mb-4">
              <li>Facebook API</li>
              <li>Google API</li>
            </ul>
            <p className="text-muted-foreground text-sm">{t('cookies.functionalityNote')}</p>
          </div>
        </section>

        {/* Personal information */}
        <section className="mb-12 bg-card rounded-2xl p-8 border border-border">
          <div className="flex items-center gap-3 mb-6">
            <Lock className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground m-0">{t('cookies.personalTitle')}</h2>
          </div>
          <p className="text-muted-foreground">{t('cookies.personalDesc')}</p>
        </section>

        {/* Deleting cookies */}
        <section className="mb-12 bg-card rounded-2xl p-8 border border-border">
          <div className="flex items-center gap-3 mb-6">
            <Trash2 className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground m-0">{t('cookies.deleteTitle')}</h2>
          </div>
          <p className="text-muted-foreground mb-4">{t('cookies.deleteDesc1')}</p>
          <p className="text-muted-foreground mb-4">{t('cookies.deleteDesc2')}</p>
          <p className="text-muted-foreground text-sm italic">{t('cookies.deleteWarning')}</p>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Cookies;
