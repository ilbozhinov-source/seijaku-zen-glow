import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import ProductDetail from "./pages/ProductDetail";
import FAQPage from "./pages/FAQ";
import Story from "./pages/Story";
import Quality from "./pages/Quality";
import Delivery from "./pages/Delivery";
import ReviewsPage from "./pages/Reviews";
import Contact from "./pages/Contact";
import Returns from "./pages/Returns";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/product/:handle" element={<ProductDetail />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/story" element={<Story />} />
          <Route path="/quality" element={<Quality />} />
          <Route path="/delivery" element={<Delivery />} />
          <Route path="/reviews" element={<ReviewsPage />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/returns" element={<Returns />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
