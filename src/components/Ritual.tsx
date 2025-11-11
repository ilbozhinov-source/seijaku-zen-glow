import ritualImage from "@/assets/ritual-preparation.jpg";
import { useTranslation } from 'react-i18next';

const Ritual = () => {
  const { t } = useTranslation();
  
  const steps = [
    {
      number: "01",
      title: t('ritual.step1Title'),
      description: t('ritual.step1Desc')
    },
    {
      number: "02",
      title: t('ritual.step2Title'),
      description: t('ritual.step2Desc')
    },
    {
      number: "03",
      title: t('ritual.step3Title'),
      description: t('ritual.step3Desc')
    }
  ];

  return (
    <section className="py-20 md:py-32 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
            {t('ritual.title')}
          </h2>
          <p className="text-lg text-muted-foreground">
            {t('ritual.subtitle')}
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Steps */}
            <div className="space-y-8 order-2 md:order-1">
              {steps.map((step, index) => (
                <div key={index} className="flex gap-6 group">
                  <div className="flex-shrink-0">
                    <div className="w-14 h-14 rounded-full gradient-zen text-primary-foreground flex items-center justify-center text-lg font-bold shadow-zen group-hover:scale-110 zen-transition">
                      {step.number}
                    </div>
                  </div>
                  <div className="flex-1 pt-2">
                    <h3 className="text-xl font-bold text-foreground mb-2">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}

              <div className="mt-8 p-6 bg-accent/50 rounded-xl border border-primary/20">
                <h4 className="font-bold text-foreground mb-2">{t('ritual.proTip')}</h4>
                <p className="text-sm text-muted-foreground">
                  {t('ritual.proTipDesc')}
                </p>
              </div>
            </div>

            {/* Image */}
            <div className="order-1 md:order-2">
              <div className="relative rounded-2xl overflow-hidden shadow-zen">
                <img 
                  src={ritualImage} 
                  alt={t('ritual.imageAlt')}
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent"></div>
              </div>
            </div>
          </div>

          {/* Additional Tips */}
          <div className="mt-16 grid md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-card rounded-xl shadow-soft border border-border">
              <div className="text-3xl mb-3">🍵</div>
              <h4 className="font-bold text-foreground mb-2">{t('ritual.chasenTitle')}</h4>
              <p className="text-sm text-muted-foreground">
                {t('ritual.chasenDesc')}
              </p>
            </div>
            <div className="text-center p-6 bg-card rounded-xl shadow-soft border border-border">
              <div className="text-3xl mb-3">🌡️</div>
              <h4 className="font-bold text-foreground mb-2">{t('ritual.temperatureTitle')}</h4>
              <p className="text-sm text-muted-foreground">
                {t('ritual.temperatureDesc')}
              </p>
            </div>
            <div className="text-center p-6 bg-card rounded-xl shadow-soft border border-border">
              <div className="text-3xl mb-3">💚</div>
              <h4 className="font-bold text-foreground mb-2">{t('ritual.storageTitle')}</h4>
              <p className="text-sm text-muted-foreground">
                {t('ritual.storageDesc')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Ritual;
