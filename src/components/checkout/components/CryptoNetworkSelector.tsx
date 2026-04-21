import { For } from 'solid-js';
import type { PaymentNetwork, PaymentToken } from '../types/checkout.types';
import { NETWORK_OPTIONS } from '../utils/crypto-icons';
import { getSupportedTokens } from '../utils/payment-config';

interface CryptoNetworkSelectorProps {
    selectedNetwork: PaymentNetwork;
    onNetworkChange: (network: PaymentNetwork, defaultToken: PaymentToken) => void;
}

export default function CryptoNetworkSelector(props: CryptoNetworkSelectorProps) {
    const handleNetworkSelect = (network: PaymentNetwork) => {
        const tokens = getSupportedTokens(network);
        const defaultToken = tokens.length > 0 ? tokens[0] : 'usdc' as PaymentToken;
        props.onNetworkChange(network, defaultToken);
    };

    return (
        <div>
            <label class="block mb-3 text-sm font-semibold text-gray-200">Network</label>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <For each={NETWORK_OPTIONS}>
                    {(network) => {
                        const isSelected = () => props.selectedNetwork === network.value;
                        return (
                            <button
                                type="button"
                                onClick={() => handleNetworkSelect(network.value)}
                                class={`p-4 rounded-lg border-2 cursor-pointer transition flex flex-col items-center gap-2 ${
                                    isSelected()
                                        ? 'bg-[#2A2A2A] border-blue-500'
                                        : 'bg-[#1B1B1B] border-[#2E2E2E] hover:border-gray-600'
                                }`}
                            >
                                <div class="text-2xl" style={`color: ${network.color};`}>
                                    {network.icon}
                                </div>
                                <div class={`text-sm font-semibold ${
                                    isSelected() ? 'text-gray-200' : 'text-gray-500'
                                }`}>
                                    {network.label}
                                </div>
                            </button>
                        );
                    }}
                </For>
            </div>
        </div>
    );
}
