/**
 * Payment configuration and constants
 */

import type { PaymentToken, PaymentNetwork } from '../types/checkout.types';

// Payment monitoring interval (10 seconds)
export const PAYMENT_MONITOR_INTERVAL = 10000;

// Get supported tokens for a network.
// USDC/USDT first (stablecoins preferred for fixed-price payments),
// then native coin.
export const getSupportedTokens = (network: PaymentNetwork): PaymentToken[] => {
    switch (network) {
        case 'bitcoin':
            return ['btc'];
        case 'ethereum':
            return ['usdc', 'usdt', 'eth'];
        case 'solana':
            return ['usdc', 'usdt', 'sol'];
        case 'arbitrum':
            return ['usdc', 'usdt', 'eth'];
        default:
            return [];
    }
};

/**
 * Convert (token, network) to the NOWPayments currency code.
 * This is what we send to the API's `pay_currency` parameter.
 */
export const getCurrencyCode = (token: PaymentToken, network: PaymentNetwork): string => {
    if (token === 'usdt') {
        if (network === 'ethereum') return 'usdterc20';
        if (network === 'solana') return 'usdtsol';
        if (network === 'arbitrum') return 'usdtarb';
        return 'usdterc20';
    }
    if (token === 'usdc') {
        if (network === 'ethereum') return 'usdc';
        if (network === 'solana') return 'usdcsol';
        if (network === 'arbitrum') return 'usdcarb';
        return 'usdc';
    }
    if (token === 'eth') {
        if (network === 'arbitrum') return 'etharb';
        return 'eth';
    }
    return token; // btc, sol
};
