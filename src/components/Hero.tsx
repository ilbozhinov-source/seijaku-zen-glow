import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-matcha.jpg";

const Hero = () => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/90 to-background"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-1000">
          {/* Japanese Characters */}
          <div className="text-primary-light text-6xl md:text-8xl font-light tracking-wider mb-4">
            静寂
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight">
            SEIJAKU
          </h1>

          <p className="text-xl md:text-2xl text-primary font-medium">
            Енергия от Дзен. Красота отвътре.
          </p>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Церемониална японска матча за модерната жена
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
            <Button 
              variant="hero" 
              size="lg"
              onClick={() => scrollToSection('products')}
            >
              Купи сега
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => scrollToSection('benefits')}
            >
              Научи повече
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="pt-12 flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="text-primary text-lg">✓</span>
              <span>100% японска</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-primary text-lg">✓</span>
              <span>Ceremonial grade</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-primary text-lg">✓</span>
              <span>Ръчно смляна</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-primary rounded-full flex items-start justify-center p-2">
          <div className="w-1.5 h-3 bg-primary rounded-full"></div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
