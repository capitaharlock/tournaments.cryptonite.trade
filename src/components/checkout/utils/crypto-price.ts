/**
 * Crypto price calculation utilities
 */

import type { PaymentToken } from '../types/checkout.types';

/**
 * [RJJ-RULES] Hardcoded stablecoin pricing
 * USDC and USDT always equal USD amount (no conversion, no decimals)
 * All other cryptos need real-time conversion from API
 */
export function isStablecoin(token: PaymentToken | string): boolean {
    const stablecoins = ['usdc', 'usdt'];
    return stablecoins.indexOf(token.toLowerCase()) !== -1;
}

/**
 * [RJJ-RULES] Format crypto amount based on token type
 * - Stablecoins (USDC/USDT): Exact USD amount, no decimals
 * - Other cryptos: Use API conversion with appropriate decimals
 */
export function formatCryptoPrice(amountUsd: number, token: PaymentToken | string): string {
    // [RJJ-RULES] Stablecoins = exact USD amount
    if (isStablecoin(token)) {
        return amountUsd.toFixed(2); // $3.00 → 3.00 USDC/USDT
    }
    
    // Other cryptos will be calculated via API
    return '...'; // Placeholder for API calculation
}

/**
 * Smart decimal formatting for crypto amounts
 * Shows enough decimals so the smallest unit represents ~$0.01 USD
 * 
 * Examples:
 * - BTC ($100k): 0.00003 BTC = $3 → 5 decimals
 * - ETH ($4k): 0.00075 ETH = $3 → 5 decimals  
 * - SOL ($150): 0.02 SOL = $3 → 2 decimals
 * - SHIB ($0.00001): 300000 SHIB = $3 → 0 decimals
 */
export function getSmartDecimals(cryptoAmount: number, usdAmount: number): number {
    if (cryptoAmount === 0) return 2;
    
    // Calculate USD value per crypto unit
    const usdPerUnit = usdAmount / cryptoAmount;
    
    // Calculate decimals needed so 1 decimal place = ~$0.01 USD
    // If 1 BTC = $100k, then 0.00001 BTC = $1, so we need 5 decimals for $0.01 precision
    const decimalsNeeded = Math.ceil(Math.log10(usdPerUnit / 0.01));
    
    // Clamp between 0 and 8 decimals
    return Math.max(0, Math.min(8, decimalsNeeded));
}

/**
 * Get display text for crypto amount with smart decimal formatting
 */
export function getCryptoAmountDisplay(amountUsd: number, token: PaymentToken | string, apiAmount?: number): string {
    // [RJJ-RULES] Stablecoins = exact USD amount
    if (isStablecoin(token)) {
        return amountUsd.toFixed(2);
    }
    
    // Other cryptos: use API amount if available
    if (apiAmount !== undefined && apiAmount !== null) {
        const decimals = getSmartDecimals(apiAmount, amountUsd);
        return apiAmount.toFixed(decimals);
    }
    
    return 'Calculating...';
}
