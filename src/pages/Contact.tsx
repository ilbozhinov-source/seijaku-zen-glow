import Footer from "@/components/Footer";
import { useSEO } from "@/hooks/useSEO";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, MapPin, Phone } from "lucide-react";
import { Card } from "@/components/ui/card";

const Contact = () => {
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
      
      <section className="py-24 px-4 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {t("contact.title")}
            </h1>
            <p className="text-lg text-muted-foreground">
              {t("contact.subtitle")}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-6 text-center">
              <Mail className="w-8 h-8 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2">{t("contact.email")}</h3>
              <p className="text-muted-foreground">info@seijaku.com</p>
            </Card>

            <Card className="p-6 text-center">
              <Phone className="w-8 h-8 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2">{t("contact.phone")}</h3>
              <p className="text-muted-foreground">+359 888 123 456</p>
            </Card>

            <Card className="p-6 text-center">
              <MapPin className="w-8 h-8 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2">{t("contact.location")}</h3>
              <p className="text-muted-foreground">София, България</p>
            </Card>
          </div>
        </div>
      </section>
      
      <Footer />
    </main>
  );
};

export default Contact;
