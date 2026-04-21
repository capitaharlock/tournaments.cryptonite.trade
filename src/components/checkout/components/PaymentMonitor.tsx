import { createSignal, onCleanup, onMount, Show } from 'solid-js';
import type { PaymentData } from '../types/checkout.types';
import { getNetworkName } from '../utils/crypto-icons';
import { getSmartDecimals } from '../utils/crypto-price';
import QRCode from 'qrcode';

interface PaymentMonitorProps {
    paymentData: PaymentData;
    intentId: string;
    jwt: string;
    tournamentId: string;
    onCopyAddress: (address: string) => void;
    onBack: () => void;
    onCancelAndGetNew: () => void;
    onConfirmed: (entryId: string, accountId: string) => void;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:7002";

export default function PaymentMonitor(props: PaymentMonitorProps) {
    const formatPayAmount = () => {
        const amount = parseFloat(props.paymentData.payAmount);
        const decimals = getSmartDecimals(amount, props.paymentData.priceAmount);
        return amount.toFixed(decimals);
    };

    const [timeLeft, setTimeLeft] = createSignal('');
    const [isExpired, setIsExpired] = createSignal(false);
    const [paymentStatus, setPaymentStatus] = createSignal<'waiting' | 'confirming' | 'confirmed' | 'failed'>('waiting');
    const [isConfirming, setIsConfirming] = createSignal(false);
    const [qrDataUrl, setQrDataUrl] = createSignal<string>('');
    const [showQrMobile, setShowQrMobile] = createSignal(false);

    let pollCount = 0;

    // Poll the tournament payment intent status — looks for completed state
    const pollPaymentStatus = async () => {
        if (isExpired() || paymentStatus() === 'confirmed') return;
        pollCount++;

        try {
            const response = await fetch(
                `${API_URL}/v1/tournaments/${props.tournamentId}/confirm-payment`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${props.jwt}`,
                    },
                    body: JSON.stringify({ intent_id: props.intentId }),
                }
            );

            if (!response.ok) return;
            const data = await response.json();

            if (data.success && data.data?.tournament_entry_id && data.data?.trading_account_id) {
                setPaymentStatus('confirmed');
                props.onConfirmed(data.data.tournament_entry_id, data.data.trading_account_id);
                return;
            }

            if (data.data?.status === 'failed' || data.data?.status === 'expired') {
                setPaymentStatus('failed');
                return;
            }

            if (data.data?.status === 'processing') {
                setPaymentStatus('confirming');
            }
        } catch (error) {
            console.error('Payment poll error:', error);
        }
    };

    // Build EIP-681 / BIP-21 / Solana Pay URI
    const buildPaymentUri = (): string => {
        const { payAddress, payAmount, payCurrency, network } = props.paymentData;
        const amount = parseFloat(payAmount);
        const currency = payCurrency.toLowerCase();

        const EVM_CHAIN_IDS: Record<string, number> = { ethereum: 1, arbitrum: 42161 };

        const ERC20_INFO: Record<string, { contract: string; decimals: number }> = {
            'usdc:ethereum':  { contract: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6 },
            'usdc:arbitrum':  { contract: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', decimals: 6 },
            'usdt:ethereum':  { contract: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 },
            'usdterc20:ethereum': { contract: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 },
            'usdt:arbitrum':  { contract: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', decimals: 6 },
        };

        const SOLANA_SPL_MINTS: Record<string, string> = {
            'usdc:solana': 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
            'usdt:solana': 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
        };

        if (network === 'bitcoin') {
            return `bitcoin:${payAddress}?amount=${amount}`;
        }

        if (network === 'solana') {
            const mint = SOLANA_SPL_MINTS[`${currency}:solana`];
            return `solana:${payAddress}?amount=${amount}${mint ? `&spl-token=${mint}` : ''}`;
        }

        if (currency === 'eth') {
            const chainId = EVM_CHAIN_IDS[network] || 1;
            const weiValue = Math.round(amount * 1e18);
            return `ethereum:${payAddress}@${chainId}?value=${weiValue}`;
        }

        const erc20 = ERC20_INFO[`${currency}:${network}`];
        if (erc20) {
            const chainId = EVM_CHAIN_IDS[network] || 1;
            const atomic = Math.round(amount * Math.pow(10, erc20.decimals));
            return `ethereum:${erc20.contract}@${chainId}/transfer?address=${payAddress}&uint256=${atomic}`;
        }

        return payAddress;
    };

    onMount(() => {
        // Countdown
        const updateCountdown = () => {
            const expiresAt = new Date(props.paymentData.expiresAt);
            const now = new Date();
            const diff = expiresAt.getTime() - now.getTime();
            if (diff <= 0) {
                setTimeLeft('Expired');
                setIsExpired(true);
                return;
            }
            const minutes = Math.floor(diff / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);
            setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        };

        updateCountdown();
        const countdownInterval = setInterval(updateCountdown, 1000);

        // Poll every 5 seconds
        pollPaymentStatus();
        const pollingInterval = setInterval(pollPaymentStatus, 5000);

        // QR
        const uri = buildPaymentUri();
        QRCode.toDataURL(uri, {
            width: 256,
            margin: 1,
            errorCorrectionLevel: 'M',
            color: { dark: '#000000', light: '#ffffff' }
        }).then(url => setQrDataUrl(url)).catch((e) => console.error('QR error:', e));

        onCleanup(() => {
            clearInterval(countdownInterval);
            clearInterval(pollingInterval);
        });
    });

    return (
        <div class="flex flex-col gap-5 max-w-full mx-auto">
            {/* Header */}
            <div class="flex items-center gap-3">
                <div class="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">1</div>
                <div class="text-base font-semibold text-gray-200 flex-1">Send Your Payment</div>
                <div class="text-xs text-gray-500 flex items-center gap-1">
                    <span>🔒</span><span>Secure</span>
                </div>
            </div>

            {/* Amount + Network bar */}
            <div class="p-4 bg-[#121212] rounded-lg border border-[#2E2E2E] flex justify-between items-center flex-wrap gap-2">
                <div class="text-2xl font-bold text-green-500">
                    {formatPayAmount()} {props.paymentData.payCurrency.toUpperCase()}
                </div>
                <div class="text-xs text-gray-400 flex items-center gap-1.5">
                    <span>Network:</span>
                    <span class="text-gray-200 font-semibold">{getNetworkName(props.paymentData.network)}</span>
                </div>
            </div>

            {/* Main Payment Card */}
            <div class="bg-white/[0.03] border border-white/10 rounded-xl p-4">
                <div class="flex gap-4 items-start flex-col sm:flex-row">
                    {/* QR Code */}
                    <div class="flex-shrink-0 flex flex-col items-center gap-1.5">
                        <Show when={qrDataUrl()}>
                            <img src={qrDataUrl()} alt="QR Code"
                                class="w-40 h-40 rounded-lg bg-white p-1.5" />
                            <p class="text-[11px] text-gray-500 text-center m-0">Scan with wallet</p>
                        </Show>
                    </div>

                    {/* Address + Warning */}
                    <div class="flex-1 flex flex-col gap-2.5 min-w-0 w-full">
                        <label class="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                            Payment Address
                        </label>
                        <div class="bg-black/25 border border-white/10 rounded-lg p-2.5 flex items-center gap-2 flex-wrap">
                            <code class="font-mono text-xs break-all text-gray-200 flex-1 select-all leading-relaxed">
                                {props.paymentData.payAddress}
                            </code>
                            <button
                                onClick={() => props.onCopyAddress(props.paymentData.payAddress)}
                                class="bg-blue-600/15 border border-blue-600/30 text-blue-400 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition hover:bg-blue-600 hover:text-white"
                            >
                                📋 Copy
                            </button>
                        </div>
                        <div class="text-xs text-yellow-400 leading-relaxed flex gap-1.5 items-start">
                            <span class="flex-shrink-0">⚠️</span>
                            <span>ONLY send {getNetworkName(props.paymentData.network)} to this address. Sending on another network will result in loss of funds.</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Status Bar */}
            <div class="flex items-center gap-3 flex-wrap py-3">
                <Show when={paymentStatus() === 'confirmed'}>
                    <div class="text-center w-full py-5">
                        <div class="text-5xl mb-2">✅</div>
                        <div class="text-xl font-bold text-green-500 mb-3">Payment Confirmed</div>
                        <div class="text-sm text-gray-200 mb-5 leading-relaxed">
                            Your payment has been received.<br/>Your tournament entry is ready.
                        </div>
                    </div>
                </Show>

                <Show when={paymentStatus() === 'confirming'}>
                    <div class="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                    <span class="text-sm font-semibold text-green-500">Transaction detected</span>
                    <span class="text-white/20">|</span>
                    <span class="text-xs text-gray-400">Usually takes 1-3 minutes</span>
                </Show>

                <Show when={paymentStatus() === 'waiting' && !isExpired()}>
                    <div class="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span class="text-sm text-gray-200">Waiting for transaction</span>
                    <span class="text-white/20">|</span>
                    <span class="text-sm font-bold text-orange-400 font-mono">⏳ {timeLeft()}</span>
                    <span class="text-white/20">|</span>
                    <span class="text-xs text-gray-500">🔒 Price locked</span>
                </Show>

                <Show when={isExpired() && paymentStatus() !== 'confirmed'}>
                    <div class="text-center w-full py-4">
                        <div class="text-lg font-bold text-orange-400 mb-2">⏳ Time Expired</div>
                        <div class="text-xs text-gray-400 leading-relaxed">
                            No payment was received. If you already sent funds, contact{' '}
                            <a href="mailto:payments@cryptonite.trade" class="text-blue-500 font-semibold">payments@cryptonite.trade</a>
                        </div>
                    </div>
                </Show>

                <Show when={paymentStatus() === 'failed'}>
                    <div class="text-center w-full py-4">
                        <div class="text-lg font-bold text-red-500 mb-2">❌ Payment Failed</div>
                        <div class="text-xs text-gray-400">Try again with a new address.</div>
                    </div>
                </Show>
            </div>

            {/* Footer */}
            <div class="pt-4 border-t border-[#2E2E2E] flex justify-between items-center flex-wrap gap-2">
                <button onClick={props.onBack}
                    class="bg-transparent border border-[#2E2E2E] text-gray-400 px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 transition hover:border-gray-500 hover:text-gray-300">
                    ← {isExpired() ? 'Cancel' : 'Back'}
                </button>
                <Show when={paymentStatus() === 'waiting' && !isExpired()}>
                    <button onClick={props.onCancelAndGetNew}
                        class="bg-transparent border border-orange-400 text-orange-400 px-3 py-2 rounded-md text-xs font-medium transition hover:bg-orange-400 hover:text-black">
                        🔄 Get New Address
                    </button>
                </Show>
                <div class="flex items-center gap-1.5 text-gray-500 text-xs">
                    🔒 Processed by NOWPayments
                </div>
            </div>
        </div>
    );
}
