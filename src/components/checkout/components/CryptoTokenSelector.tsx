import { For } from 'solid-js';
import type { PaymentToken, PaymentNetwork } from '../types/checkout.types';
import { getSupportedTokens } from '../utils/payment-config';

interface CryptoTokenSelectorProps {
    selectedNetwork: PaymentNetwork;
    selectedToken: PaymentToken;
    onTokenChange: (token: PaymentToken) => void;
}

// Display order: USDC first, USDT, then native coins
const TOKEN_SORT_ORDER: Record<string, number> = {
    usdc: 1,
    usdt: 2,
    eth: 3,
    sol: 4,
    btc: 5,
};

export default function CryptoTokenSelector(props: CryptoTokenSelectorProps) {
    const getTokensForNetwork = () => {
        const tokens = getSupportedTokens(props.selectedNetwork);
        return tokens
            .map(token => ({ value: token, label: token.toUpperCase() }))
            .sort((a, b) => (TOKEN_SORT_ORDER[a.value] || 99) - (TOKEN_SORT_ORDER[b.value] || 99));
    };

    return (
        <div>
            <label class="block mb-3 text-sm font-semibold text-gray-200">Choose Token to Pay</label>
            <div class="grid grid-cols-3 gap-2.5">
                <For each={getTokensForNetwork()}>
                    {(token) => {
                        const isSelected = () => props.selectedToken === token.value;
                        return (
                            <button
                                type="button"
                                onClick={() => props.onTokenChange(token.value)}
                                class={`px-3 py-3 rounded-lg border-2 cursor-pointer transition text-sm font-semibold ${
                                    isSelected()
                                        ? 'bg-[#2A2A2A] border-blue-500 text-gray-200'
                                        : 'bg-[#1B1B1B] border-[#2E2E2E] text-gray-500 hover:border-gray-600'
                                }`}
                            >
                                {token.label}
                            </button>
                        );
                    }}
                </For>
            </div>
        </div>
    );
}
