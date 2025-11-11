import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import { useTranslation } from 'react-i18next';

const Reviews = () => {
  const { t } = useTranslation();
  
  const reviews = [
    {
      name: t('reviews.review1Name'),
      age: t('reviews.review1Age'),
      occupation: t('reviews.review1Occupation'),
      rating: 5,
      text: t('reviews.review1Text'),
      image: "👩🏻‍💼"
    },
    {
      name: t('reviews.review2Name'),
      age: t('reviews.review2Age'),
      occupation: t('reviews.review2Occupation'),
      rating: 5,
      text: t('reviews.review2Text'),
      image: "💪🏻"
    },
    {
      name: t('reviews.review3Name'),
      age: t('reviews.review3Age'),
      occupation: t('reviews.review3Occupation'),
      rating: 5,
      text: t('reviews.review3Text'),
      image: "👩🏼‍💼"
    }
  ];

  return (
    <section className="py-20 md:py-32 bg-gradient-soft">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
            {t('reviews.title')}
          </h2>
          <p className="text-lg text-muted-foreground">
            {t('reviews.subtitle')}
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
                      {review.age} {t('reviews.yearsShort')}, {review.occupation}
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
              <p className="text-sm text-muted-foreground">{t('reviews.averageRating')}</p>
            </div>
            <div className="h-12 w-px bg-border"></div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-1">500+</div>
              <p className="text-sm text-muted-foreground">{t('reviews.satisfiedClients')}</p>
            </div>
            <div className="h-12 w-px bg-border"></div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-1">98%</div>
              <p className="text-sm text-muted-foreground">{t('reviews.recommend')}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Reviews;
