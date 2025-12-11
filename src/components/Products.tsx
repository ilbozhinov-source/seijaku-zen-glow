import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart, Loader2 } from "lucide-react";
import { getProducts, Product, CartItem } from "@/lib/products";
import { useCartStore } from "@/stores/cartStore";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { EUR_PRICE_GR, RON_PRICE_RO, EUR_PRICE_RO, BGN_TO_EUR_RATE } from "@/lib/pricing";

const Products = () => {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState('BG');
  const addItem = useCartStore(state => state.addItem);

  // Read country from cookie on mount
  useEffect(() => {
    const getCookie = (name: string): string | null => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
      return null;
    };
    setSelectedCountry(getCookie('country') || 'BG');
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const data = await getProducts();
      setProducts(data);
      setLoading(false);
    };
    fetchProducts();
  }, []);

  const handleAddToCart = (product: Product) => {
    const firstAvailableVariant = product.variants.find(v => v.availableForSale) || product.variants[0];
    
    const cartItem: CartItem = {
      product,
      variantId: firstAvailableVariant.id,
      variantTitle: firstAvailableVariant.title,
      price: firstAvailableVariant.price,
      quantity: 1,
      selectedOptions: firstAvailableVariant.selectedOptions
    };
    
    addItem(cartItem);
    toast.success(t('products.addedToCart'), {
      position: 'top-center'
    });
  };

  return (
    <section id="products" className="py-20 md:py-32 bg-gradient-soft">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
            {t('products.title')}
          </h2>
          <p className="text-lg text-muted-foreground">
            {t('products.subtitle')}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground mb-4">{t('products.noProducts')}</p>
            <p className="text-sm text-muted-foreground">
              {t('products.noProductsDesc')}
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-8 max-w-7xl mx-auto">
            {products.map((product) => (
              <Card key={product.id} className="overflow-hidden shadow-zen border-primary/20 hover:shadow-xl transition-shadow w-full max-w-sm">
                <Link to={`/product/${product.handle}`}>
                  <div className="relative h-64 bg-gradient-to-br from-accent to-background cursor-pointer">
                    {product.images[0] ? (
                      <img 
                        src={product.images[0].url}
                        alt={product.title}
                        className="w-full h-full object-contain p-8 hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        {t('products.noImage')}
                      </div>
                    )}
                  </div>
                </Link>

                <CardContent className="p-6 space-y-4">
                  <Link to={`/product/${product.handle}`}>
                    <h3 className="text-xl font-bold text-foreground hover:text-primary transition-colors cursor-pointer">
                      {t(product.title)}
                    </h3>
                  </Link>
                  
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {t(product.description)}
                  </p>

                  <div className="flex flex-col gap-1 items-center text-center">
                    {selectedCountry === 'GR' ? (
                      <span className="text-2xl font-bold text-primary">
                        {EUR_PRICE_GR.toFixed(2)} €
                      </span>
                    ) : selectedCountry === 'RO' ? (
                      <>
                        <span className="text-2xl font-bold text-primary">
                          {RON_PRICE_RO.toFixed(2)} lei
                        </span>
                        <span className="text-sm text-muted-foreground">
                          ≈ {EUR_PRICE_RO.toFixed(2)} €
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-2xl font-bold text-primary">
                          {t('products.priceBGN', { price: Math.round(parseFloat(product.priceRange.minVariantPrice.amount)) })}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {t('products.priceEUR', { price: (parseFloat(product.priceRange.minVariantPrice.amount) / BGN_TO_EUR_RATE).toFixed(2) })}
                        </span>
                      </>
                    )}
                  </div>

                  <Button 
                    variant="hero" 
                    size="lg" 
                    className="w-full"
                    onClick={() => handleAddToCart(product)}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    {t('products.addToCart')}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Products;
