import Hero from "@/components/Hero";
import WhySeijaku from "@/components/WhySeijaku";
import Benefits from "@/components/Benefits";
import Products from "@/components/Products";
import Ritual from "@/components/Ritual";
import Reviews from "@/components/Reviews";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";
import { useSEO } from "@/hooks/useSEO";
import { FAQSchema } from "@/components/FAQSchema";

const Index = () => {
  useSEO();

  return (
    <main className="min-h-screen">
      <FAQSchema />
      <Hero />
      <WhySeijaku />
      <Benefits />
      <Products />
      <Ritual />
      <Reviews />
      <FAQ />
      <Footer />
    </main>
  );
};

export default Index;
