import { useNavigate, useSearchParams } from 'react-router-dom';
import { XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CheckoutCancel = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id');

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
          <XCircle className="w-12 h-12 text-red-600" />
        </div>
        
        <h1 className="text-3xl font-bold text-foreground">
          Плащането е отменено
        </h1>
        
        <p className="text-muted-foreground">
          Плащането не беше завършено. Вашата количка е запазена.
        </p>
        
        <div className="pt-4 space-y-3">
          <Button onClick={() => navigate('/checkout')} className="w-full">
            Опитай отново
          </Button>
          <Button variant="outline" onClick={() => navigate('/')} className="w-full">
            Към началната страница
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutCancel;
