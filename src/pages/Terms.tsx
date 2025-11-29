import Footer from "@/components/Footer";
import { useSEO } from "@/hooks/useSEO";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const Terms = () => {
  const { t } = useTranslation();
  
  useSEO();

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('navigation.back')}
          </Button>
        </Link>
      </div>
      
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <article className="prose prose-lg dark:prose-invert max-w-none">
            <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center">{t("terms.title")}</h1>
            
            <h2 className="text-2xl font-bold mt-8 mb-4">{t("terms.mainTitle")}</h2>
            <p className="text-muted-foreground">{t("terms.website")}</p>
            
            <hr className="my-8 border-border" />
            
            <h3 className="text-xl font-semibold mt-8 mb-4">{t("terms.section1Title")}</h3>
            <p>{t("terms.article1")}</p>
            
            <hr className="my-8 border-border" />
            
            <h3 className="text-xl font-semibold mt-8 mb-4">{t("terms.section2Title")}</h3>
            <p><strong>{t("terms.article2Intro")}</strong></p>
            <ol className="list-decimal pl-6 space-y-2">
              <li><strong>{t("terms.providerName")}</strong> {t("terms.providerNameValue")}</li>
              <li><strong>{t("terms.headquarters")}</strong> {t("terms.headquartersValue")}</li>
              <li><strong>{t("terms.complaintsAddress")}</strong> info@gomatcha.bg</li>
              <li><strong>{t("terms.correspondenceData")}</strong> {t("terms.correspondenceValue")}</li>
              <li><strong>{t("terms.publicRegisters")}</strong> {t("terms.publicRegistersValue")}</li>
              <li>
                <strong>{t("terms.supervisoryAuthorities")}</strong>
                <div className="mt-2 space-y-4">
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="font-medium">{t("terms.cpdpTitle")}</p>
                    <p>{t("terms.cpdpAddress")}</p>
                    <p>{t("terms.cpdpPhone")}</p>
                    <p>{t("terms.cpdpFax")}</p>
                    <p>{t("terms.cpdpEmail")}</p>
                    <p>{t("terms.cpdpWebsite")}</p>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="font-medium">{t("terms.kzpTitle")}</p>
                    <p>{t("terms.kzpAddress")}</p>
                    <p>{t("terms.kzpPhone")}</p>
                    <p>{t("terms.kzpFax")}</p>
                    <p>{t("terms.kzpHotline")}</p>
                    <p>{t("terms.kzpWebsite")}</p>
                  </div>
                </div>
              </li>
              <li><strong>{t("terms.vatRegistration")}</strong> {t("terms.vatRegistrationValue")}</li>
            </ol>
            
            <hr className="my-8 border-border" />
            
            <h3 className="text-xl font-semibold mt-8 mb-4">{t("terms.section3Title")}</h3>
            <p>{t("terms.article3")}</p>
            <ol className="list-decimal pl-6 space-y-2">
              <li>{t("terms.platformFeature1")}</li>
              <li>{t("terms.platformFeature2")}</li>
              <li>{t("terms.platformFeature3")}</li>
              <li>{t("terms.platformFeature4")}</li>
              <li>{t("terms.platformFeature5")}</li>
              <li>{t("terms.platformFeature6")}</li>
              <li>{t("terms.platformFeature7")}</li>
              <li>{t("terms.platformFeature8")}</li>
            </ol>
            
            <hr className="my-8 border-border" />
            
            <h3 className="text-xl font-semibold mt-8 mb-4">{t("terms.section4Title")}</h3>
            
            <hr className="my-8 border-border" />
            
            <h3 className="text-xl font-semibold mt-8 mb-4">{t("terms.section5Title")}</h3>
            
            <hr className="my-8 border-border" />
            
            <h3 className="text-xl font-semibold mt-8 mb-4">{t("terms.section6Title")}</h3>
            
            <hr className="my-8 border-border" />
            
            <h3 className="text-xl font-semibold mt-8 mb-4">{t("terms.section7Title")}</h3>
            <p><strong>{t("terms.returnRightTitle")}</strong></p>
            <p>{t("terms.returnRightDesc")}</p>
            <p className="mt-4"><strong>{t("terms.returnExceptions")}</strong></p>
            <ul className="list-disc pl-6 space-y-1">
              <li>{t("terms.returnException1")}</li>
              <li>{t("terms.returnException2")}</li>
              <li>{t("terms.returnException3")}</li>
              <li>{t("terms.returnException4")}</li>
            </ul>
            <p className="mt-4 font-medium">{t("terms.returnAddress")}</p>
            
            <hr className="my-8 border-border" />
            
            <h3 className="text-xl font-semibold mt-8 mb-4">{t("terms.section8Title")}</h3>
            
            <hr className="my-8 border-border" />
            
            <h3 className="text-xl font-semibold mt-8 mb-4">{t("terms.section9Title")}</h3>
            
            <hr className="my-8 border-border" />
            
            <h3 className="text-xl font-semibold mt-8 mb-4">{t("terms.section10Title")}</h3>
            <p><strong>{t("terms.terminationCases")}</strong></p>
            <ul className="list-disc pl-6 space-y-1">
              <li>{t("terms.terminationCase1")}</li>
              <li>{t("terms.terminationCase2")}</li>
              <li>{t("terms.terminationCase3")}</li>
              <li>{t("terms.terminationCase4")}</li>
              <li>{t("terms.terminationCase5")}</li>
            </ul>
            
            <hr className="my-8 border-border" />
            
            <h3 className="text-xl font-semibold mt-8 mb-4">{t("terms.section11Title")}</h3>
            
            <hr className="my-8 border-border" />
            
            <h3 className="text-xl font-semibold mt-8 mb-4">{t("terms.section12Title")}</h3>
            
            <hr className="my-8 border-border" />
            
            <h3 className="text-xl font-semibold mt-8 mb-4">{t("terms.glossaryTitle")}</h3>
            
            <hr className="my-8 border-border" />
            
            <h3 className="text-xl font-semibold mt-8 mb-4">{t("terms.abbreviationsTitle")}</h3>
            
            <hr className="my-8 border-border" />
            
            <p><strong>{t("terms.attachments")}</strong></p>
            <ul className="list-disc pl-6 space-y-1">
              <li>{t("terms.attachment1")}</li>
              <li>{t("terms.attachment2")}</li>
            </ul>
            
            <p className="mt-8 text-muted-foreground">{t("terms.effectiveDate")}</p>
          </article>
        </div>
      </section>
      
      <Footer />
    </main>
  );
};

export default Terms;
