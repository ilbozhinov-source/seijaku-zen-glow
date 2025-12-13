// Pricing utilities for country-specific pricing

// Re-export FREE_SHIPPING_THRESHOLD_BG from shipping.ts for backwards compatibility
export { FREE_SHIPPING_THRESHOLD_BG } from './shipping';

export const BGN_TO_EUR_RATE = 1.95583;
export const EUR_TO_RON_RATE = 4.97; // 1 EUR = 4.97 RON
export const EUR_PRICE_GR = 14.99; // Fixed EUR price for Greece
export const EUR_PRICE_RO = 14.99; // Fixed EUR price for Romania (base for RON conversion)
export const RON_PRICE_RO = Math.round(EUR_PRICE_RO * EUR_TO_RON_RATE * 100) / 100; // ~74.50 RON

// Legacy export for backwards compatibility
export const EUR_PRICE_GR_RO = EUR_PRICE_GR;

/**
 * Get the display price based on country
 * Bulgaria: Shows BGN price from DB
 * Greece: Shows fixed EUR price
 * Romania: Shows RON price
 */
export function getDisplayPrice(amountBGN: number, country: string): number {
  if (country === 'GR') {
    return EUR_PRICE_GR;
  }
  if (country === 'RO') {
    return RON_PRICE_RO;
  }
  return amountBGN;
}

/**
 * Get the currency code for display
 */
export function getCurrencyCode(country: string): string {
  if (country === 'GR') {
    return 'EUR';
  }
  if (country === 'RO') {
    return 'RON';
  }
  return 'BGN';
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(country: string): string {
  if (country === 'GR') {
    return '€';
  }
  if (country === 'RO') {
    return 'lei';
  }
  return 'лв.';
}

/**
 * Format price with currency based on country
 * Bulgaria: "29 лв. (≈ 14.83 €)"
 * Greece: "14.99 €"
 * Romania: "74.50 lei (≈ 14.99 €)"
 */
export function formatPriceWithCurrency(amountBGN: number, country: string): string {
  if (country === 'GR') {
    return `${EUR_PRICE_GR.toFixed(2)} €`;
  }
  if (country === 'RO') {
    return `${RON_PRICE_RO.toFixed(2)} lei (≈ ${EUR_PRICE_RO.toFixed(2)} €)`;
  }
  // Bulgaria: show BGN with EUR approximation
  const eurAmount = amountBGN / BGN_TO_EUR_RATE;
  return `${Math.round(amountBGN)} лв. (≈ ${eurAmount.toFixed(2)} €)`;
}

/**
 * Format a single price amount in appropriate currency
 */
export function formatSinglePrice(amountBGN: number, country: string): string {
  if (country === 'GR') {
    return `${EUR_PRICE_GR.toFixed(2)} €`;
  }
  if (country === 'RO') {
    return `${RON_PRICE_RO.toFixed(2)} lei`;
  }
  return `${Math.round(amountBGN)} лв.`;
}

/**
 * Get price for cart/checkout calculations
 * Returns the price in the country's currency
 */
export function getCartPrice(amountBGN: number, country: string): number {
  if (country === 'GR') {
    return EUR_PRICE_GR;
  }
  if (country === 'RO') {
    return RON_PRICE_RO;
  }
  return amountBGN;
}

/**
 * Format total price for cart/checkout
 */
export function formatTotalPrice(totalBGN: number, itemCount: number, country: string): string {
  if (country === 'GR') {
    const total = EUR_PRICE_GR * itemCount;
    return `${total.toFixed(2)} €`;
  }
  if (country === 'RO') {
    const totalRON = RON_PRICE_RO * itemCount;
    const totalEUR = EUR_PRICE_RO * itemCount;
    return `${totalRON.toFixed(2)} lei (≈ ${totalEUR.toFixed(2)} €)`;
  }
  // Bulgaria: show BGN with EUR approximation
  const eurAmount = totalBGN / BGN_TO_EUR_RATE;
  return `${Math.round(totalBGN)} лв. (≈ ${eurAmount.toFixed(2)} €)`;
}

/**
 * Format shipping price based on country
 */
export function formatShippingPrice(price: number, country: string): string {
  if (country === 'GR') {
    return `${price.toFixed(2)} €`;
  }
  if (country === 'RO') {
    // Shipping price is already in RON for Romania
    const eurEquiv = price / EUR_TO_RON_RATE;
    return `${price.toFixed(2)} lei (≈ ${eurEquiv.toFixed(2)} €)`;
  }
  // Bulgaria
  const eurAmount = price / BGN_TO_EUR_RATE;
  return `${price.toFixed(2)} лв. (≈ ${eurAmount.toFixed(2)} €)`;
}
