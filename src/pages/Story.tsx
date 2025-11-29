import Footer from "@/components/Footer";
import { useSEO } from "@/hooks/useSEO";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const Story = () => {
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
              {t("story.title")}
            </h1>
            <p className="text-lg text-muted-foreground">
              {t("story.subtitle")}
            </p>
          </div>

          <div className="text-center space-y-8">
            <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl mx-auto">
              {t("story.intro")}
            </p>

            <div className="grid md:grid-cols-2 gap-6 text-left mt-12">
              <div className="bg-card p-6 rounded-xl border border-border/50">
                <h3 className="font-semibold text-foreground mb-2">{t("story.shading.title")}</h3>
                <p className="text-muted-foreground text-sm">{t("story.shading.description")}</p>
              </div>
              <div className="bg-card p-6 rounded-xl border border-border/50">
                <h3 className="font-semibold text-foreground mb-2">{t("story.harvest.title")}</h3>
                <p className="text-muted-foreground text-sm">{t("story.harvest.description")}</p>
              </div>
              <div className="bg-card p-6 rounded-xl border border-border/50">
                <h3 className="font-semibold text-foreground mb-2">{t("story.grinding.title")}</h3>
                <p className="text-muted-foreground text-sm">{t("story.grinding.description")}</p>
              </div>
              <div className="bg-card p-6 rounded-xl border border-border/50">
                <h3 className="font-semibold text-foreground mb-2">{t("story.purity.title")}</h3>
                <p className="text-muted-foreground text-sm">{t("story.purity.description")}</p>
              </div>
            </div>

            <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl mx-auto mt-12">
              {t("story.conclusion")}
            </p>
          </div>
        </div>
      </section>
      
      <Footer />
    </main>
  );
};

export default Story;
