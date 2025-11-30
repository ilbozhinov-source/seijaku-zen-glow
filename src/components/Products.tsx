import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart } from "lucide-react";
import { getProducts, ShopifyProduct } from "@/lib/shopify";
import { useCartStore } from "@/stores/cartStore";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';

const Products = () => {
  const { t } = useTranslation();
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const addItem = useCartStore(state => state.addItem);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getProducts();
        setProducts(data);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleAddToCart = (product: ShopifyProduct) => {
    const firstVariant = product.node.variants.edges[0].node;
    
    const cartItem = {
      product,
      variantId: firstVariant.id,
      variantTitle: firstVariant.title,
      price: firstVariant.price,
      quantity: 1,
      selectedOptions: firstVariant.selectedOptions
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
          <div className="text-center py-20">
            <p className="text-muted-foreground">{t('products.loading')}</p>
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
              <Card key={product.node.id} className="overflow-hidden shadow-zen border-primary/20 hover:shadow-xl transition-shadow w-full max-w-sm">
                <Link to={`/product/${product.node.handle}`}>
                  <div className="relative h-64 bg-gradient-to-br from-accent to-background cursor-pointer">
                    {product.node.images.edges[0]?.node ? (
                      <img 
                        src={product.node.images.edges[0].node.url}
                        alt={product.node.title}
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
                  <Link to={`/product/${product.node.handle}`}>
                    <h3 className="text-xl font-bold text-foreground hover:text-primary transition-colors cursor-pointer">
                      {product.node.title}
                    </h3>
                  </Link>
                  
                  {product.node.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {product.node.description}
                    </p>
                  )}

                  <div className="flex flex-col gap-1 items-center text-center">
                    <span className="text-2xl font-bold text-primary">
                      {Math.round(parseFloat(product.node.priceRange.minVariantPrice.amount))} лв.
                    </span>
                    <span className="text-sm text-muted-foreground">
                      ({(parseFloat(product.node.priceRange.minVariantPrice.amount) / 1.9553).toFixed(2)} €)
                    </span>
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
