import Hero from "@/components/Hero";
import WhySeijaku from "@/components/WhySeijaku";
import Benefits from "@/components/Benefits";
import Products from "@/components/Products";
import Ritual from "@/components/Ritual";
import Reviews from "@/components/Reviews";
import Footer from "@/components/Footer";
import { useSEO } from "@/hooks/useSEO";

const Index = () => {
  useSEO();

  return (
    <main className="min-h-screen">
      <Hero />
      <WhySeijaku />
      <Benefits />
      <Products />
      <Ritual />
      <Reviews />
      <Footer />
    </main>
  );
};

export default Index;
