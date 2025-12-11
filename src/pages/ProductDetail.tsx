import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ShoppingCart, Loader2 } from "lucide-react";
import { getProductByHandle, Product, CartItem } from "@/lib/products";
import { useCartStore } from "@/stores/cartStore";
import { toast } from "sonner";
import { ProductSchema } from "@/components/ProductSchema";
import { BreadcrumbSchema } from "@/components/BreadcrumbSchema";
import { useSEO } from "@/hooks/useSEO";
import { useTranslation } from 'react-i18next';
import { EUR_PRICE_GR, RON_PRICE_RO, EUR_PRICE_RO, BGN_TO_EUR_RATE } from "@/lib/pricing";

const ProductDetail = () => {
  const { t } = useTranslation();
  const { handle } = useParams<{ handle: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [selectedCountry, setSelectedCountry] = useState('BG');
  const addItem = useCartStore(state => state.addItem);
  
  useSEO();

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
    const fetchProduct = async () => {
      if (!handle) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const data = await getProductByHandle(handle);
      setProduct(data);
      // Reset to first available variant
      if (data) {
        const firstAvailableIndex = data.variants.findIndex(v => v.availableForSale);
        setSelectedVariantIndex(firstAvailableIndex >= 0 ? firstAvailableIndex : 0);
      }
      setLoading(false);
    };
    fetchProduct();
  }, [handle]);

  const handleAddToCart = () => {
    if (!product) return;
    
    const selectedVariant = product.variants[selectedVariantIndex];
    
    const cartItem: CartItem = {
      product,
      variantId: selectedVariant.id,
      variantTitle: selectedVariant.title,
      price: selectedVariant.price,
      quantity: 1,
      selectedOptions: selectedVariant.selectedOptions
    };
    
    addItem(cartItem);
    toast.success(t('products.addedToCart'));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-soft">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">{t('products.productNotFound')}</p>
          <Link to="/">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('products.backToHome')}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const selectedVariant = product.variants[selectedVariantIndex];

  return (
    <div className="min-h-screen bg-gradient-soft">
      <ProductSchema product={product} selectedVariant={selectedVariant} />
      <BreadcrumbSchema 
        productName={product.title}
        productUrl={window.location.href}
      />
      <div className="container mx-auto px-4 py-8">
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('products.backToProducts')}
          </Button>
        </Link>

        <Card className="overflow-hidden">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="relative aspect-square bg-gradient-to-br from-accent to-background p-8">
              {product.images[0] ? (
                <img
                  src={product.images[0].url}
                  alt={product.title}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  {t('products.noImage')}
                </div>
              )}
            </div>

            <CardContent className="p-8">
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold text-foreground mb-2">
                    {t(product.title)}
                  </h1>
                  <div>
                    {selectedCountry === 'GR' ? (
                      <p className="text-2xl font-bold text-primary">
                        {EUR_PRICE_GR.toFixed(2)} €
                      </p>
                    ) : selectedCountry === 'RO' ? (
                      <>
                        <p className="text-2xl font-bold text-primary">
                          {RON_PRICE_RO.toFixed(2)} lei
                        </p>
                        <p className="text-sm text-muted-foreground">
                          ≈ {EUR_PRICE_RO.toFixed(2)} €
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-2xl font-bold text-primary">
                          {t('products.priceBGN', { price: Math.round(parseFloat(selectedVariant.price.amount)) })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {t('products.priceEUR', { price: (parseFloat(selectedVariant.price.amount) / BGN_TO_EUR_RATE).toFixed(2) })}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-semibold mb-2">{t('products.description')}</h2>
                  <p className="text-muted-foreground">{t(product.description)}</p>
                </div>

                {product.variants.length > 1 && (
                  <div>
                    <h2 className="text-lg font-semibold mb-2">{t('products.variants')}</h2>
                    <div className="flex flex-wrap gap-2">
                      {product.variants.map((variant, index) => (
                        <Button
                          key={variant.id}
                          variant={selectedVariantIndex === index ? "default" : "outline"}
                          onClick={() => setSelectedVariantIndex(index)}
                          disabled={!variant.availableForSale}
                          className={!variant.availableForSale ? "line-through opacity-50 cursor-not-allowed" : ""}
                        >
                          {variant.title}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                <Button 
                  onClick={handleAddToCart}
                  size="lg"
                  className="w-full"
                  disabled={!selectedVariant.availableForSale}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  {selectedVariant.availableForSale ? t('products.addToCart') : t('products.soldOut')}
                </Button>
              </div>
            </CardContent>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ProductDetail;
