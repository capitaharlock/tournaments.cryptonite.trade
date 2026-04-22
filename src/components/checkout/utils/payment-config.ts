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
        case 'tron':
            return ['usdt', 'trx']; // USDT-TRC20 is the dominant USDT network worldwide
        case 'bsc':
            return ['usdt', 'usdc', 'bnb']; // BEP20
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
 * Codes from: https://nowpayments.io/supported-coins
 */
export const getCurrencyCode = (token: PaymentToken, network: PaymentNetwork): string => {
    if (token === 'usdt') {
        if (network === 'ethereum') return 'usdterc20';
        if (network === 'tron') return 'usdttrc20';
        if (network === 'bsc') return 'usdtbsc';
        if (network === 'solana') return 'usdtsol';
        if (network === 'arbitrum') return 'usdtarb';
        return 'usdterc20';
    }
    if (token === 'usdc') {
        if (network === 'ethereum') return 'usdc';
        if (network === 'bsc') return 'usdcbsc';
        if (network === 'solana') return 'usdcsol';
        if (network === 'arbitrum') return 'usdcarb';
        return 'usdc';
    }
    if (token === 'eth') {
        if (network === 'arbitrum') return 'etharb';
        return 'eth';
    }
    if (token === 'bnb') return 'bnbbsc';
    if (token === 'trx') return 'trx';
    return token; // btc, sol
};
