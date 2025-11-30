import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { getProductByHandle, CartItem } from "@/lib/products";
import { useCartStore } from "@/stores/cartStore";
import { toast } from "sonner";
import { ProductSchema } from "@/components/ProductSchema";
import { BreadcrumbSchema } from "@/components/BreadcrumbSchema";
import { useSEO } from "@/hooks/useSEO";
import { useTranslation } from 'react-i18next';

const ProductDetail = () => {
  const { t } = useTranslation();
  const { handle } = useParams<{ handle: string }>();
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const addItem = useCartStore(state => state.addItem);
  
  useSEO();

  const product = handle ? getProductByHandle(handle) : null;

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
                    {product.title}
                  </h1>
                  <div>
                    <p className="text-2xl font-bold text-primary">
                      {t('products.priceBGN', { price: Math.round(parseFloat(selectedVariant.price.amount)) })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t('products.priceEUR', { price: (parseFloat(selectedVariant.price.amount) / 1.9553).toFixed(2) })}
                    </p>
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-semibold mb-2">{t('products.description')}</h2>
                  <p className="text-muted-foreground">{product.description}</p>
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