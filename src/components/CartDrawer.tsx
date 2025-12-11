import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ShoppingCart, Minus, Plus, Trash2, ArrowRight, Truck } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { useTranslation } from 'react-i18next';
import { Progress } from "@/components/ui/progress";
import { 
  formatPriceWithCurrency, 
  FREE_SHIPPING_THRESHOLD_BG, 
  EUR_PRICE_GR,
  RON_PRICE_RO
} from "@/lib/pricing";

export const CartDrawer = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('BG');
  const { items, updateQuantity, removeItem, getTotalPrice, getTotalItems } = useCartStore();
  
  // Read country from cookie on mount
  useEffect(() => {
    const getCookie = (name: string): string | null => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
      return null;
    };
    const country = getCookie('country') || 'BG';
    setSelectedCountry(country);
  }, [isOpen]); // Re-check when drawer opens
  
  const totalItems = getTotalItems();
  const totalPriceBGN = getTotalPrice();
  
  // Calculate actual total for display based on country
  const getDisplayTotal = () => {
    if (selectedCountry === 'GR') {
      return items.reduce((sum, item) => sum + (EUR_PRICE_GR * item.quantity), 0);
    }
    if (selectedCountry === 'RO') {
      return items.reduce((sum, item) => sum + (RON_PRICE_RO * item.quantity), 0);
    }
    return totalPriceBGN;
  };
  
  const displayTotal = getDisplayTotal();
  const amountUntilFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD_BG - totalPriceBGN);
  const freeShippingProgress = Math.min(100, (totalPriceBGN / FREE_SHIPPING_THRESHOLD_BG) * 100);

  const handleCheckout = () => {
    setIsOpen(false);
    navigate('/checkout');
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <ShoppingCart className="h-5 w-5" />
          {totalItems > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-primary">
              {totalItems}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-full sm:max-w-lg flex flex-col h-full">
        <SheetHeader className="flex-shrink-0">
          <SheetTitle>{t('cart.title')}</SheetTitle>
          <SheetDescription>
            {totalItems === 0 ? t('cart.empty') : t('cart.itemsInCart', { count: totalItems })}
          </SheetDescription>
        </SheetHeader>
        
        <div className="flex flex-col flex-1 pt-6 min-h-0">
          {items.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">{t('cart.empty')}</p>
              </div>
            </div>
          ) : (
            <>
              {/* Free Shipping Banner - only for Bulgaria */}
              {selectedCountry === 'BG' && (
                <div className="mb-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Truck className="h-4 w-4 text-primary" />
                    {amountUntilFreeShipping > 0 ? (
                      <span className="text-sm">
                        {t('cart.freeShippingBanner', { amount: Math.round(amountUntilFreeShipping) })}
                      </span>
                    ) : (
                      <span className="text-sm text-green-600 font-medium">
                        {t('cart.freeShippingUnlocked')}
                      </span>
                    )}
                  </div>
                  <Progress value={freeShippingProgress} className="h-2" />
                </div>
              )}

              <div className="flex-1 overflow-y-auto pr-2 min-h-0">
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.variantId} className="flex gap-4 p-2">
                      <div className="w-16 h-16 bg-secondary/20 rounded-md overflow-hidden flex-shrink-0">
                        {item.product.images?.[0] && (
                          <img
                            src={item.product.images[0].url}
                            alt={item.product.title}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{item.product.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {item.selectedOptions.map(option => option.value).join(' • ')}
                        </p>
                        <p className="font-semibold text-sm">
                          {formatPriceWithCurrency(parseFloat(item.price.amount), selectedCountry)}
                        </p>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => removeItem(item.variantId)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                        
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex-shrink-0 space-y-4 pt-4 border-t bg-background">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">{t('cart.total')}</span>
                  <div className="text-right">
                    <span className="text-xl font-bold block">
                      {selectedCountry === 'GR' 
                        ? `${displayTotal.toFixed(2)} €`
                        : selectedCountry === 'RO'
                        ? `${displayTotal.toFixed(2)} lei (≈ ${(displayTotal / 4.97).toFixed(2)} €)`
                        : formatPriceWithCurrency(totalPriceBGN, selectedCountry)}
                    </span>
                  </div>
                </div>
                
                <Button 
                  onClick={handleCheckout}
                  className="w-full" 
                  size="lg"
                  disabled={items.length === 0}
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  {t('cart.checkout')}
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};