import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCartStore } from '@/stores/cartStore';
import { ArrowLeft, Loader2, CreditCard, Banknote, ShoppingBag, MapPin, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';
import Footer from '@/components/Footer';

// Shipping rates configuration - easy to change later
const SHIPPING_RATES: Record<string, { price: number; currency: string; label: string }> = {
  BG: { price: 5, currency: 'BGN', label: 'лв.' },
  GR: { price: 10, currency: 'EUR', label: '€' },
  RO: { price: 40, currency: 'RON', label: 'лей' },
};

// Fallback countries in case API fails
const FALLBACK_COUNTRIES = [
  { code: 'BG', name: 'Bulgaria' },
  { code: 'GR', name: 'Greece' },
  { code: 'RO', name: 'Romania' },
];

interface Country {
  code: string;
  name: string;
}

interface Office {
  id: string;
  name: string;
  address: string;
  city: string;
  postcode?: string;
}

const Checkout = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { items, getTotalPrice } = useCartStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Countries and offices state
  const [countries, setCountries] = useState<Country[]>(FALLBACK_COUNTRIES);
  const [offices, setOffices] = useState<Office[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [loadingOffices, setLoadingOffices] = useState(false);
  const [countriesError, setCountriesError] = useState<string | null>(null);
  const [officesError, setOfficesError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    shippingCountry: '',
    shippingOffice: '',
    deliveryType: 'address', // 'address' or 'office'
    paymentMethod: 'cod',
  });

  const productsTotal = getTotalPrice();
  const shippingRate = formData.shippingCountry ? SHIPPING_RATES[formData.shippingCountry] : null;
  const shippingPrice = shippingRate?.price || 0;
  const totalWithShipping = productsTotal + shippingPrice;

  // Fetch countries from NextLevel API
  useEffect(() => {
    const fetchCountries = async () => {
      setLoadingCountries(true);
      setCountriesError(null);
      
      try {
        const { data, error } = await supabase.functions.invoke('fulfillment', {
          body: {},
          method: 'GET',
        });

        // Use fetch directly for GET with query params
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fulfillment?action=countries`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const countriesData = await response.json();
        
        if (countriesData.error) {
          throw new Error(countriesData.error);
        }

        // Map API response to our format (adjust based on actual API response structure)
        if (Array.isArray(countriesData)) {
          const mappedCountries = countriesData.map((c: any) => ({
            code: c.code || c.iso_code || c.id,
            name: c.name || c.country_name,
          }));
          setCountries(mappedCountries.length > 0 ? mappedCountries : FALLBACK_COUNTRIES);
        } else {
          setCountries(FALLBACK_COUNTRIES);
        }
      } catch (error) {
        console.error('Error fetching countries:', error);
        setCountriesError(t('checkout.countriesLoadError'));
        setCountries(FALLBACK_COUNTRIES);
      } finally {
        setLoadingCountries(false);
      }
    };

    fetchCountries();
  }, [t]);

  // Fetch offices when country changes and delivery type is office
  useEffect(() => {
    const fetchOffices = async () => {
      if (!formData.shippingCountry || formData.deliveryType !== 'office') {
        setOffices([]);
        setOfficesError(null);
        return;
      }

      setLoadingOffices(true);
      setOfficesError(null);
      
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fulfillment?action=offices&country=${formData.shippingCountry}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const officesData = await response.json();
        
        if (officesData.error) {
          console.error('Offices API error:', officesData.error);
          setOfficesError(t('checkout.officesLoadError'));
          setOffices([]);
        } else if (Array.isArray(officesData) && officesData.length > 0) {
          setOffices(officesData);
          setOfficesError(null);
        } else {
          setOffices([]);
          setOfficesError(t('checkout.noOfficesAvailable'));
        }
      } catch (error) {
        console.error('Error fetching offices:', error);
        setOfficesError(t('checkout.officesLoadError'));
        setOffices([]);
      } finally {
        setLoadingOffices(false);
      }
    };

    fetchOffices();
  }, [formData.shippingCountry, formData.deliveryType, t]);

  const checkoutSchema = z.object({
    firstName: z.string().trim().min(2, t('checkout.firstNameRequired')),
    lastName: z.string().trim().min(2, t('checkout.lastNameRequired')),
    email: z.string().trim().email(t('checkout.invalidEmail')),
    phone: z.string().trim().min(6, t('checkout.phoneRequired')),
    address: formData.deliveryType === 'address' 
      ? z.string().trim().min(5, t('checkout.addressRequired'))
      : z.string().optional(),
    city: formData.deliveryType === 'address'
      ? z.string().trim().min(2, t('checkout.cityRequired'))
      : z.string().optional(),
    postalCode: formData.deliveryType === 'address'
      ? z.string().trim().min(4, t('checkout.postalCodeRequired'))
      : z.string().optional(),
    shippingCountry: z.string().min(2, t('checkout.countryRequired')),
    shippingOffice: formData.deliveryType === 'office'
      ? z.string().min(1, t('checkout.officeRequired'))
      : z.string().optional(),
    deliveryType: z.enum(['address', 'office']),
    paymentMethod: z.enum(['cod', 'card']),
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (items.length === 0) {
      toast.error(t('checkout.emptyCart'));
      return;
    }

    const validation = checkoutSchema.safeParse(formData);
    if (!validation.success) {
      toast.error(validation.error.errors[0]?.message || t('checkout.fillAllFields'));
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedOffice = offices.find(o => o.id === formData.shippingOffice);
      
      const customer = {
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        phone: formData.phone,
        address: formData.deliveryType === 'office' && selectedOffice
          ? `${selectedOffice.name}, ${selectedOffice.address}`
          : formData.address,
        city: formData.deliveryType === 'office' && selectedOffice
          ? selectedOffice.city
          : formData.city,
        postalCode: formData.deliveryType === 'office' && selectedOffice
          ? selectedOffice.postcode
          : formData.postalCode,
        shippingCountry: formData.shippingCountry,
        shippingOfficeId: formData.deliveryType === 'office' ? formData.shippingOffice : null,
        deliveryType: formData.deliveryType,
        shippingPrice: shippingPrice,
        totalWithShipping: totalWithShipping,
        // Courier office details for order storage
        courierOfficeId: formData.deliveryType === 'office' && selectedOffice ? selectedOffice.id : null,
        courierOfficeName: formData.deliveryType === 'office' && selectedOffice ? selectedOffice.name : null,
        courierOfficeAddress: formData.deliveryType === 'office' && selectedOffice 
          ? `${selectedOffice.address}, ${selectedOffice.city}${selectedOffice.postcode ? `, ${selectedOffice.postcode}` : ''}`
          : null,
      };

      const cartItems = items.map(item => ({
        productId: item.product.id,
        productTitle: item.product.title,
        variantId: item.variantId,
        variantTitle: item.selectedOptions.map(o => o.value).join(' • '),
        quantity: item.quantity,
        price: item.price,
        selectedOptions: item.selectedOptions,
      }));

      if (formData.paymentMethod === 'card') {
        // Stripe checkout
        const { data, error } = await supabase.functions.invoke('stripe-checkout', {
          body: {
            items: cartItems,
            customer,
            successUrl: `${window.location.origin}/checkout/success`,
            cancelUrl: `${window.location.origin}/checkout/cancel`,
          },
        });

        if (error) throw error;

        if (data?.url) {
          // Redirect to Stripe checkout
          window.location.href = data.url;
        } else {
          throw new Error('No checkout URL returned');
        }
      } else {
        // Cash on delivery
        const { data, error } = await supabase.functions.invoke('create-cod-order', {
          body: {
            items: cartItems,
            customer,
          },
        });

        if (error) throw error;

        // Send order email
        await supabase.functions.invoke('send-order-email', {
          body: {
            customer: {
              firstName: formData.firstName,
              lastName: formData.lastName,
              email: formData.email,
              phone: formData.phone,
            },
            shipping: {
              address: customer.address,
              city: customer.city,
              postalCode: formData.postalCode,
              country: formData.shippingCountry,
              deliveryType: formData.deliveryType,
              officeId: formData.shippingOffice || null,
            },
            paymentMethod: 'cod',
            items: items.map(item => ({
              title: item.product.title,
              variant: item.selectedOptions.map(o => o.value).join(' • '),
              quantity: item.quantity,
              price: parseFloat(item.price.amount),
            })),
            total: productsTotal,
            shippingPrice: shippingPrice,
            totalWithShipping: totalWithShipping,
            currency: 'BGN',
          },
        });

        // Redirect to COD success page
        navigate(`/checkout/cod-success?order_id=${data?.orderId}`);
      }
    } catch (error: unknown) {
      console.error('Order submission error:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(t('checkout.orderError') + ': ' + message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <main className="min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <Link to="/">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('navigation.back')}
            </Button>
          </Link>
        </div>
        
        <section className="py-24 px-4">
          <div className="container mx-auto max-w-2xl text-center">
            <ShoppingBag className="w-16 h-16 mx-auto mb-6 text-muted-foreground" />
            <h1 className="text-3xl font-bold mb-4">{t('checkout.emptyCartTitle')}</h1>
            <p className="text-muted-foreground mb-8">{t('checkout.emptyCartDescription')}</p>
            <Link to="/">
              <Button size="lg">{t('checkout.continueShopping')}</Button>
            </Link>
          </div>
        </section>
        
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('navigation.back')}
          </Button>
        </Link>
      </div>
      
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center">{t('checkout.title')}</h1>
          
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Order Form */}
            <Card className="p-6 md:p-8">
              <h2 className="text-xl font-semibold mb-6">{t('checkout.deliveryInfo')}</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">{t('checkout.firstName')} *</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">{t('checkout.lastName')} *</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">{t('checkout.email')} *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">{t('checkout.phone')} *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                {/* Country Selection */}
                <div className="space-y-2">
                  <Label htmlFor="shippingCountry">{t('checkout.shippingCountry')} *</Label>
                  <Select
                    value={formData.shippingCountry}
                    onValueChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      shippingCountry: value,
                      shippingOffice: '' // Reset office when country changes
                    }))}
                    disabled={loadingCountries}
                  >
                    <SelectTrigger className="bg-background">
                      {loadingCountries ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>{t('checkout.loadingCountries')}</span>
                        </div>
                      ) : (
                        <SelectValue placeholder={t('checkout.selectCountry')} />
                      )}
                    </SelectTrigger>
                    <SelectContent className="bg-background">
                      {countries.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          {t(`checkout.countries.${country.code}`, { defaultValue: country.name })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {countriesError && (
                    <p className="text-sm text-amber-600">{countriesError}</p>
                  )}
                </div>

                {/* Delivery Type Selection */}
                {formData.shippingCountry && (
                  <div className="space-y-4">
                    <Label>{t('checkout.deliveryType')} *</Label>
                    <RadioGroup
                      value={formData.deliveryType}
                      onValueChange={(value) => setFormData(prev => ({ 
                        ...prev, 
                        deliveryType: value,
                        shippingOffice: ''
                      }))}
                      className="space-y-3"
                    >
                      <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <RadioGroupItem value="address" id="delivery-address" />
                        <Label htmlFor="delivery-address" className="flex items-center gap-2 cursor-pointer flex-1">
                          <MapPin className="w-5 h-5 text-primary" />
                          {t('checkout.deliveryToAddress')}
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <RadioGroupItem value="office" id="delivery-office" />
                        <Label htmlFor="delivery-office" className="flex items-center gap-2 cursor-pointer flex-1">
                          <Building2 className="w-5 h-5 text-primary" />
                          {t('checkout.deliveryToOffice')}
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                )}

                {/* Office Selection (for office delivery) */}
                {formData.deliveryType === 'office' && formData.shippingCountry && (
                  <div className="space-y-2">
                    <Label htmlFor="shippingOffice">{t('checkout.selectOffice')} *</Label>
                    <Select
                      value={formData.shippingOffice}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, shippingOffice: value }))}
                      disabled={loadingOffices || offices.length === 0}
                    >
                      <SelectTrigger className="bg-background">
                        {loadingOffices ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>{t('checkout.loadingOffices')}</span>
                          </div>
                        ) : (
                          <SelectValue placeholder={t('checkout.selectOffice')} />
                        )}
                      </SelectTrigger>
                      <SelectContent className="bg-background max-h-[300px]">
                        {offices.length === 0 ? (
                          <SelectItem value="_none" disabled>
                            {t('checkout.noOfficesAvailable')}
                          </SelectItem>
                        ) : (
                          offices.map((office) => (
                            <SelectItem key={office.id} value={office.id}>
                              {office.name} - {office.city}, {office.address}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {officesError && !loadingOffices && (
                      <p className="text-sm text-destructive">{officesError}</p>
                    )}
                  </div>
                )}

                {/* Address Fields (for address delivery) */}
                {formData.deliveryType === 'address' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="address">{t('checkout.address')} *</Label>
                      <Input
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        required={formData.deliveryType === 'address'}
                      />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">{t('checkout.city')} *</Label>
                        <Input
                          id="city"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          required={formData.deliveryType === 'address'}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="postalCode">{t('checkout.postalCode')} *</Label>
                        <Input
                          id="postalCode"
                          name="postalCode"
                          value={formData.postalCode}
                          onChange={handleInputChange}
                          required={formData.deliveryType === 'address'}
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-4">
                  <Label>{t('checkout.paymentMethod')} *</Label>
                  <RadioGroup
                    value={formData.paymentMethod}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value }))}
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value="cod" id="cod" />
                      <Label htmlFor="cod" className="flex items-center gap-2 cursor-pointer flex-1">
                        <Banknote className="w-5 h-5 text-primary" />
                        {t('checkout.cashOnDelivery')}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value="card" id="card" />
                      <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer flex-1">
                        <CreditCard className="w-5 h-5 text-primary" />
                        {t('checkout.cardPayment')}
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg"
                  disabled={
                    isSubmitting || 
                    !formData.shippingCountry || 
                    (formData.deliveryType === 'office' && (!formData.shippingOffice || offices.length === 0 || loadingOffices))
                  }
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('checkout.processing')}
                    </>
                  ) : (
                    t('checkout.placeOrder')
                  )}
                </Button>
              </form>
            </Card>

            {/* Order Summary */}
            <Card className="p-6 md:p-8 h-fit">
              <h2 className="text-xl font-semibold mb-6">{t('checkout.orderSummary')}</h2>
              
              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div key={item.variantId} className="flex gap-4">
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
                      <p className="text-sm text-muted-foreground">
                        {t('checkout.quantity')}: {item.quantity}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-semibold">
                        {t('products.priceBGN', { price: Math.round(parseFloat(item.price.amount) * item.quantity) })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="border-t pt-4 space-y-3">
                {/* Products subtotal */}
                <div className="flex justify-between text-muted-foreground">
                  <span>{t('checkout.subtotal')}</span>
                  <span>{t('products.priceBGN', { price: Math.round(productsTotal) })}</span>
                </div>
                
                {/* Shipping price */}
                <div className="flex justify-between text-muted-foreground">
                  <span>{t('checkout.shippingPrice')}</span>
                  {formData.shippingCountry && shippingRate ? (
                    <span>{shippingRate.price} {shippingRate.label}</span>
                  ) : (
                    <span className="text-sm italic">{t('checkout.selectCountryForShipping')}</span>
                  )}
                </div>
                
                {/* Total */}
                <div className="flex justify-between text-lg font-semibold pt-2 border-t">
                  <span>{t('checkout.total')}</span>
                  <div className="text-right">
                    {formData.shippingCountry ? (
                      <>
                        <span className="block">{t('products.priceBGN', { price: Math.round(totalWithShipping) })}</span>
                        <span className="text-sm text-muted-foreground font-normal">
                          {t('products.priceEUR', { price: (totalWithShipping / 1.9553).toFixed(2) })}
                        </span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">{t('checkout.selectCountryForTotal')}</span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>
      
      <Footer />
    </main>
  );
};

export default Checkout;
