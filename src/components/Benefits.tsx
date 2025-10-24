import { Sun, Moon, Heart } from "lucide-react";

const Benefits = () => {
  const lifestyleBenefits = [
    {
      icon: Sun,
      title: "Сутрешен ритуал",
      description: "Започни деня с чиста енергия и фокус. SEIJAKU замества кафето с по-здравословна алтернатива, която не води до срив."
    },
    {
      icon: Moon,
      title: "Следобеден детокс",
      description: "Идеална за следобедна пауза. Подмладява без да наруши съня, благодарение на балансираното съдържание на кофеин."
    },
    {
      icon: Heart,
      title: "Грижа за тялото",
      description: "Богата на EGCG антиоксиданти, които подпомагат метаболизма, имунната система и здравето на кожата."
    }
  ];

  return (
    <section id="benefits" className="py-20 md:py-32 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
            За теб
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground">
            SEIJAKU е повече от напитка – това е момент само за теб. Момент на спокойствие, баланс и грижа за себе си.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
          {lifestyleBenefits.map((benefit, index) => (
            <div
              key={index}
              className="bg-card rounded-2xl p-8 shadow-soft hover:shadow-zen zen-transition border border-border"
            >
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full gradient-zen text-primary-foreground">
                  <benefit.icon className="w-7 h-7" />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-4 text-foreground">
                {benefit.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>

        {/* Highlight Section */}
        <div className="max-w-4xl mx-auto bg-accent/50 rounded-2xl p-8 md:p-12 border border-primary/20">
          <div className="text-center space-y-4">
            <h3 className="text-2xl md:text-3xl font-bold text-foreground">
              Без компромиси за твоето здраве
            </h3>
            <p className="text-lg text-muted-foreground">
              Без захар • Без калории • Без изкуствени добавки • Без ГМО
            </p>
            <p className="text-base text-muted-foreground max-w-2xl mx-auto pt-4">
              Само чиста, органична матча от най-високо качество. Всеки глътка е инвестиция във твоето здраве, красота и благополучие.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Benefits;
