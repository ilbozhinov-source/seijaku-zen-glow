import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCartStore } from '@/stores/cartStore';
import { ArrowLeft, Loader2, CreditCard, Banknote, ShoppingBag, Search, Check, Phone, Truck, Package, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import Footer from '@/components/Footer';
import { CityAutocomplete } from '@/components/CityAutocomplete';
import { SamedayBoxSelector } from '@/components/SamedayBoxSelector';
// Supported shipping countries - only these three
const SUPPORTED_SHIPPING_COUNTRIES = [
  { code: 'BG', name: 'Bulgaria' },
  { code: 'GR', name: 'Greece' },
  { code: 'RO', name: 'Romania' },
] as const;

// Currency conversion rate: 1 EUR = 1.95583 BGN
const BGN_TO_EUR_RATE = 1.95583;

// Currency display helpers
const getCurrencySymbol = (country: string): string => {
  return country === 'BG' ? 'лв.' : '€';
};

const convertToDisplayCurrency = (amountBGN: number, country: string): number => {
  if (country === 'BG') return amountBGN;
  return amountBGN / BGN_TO_EUR_RATE;
};

const formatPrice = (amount: number, country: string): string => {
  const symbol = getCurrencySymbol(country);
  if (country === 'BG') {
    return `${Math.round(amount)} ${symbol}`;
  }
  return `${amount.toFixed(2)} ${symbol}`;
};

// Phone country codes and validation rules
const PHONE_CONFIG: Record<string, { code: string; minLength: number; maxLength: number; placeholder: string }> = {
  BG: { code: '+359', minLength: 9, maxLength: 9, placeholder: '888123456' },
  GR: { code: '+30', minLength: 10, maxLength: 10, placeholder: '6912345678' },
  RO: { code: '+40', minLength: 9, maxLength: 10, placeholder: '712345678' },
};

// ============================================
// SHIPPING METHOD CONFIGURATION
// Easy to add new countries and methods
// ============================================

interface ShippingMethod {
  id: string;
  name: string;
  price: number;
  currency: 'BGN' | 'EUR';
  currencyLabel: string;
  courierCode: string;
  courierName: string;
  type: 'office' | 'address' | 'easybox';
}

// Shipping methods configuration by country
const SHIPPING_METHODS: Record<string, ShippingMethod[]> = {
  BG: [
    { id: 'econt_office', name: 'Еконт — до офис', price: 7.00, currency: 'BGN', currencyLabel: 'лв.', courierCode: 'ECONT', courierName: 'Econt', type: 'office' },
    { id: 'econt_address', name: 'Еконт — до адрес', price: 6.00, currency: 'BGN', currencyLabel: 'лв.', courierCode: 'ECONT', courierName: 'Econt', type: 'address' },
    { id: 'sameday_easybox', name: 'Sameday easybox', price: 4.50, currency: 'BGN', currencyLabel: 'лв.', courierCode: 'SAMEDAY', courierName: 'Sameday', type: 'easybox' },
  ],
  GR: [
    { id: 'speedex', name: 'Speedex', price: 4.00, currency: 'EUR', currencyLabel: '€', courierCode: 'SPEEDX', courierName: 'SpeedX', type: 'address' },
  ],
  RO: [
    { id: 'fan', name: 'FAN Courier', price: 4.00, currency: 'EUR', currencyLabel: '€', courierCode: 'FAN', courierName: 'FAN', type: 'address' },
  ],
};

// Placeholder for future easybox selection
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const selectEasyboxLocker = async (_country: string): Promise<string | null> => {
  // TODO: Implement easybox locker selection modal
  // For now, just return null - the method stores only shippingMethod and shippingPrice
  return null;
};

interface Office {
  id: string;
  name: string;
  address: string;
  place: string;      // city name from NextLevel API
  post_code: string;  // postal code from NextLevel API
  country: string;    // country code
}

// Searchable Office Combobox component
interface OfficeComboboxProps {
  offices: Office[];
  value: string;
  onChange: (value: string) => void;
  loading: boolean;
  error: string | null;
  t: (key: string) => string;
}

const OfficeCombobox = ({ offices, value, onChange, loading, error, t }: OfficeComboboxProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  
  // Sort offices alphabetically by name
  const sortedOffices = useMemo(() => {
    return [...offices].sort((a, b) => a.name.localeCompare(b.name, 'bg'));
  }, [offices]);
  
  // Filter offices based on search term
  const filteredOffices = useMemo(() => {
    if (!searchTerm.trim()) return sortedOffices;
    const term = searchTerm.toLowerCase();
    return sortedOffices.filter(office => 
      office.name.toLowerCase().includes(term) ||
      office.place.toLowerCase().includes(term) ||
      office.address.toLowerCase().includes(term)
    );
  }, [sortedOffices, searchTerm]);
  
  const selectedOffice = sortedOffices.find((office) => office.id === value);
  
  // Close dropdown when clicking outside
  const handleBlur = (e: React.FocusEvent) => {
    // Delay to allow click on option to register
    setTimeout(() => {
      if (!e.currentTarget.contains(document.activeElement)) {
        setIsOpen(false);
      }
    }, 150);
  };
  
  return (
    <div className="space-y-2">
      <Label>{t('checkout.selectOffice')} *</Label>
      <div className="relative" onBlur={handleBlur}>
        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={loading ? t('checkout.loadingOffices') : t('checkout.searchOffice')}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            disabled={loading || sortedOffices.length === 0}
            className="pl-10 bg-background"
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />
          )}
        </div>
        
        {/* Selected office display */}
        {selectedOffice && !isOpen && (
          <div className="mt-2 p-3 border rounded-lg bg-muted/50 flex items-center gap-2">
            <Check className="h-4 w-4 text-primary" />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{selectedOffice.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {selectedOffice.place}, {selectedOffice.address}
              </p>
            </div>
          </div>
        )}
        
        {/* Dropdown list */}
        {isOpen && !loading && filteredOffices.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-background border rounded-lg shadow-lg">
            <ScrollArea className="h-[300px]">
              <div className="p-1">
                {filteredOffices.map((office) => (
                  <button
                    key={office.id}
                    type="button"
                    onClick={() => {
                      onChange(office.id);
                      setSearchTerm('');
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-md hover:bg-muted transition-colors flex items-start gap-2",
                      value === office.id && "bg-muted"
                    )}
                  >
                    <Check
                      className={cn(
                        "h-4 w-4 mt-0.5 shrink-0",
                        value === office.id ? "opacity-100 text-primary" : "opacity-0"
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{office.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {office.place}, {office.address}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
        
        {/* No results message */}
        {isOpen && !loading && searchTerm && filteredOffices.length === 0 && (
          <div className="absolute z-50 w-full mt-1 bg-background border rounded-lg shadow-lg p-4 text-center text-muted-foreground">
            {t('checkout.noOfficesFound')}
          </div>
        )}
      </div>
      {error && !loading && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
};

const Checkout = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { items, getTotalPrice } = useCartStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [geoLoaded, setGeoLoaded] = useState(false);
  
  // Offices state
  const [offices, setOffices] = useState<Office[]>([]);
  const [loadingOffices, setLoadingOffices] = useState(false);
  const [officesError, setOfficesError] = useState<string | null>(null);
  
  // Sameday easybox state
  const [showEasyboxModal, setShowEasyboxModal] = useState(false);
  const [selectedEasybox, setSelectedEasybox] = useState<{ id: string; label: string } | null>(null);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '', // Just the number without country code
    address: '',
    city: '',
    postalCode: '',
    shippingCountry: '',
    shippingOffice: '',
    shippingMethodId: '', // Selected shipping method ID
    paymentMethod: 'cod',
  });

  // Phone validation error
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // Get phone config for current country
  const phoneConfig = formData.shippingCountry ? PHONE_CONFIG[formData.shippingCountry] : null;
  const phoneCountryCode = phoneConfig?.code || '+359';
  const fullPhoneNumber = phoneConfig ? `${phoneConfig.code}${formData.phoneNumber}` : formData.phoneNumber;

  // Get available shipping methods for current country
  const allShippingMethods = formData.shippingCountry 
    ? SHIPPING_METHODS[formData.shippingCountry] || []
    : [];

  // Filter shipping methods based on payment method
  // COD does not support easybox/automat delivery (only office and address)
  const availableShippingMethods = useMemo(() => {
    if (formData.paymentMethod === 'cod') {
      return allShippingMethods.filter(m => m.type === 'office' || m.type === 'address');
    }
    return allShippingMethods;
  }, [allShippingMethods, formData.paymentMethod]);

  // Get selected shipping method
  const selectedShippingMethod = useMemo(() => {
    return availableShippingMethods.find(m => m.id === formData.shippingMethodId);
  }, [availableShippingMethods, formData.shippingMethodId]);

  // GeoIP detection on first load
  useEffect(() => {
    const detectLocation = async () => {
      // Check if we already have stored preferences
      const storedCountry = localStorage.getItem('shipping_country');
      
      if (storedCountry && SUPPORTED_SHIPPING_COUNTRIES.some(c => c.code === storedCountry)) {
        setFormData(prev => ({ ...prev, shippingCountry: storedCountry }));
        setGeoLoaded(true);
        return;
      }

      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/geo-ip`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          console.log('GeoIP detection result:', data);
          
          if (data.success && data.isSupported) {
            // Set shipping country based on detected location
            setFormData(prev => ({ ...prev, shippingCountry: data.shippingCountry }));
            localStorage.setItem('shipping_country', data.shippingCountry);
            
            // Change language if different from current
            if (data.lang && data.lang !== i18n.language) {
              i18n.changeLanguage(data.lang);
              localStorage.setItem('lang', data.lang);
            }
          }
        }
      } catch (error) {
        console.log('GeoIP detection failed, using defaults:', error);
      }
      
      setGeoLoaded(true);
    };

    detectLocation();
  }, [i18n]);

  // Auto-select first/only shipping method when country changes
  useEffect(() => {
    if (formData.shippingCountry) {
      const methods = SHIPPING_METHODS[formData.shippingCountry] || [];
      if (methods.length === 1) {
        // Auto-select if only one method
        setFormData(prev => ({ ...prev, shippingMethodId: methods[0].id }));
      } else if (methods.length > 1 && !methods.find(m => m.id === formData.shippingMethodId)) {
        // Reset method selection if current selection is not valid for new country
        setFormData(prev => ({ ...prev, shippingMethodId: '' }));
      }
    }
  }, [formData.shippingCountry]);

  // Save shipping country to localStorage when changed
  const handleCountryChange = useCallback((value: string) => {
    setFormData(prev => ({ 
      ...prev, 
      shippingCountry: value,
      shippingOffice: '', // Reset office when country changes
      shippingMethodId: '', // Reset method when country changes
    }));
    localStorage.setItem('shipping_country', value);
  }, []);

  // Handle shipping method change
  const handleShippingMethodChange = useCallback((methodId: string) => {
    setFormData(prev => ({ 
      ...prev, 
      shippingMethodId: methodId,
      shippingOffice: '', // Reset office when method changes
    }));
    // Reset easybox selection when method changes
    setSelectedEasybox(null);
  }, []);

  // Handle payment method change - reset easybox if switching to COD
  const handlePaymentMethodChange = useCallback((value: string) => {
    // Check if current shipping method is easybox and switching to COD
    const currentMethod = allShippingMethods.find(m => m.id === formData.shippingMethodId);
    
    if (value === 'cod' && currentMethod?.type === 'easybox') {
      // Reset shipping method and show warning
      setFormData(prev => ({ 
        ...prev, 
        paymentMethod: value,
        shippingMethodId: '',
        shippingOffice: '',
      }));
      setSelectedEasybox(null);
      toast.error(t('checkout.easyboxNotAvailableWithCOD'));
    } else {
      setFormData(prev => ({ ...prev, paymentMethod: value }));
    }
  }, [allShippingMethods, formData.shippingMethodId, t]);

  // Handle easybox selection
  const handleEasyboxSelect = useCallback((box: { id: string; label: string }) => {
    setSelectedEasybox(box);
    setShowEasyboxModal(false);
  }, []);

  const productsTotalBGN = getTotalPrice(); // Always in BGN from cart
  const FREE_SHIPPING_THRESHOLD_BGN = 79;
  const baseShippingPrice = selectedShippingMethod?.price || 0;
  
  // Free shipping for Bulgaria when order is 79 BGN or more
  const isFreeShipping = formData.shippingCountry === 'BG' && productsTotalBGN >= FREE_SHIPPING_THRESHOLD_BGN;
  const shippingPrice = isFreeShipping ? 0 : baseShippingPrice;
  
  // Display currency based on country
  const displayCurrency = formData.shippingCountry === 'BG' ? 'BGN' : 'EUR';
  const displayCurrencyLabel = getCurrencySymbol(formData.shippingCountry);
  
  // Convert products total to display currency
  const productsTotalDisplay = convertToDisplayCurrency(productsTotalBGN, formData.shippingCountry);
  
  // Total with shipping in display currency
  const totalWithShipping = productsTotalDisplay + shippingPrice;

  // Fetch offices when method requires office selection
  useEffect(() => {
    const fetchOfficesFromApi = async () => {
      // Only fetch offices for office-type shipping methods
      if (!formData.shippingCountry || !selectedShippingMethod || selectedShippingMethod.type !== 'office') {
        setOffices([]);
        setOfficesError(null);
        return;
      }

      setLoadingOffices(true);
      setOfficesError(null);
      
      try {
        // Build URL with correct params: country, place (optional), post_code (optional)
        const params = new URLSearchParams({
          action: 'offices',
          country: formData.shippingCountry,
        });
        // Could add: place (city) and post_code filters if we have them in form
        
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fulfillment?${params.toString()}`,
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

        const result = await response.json();
        
        // Response format: { success: boolean, offices: Office[], error?: string }
        if (!result.success) {
          console.error('Offices API error:', result.error);
          setOfficesError(result.error || t('checkout.officesLoadError'));
          setOffices([]);
        } else if (Array.isArray(result.offices) && result.offices.length > 0) {
          // Filter out easybox locations when selecting regular courier offices
          // Easybox entries have "easybox" in their name (case insensitive)
          const filteredOffices = result.offices.filter((office: Office) => 
            !office.name.toLowerCase().includes('easybox')
          );
          setOffices(filteredOffices);
          setOfficesError(filteredOffices.length === 0 ? t('checkout.noOfficesAvailable') : null);
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

    fetchOfficesFromApi();
  }, [formData.shippingCountry, selectedShippingMethod, t]);

  const checkoutSchema = z.object({
    firstName: z.string().trim().min(2, t('checkout.firstNameRequired')),
    lastName: z.string().trim().min(2, t('checkout.lastNameRequired')),
    email: z.string().trim().email(t('checkout.invalidEmail')),
    phoneNumber: phoneConfig 
      ? z.string().trim().min(phoneConfig.minLength, t('checkout.phoneInvalid')).max(phoneConfig.maxLength, t('checkout.phoneInvalid'))
      : z.string().trim().min(6, t('checkout.phoneRequired')),
    address: selectedShippingMethod?.type === 'address' 
      ? z.string().trim().min(5, t('checkout.addressRequired'))
      : z.string().optional(),
    city: selectedShippingMethod?.type === 'address'
      ? z.string().trim().min(2, t('checkout.cityRequired'))
      : z.string().optional(),
    postalCode: selectedShippingMethod?.type === 'address'
      ? z.string().trim().min(4, t('checkout.postalCodeRequired'))
      : z.string().optional(),
    shippingCountry: z.string().min(2, t('checkout.countryRequired')),
    shippingMethodId: z.string().min(1, t('checkout.shippingMethodRequired')),
    shippingOffice: selectedShippingMethod?.type === 'office'
      ? z.string().min(1, t('checkout.officeRequired'))
      : z.string().optional(),
    paymentMethod: z.enum(['cod', 'card']),
  });

  // Handle phone number input - only allow digits
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Remove all non-digits
    setFormData(prev => ({ ...prev, phoneNumber: value }));
    setPhoneError(null);
  };

  // Validate phone number
  const validatePhone = (): boolean => {
    if (!phoneConfig) {
      setPhoneError(t('checkout.selectCountryFirst'));
      return false;
    }
    
    if (formData.phoneNumber.length < phoneConfig.minLength || formData.phoneNumber.length > phoneConfig.maxLength) {
      setPhoneError(t('checkout.phoneInvalid'));
      return false;
    }
    
    setPhoneError(null);
    return true;
  };

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

    // Validate phone number
    if (!validatePhone()) {
      return;
    }

    // Validate easybox selection if method is easybox
    if (selectedShippingMethod?.type === 'easybox' && !selectedEasybox) {
      toast.error(t('checkout.easyboxRequired'));
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
      const selectedCountry = SUPPORTED_SHIPPING_COUNTRIES.find(c => c.code === formData.shippingCountry);
      
      const customer = {
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        phone: fullPhoneNumber, // Full phone with country code
        phoneCountryCode: phoneCountryCode,
        phoneNumber: formData.phoneNumber,
        address: selectedShippingMethod?.type === 'office' && selectedOffice
          ? `${selectedOffice.name}, ${selectedOffice.address}`
          : selectedShippingMethod?.type === 'easybox' && selectedEasybox
          ? selectedEasybox.label
          : formData.address,
        city: selectedShippingMethod?.type === 'office' && selectedOffice
          ? selectedOffice.place  // place = city from NextLevel API
          : formData.city,
        postalCode: selectedShippingMethod?.type === 'office' && selectedOffice
          ? selectedOffice.post_code
          : formData.postalCode,
        // Shipping country info
        shippingCountryCode: formData.shippingCountry,
        shippingCountryName: selectedCountry?.name || formData.shippingCountry,
        // Shipping method info
        shippingMethod: selectedShippingMethod?.id || '',
        shippingMethodName: selectedShippingMethod?.name || '',
        shippingMethodType: selectedShippingMethod?.type || 'address',
        // Pricing
        shippingPrice: shippingPrice,
        shippingCurrency: displayCurrency,
        totalWithShipping: totalWithShipping,
        // Courier info
        courierName: selectedShippingMethod?.courierName || null,
        courierCode: selectedShippingMethod?.courierCode || null,
        // Courier office details (only when delivery to office)
        courierOfficeId: selectedShippingMethod?.type === 'office' && selectedOffice ? selectedOffice.id : null,
        courierOfficeName: selectedShippingMethod?.type === 'office' && selectedOffice ? selectedOffice.name : null,
        courierOfficeAddress: selectedShippingMethod?.type === 'office' && selectedOffice ? selectedOffice.address : null,
        courierOfficeCity: selectedShippingMethod?.type === 'office' && selectedOffice ? selectedOffice.place : null,
        courierOfficePostCode: selectedShippingMethod?.type === 'office' && selectedOffice ? selectedOffice.post_code : null,
        courierOfficeCountryCode: selectedShippingMethod?.type === 'office' ? formData.shippingCountry : null,
        // Sameday easybox details
        samedayBoxId: selectedShippingMethod?.type === 'easybox' && selectedEasybox ? selectedEasybox.id : null,
        samedayBoxLabel: selectedShippingMethod?.type === 'easybox' && selectedEasybox ? selectedEasybox.label : null,
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
              phone: fullPhoneNumber,
            },
            shipping: {
              address: customer.address,
              city: customer.city,
              postalCode: formData.postalCode,
              country: formData.shippingCountry,
              shippingMethod: selectedShippingMethod?.name || '',
              officeId: formData.shippingOffice || null,
            },
            paymentMethod: 'cod',
            items: items.map(item => ({
              title: item.product.title,
              variant: item.selectedOptions.map(o => o.value).join(' • '),
              quantity: item.quantity,
              price: parseFloat(item.price.amount),
            })),
            total: productsTotalDisplay,
            shippingPrice: shippingPrice,
            shippingCurrency: displayCurrency,
            totalWithShipping: totalWithShipping,
            currency: displayCurrency,
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
                  <Label htmlFor="phoneNumber">{t('checkout.phone')} *</Label>
                  <div className="flex">
                    {/* Country code prefix - non-editable */}
                    <div className="flex items-center px-3 border border-r-0 rounded-l-md bg-muted text-muted-foreground min-w-[70px] justify-center">
                      <Phone className="h-4 w-4 mr-1" />
                      <span className="font-medium">{phoneCountryCode}</span>
                    </div>
                    {/* Phone number input - only digits */}
                    <Input
                      id="phoneNumber"
                      name="phoneNumber"
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={formData.phoneNumber}
                      onChange={handlePhoneChange}
                      onBlur={validatePhone}
                      placeholder={phoneConfig?.placeholder || ''}
                      className="rounded-l-none"
                      required
                    />
                  </div>
                  {phoneError && (
                    <p className="text-sm text-destructive">{phoneError}</p>
                  )}
                  {!formData.shippingCountry && (
                    <p className="text-sm text-muted-foreground">{t('checkout.selectCountryFirst')}</p>
                  )}
                </div>

                {/* Country Selection */}
                <div className="space-y-2">
                  <Label htmlFor="shippingCountry">{t('checkout.shippingCountry')} *</Label>
                  <Select
                    value={formData.shippingCountry}
                    onValueChange={handleCountryChange}
                    disabled={false}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder={t('checkout.selectCountry')} />
                    </SelectTrigger>
                    <SelectContent className="bg-background">
                      {SUPPORTED_SHIPPING_COUNTRIES.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          {t(`checkout.countries.${country.code}`, { defaultValue: country.name })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Shipping Method Selection */}
                {formData.shippingCountry && (
                  <div className="space-y-4">
                    <Label>{t('checkout.shippingMethod')} *</Label>
                    <RadioGroup
                      value={formData.shippingMethodId}
                      onValueChange={handleShippingMethodChange}
                      className="space-y-3"
                    >
                      {availableShippingMethods.map((method) => (
                        <div 
                          key={method.id}
                          className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <RadioGroupItem value={method.id} id={`method-${method.id}`} />
                          <Label 
                            htmlFor={`method-${method.id}`} 
                            className="flex items-center justify-between cursor-pointer flex-1"
                          >
                            <div className="flex items-center gap-2">
                              {method.type === 'office' ? (
                                <Package className="w-5 h-5 text-primary" />
                              ) : (
                                <Truck className="w-5 h-5 text-primary" />
                              )}
                              <span>{method.name}</span>
                            </div>
                            <span className="font-semibold">
                              {method.price.toFixed(2)} {method.currencyLabel}
                            </span>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                )}

                {/* Office Selection (for office delivery methods) */}
                {selectedShippingMethod?.type === 'office' && formData.shippingCountry && (
                  <OfficeCombobox
                    offices={offices}
                    value={formData.shippingOffice}
                    onChange={(value) => setFormData(prev => ({ ...prev, shippingOffice: value }))}
                    loading={loadingOffices}
                    error={officesError}
                    t={t}
                  />
                )}

                {/* Address Fields (for address delivery methods) */}
                {selectedShippingMethod?.type === 'address' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="address">{t('checkout.address')} *</Label>
                      <Input
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        required={selectedShippingMethod?.type === 'address'}
                      />
                    </div>

                    <CityAutocomplete
                      country={formData.shippingCountry}
                      value={formData.city}
                      postalCode={formData.postalCode}
                      onCityChange={(city) => setFormData(prev => ({ ...prev, city }))}
                      onPostalCodeChange={(postalCode) => setFormData(prev => ({ ...prev, postalCode }))}
                      cityLabel={t('checkout.city')}
                      postalCodeLabel={t('checkout.postalCode')}
                      required={selectedShippingMethod?.type === 'address'}
                    />
                  </>
                )}

                {/* Easybox selection */}
                {selectedShippingMethod?.type === 'easybox' && (
                  <div className="space-y-3">
                    <Label>{t('checkout.selectEasybox')} *</Label>
                    
                    {selectedEasybox ? (
                      <div className="p-4 border rounded-lg bg-primary/5 border-primary/30">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-primary shrink-0" />
                              <span className="font-medium">{t('checkout.selectedEasybox')}</span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1 truncate">
                              {selectedEasybox.label}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowEasyboxModal(true)}
                          >
                            <Edit2 className="h-4 w-4 mr-1" />
                            {t('checkout.change')}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start h-auto py-4"
                        onClick={() => setShowEasyboxModal(true)}
                      >
                        <Package className="h-5 w-5 mr-2 text-primary" />
                        <span>{t('checkout.selectEasyboxButton')}</span>
                      </Button>
                    )}
                    
                    <p className="text-sm text-muted-foreground">
                      {t('checkout.easyboxInfo')}
                    </p>
                  </div>
                )}

                {/* Sameday Box Selector Modal */}
                <SamedayBoxSelector
                  isOpen={showEasyboxModal}
                  onClose={() => setShowEasyboxModal(false)}
                  onSelect={handleEasyboxSelect}
                  t={t}
                />

                <div className="space-y-4">
                  <Label>{t('checkout.paymentMethod')} *</Label>
                  <RadioGroup
                    value={formData.paymentMethod}
                    onValueChange={handlePaymentMethodChange}
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
                    !formData.shippingMethodId ||
                    (selectedShippingMethod?.type === 'office' && (!formData.shippingOffice || offices.length === 0 || loadingOffices)) ||
                    (selectedShippingMethod?.type === 'easybox' && !selectedEasybox)
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
                        {formatPrice(
                          convertToDisplayCurrency(parseFloat(item.price.amount) * item.quantity, formData.shippingCountry),
                          formData.shippingCountry
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="border-t pt-4 space-y-3">
                {/* Products subtotal */}
                <div className="flex justify-between text-muted-foreground">
                  <span>{t('checkout.subtotal')}</span>
                  <span>{formatPrice(productsTotalDisplay, formData.shippingCountry)}</span>
                </div>
                
                {/* Shipping price */}
                <div className="flex justify-between text-muted-foreground">
                  <span>{t('checkout.shippingPrice')}</span>
                  {selectedShippingMethod ? (
                    isFreeShipping ? (
                      <span className="text-green-600 font-medium">{t('checkout.freeShipping')}</span>
                    ) : (
                      <span>{shippingPrice.toFixed(2)} {displayCurrencyLabel}</span>
                    )
                  ) : (
                    <span className="text-sm italic">{t('checkout.selectShippingMethod')}</span>
                  )}
                </div>
                
                {/* Total */}
                <div className="flex justify-between text-lg font-semibold pt-2 border-t">
                  <span>{t('checkout.total')}</span>
                  <div className="text-right">
                    {selectedShippingMethod ? (
                      <span className="block">
                        {formatPrice(totalWithShipping, formData.shippingCountry)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">{t('checkout.selectShippingForTotal')}</span>
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
