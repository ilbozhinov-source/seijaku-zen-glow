import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/stores/cartStore';

const CheckoutSuccess = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const clearCart = useCartStore((state) => state.clearCart);
  
  const orderId = searchParams.get('order_id');

  useEffect(() => {
    // Clear cart on successful checkout
    clearCart();
  }, [clearCart]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        
        <h1 className="text-3xl font-bold text-foreground">
          Поръчката е успешна!
        </h1>
        
        <p className="text-muted-foreground">
          Благодарим ви за поръчката. Плащането е получено успешно.
        </p>
        
        {orderId && (
          <p className="text-sm text-muted-foreground">
            Номер на поръчка: <span className="font-mono font-medium">{orderId.slice(0, 8)}</span>
          </p>
        )}
        
        <p className="text-sm text-muted-foreground">
          Ще получите имейл с потвърждение на поръчката.
        </p>
        
        <div className="pt-4 space-y-3">
          <Button onClick={() => navigate('/')} className="w-full">
            Към началната страница
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutSuccess;
