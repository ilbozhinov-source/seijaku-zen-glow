import ritualImage from "@/assets/ritual-preparation.jpg";

const Ritual = () => {
  const steps = [
    {
      number: "01",
      title: "Просей матчата",
      description: "Сложи 1-2 чаени лъжички SEIJAKU матча в купичка. За най-добър резултат, просей я за премахване на бучки."
    },
    {
      number: "02",
      title: "Добави водата",
      description: "Налей 60-80ml гореща вода (75-80°C). Не трябва да е вряла вода, за да запазиш хранителните вещества."
    },
    {
      number: "03",
      title: "Разбий с chasen",
      description: "Използвай бамбукова метличка (chasen) и разбий в W-образни движения, докато се образува кремообразна пяна."
    }
  ];

  return (
    <section className="py-20 md:py-32 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
            Ритуал на приготвяне
          </h2>
          <p className="text-lg text-muted-foreground">
            Превърни всяка сутрин в дзен момент. Традиционната церемония е проста, 
            но изпълнена с грижа и внимание.
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
                <h4 className="font-bold text-foreground mb-2">Pro съвет:</h4>
                <p className="text-sm text-muted-foreground">
                  За по-кремообразна текстура, първо добави малко студена вода към матчата, 
                  разбърквай до паста, след това долей горещата вода. 
                  Можеш да добавиш и растително мляко за матча лате.
                </p>
              </div>
            </div>

            {/* Image */}
            <div className="order-1 md:order-2">
              <div className="relative rounded-2xl overflow-hidden shadow-zen">
                <img 
                  src={ritualImage} 
                  alt="Приготвяне на матча с chasen"
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
              <h4 className="font-bold text-foreground mb-2">Chasen метличка</h4>
              <p className="text-sm text-muted-foreground">
                Използвай традиционна бамбукова метличка за най-добра пяна
              </p>
            </div>
            <div className="text-center p-6 bg-card rounded-xl shadow-soft border border-border">
              <div className="text-3xl mb-3">🌡️</div>
              <h4 className="font-bold text-foreground mb-2">Температура</h4>
              <p className="text-sm text-muted-foreground">
                75-80°C е идеална за запазване на вкуса и ползите
              </p>
            </div>
            <div className="text-center p-6 bg-card rounded-xl shadow-soft border border-border">
              <div className="text-3xl mb-3">💚</div>
              <h4 className="font-bold text-foreground mb-2">Съхранение</h4>
              <p className="text-sm text-muted-foreground">
                Пази SEIJAKU на хладно, тъмно място за максимална свежест
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Ritual;
