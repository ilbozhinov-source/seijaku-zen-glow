import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";
import { FAQSchema } from "@/components/FAQSchema";
import { useSEO } from "@/hooks/useSEO";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const FAQPage = () => {
  const { t } = useTranslation();
  
  useSEO();

  return (
    <main className="min-h-screen">
      <FAQSchema />
      
      <div className="container mx-auto px-4 py-8">
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('navigation.back')}
          </Button>
        </Link>
      </div>
      
      <FAQ />
      <Footer />
    </main>
  );
};

export default FAQPage;
