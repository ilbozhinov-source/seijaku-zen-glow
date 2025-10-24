import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

const Reviews = () => {
  const reviews = [
    {
      name: "Мария Петрова",
      age: 32,
      occupation: "Дигитален маркетинг мениджър",
      rating: 5,
      text: "Пия SEIJAKU всяка сутрин вече 3 месеца и се чувствам фокусирана и спокойна през целия ден. Кожата ми буквално светва! Никога не съм се чувствала толкова балансирана.",
      image: "👩🏻‍💼"
    },
    {
      name: "Елена Димитрова",
      age: 28,
      occupation: "Фитнес инструктор",
      rating: 5,
      text: "Като човек, който обича здравословния начин на живот, SEIJAKU е перфектната допълнение към моята рутина. Енергията е чиста, без нервност. Заменям сутрешното кафе с матча и се чувствам страхотно!",
      image: "💪🏻"
    },
    {
      name: "Силвия Георгиева",
      age: 45,
      occupation: "Собственик на бутик",
      rating: 5,
      text: "Открих SEIJAKU, когато търсех естествен начин да подобря концентрацията си. Не само това, но забелязах, че кожата ми изглежда по-жизнена. Това е истински ритуал за грижа за себе си!",
      image: "👩🏼‍💼"
    }
  ];

  return (
    <section className="py-20 md:py-32 bg-gradient-soft">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
            Какво казват нашите клиенти
          </h2>
          <p className="text-lg text-muted-foreground">
            Истински истории от хора, които откриха баланса с SEIJAKU
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {reviews.map((review, index) => (
            <Card key={index} className="shadow-zen hover:shadow-soft zen-transition border-primary/10">
              <CardContent className="pt-6 space-y-4">
                {/* Stars */}
                <div className="flex gap-1">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                  ))}
                </div>

                {/* Review Text */}
                <p className="text-muted-foreground leading-relaxed italic">
                  "{review.text}"
                </p>

                {/* Reviewer Info */}
                <div className="flex items-center gap-4 pt-4 border-t border-border">
                  <div className="text-4xl">{review.image}</div>
                  <div>
                    <p className="font-bold text-foreground">{review.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {review.age} г., {review.occupation}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Trust Badge Section */}
        <div className="mt-16 max-w-4xl mx-auto text-center">
          <div className="inline-flex flex-wrap justify-center gap-8 items-center p-8 bg-card rounded-2xl shadow-soft border border-border">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-1">4.9/5</div>
              <p className="text-sm text-muted-foreground">Средна оценка</p>
            </div>
            <div className="h-12 w-px bg-border"></div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-1">500+</div>
              <p className="text-sm text-muted-foreground">Доволни клиенти</p>
            </div>
            <div className="h-12 w-px bg-border"></div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-1">98%</div>
              <p className="text-sm text-muted-foreground">Препоръчват SEIJAKU</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Reviews;
