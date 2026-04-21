/**
 * Shared types for tournament crypto checkout flow.
 * Subset of broker types — tournaments don't need challenge config,
 * only payment-related types.
 */

export type PaymentMethod = 'paypal' | 'crypto';

export type PaymentNetwork = 'bitcoin' | 'ethereum' | 'solana' | 'arbitrum' | 'other';

export type PaymentToken = 'btc' | 'eth' | 'sol' | 'usdc' | 'usdt';

export type PaymentStatus = 'waiting' | 'confirming' | 'confirmed' | 'failed' | 'expired';

export interface AvailableCurrency {
    code: string;
    name: string;
    network?: string;
    logo_url?: string;
}

export interface PaymentData {
    paymentId: string;
    payAddress: string;
    payAmount: string;
    payCurrency: string;
    priceAmount: number; // USD amount
    network: PaymentNetwork;
    expiresAt: string;
}

export interface NetworkOption {
    value: PaymentNetwork;
    label: string;
    icon: string;
    color: string;
}

export interface TokenOption {
    value: PaymentToken;
    label: string;
}
