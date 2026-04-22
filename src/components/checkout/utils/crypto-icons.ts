/**
 * Crypto icons and network configuration
 */

import type { NetworkOption, PaymentNetwork } from '../types/checkout.types';

export const NETWORK_OPTIONS: NetworkOption[] = [
    { value: 'ethereum', label: 'Ethereum', icon: 'Ξ', color: '#627EEA' },
    { value: 'tron', label: 'Tron', icon: 'T', color: '#EB0029' },
    { value: 'bsc', label: 'BSC', icon: 'B', color: '#F0B90B' },
    { value: 'arbitrum', label: 'Arbitrum', icon: '▲', color: '#28A0F0' },
    { value: 'solana', label: 'Solana', icon: '◎', color: '#14F195' },
    { value: 'bitcoin', label: 'Bitcoin', icon: '₿', color: '#F7931A' },
];

export const getCryptoIcon = (currency: string): string => {
    const icons: Record<string, string> = {
        'BTC': '₿',
        'ETH': 'Ξ',
        'SOL': '◎',
        'USDC': '💵',
        'USDT': '💵',
        'ARB': '🔷',
        'DOGE': '🐕',
        'XRP': '💧',
        'ADA': '🔺',
        'DOT': '⚫',
        'MATIC': '🟣',
        'AVAX': '🔺',
        'LINK': '🔗',
        'UNI': '🦄',
    };
    return icons[currency.toUpperCase()] || '🪙';
};

/**
 * Convert a NOWPayments currency code (e.g. "usdterc20", "usdttrc20",
 * "usdcbsc") to the user-facing token symbol ("USDT", "USDC", etc.).
 * Strips the network suffix so the UI shows clean token names.
 */
export const getTokenDisplayName = (payCurrency: string): string => {
    const c = payCurrency.toLowerCase();
    if (c.startsWith('usdt')) return 'USDT';
    if (c.startsWith('usdc')) return 'USDC';
    if (c === 'eth' || c === 'etharb' || c.startsWith('eth')) return 'ETH';
    if (c === 'bnbbsc' || c === 'bnb') return 'BNB';
    if (c === 'trx') return 'TRX';
    if (c === 'btc') return 'BTC';
    if (c === 'sol') return 'SOL';
    return payCurrency.toUpperCase();
};

export const getNetworkName = (network: PaymentNetwork): string => {
    const names: Record<PaymentNetwork, string> = {
        'bitcoin': 'Bitcoin',
        'ethereum': 'Ethereum (ERC20)',
        'tron': 'Tron (TRC20)',
        'bsc': 'BNB Smart Chain (BEP20)',
        'solana': 'Solana',
        'arbitrum': 'Arbitrum',
        'other': 'Other network',
    };
    return names[network] || network;
};
