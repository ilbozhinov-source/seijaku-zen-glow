import { Zap, Target, Sparkles } from "lucide-react";

const WhySeijaku = () => {
  const benefits = [
    {
      icon: Zap,
      title: "Енергия",
      description: "Чиста енергия без срив. Природен кофеин и L-теанин за дълготраен фокус."
    },
    {
      icon: Target,
      title: "Фокус",
      description: "Подобрява концентрацията и умствената яснота за максимална продуктивност."
    },
    {
      icon: Sparkles,
      title: "Красота",
      description: "Богата на антиоксиданти за сияйна кожа и вътрешен баланс."
    }
  ];

  return (
    <section className="py-20 md:py-32 bg-gradient-soft">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
            Защо SEIJAKU?
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground">
            100% церемониална матча, ръчно смляна с любов и внимание към всеки детайл.
            Създадена за тези, които търсят баланс между динамичния живот и вътрешното спокойствие.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-3 gap-8 md:gap-12 max-w-5xl mx-auto">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="text-center space-y-4 p-6 rounded-2xl bg-card shadow-soft hover:shadow-zen zen-transition hover:-translate-y-1"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mx-auto">
                <benefit.icon className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">
                {benefit.title}
              </h3>
              <p className="text-muted-foreground">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>

        {/* Key Features */}
        <div className="mt-16 max-w-4xl mx-auto">
          <div className="bg-card rounded-2xl p-8 md:p-12 shadow-soft border border-border">
            <h3 className="text-2xl md:text-3xl font-bold text-center mb-8 text-foreground">
              Какво прави SEIJAKU специална
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start gap-4">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="text-foreground font-medium">Без захар и калории</p>
                  <p className="text-sm text-muted-foreground">Естествена сладост без вина</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="text-foreground font-medium">Без кофеинов срив</p>
                  <p className="text-sm text-muted-foreground">Балансирана енергия през целия ден</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="text-foreground font-medium">137x повече антиоксиданти</p>
                  <p className="text-sm text-muted-foreground">В сравнение с обикновен зелен чай</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="text-foreground font-medium">Подпомага метаболизма</p>
                  <p className="text-sm text-muted-foreground">Естествено ускорява изгарянето на калории</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhySeijaku;
