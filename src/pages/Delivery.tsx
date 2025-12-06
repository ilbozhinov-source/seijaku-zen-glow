import Footer from "@/components/Footer";
import { useSEO } from "@/hooks/useSEO";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Truck, CreditCard, Clock, MapPin, Building2, Home } from "lucide-react";

const Delivery = () => {
  const { t } = useTranslation();
  
  useSEO();

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('navigation.back')}
          </Button>
        </Link>
      </div>
      
      <section className="py-16 md:py-24 px-4 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {t("delivery.title")}
            </h1>
            <p className="text-lg text-muted-foreground">
              {t("delivery.subtitle")}
            </p>
          </div>

          {/* Payment Info */}
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <CreditCard className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">{t("delivery.paymentTitle")}</h3>
                <p className="text-muted-foreground">
                  {t("delivery.paymentDesc")}
                </p>
              </div>
            </div>
          </div>

          {/* Delivery Info */}
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">{t("delivery.timeTitle")}</h3>
                <p className="text-muted-foreground">
                  {t("delivery.timeDesc")}
                </p>
              </div>
            </div>
          </div>

          {/* Pricing Section */}
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-8 mb-8">
            <h3 className="font-bold text-2xl mb-8 text-center">{t("delivery.pricesTitle")}</h3>
            
            {/* Bulgaria */}
            <div className="mb-8 pb-8 border-b border-border/30">
              <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                {t("delivery.forBulgaria")}
              </h4>
              <p className="text-muted-foreground mb-4">{t("delivery.bulgariaPartners")}</p>
              <div className="space-y-3 pl-7">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-4 h-4 text-primary" />
                    <span>{t("delivery.econtOfficeNew")}</span>
                  </div>
                  <span className="font-semibold text-primary">6,00 лв.</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Home className="w-4 h-4 text-primary" />
                    <span>{t("delivery.econtAddress")}</span>
                  </div>
                  <span className="font-semibold text-primary">7,00 лв.</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Truck className="w-4 h-4 text-primary" />
                    <span>{t("delivery.mdaAutomat")}</span>
                  </div>
                  <span className="font-semibold text-primary">4,50 лв.</span>
                </div>
              </div>
            </div>

            {/* International */}
            <div className="mb-8 pb-8 border-b border-border/30">
              <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Truck className="w-5 h-5 text-primary" />
                {t("delivery.forAbroad")}
              </h4>
              <div className="space-y-3 pl-7">
                <div className="flex items-center justify-between">
                  <span>{t("delivery.greece")}</span>
                  <span className="font-semibold text-primary">4,00 €</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>{t("delivery.romania")}</span>
                  <span className="font-semibold text-primary">4,00 €</span>
                </div>
              </div>
            </div>

            {/* Free Shipping */}
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6">
              <h4 className="font-semibold text-lg mb-2 text-green-700 dark:text-green-400 flex items-center gap-2">
                🎁 {t("delivery.freeShipping")}
              </h4>
              <p className="text-muted-foreground">
                {t("delivery.freeShippingDesc")}
              </p>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </main>
  );
};

export default Delivery;
