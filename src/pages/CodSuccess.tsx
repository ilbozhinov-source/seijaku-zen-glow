import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Package, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/stores/cartStore';
import { supabase } from '@/integrations/supabase/client';

const CodSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const clearCart = useCartStore((state) => state.clearCart);
  const [trackingNumber, setTrackingNumber] = useState<string | null>(null);
  
  const orderId = searchParams.get('order_id');

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  useEffect(() => {
    const fetchTracking = async () => {
      if (orderId) {
        const { data } = await supabase
          .from('orders')
          .select('tracking_number')
          .eq('id', orderId)
          .maybeSingle();
        
        if (data?.tracking_number) {
          setTrackingNumber(data.tracking_number);
        }
      }
    };
    fetchTracking();
  }, [orderId]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
          <Package className="w-12 h-12 text-primary" />
        </div>
        
        <h1 className="text-3xl font-bold text-foreground">
          Поръчката е приета!
        </h1>
        
        <p className="text-muted-foreground">
          Благодарим ви за поръчката. Ще платите при доставка.
        </p>
        
        {orderId && (
          <p className="text-sm text-muted-foreground">
            Номер на поръчка: <span className="font-mono font-medium">{orderId.slice(0, 8)}</span>
          </p>
        )}

        {trackingNumber && (
          <div className="bg-primary/10 rounded-lg p-4 flex items-center justify-center gap-3">
            <Truck className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Tracking номер:</p>
              <p className="font-mono font-bold text-foreground">{trackingNumber}</p>
            </div>
          </div>
        )}
        
        <div className="bg-muted/50 rounded-lg p-4 text-left space-y-2">
          <p className="text-sm font-medium">Какво следва:</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Ще получите имейл с потвърждение</li>
            <li>• Ще ви се обадим за потвърждение на доставката</li>
            <li>• Плащате на куриера при получаване</li>
          </ul>
        </div>
        
        <div className="pt-4">
          <Button onClick={() => navigate('/')} className="w-full">
            Към началната страница
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CodSuccess;
