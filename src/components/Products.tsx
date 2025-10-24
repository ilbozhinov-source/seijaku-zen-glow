import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import productImage from "@/assets/product-matcha.jpg";
import { Check } from "lucide-react";

const Products = () => {
  const features = [
    "30g церемониална матча (достатъчна за 15+ порции)",
    "100% произход от Uji, Киото",
    "Organic & ceremonial grade",
    "Ръчно смляна с каменни мелници",
    "Богата на антиоксиданти и L-теанин",
    "Включена рецепта за приготвяне"
  ];

  return (
    <section id="products" className="py-20 md:py-32 bg-gradient-soft">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
            Открий силата на SEIJAKU
          </h2>
          <p className="text-lg text-muted-foreground">
            Премиум матча, създадена с почит към традицията и любов към детайла
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <Card className="overflow-hidden shadow-zen border-primary/20">
            <div className="grid md:grid-cols-2 gap-0">
              {/* Product Image */}
              <div className="relative h-[400px] md:h-auto bg-gradient-to-br from-accent to-background">
                <img 
                  src={productImage} 
                  alt="SEIJAKU Ceremonial Matcha"
                  className="w-full h-full object-contain p-8 md:p-12"
                />
              </div>

              {/* Product Details */}
              <div className="flex flex-col">
                <CardHeader className="space-y-4 pb-6">
                  <div className="space-y-2">
                    <div className="inline-block px-4 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
                      Ceremonial Grade
                    </div>
                    <h3 className="text-3xl font-bold text-foreground">
                      SEIJAKU Ceremonial Matcha
                    </h3>
                    <p className="text-muted-foreground">
                      Традиционна церемониална матча от Киото
                    </p>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 space-y-6">
                  <div className="space-y-3">
                    {features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-border">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-primary">39.90 лв</span>
                      <span className="text-muted-foreground">/ 30g</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Около 2.66 лв на порция
                    </p>
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-3 pt-6">
                  <Button 
                    variant="hero" 
                    size="lg" 
                    className="w-full"
                    onClick={() => alert('Поръчката ще бъде налична скоро!')}
                  >
                    Поръчай сега
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="w-full"
                    onClick={() => alert('Добавено в количката!')}
                  >
                    Добави в количката
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    Безплатна доставка при поръчка над 50 лв
                  </p>
                </CardFooter>
              </div>
            </div>
          </Card>

          {/* Money Back Guarantee */}
          <div className="mt-12 text-center p-8 bg-card rounded-xl shadow-soft border border-border">
            <h4 className="text-xl font-bold text-foreground mb-3">
              100% Гаранция за удовлетворение
            </h4>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Ако не си доволен/доволна от SEIJAKU в рамките на 30 дни, 
              ще ти върнем парите без въпроси. Вярваме в качеството на нашата матча.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Products;
