import Footer from "@/components/Footer";
import { useSEO } from "@/hooks/useSEO";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Leaf, Sun, Sparkles, Shield } from "lucide-react";

const Quality = () => {
  const { t } = useTranslation();
  
  useSEO();

  const steps = [
    {
      icon: Sun,
      title: t("quality.shadingTitle"),
      description: t("quality.shadingDesc"),
    },
    {
      icon: Leaf,
      title: t("quality.harvestTitle"),
      description: t("quality.harvestDesc"),
    },
    {
      icon: Sparkles,
      title: t("quality.grindingTitle"),
      description: t("quality.grindingDesc"),
    },
    {
      icon: Shield,
      title: t("quality.purityTitle"),
      description: t("quality.purityDesc"),
    },
  ];

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
              {t("quality.title")}
            </h1>
            <p className="text-lg text-muted-foreground">
              {t("quality.subtitle")}
            </p>
          </div>

          <div className="prose prose-lg mx-auto mb-16">
            <p className="text-muted-foreground leading-relaxed text-center">
              {t("quality.intro")}
            </p>
          </div>

          {/* Process Steps */}
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {steps.map((step, index) => (
              <div 
                key={index}
                className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <step.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Conclusion */}
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-8 text-center">
            <p className="text-foreground leading-relaxed">
              {t("quality.conclusion")}
            </p>
          </div>
        </div>
      </section>
      
      <Footer />
    </main>
  );
};

export default Quality;
