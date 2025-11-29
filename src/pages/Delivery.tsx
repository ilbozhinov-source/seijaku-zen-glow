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
            <h3 className="font-bold text-xl mb-6 text-center">{t("delivery.pricesTitle")}</h3>
            
            {/* Under 69.99 */}
            <div className="mb-6 pb-6 border-b border-border/30">
              <p className="font-medium mb-4 text-muted-foreground">{t("delivery.under70")}</p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-primary" />
                  <span>{t("delivery.speedyOffice")}</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-primary" />
                  <span>{t("delivery.ekontOffice")}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Home className="w-5 h-5 text-primary" />
                  <span>{t("delivery.homeAddress")}</span>
                </div>
              </div>
            </div>

            {/* Over 69.99 */}
            <div>
              <p className="font-medium mb-4 text-primary">{t("delivery.over70")}</p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Truck className="w-5 h-5 text-primary" />
                  <span className="font-medium">{t("delivery.freeOffice")}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Truck className="w-5 h-5 text-primary" />
                  <span className="font-medium">{t("delivery.freeAddress")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </main>
  );
};

export default Delivery;
