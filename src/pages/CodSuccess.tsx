import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Package, Truck, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/stores/cartStore';
import { supabase } from '@/integrations/supabase/client';

interface OrderFulfillmentData {
  order_number: string | null;
  tracking_number: string | null;
  sent_to_fulfillment: boolean | null;
  fulfillment_error: string | null;
}

const CodSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const clearCart = useCartStore((state) => state.clearCart);
  const [orderData, setOrderData] = useState<OrderFulfillmentData | null>(null);
  
  const orderId = searchParams.get('order_id');

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  useEffect(() => {
    const fetchOrderData = async () => {
      if (orderId) {
        const { data } = await supabase
          .from('orders')
          .select('order_number, tracking_number, sent_to_fulfillment, fulfillment_error')
          .eq('id', orderId)
          .maybeSingle();
        
        if (data) {
          setOrderData(data as OrderFulfillmentData);
        }
      }
    };
    
    // Poll for fulfillment data (it may take a moment)
    fetchOrderData();
    const interval = setInterval(fetchOrderData, 2000);
    setTimeout(() => clearInterval(interval), 10000);
    
    return () => clearInterval(interval);
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
        
        {(orderData?.order_number || orderId) && (
          <p className="text-sm text-muted-foreground">
            Номер на поръчка: <span className="font-mono font-medium">{orderData?.order_number || orderId?.slice(0, 8)}</span>
          </p>
        )}

        {/* Show tracking number if fulfillment was successful */}
        {orderData?.sent_to_fulfillment && orderData?.tracking_number && (
          <div className="bg-primary/10 rounded-lg p-4 flex items-center justify-center gap-3">
            <Truck className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Поръчката е изпратена към склада</p>
              <p className="text-sm text-muted-foreground">Tracking номер:</p>
              <p className="font-mono font-bold text-foreground">{orderData.tracking_number}</p>
            </div>
          </div>
        )}

        {/* Show message if fulfillment failed */}
        {orderData?.sent_to_fulfillment === false && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="text-left">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Поръчката е създадена успешно
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                Имаше проблем със свързването към куриерската система. 
                Ние ще обработим поръчката ви ръчно и ще се свържем с вас.
              </p>
            </div>
          </div>
        )}
        
        <div className="bg-muted/50 rounded-lg p-4 text-left space-y-2">
          <p className="text-sm font-medium">Какво следва:</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Ще получите имейл с потвърждение</li>
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
