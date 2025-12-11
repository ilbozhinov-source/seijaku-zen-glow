// Pricing utilities for country-specific pricing

export const BGN_TO_EUR_RATE = 1.95583;
export const EUR_PRICE_GR_RO = 14.99; // Fixed price for Greece and Romania
export const FREE_SHIPPING_THRESHOLD_BG = 79; // BGN

/**
 * Get the display price based on country
 * Bulgaria: Shows BGN price from DB
 * Greece/Romania: Shows fixed 14.99 EUR
 */
export function getDisplayPrice(amountBGN: number, country: string): number {
  if (country === 'GR' || country === 'RO') {
    return EUR_PRICE_GR_RO;
  }
  return amountBGN;
}

/**
 * Get the currency code for display
 */
export function getCurrencyCode(country: string): string {
  if (country === 'GR' || country === 'RO') {
    return 'EUR';
  }
  return 'BGN';
}

/**
 * Format price with currency based on country
 * Bulgaria: "29 лв. (≈ 14.83 €)"
 * Greece/Romania: "14.99 €"
 */
export function formatPriceWithCurrency(amountBGN: number, country: string): string {
  if (country === 'GR' || country === 'RO') {
    return `${EUR_PRICE_GR_RO.toFixed(2)} €`;
  }
  // Bulgaria: show BGN with EUR approximation
  const eurAmount = amountBGN / BGN_TO_EUR_RATE;
  return `${Math.round(amountBGN)} лв. (≈ ${eurAmount.toFixed(2)} €)`;
}

/**
 * Format a single price amount in appropriate currency
 */
export function formatSinglePrice(amountBGN: number, country: string): string {
  if (country === 'GR' || country === 'RO') {
    return `${EUR_PRICE_GR_RO.toFixed(2)} €`;
  }
  return `${Math.round(amountBGN)} лв.`;
}

/**
 * Get price for cart/checkout calculations
 * Returns the price in the country's currency
 */
export function getCartPrice(amountBGN: number, country: string): number {
  if (country === 'GR' || country === 'RO') {
    return EUR_PRICE_GR_RO;
  }
  return amountBGN;
}

/**
 * Format total price for cart/checkout
 */
export function formatTotalPrice(totalBGN: number, itemCount: number, country: string): string {
  if (country === 'GR' || country === 'RO') {
    const total = EUR_PRICE_GR_RO * itemCount;
    return `${total.toFixed(2)} €`;
  }
  // Bulgaria: show BGN with EUR approximation
  const eurAmount = totalBGN / BGN_TO_EUR_RATE;
  return `${Math.round(totalBGN)} лв. (≈ ${eurAmount.toFixed(2)} €)`;
}
