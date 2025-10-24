import { Instagram, Facebook } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-zen-dark text-zen-cream py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="md:col-span-2 space-y-4">
            <div className="space-y-2">
              <h3 className="text-3xl font-bold">SEIJAKU</h3>
              <p className="text-2xl font-light">静寂</p>
            </div>
            <p className="text-zen-silver max-w-md">
              Церемониална японска матча за модерната жена. 
              Енергия от дзен, красота отвътре.
            </p>
            
            {/* Social Links */}
            <div className="flex gap-4 pt-4">
              <a 
                href="https://instagram.com/seijaku" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-primary/20 hover:bg-primary flex items-center justify-center zen-transition"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a 
                href="https://facebook.com/seijaku" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-primary/20 hover:bg-primary flex items-center justify-center zen-transition"
              >
                <Facebook className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-bold text-zen-cream mb-4">За SEIJAKU</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-zen-silver hover:text-primary zen-transition">
                  Нашата история
                </a>
              </li>
              <li>
                <a href="#" className="text-zen-silver hover:text-primary zen-transition">
                  Качество и произход
                </a>
              </li>
              <li>
                <a href="#" className="text-zen-silver hover:text-primary zen-transition">
                  Блог
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-bold text-zen-cream mb-4">Поддръжка</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-zen-silver hover:text-primary zen-transition">
                  Свържи се с нас
                </a>
              </li>
              <li>
                <a href="#" className="text-zen-silver hover:text-primary zen-transition">
                  Доставка
                </a>
              </li>
              <li>
                <a href="#" className="text-zen-silver hover:text-primary zen-transition">
                  Политика за връщане
                </a>
              </li>
              <li>
                <a href="#" className="text-zen-silver hover:text-primary zen-transition">
                  Често задавани въпроси
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-zen-silver/20">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-zen-silver">
            <p>© 2025 SEIJAKU. Всички права запазени.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-primary zen-transition">
                Политика за поверителност
              </a>
              <a href="#" className="hover:text-primary zen-transition">
                Условия за ползване
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
