import { Instagram, Facebook } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

const Footer = () => {
  const { t } = useTranslation();

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
            <p className="text-zen-silver max-w-md">{t("footer.tagline")}</p>

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
            <h4 className="font-bold text-zen-cream mb-4">{t("footer.aboutTitle")}</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/story" className="text-sm text-zen-silver hover:text-primary zen-transition">
                  {t("footer.ourStory")}
                </Link>
              </li>
              <li>
                <Link to="/quality" className="text-sm text-zen-silver hover:text-primary zen-transition">
                  {t("footer.quality")}
                </Link>
              </li>
              <li>
                <Link to="/reviews" className="text-sm text-zen-silver hover:text-primary zen-transition">
                  {t("footer.reviews")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-bold text-zen-cream mb-4">{t("footer.supportTitle")}</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/contact" className="text-sm text-zen-silver hover:text-primary zen-transition">
                  {t("footer.contact")}
                </Link>
              </li>
              <li>
                <Link to="/delivery" className="text-sm text-zen-silver hover:text-primary zen-transition">
                  {t("footer.shipping")}
                </Link>
              </li>
              <li>
                <Link to="/returns" className="text-sm text-zen-silver hover:text-primary zen-transition">
                  {t("footer.returns")}
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-sm text-zen-silver hover:text-primary zen-transition">
                  {t("footer.faq")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-zen-silver/20">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-zen-silver">
            <p>{t("footer.rights")}</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-primary zen-transition">
                {t("footer.privacy")}
              </a>
              <a href="#" className="hover:text-primary zen-transition">
                {t("footer.terms")}
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
export default Footer;
