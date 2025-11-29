import { useTranslation } from 'react-i18next';
import { ArrowLeft, Shield, Database, Lock, Mail, Eye, FileText, Users, Clock, Globe, AlertTriangle, Scale } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Footer from '@/components/Footer';

const Privacy = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              {t('navigation.back')}
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-6">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">{t('privacy.title')}</h1>
          <p className="text-lg text-muted-foreground">{t('privacy.subtitle')}</p>
        </div>

        <div className="prose prose-lg max-w-none">
          {/* Section I - Introduction */}
          <section className="mb-12 bg-card rounded-2xl p-8 border border-border">
            <div className="flex items-center gap-3 mb-6">
              <FileText className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold text-foreground m-0">{t('privacy.introTitle')}</h2>
            </div>
            <p className="text-muted-foreground mb-4">{t('privacy.introText1')}</p>
            <p className="text-muted-foreground mb-4">{t('privacy.introText2')}</p>
            <div className="bg-primary/5 rounded-lg p-4 mb-4">
              <p className="text-foreground font-medium mb-2">{t('privacy.importantNote')}</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>{t('privacy.importantNote1')}</li>
                <li>{t('privacy.importantNote2')}</li>
                <li>{t('privacy.importantNote3')}</li>
              </ul>
            </div>
            <p className="text-muted-foreground">{t('privacy.controlAuthority')}</p>
          </section>

          {/* Section II - Definitions */}
          <section className="mb-12 bg-card rounded-2xl p-8 border border-border">
            <div className="flex items-center gap-3 mb-6">
              <Database className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold text-foreground m-0">{t('privacy.definitionsTitle')}</h2>
            </div>
            <div className="space-y-4">
              <div>
                <p className="font-semibold text-foreground">{t('privacy.defCompany')}</p>
                <p className="text-muted-foreground">{t('privacy.defCompanyDesc')}</p>
              </div>
              <div>
                <p className="font-semibold text-foreground">{t('privacy.defPersonalData')}</p>
                <p className="text-muted-foreground">{t('privacy.defPersonalDataDesc')}</p>
              </div>
              <div>
                <p className="font-semibold text-foreground">{t('privacy.defProcessing')}</p>
                <p className="text-muted-foreground">{t('privacy.defProcessingDesc')}</p>
              </div>
              <div>
                <p className="font-semibold text-foreground">{t('privacy.defSubject')}</p>
                <p className="text-muted-foreground">{t('privacy.defSubjectDesc')}</p>
              </div>
              <div>
                <p className="font-semibold text-foreground">{t('privacy.defStore')}</p>
                <p className="text-muted-foreground">{t('privacy.defStoreDesc')}</p>
              </div>
            </div>
          </section>

          {/* Section III - Personal Data Types */}
          <section className="mb-12 bg-card rounded-2xl p-8 border border-border">
            <div className="flex items-center gap-3 mb-6">
              <Users className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold text-foreground m-0">{t('privacy.dataTypesTitle')}</h2>
            </div>
            <p className="text-muted-foreground mb-6">{t('privacy.dataTypesIntro')}</p>

            {/* Visitor */}
            <div className="mb-8 p-6 bg-background rounded-xl border border-border">
              <h3 className="text-xl font-semibold text-foreground mb-4">{t('privacy.visitorTitle')}</h3>
              <p className="text-muted-foreground mb-4">{t('privacy.visitorDesc')}</p>
              <div className="space-y-3">
                <div>
                  <p className="font-medium text-foreground">{t('privacy.dataCategories')}</p>
                  <p className="text-muted-foreground text-sm">{t('privacy.visitorData')}</p>
                </div>
                <div>
                  <p className="font-medium text-foreground">{t('privacy.processingPurposes')}</p>
                  <p className="text-muted-foreground text-sm">{t('privacy.visitorPurposes')}</p>
                </div>
                <div>
                  <p className="font-medium text-foreground">{t('privacy.storageTime')}</p>
                  <p className="text-muted-foreground text-sm">{t('privacy.visitorStorage')}</p>
                </div>
              </div>
            </div>

            {/* Email Subscriber */}
            <div className="mb-8 p-6 bg-background rounded-xl border border-border">
              <h3 className="text-xl font-semibold text-foreground mb-4">{t('privacy.subscriberTitle')}</h3>
              <p className="text-muted-foreground mb-4">{t('privacy.subscriberDesc')}</p>
              <div className="space-y-3">
                <div>
                  <p className="font-medium text-foreground">{t('privacy.dataCategories')}</p>
                  <p className="text-muted-foreground text-sm">{t('privacy.subscriberData')}</p>
                </div>
                <div>
                  <p className="font-medium text-foreground">{t('privacy.processingPurposes')}</p>
                  <p className="text-muted-foreground text-sm">{t('privacy.subscriberPurposes')}</p>
                </div>
                <div>
                  <p className="font-medium text-foreground">{t('privacy.storageTime')}</p>
                  <p className="text-muted-foreground text-sm">{t('privacy.subscriberStorage')}</p>
                </div>
              </div>
            </div>

            {/* Registered User */}
            <div className="mb-8 p-6 bg-background rounded-xl border border-border">
              <h3 className="text-xl font-semibold text-foreground mb-4">{t('privacy.registeredTitle')}</h3>
              <p className="text-muted-foreground mb-4">{t('privacy.registeredDesc')}</p>
              <div className="space-y-3">
                <div>
                  <p className="font-medium text-foreground">{t('privacy.dataCategories')}</p>
                  <p className="text-muted-foreground text-sm">{t('privacy.registeredData')}</p>
                </div>
                <div>
                  <p className="font-medium text-foreground">{t('privacy.processingPurposes')}</p>
                  <p className="text-muted-foreground text-sm">{t('privacy.registeredPurposes')}</p>
                </div>
                <div>
                  <p className="font-medium text-foreground">{t('privacy.storageTime')}</p>
                  <p className="text-muted-foreground text-sm">{t('privacy.registeredStorage')}</p>
                </div>
              </div>
            </div>

            {/* Buyer */}
            <div className="p-6 bg-background rounded-xl border border-border">
              <h3 className="text-xl font-semibold text-foreground mb-4">{t('privacy.buyerTitle')}</h3>
              <p className="text-muted-foreground mb-4">{t('privacy.buyerDesc')}</p>
              <div className="space-y-3">
                <div>
                  <p className="font-medium text-foreground">{t('privacy.dataCategories')}</p>
                  <p className="text-muted-foreground text-sm">{t('privacy.buyerData')}</p>
                </div>
                <div>
                  <p className="font-medium text-foreground">{t('privacy.processingPurposes')}</p>
                  <p className="text-muted-foreground text-sm">{t('privacy.buyerPurposes')}</p>
                </div>
                <div>
                  <p className="font-medium text-foreground">{t('privacy.storageTime')}</p>
                  <p className="text-muted-foreground text-sm">{t('privacy.buyerStorage')}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Your Rights */}
          <section className="mb-12 bg-card rounded-2xl p-8 border border-border">
            <div className="flex items-center gap-3 mb-6">
              <Eye className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold text-foreground m-0">{t('privacy.rightsTitle')}</h2>
            </div>
            <p className="text-muted-foreground mb-6">{t('privacy.rightsIntro')}</p>
            <div className="space-y-4">
              <div className="p-4 bg-background rounded-lg border border-border">
                <p className="font-semibold text-foreground">{t('privacy.rightAccess')}</p>
                <p className="text-muted-foreground text-sm">{t('privacy.rightAccessDesc')}</p>
              </div>
              <div className="p-4 bg-background rounded-lg border border-border">
                <p className="font-semibold text-foreground">{t('privacy.rightCorrection')}</p>
                <p className="text-muted-foreground text-sm">{t('privacy.rightCorrectionDesc')}</p>
              </div>
              <div className="p-4 bg-background rounded-lg border border-border">
                <p className="font-semibold text-foreground">{t('privacy.rightErasure')}</p>
                <p className="text-muted-foreground text-sm">{t('privacy.rightErasureDesc')}</p>
              </div>
              <div className="p-4 bg-background rounded-lg border border-border">
                <p className="font-semibold text-foreground">{t('privacy.rightRestriction')}</p>
                <p className="text-muted-foreground text-sm">{t('privacy.rightRestrictionDesc')}</p>
              </div>
              <div className="p-4 bg-background rounded-lg border border-border">
                <p className="font-semibold text-foreground">{t('privacy.rightObjection')}</p>
                <p className="text-muted-foreground text-sm">{t('privacy.rightObjectionDesc')}</p>
              </div>
              <div className="p-4 bg-background rounded-lg border border-border">
                <p className="font-semibold text-foreground">{t('privacy.rightPortability')}</p>
                <p className="text-muted-foreground text-sm">{t('privacy.rightPortabilityDesc')}</p>
              </div>
              <div className="p-4 bg-background rounded-lg border border-border">
                <p className="font-semibold text-foreground">{t('privacy.rightComplaint')}</p>
                <p className="text-muted-foreground text-sm">{t('privacy.rightComplaintDesc')}</p>
              </div>
            </div>
          </section>

          {/* Third Party Sharing */}
          <section className="mb-12 bg-card rounded-2xl p-8 border border-border">
            <div className="flex items-center gap-3 mb-6">
              <Globe className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold text-foreground m-0">{t('privacy.thirdPartyTitle')}</h2>
            </div>
            <p className="text-muted-foreground mb-4">{t('privacy.thirdPartyIntro')}</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>{t('privacy.thirdParty1')}</li>
              <li>{t('privacy.thirdParty2')}</li>
              <li>{t('privacy.thirdParty3')}</li>
              <li>{t('privacy.thirdParty4')}</li>
            </ul>
          </section>

          {/* Data Security */}
          <section className="mb-12 bg-card rounded-2xl p-8 border border-border">
            <div className="flex items-center gap-3 mb-6">
              <Lock className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold text-foreground m-0">{t('privacy.securityTitle')}</h2>
            </div>
            <p className="text-muted-foreground">{t('privacy.securityDesc')}</p>
          </section>

          {/* Minors */}
          <section className="mb-12 bg-card rounded-2xl p-8 border border-border">
            <div className="flex items-center gap-3 mb-6">
              <AlertTriangle className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold text-foreground m-0">{t('privacy.minorsTitle')}</h2>
            </div>
            <p className="text-muted-foreground">{t('privacy.minorsDesc')}</p>
          </section>

          {/* IP Addresses */}
          <section className="mb-12 bg-card rounded-2xl p-8 border border-border">
            <div className="flex items-center gap-3 mb-6">
              <Clock className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold text-foreground m-0">{t('privacy.ipTitle')}</h2>
            </div>
            <p className="text-muted-foreground">{t('privacy.ipDesc')}</p>
          </section>

          {/* Cookies */}
          <section className="mb-12 bg-card rounded-2xl p-8 border border-border">
            <div className="flex items-center gap-3 mb-6">
              <Database className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold text-foreground m-0">{t('privacy.cookiesTitle')}</h2>
            </div>
            <p className="text-muted-foreground">{t('privacy.cookiesDesc')}</p>
          </section>

          {/* Final Provisions */}
          <section className="mb-12 bg-card rounded-2xl p-8 border border-border">
            <div className="flex items-center gap-3 mb-6">
              <FileText className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold text-foreground m-0">{t('privacy.finalTitle')}</h2>
            </div>
            <p className="text-muted-foreground">{t('privacy.finalDesc')}</p>
          </section>

          {/* ORS - Online Dispute Resolution */}
          <section className="mb-12 bg-card rounded-2xl p-8 border border-border">
            <div className="flex items-center gap-3 mb-6">
              <Scale className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold text-foreground m-0">{t('privacy.orsTitle')}</h2>
            </div>
            <p className="text-muted-foreground mb-4">{t('privacy.orsDesc')}</p>
            <a 
              href="https://consumer-redress.ec.europa.eu/site-relocation_en" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary font-semibold hover:underline"
            >
              {t('privacy.orsLink')}
              <Globe className="w-4 h-4" />
            </a>
          </section>

          {/* Contact */}
          <section className="bg-primary/5 rounded-2xl p-8 border border-primary/20 text-center">
            <Mail className="w-10 h-10 text-primary mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">{t('privacy.contactTitle')}</h2>
            <p className="text-muted-foreground mb-4">{t('privacy.contactDesc')}</p>
            <a href="mailto:info@gomatcha.bg" className="text-primary font-semibold hover:underline">
              info@gomatcha.bg
            </a>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Privacy;
