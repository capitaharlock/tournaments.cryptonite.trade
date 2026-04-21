/**
 * Crypto icons and network configuration
 */

import type { NetworkOption, PaymentNetwork } from '../types/checkout.types';

export const NETWORK_OPTIONS: NetworkOption[] = [
    { value: 'ethereum', label: 'Ethereum', icon: 'Ξ', color: '#627EEA' },
    { value: 'bitcoin', label: 'Bitcoin', icon: '₿', color: '#F7931A' },
    { value: 'solana', label: 'Solana', icon: '◎', color: '#14F195' },
    { value: 'arbitrum', label: 'Arbitrum', icon: '▲', color: '#28A0F0' },
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

export const getNetworkName = (network: PaymentNetwork): string => {
    const names: Record<PaymentNetwork, string> = {
        'bitcoin': 'Bitcoin',
        'ethereum': 'Ethereum (ERC20)',
        'solana': 'Solana',
        'arbitrum': 'Arbitrum',
        'other': 'Otra red',
    };
    return names[network] || network;
};
