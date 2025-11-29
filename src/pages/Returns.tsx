import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ArrowLeft, Package, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import { LanguageSelector } from "@/components/LanguageSelector";
import { CartDrawer } from "@/components/CartDrawer";

const Returns = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-foreground">
            SEIJAKU <span className="text-primary">静寂</span>
          </Link>
          <div className="flex items-center gap-4">
            <LanguageSelector />
            <CartDrawer />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Back Button */}
          <Link to="/">
            <Button variant="ghost" className="mb-8 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t("navigation.back")}
            </Button>
          </Link>

          {/* Title Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              {t("returns.title")}
            </h1>
            <p className="text-xl text-muted-foreground">
              {t("returns.subtitle")}
            </p>
          </div>

          {/* Policy Overview */}
          <div className="bg-primary/10 rounded-2xl p-8 mb-12">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">{t("returns.guaranteeTitle")}</h2>
            </div>
            <p className="text-muted-foreground text-lg">
              {t("returns.guaranteeDesc")}
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-8 mb-12">
            {/* Step 1 */}
            <div className="flex gap-6">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                1
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">{t("returns.step1Title")}</h3>
                <p className="text-muted-foreground">{t("returns.step1Desc")}</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-6">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                2
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">{t("returns.step2Title")}</h3>
                <p className="text-muted-foreground">{t("returns.step2Desc")}</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-6">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                3
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">{t("returns.step3Title")}</h3>
                <p className="text-muted-foreground">{t("returns.step3Desc")}</p>
              </div>
            </div>
          </div>

          {/* Info Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <div className="bg-card rounded-xl p-6 border border-border">
              <div className="flex items-center gap-3 mb-3">
                <Clock className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-foreground">{t("returns.timeframeTitle")}</h3>
              </div>
              <p className="text-muted-foreground">{t("returns.timeframeDesc")}</p>
            </div>

            <div className="bg-card rounded-xl p-6 border border-border">
              <div className="flex items-center gap-3 mb-3">
                <Package className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-foreground">{t("returns.conditionTitle")}</h3>
              </div>
              <p className="text-muted-foreground">{t("returns.conditionDesc")}</p>
            </div>
          </div>

          {/* Important Note */}
          <div className="bg-accent/50 rounded-xl p-6 border border-accent">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-accent-foreground mt-0.5" />
              <div>
                <h3 className="font-bold text-foreground mb-2">{t("returns.noteTitle")}</h3>
                <p className="text-muted-foreground">{t("returns.noteDesc")}</p>
              </div>
            </div>
          </div>

          {/* Contact CTA */}
          <div className="text-center mt-12">
            <p className="text-muted-foreground mb-4">{t("returns.questionsText")}</p>
            <Link to="/contact">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                {t("footer.contact")}
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Returns;
