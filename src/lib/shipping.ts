// Centralized shipping configuration
// All shipping prices and methods are defined here to ensure consistency across the app

export interface ShippingMethod {
  id: string;
  name: string;
  price: number;
  currency: string;
  currencyLabel: string;
  courierCode: string;
  courierName: string;
  type: 'office' | 'address' | 'easybox';
}

// Bulgaria shipping prices (in BGN)
export const BG_SHIPPING_PRICES = {
  ECONT_OFFICE: 7.99,
  ECONT_ADDRESS: 6.99,
  SAMEDAY_EASYBOX: 4.99,
} as const;

// Greece shipping prices (in EUR)
export const GR_SHIPPING_PRICES = {
  SPEEDEX: 4.00,
} as const;

// Romania shipping prices (in RON)
export const RO_SHIPPING_PRICES = {
  FAN_COURIER: 19.88,
} as const;

// Free shipping threshold for Bulgaria (in BGN)
export const FREE_SHIPPING_THRESHOLD_BG = 79;

// Shipping methods configuration by country
export const SHIPPING_METHODS: Record<string, ShippingMethod[]> = {
  BG: [
    { id: 'econt_office', name: 'Еконт — до офис', price: BG_SHIPPING_PRICES.ECONT_OFFICE, currency: 'BGN', currencyLabel: 'лв.', courierCode: 'ECONT', courierName: 'Econt', type: 'office' },
    { id: 'econt_address', name: 'Еконт — до адрес', price: BG_SHIPPING_PRICES.ECONT_ADDRESS, currency: 'BGN', currencyLabel: 'лв.', courierCode: 'ECONT', courierName: 'Econt', type: 'address' },
    { id: 'sameday_easybox', name: 'Sameday easybox', price: BG_SHIPPING_PRICES.SAMEDAY_EASYBOX, currency: 'BGN', currencyLabel: 'лв.', courierCode: 'SAMEDAY', courierName: 'Sameday', type: 'easybox' },
  ],
  GR: [
    { id: 'speedex', name: 'Speedex', price: GR_SHIPPING_PRICES.SPEEDEX, currency: 'EUR', currencyLabel: '€', courierCode: 'SPEEDX', courierName: 'Speedex', type: 'address' },
  ],
  RO: [
    { id: 'fan_courier', name: 'FAN Courier', price: RO_SHIPPING_PRICES.FAN_COURIER, currency: 'RON', currencyLabel: 'lei', courierCode: 'FAN', courierName: 'FAN', type: 'address' },
  ],
};

// Helper to get shipping methods for a country
export const getShippingMethodsForCountry = (countryCode: string): ShippingMethod[] => {
  return SHIPPING_METHODS[countryCode] || SHIPPING_METHODS.BG;
};

// Helper to get a specific shipping method
export const getShippingMethod = (countryCode: string, methodId: string): ShippingMethod | undefined => {
  const methods = getShippingMethodsForCountry(countryCode);
  return methods.find(m => m.id === methodId);
};
