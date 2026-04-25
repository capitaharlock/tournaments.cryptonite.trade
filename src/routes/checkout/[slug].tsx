import { createResource, createSignal, Show, For, onMount, createEffect } from "solid-js";
import { useParams, useSearchParams, A } from "@solidjs/router";
import { Title } from "@solidjs/meta";
import { fetchTournament } from "../../services/api";
import type { Tournament, PrizeBand } from "../../types/tournament";
import Header from "../../components/layout/Header";
import FlipClock from "../../components/tournament/FlipClock";
import TournamentProgress from "../../components/tournament/TournamentProgress";
import { getStatusStyle } from "../../lib/statusStyles";
import { getSSOToken, setSSOToken } from "../../lib/sso";
import { useUserEntries } from "../../contexts/UserEntries";
import CryptoNetworkSelector from "../../components/checkout/components/CryptoNetworkSelector";
import CryptoTokenSelector from "../../components/checkout/components/CryptoTokenSelector";
import PaymentMonitor from "../../components/checkout/components/PaymentMonitor";
import type { PaymentNetwork, PaymentToken, PaymentData } from "../../components/checkout/types/checkout.types";
import { getCurrencyCode } from "../../components/checkout/utils/payment-config";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:7002";

type Step = "auth" | "method" | "payment" | "success" | "error";
type PaymentMethod = "paypal" | "crypto";

export default function Checkout() {
  const params = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tournament] = createResource(() => params.slug, fetchTournament);
  const userEntries = useUserEntries();
  // True once we've confirmed (via the user-entries endpoint) that the
  // logged-in user already has an entry in THIS tournament. Stops the
  // whole checkout flow and shows a friendly "you're already in" panel
  // instead of pushing the user into a payment that would 409.
  const alreadyRegistered = () => {
    const t = tournament();
    if (!t) return false;
    if (userEntries.loading()) return false; // wait until the fetch settles
    if (!userEntries.userId()) return false; // anonymous visitor — let auth flow run
    return userEntries.isRegistered(t.id);
  };
  const [email, setEmail] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [nickname, setNickname] = createSignal("");
  const [step, setStep] = createSignal<Step>("auth");
  const [paymentMethod, setPaymentMethod] = createSignal<PaymentMethod>("paypal");
  const [jwt, setJwt] = createSignal<string | null>(null);
  const [userName, setUserName] = createSignal<string | null>(null);
  const [error, setError] = createSignal<string | null>(null);
  const [loading, setLoading] = createSignal(false);
  const [entryResult, setEntryResult] = createSignal<any>(null);
  const [voucherCode, setVoucherCode] = createSignal("");
  const [voucherApplied, setVoucherApplied] = createSignal(false);
  const [voucherLoading, setVoucherLoading] = createSignal(false);
  const [voucherError, setVoucherError] = createSignal<string | null>(null);
  const [voucherDiscount, setVoucherDiscount] = createSignal<{ discount_percentage: number; original_amount: number; discount_amount: number; final_amount: number } | null>(null);

  const style = () => getStatusStyle(tournament()?.status);
  const [autoApplyDone, setAutoApplyDone] = createSignal(false);

  // ─── Promo code from URL or session ───────────────────────────────────
  onMount(() => {
    const urlCode = (searchParams.code as string | undefined)?.trim().toUpperCase();
    if (urlCode) {
      setVoucherCode(urlCode);
      sessionStorage.setItem("cryptonite_promo_code", urlCode);
    } else {
      const saved = sessionStorage.getItem("cryptonite_promo_code");
      if (saved) setVoucherCode(saved);
    }
  });

  // Auto-apply when tournament + auth + code are all ready (once only)
  createEffect(() => {
    const t = tournament();
    const token = jwt();
    const code = voucherCode();
    if (t && token && code && !autoApplyDone() && !voucherApplied()) {
      setAutoApplyDone(true);
      handleApplyVoucher(t.id);
    }
  });

  // ─── Auto-auth: SSO cookie (primary) or URL token (legacy fallback) ───
  const tryAutoAuth = async (token: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/v1/auth/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!data.valid || !data.user_id) return false;

      const userRes = await fetch(`${API_URL}/v1/users/${data.user_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userData = await userRes.json();
      setJwt(token);
      setUserName(userData?.nickname || userData?.name || userData?.email || "Trader");
      if (userData?.nickname) setNickname(userData.nickname);
      setStep("method");
      return true;
    } catch {
      return false;
    }
  };

  onMount(async () => {
    // 1. SSO cookie — JWT from previous login or TokenAuthHandler
    const cookieToken = getSSOToken();
    if (cookieToken && await tryAutoAuth(cookieToken)) return;

    // 2. Raw email token — exchange for JWT via verify-email, then auth inline
    const urlToken = searchParams.token as string | undefined;
    if (urlToken) {
      try {
        const res = await fetch(`${API_URL}/v1/auth/verify-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: urlToken }),
        });
        const data = await res.json();
        if (data.success && data.jwt) {
          setSSOToken(data.jwt);
          await tryAutoAuth(data.jwt);
        }
      } catch { /* silent */ }
      setSearchParams({ token: undefined });
    }
  });

  const [showForgotPassword, setShowForgotPassword] = createSignal(false);
  const [forgotSent, setForgotSent] = createSignal(false);

  /** Transparent login-or-register: one form, zero friction. */
  const handleAuth = async (e: Event) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setShowForgotPassword(false);

    const em = email().trim().toLowerCase();
    const pw = password();
    const name = nickname() || em.split("@")[0];

    try {
      // 1. Try login first
      const loginRes = await fetch(`${API_URL}/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: em, password: pw }),
      });
      const loginData = await loginRes.json();

      if (loginData.jwt) {
        // Login OK — done
        setJwt(loginData.jwt);
        setSSOToken(loginData.jwt);
        setStep("method");
        return;
      }

      // 2. Login failed — try signup (new user)
      const signupRes = await fetch(`${API_URL}/v1/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: em, password: pw, name }),
      });
      const signupData = await signupRes.json();

      if (signupRes.ok && (signupData.user?.id || signupData.ID)) {
        // Signup OK — now login to get JWT
        const loginRes2 = await fetch(`${API_URL}/v1/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: em, password: pw }),
        });
        const loginData2 = await loginRes2.json();
        if (loginData2.jwt) {
          setJwt(loginData2.jwt);
          setSSOToken(loginData2.jwt);
          setStep("method");
          return;
        }
      }

      // 3. Signup failed — distinguish password validation vs existing user
      const errMsg = signupData.error || signupData.message || "";
      if (errMsg.toLowerCase().includes("password must")) {
        // Password too weak for signup — show the API's validation message
        setError(errMsg);
      } else {
        // User exists but wrong password
        setError("Incorrect password. Already have a Cryptonite account? Check your password or reset it below.");
        setShowForgotPassword(true);
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const em = email().trim().toLowerCase();
    if (!em) { setError("Enter your email first."); return; }
    setLoading(true);
    setError(null);
    try {
      await fetch(`${API_URL}/v1/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: em }),
      });
      setForgotSent(true);
      setShowForgotPassword(false);
      setError(null);
    } catch {
      setError("Could not send reset email. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyVoucher = async (tournamentId: string) => {
    const code = voucherCode().trim();
    if (!code) return;
    setVoucherLoading(true);
    setVoucherError(null);
    try {
      const res = await fetch(
        `${API_URL}/v1/tournaments/${tournamentId}/validate-promo?code=${encodeURIComponent(code)}`
      );
      const data = await res.json();
      if (!data.success || !data.data.valid) {
        setVoucherError(data.data?.reason || "Invalid code");
        return;
      }
      setVoucherDiscount(data.data);
      setVoucherApplied(true);
    } catch {
      setVoucherError("Could not validate code. Try again.");
    } finally {
      setVoucherLoading(false);
    }
  };

  const [intentId, setIntentId] = createSignal<string | null>(null);
  const [cryptoPayData, setCryptoPayData] = createSignal<PaymentData | null>(null);
  const [paypalLoading, setPaypalLoading] = createSignal(false);

  // ── Crypto network + token selection ──────────────────────────────
  const [selectedNetwork, setSelectedNetwork] = createSignal<PaymentNetwork>('ethereum');
  const [selectedToken, setSelectedToken] = createSignal<PaymentToken>('usdc');

  /** Start payment: create intent via API, then delegate to PayPal or crypto UI */
  const handleStartPayment = async () => {
    if (!jwt() || !tournament()) return;
    setLoading(true);
    setError(null);

    try {
      const t = tournament()!;
      const body: any = {
        payment_method: paymentMethod() === "paypal" ? "paypal" : "nowpayments",
        nickname: nickname() || null,
        voucher_code: voucherCode() || null,
      };
      // For crypto, pay_currency is set later when user picks token+network
      // For PayPal, we create the intent now
      if (paymentMethod() === "paypal") {
        const res = await fetch(`${API_URL}/v1/tournaments/${t.id}/create-payment-intent`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt()}` },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message || "Failed to create payment");

        const intent = data.data;
        setIntentId(intent.intent_id);

        if (intent.status === "completed") {
          // Voucher covered 100% — already entered
          setEntryResult({ trading_account_id: intent.trading_account_id });
          setStep("success");
          return;
        }

        // Load PayPal SDK and render buttons
        setStep("payment");
        setPaypalLoading(true);
        await loadPayPalSdk();
        renderPayPalButtons(intent.paypal_order_id, intent.intent_id, t.id);
      } else {
        // Crypto — go to token selection step
        setStep("payment");
      }
    } catch (err: any) {
      setError(err.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  /** Create crypto payment intent using selected network + token */
  const handleCryptoCreate = async () => {
    if (!jwt() || !tournament()) return;
    setLoading(true);
    setError(null);

    try {
      const t = tournament()!;
      const payCurrency = getCurrencyCode(selectedToken(), selectedNetwork());
      const res = await fetch(`${API_URL}/v1/tournaments/${t.id}/create-payment-intent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt()}` },
        body: JSON.stringify({
          payment_method: "nowpayments",
          nickname: nickname() || null,
          voucher_code: voucherCode() || null,
          pay_currency: payCurrency,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to create crypto payment");

      const intent = data.data;
      setIntentId(intent.intent_id);

      if (intent.status === "completed") {
        setEntryResult({ trading_account_id: null });
        setStep("success");
        return;
      }

      const amountUsd = Number(intent.amount) || Number(tournament()?.entry_fee) || 0;
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 min

      setCryptoPayData({
        paymentId: intent.nowpayments_payment_id,
        payAddress: intent.nowpayments_pay_address,
        payAmount: intent.nowpayments_pay_amount,
        payCurrency: intent.nowpayments_pay_currency,
        priceAmount: amountUsd,
        network: selectedNetwork(),
        expiresAt,
      });
    } catch (err: any) {
      setError(err.message || "Crypto payment failed");
    } finally {
      setLoading(false);
    }
  };

  /** Poll crypto payment status */
  const pollCryptoPayment = async () => {
    if (!jwt() || !intentId() || !tournament()) return;
    try {
      const t = tournament()!;
      const res = await fetch(`${API_URL}/v1/tournaments/${t.id}/confirm-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt()}` },
        body: JSON.stringify({
          intent_id: intentId(),
          nowpayments_payment_id: cryptoPayData()?.paymentId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEntryResult(data.data);
        setStep("success");
        return true;
      }
    } catch { /* still waiting */ }
    return false;
  };

  /** Load PayPal SDK script. Client ID from env var — never hardcode. */
  const loadPayPalSdk = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if ((window as any).paypal) { resolve(); return; }
      const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;
      if (!clientId) {
        console.error("VITE_PAYPAL_CLIENT_ID not configured");
        reject(new Error("PayPal not configured"));
        return;
      }
      const script = document.createElement("script");
      script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD&intent=capture`;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load PayPal SDK"));
      document.head.appendChild(script);
    });
  };

  /** Render PayPal buttons into the container */
  const renderPayPalButtons = (paypalOrderId: string, intentId: string, tournamentId: string) => {
    setTimeout(() => {
      const container = document.getElementById("paypal-button-container");
      if (!container || !(window as any).paypal) return;
      container.innerHTML = "";
      setPaypalLoading(false);

      (window as any).paypal.Buttons({
        style: { color: "black", shape: "rect", label: "pay", height: 48 },
        createOrder: () => paypalOrderId,
        onApprove: async (data: any) => {
          setLoading(true);
          try {
            const res = await fetch(`${API_URL}/v1/tournaments/${tournamentId}/confirm-payment`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt()}` },
              body: JSON.stringify({
                intent_id: intentId,
                paypal_order_id: data.orderID,
              }),
            });
            const result = await res.json();
            if (result.success) {
              setEntryResult(result.data);
              setStep("success");
            } else {
              setError(result.message || "Payment confirmation failed");
              setStep("error");
            }
          } catch (err: any) {
            setError(err.message || "Payment error");
            setStep("error");
          } finally {
            setLoading(false);
          }
        },
        onCancel: () => { setError("Payment cancelled"); },
        onError: (err: any) => { setError("PayPal error. Try again."); },
      }).render("#paypal-button-container");
    }, 100);
  };

  return (
    <>
      <Title>Join {tournament()?.name || "Tournament"} — Cryptonite</Title>
      <Header />

      <div class="min-h-screen bg-[#1a1a1a]">
        <Show when={tournament()} fallback={<div class="text-center py-16 text-gray-600">Loading...</div>}>
          {(t) => (
            <Show when={!alreadyRegistered()} fallback={
              <div class="p-4 max-w-2xl mx-auto pt-12">
                <DetailHero tournament={t()} />
                <div class="mt-6 bg-black border border-emerald-500/30 rounded-xl p-8 text-center shadow-xl">
                  <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/40 mb-4">
                    <svg class="w-8 h-8 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <h2 class="text-2xl font-bold text-white mb-2">You're already in!</h2>
                  <p class="text-gray-400 mb-6">
                    You're registered for <strong class="text-white">{t().name}</strong>. Good luck when it starts.
                  </p>
                  <div class="flex gap-3 justify-center flex-wrap">
                    <A href={`/tournaments/${t().slug}`}
                      class="inline-flex items-center gap-1.5 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-lg transition text-sm">
                      View Tournament →
                    </A>
                    <A href="/schedule"
                      class="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#1a1a1a] hover:bg-[#222] border border-[#333] text-gray-300 font-bold rounded-lg transition text-sm">
                      See other tournaments
                    </A>
                  </div>
                </div>
              </div>
            }>
            <div class="p-4 max-w-6xl mx-auto space-y-4">

              {/* HERO */}
              <DetailHero tournament={t()} />

              {/* MAIN CONTENT — 2 columns on desktop.
                  On mobile the Order Summary sidebar renders ABOVE the
                  checkout steps (order-1) so the user sees what they
                  are paying for before scrolling into the auth/payment
                  flow. On lg+ it stays on the right as a sticky sidebar. */}
              <div class="flex flex-col lg:flex-row gap-4">

                {/* LEFT — Checkout Steps */}
                <div class="flex-1 order-2 lg:order-1">
                  <div class="bg-black border border-[#222] rounded-xl overflow-hidden shadow-xl shadow-black/50">
                    <div class="px-5 py-4 border-b border-[#1a1a1a]">
                      <StepIndicator current={step()} />
                    </div>

                    <div class="p-4 sm:p-6">
                      {/* AUTH — transparent login or register */}
                      <Show when={step() === "auth"}>
                        <h2 class="text-xl font-bold text-white mb-1">Enter your email to continue</h2>
                        <p class="text-sm text-gray-500 mb-6">We'll sign you in or create a free account instantly</p>

                        <Show when={forgotSent()}>
                          <div class="mb-4 flex items-center gap-2 bg-green-900/15 border border-green-700/20 rounded-lg px-4 py-3">
                            <span class="text-green-400 text-sm">Password reset email sent to <strong class="text-white">{email()}</strong>. Check your inbox.</span>
                          </div>
                        </Show>

                        <form onSubmit={handleAuth} class="space-y-4 max-w-md">
                          <div>
                            <input type="email" required value={email()} onInput={(e) => setEmail(e.currentTarget.value)}
                              class="w-full bg-[#0a0a0a] border border-gray-800 rounded-lg px-4 py-3 text-white text-sm focus:border-green-500 focus:outline-none transition"
                              placeholder="your@email.com" />
                          </div>
                          <div>
                            <input type="password" required minLength={8} value={password()} onInput={(e) => setPassword(e.currentTarget.value)}
                              class="w-full bg-[#0a0a0a] border border-gray-800 rounded-lg px-4 py-3 text-white text-sm focus:border-green-500 focus:outline-none transition"
                              placeholder="Password" />
                          </div>

                          <Show when={error()}>
                            <div class="bg-red-900/15 border border-red-700/20 rounded-lg px-4 py-3">
                              <p class="text-red-400 text-sm">{error()}</p>
                              <Show when={showForgotPassword()}>
                                <button type="button" onClick={handleForgotPassword}
                                  class="mt-2 text-green-400 hover:text-green-300 text-sm font-medium transition">
                                  Reset password via email →
                                </button>
                              </Show>
                            </div>
                          </Show>

                          <button type="submit" disabled={loading()}
                            class="w-full px-8 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition disabled:opacity-50">
                            {loading() ? "Processing..." : "Continue"}
                          </button>

                          <p class="text-[11px] text-gray-600 text-center">
                            Same account as broker.cryptonite.trade
                          </p>
                        </form>
                      </Show>

                      {/* PAYMENT METHOD — PayPal/Card or Crypto */}
                      <Show when={step() === "method"}>
                        <Show when={userName()}>
                          <div class="mb-4 flex items-center gap-2 bg-green-900/15 border border-green-700/20 rounded-lg px-4 py-2.5">
                            <span class="text-green-400 text-xs font-bold">Signed in as</span>
                            <span class="text-white text-sm font-medium">{userName()}</span>
                          </div>
                        </Show>
                        <h2 class="text-xl font-bold text-white mb-1">Choose payment method</h2>
                        <p class="text-sm text-gray-500 mb-4">Entry fee: <span class="text-white font-bold">${t().entry_fee}</span></p>

                        {/* Voucher / Promo code */}
                        <div class="mb-5 max-w-lg">
                          <Show when={!voucherApplied()}>
                            <div class="flex gap-2">
                              <input
                                type="text"
                                placeholder="Promo or voucher code"
                                value={voucherCode()}
                                onInput={(e) => { setVoucherCode(e.currentTarget.value.toUpperCase()); setVoucherError(null); }}
                                onKeyDown={(e) => e.key === "Enter" && voucherCode().length > 0 && handleApplyVoucher(tournament()!.id)}
                                class="flex-1 px-3 py-2 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white text-sm focus:border-green-500 focus:outline-none font-mono uppercase"
                              />
                              <Show when={voucherCode().length > 0}>
                                <button
                                  onClick={() => handleApplyVoucher(tournament()!.id)}
                                  disabled={voucherLoading()}
                                  class="px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition text-sm disabled:opacity-50"
                                >
                                  {voucherLoading() ? "..." : "Apply"}
                                </button>
                              </Show>
                            </div>
                            <Show when={voucherError()}>
                              <p class="text-red-400 text-xs mt-1.5">{voucherError()}</p>
                            </Show>
                          </Show>
                          <Show when={voucherApplied() && voucherDiscount()}>
                            {(d) => (
                              <div class="bg-green-900/20 border border-green-700/30 rounded-lg px-4 py-3">
                                <div class="flex items-center gap-2 mb-1.5">
                                  <span class="text-green-400 text-sm font-bold">
                                    {d().discount_percentage}% off applied
                                  </span>
                                  <span class="text-white font-mono text-xs bg-green-900/40 px-2 py-0.5 rounded">{voucherCode()}</span>
                                  <button
                                    onClick={() => { setVoucherApplied(false); setVoucherCode(""); setVoucherDiscount(null); setVoucherError(null); }}
                                    class="ml-auto text-xs text-gray-500 hover:text-red-400"
                                  >
                                    Remove
                                  </button>
                                </div>
                                <div class="flex items-center gap-3 text-sm">
                                  <span class="text-gray-500 line-through">${d().original_amount.toFixed(2)}</span>
                                  <span class="text-green-400 font-black text-base">${d().final_amount.toFixed(2)}</span>
                                </div>
                              </div>
                            )}
                          </Show>
                        </div>

                        {/* Payment method buttons */}
                        <div class="space-y-3 max-w-lg mb-6">
                          {/* PayPal / Credit Card */}
                          <button onClick={() => setPaymentMethod("paypal")}
                            class={`w-full flex items-center gap-4 p-5 rounded-xl border transition ${
                              paymentMethod() === "paypal" ? "border-[#0070BA] bg-[#0070BA]/5" : "border-gray-800 bg-[#0a0a0a] hover:border-gray-700"
                            }`}>
                            <img src="https://www.paypalobjects.com/webstatic/icon/pp258.png" alt="PayPal" class="w-10 h-10 object-contain" />
                            <div class="text-left flex-1">
                              <p class="text-white font-semibold text-sm">PayPal or Credit Card</p>
                              <p class="text-gray-500 text-xs">Secure payment via PayPal</p>
                              <div class="flex gap-1.5 mt-2">
                                <svg width="32" height="20" viewBox="0 0 32 20" fill="none"><rect width="32" height="20" rx="2" fill="#1434CB"/><text x="16" y="14" text-anchor="middle" fill="white" font-size="10" font-weight="700">VISA</text></svg>
                                <svg width="32" height="20" viewBox="0 0 32 20" fill="none"><rect width="32" height="20" rx="2" fill="#EB001B"/><circle cx="12" cy="10" r="6" fill="#FF5F00"/><circle cx="20" cy="10" r="6" fill="#F79E1B"/></svg>
                              </div>
                            </div>
                            <Show when={paymentMethod() === "paypal"}>
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0070BA" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                            </Show>
                          </button>

                          {/* Crypto */}
                          <button onClick={() => setPaymentMethod("crypto")}
                            class={`w-full flex items-center gap-4 p-5 rounded-xl border transition ${
                              paymentMethod() === "crypto" ? "border-[#F7931A] bg-[#F7931A]/5" : "border-gray-800 bg-[#0a0a0a] hover:border-gray-700"
                            }`}>
                            <div class="w-10 h-10 rounded-lg bg-[#F7931A] flex items-center justify-center text-white font-bold text-lg">B</div>
                            <div class="text-left flex-1">
                              <p class="text-white font-semibold text-sm">Cryptocurrency</p>
                              <p class="text-gray-500 text-xs">Networks: Ethereum, Tron, BSC, Arbitrum, Solana, Bitcoin</p>
                              <div class="flex gap-1.5 mt-2 text-xs text-gray-500">
                                <span style="color:#F7931A">BTC</span>
                                <span style="color:#627EEA">ETH</span>
                                <span style="color:#9945FF">SOL</span>
                                <span style="color:#2775CA">USDC</span>
                                <span style="color:#26A17B">USDT</span>
                              </div>
                            </div>
                            <Show when={paymentMethod() === "crypto"}>
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F7931A" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                            </Show>
                          </button>
                        </div>

                        <Show when={error()}>
                          <p class="text-red-400 text-sm mb-4">{error()}</p>
                        </Show>

                        <div class="flex gap-3">
                          <Show when={!userName()}>
                            <button onClick={() => setStep("auth")}
                              class="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition text-sm">
                              Back
                            </button>
                          </Show>
                          <button onClick={handleStartPayment} disabled={loading()}
                            class="px-8 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition disabled:opacity-50 text-sm">
                            {loading() ? "Processing..." : `Pay $${voucherDiscount() ? voucherDiscount()!.final_amount.toFixed(2) : t().entry_fee}`}
                          </button>
                        </div>
                      </Show>

                      {/* PAYMENT — PayPal buttons or Crypto address */}
                      <Show when={step() === "payment"}>
                        <Show when={paymentMethod() === "paypal"}>
                          <h2 class="text-xl font-bold text-white mb-4">Complete PayPal payment</h2>
                          <Show when={paypalLoading()}>
                            <div class="flex items-center gap-3 text-gray-400 py-8">
                              <div class="w-5 h-5 border-2 border-gray-600 border-t-blue-500 rounded-full animate-spin" />
                              <span class="text-sm">Loading PayPal...</span>
                            </div>
                          </Show>
                          <div id="paypal-button-container" class="max-w-md" />
                          <Show when={error()}>
                            <p class="text-red-400 text-sm mt-4">{error()}</p>
                          </Show>
                          <button onClick={() => { setStep("method"); setError(null); }}
                            class="mt-4 px-6 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition text-sm">
                            Back
                          </button>
                        </Show>

                        <Show when={paymentMethod() === "crypto"}>
                          {/* Step 1: network + token selection */}
                          <Show when={!cryptoPayData()}>
                            <div class="space-y-5 max-w-2xl">
                              <CryptoNetworkSelector
                                selectedNetwork={selectedNetwork()}
                                onNetworkChange={(net, defaultTok) => {
                                  setSelectedNetwork(net);
                                  setSelectedToken(defaultTok);
                                }}
                              />
                              <CryptoTokenSelector
                                selectedNetwork={selectedNetwork()}
                                selectedToken={selectedToken()}
                                onTokenChange={(tok) => setSelectedToken(tok)}
                              />

                              <Show when={error()}>
                                <p class="text-red-400 text-sm">{error()}</p>
                              </Show>

                              <div class="flex gap-3 pt-2">
                                <button onClick={() => { setStep("method"); setError(null); }}
                                  class="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition text-sm">
                                  \u2190 Back
                                </button>
                                <button onClick={handleCryptoCreate} disabled={loading()}
                                  class="px-8 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition text-sm disabled:opacity-50">
                                  {loading() ? "Creating payment..." : `Continue with ${selectedToken().toUpperCase()}`}
                                </button>
                              </div>
                            </div>
                          </Show>

                          {/* Step 2: payment monitor with QR + address + countdown */}
                          <Show when={cryptoPayData() && jwt() && tournament() && intentId()}>
                            <PaymentMonitor
                              paymentData={cryptoPayData()!}
                              intentId={intentId()!}
                              jwt={jwt()!}
                              tournamentId={tournament()!.id}
                              onCopyAddress={(addr) => {
                                navigator.clipboard.writeText(addr);
                              }}
                              onBack={() => { setCryptoPayData(null); setError(null); }}
                              onCancelAndGetNew={() => { setCryptoPayData(null); handleCryptoCreate(); }}
                              onConfirmed={(entryId, accountId) => {
                                setEntryResult({ entry_id: entryId, trading_account_id: accountId });
                                setStep("success");
                              }}
                              allowSimulation={false}
                            />
                          </Show>
                        </Show>
                      </Show>

                      {/* SUCCESS */}
                      <Show when={step() === "success"}>
                        <div class="text-center py-8">
                          <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-green-600/20 flex items-center justify-center">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                          </div>
                          <h2 class="text-2xl font-bold text-white mb-2">You're In!</h2>
                          <p class="text-gray-400 mb-6">Your tournament account is ready. Start trading when the tournament begins.</p>
                          <a href={`https://broker.cryptonite.trade/?from_tournament=true&account_id=${entryResult()?.trading_account_id || ""}`}
                            class="inline-block px-8 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition">
                            Open Trading Station
                          </a>
                          <div class="mt-4">
                            <A href={`/tournaments/${t().slug}`} class="text-sm text-gray-500 hover:text-white transition">
                              View Tournament Rankings
                            </A>
                          </div>
                        </div>
                      </Show>

                      {/* ERROR */}
                      <Show when={step() === "error"}>
                        <div class="text-center py-8">
                          <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-red-600/20 flex items-center justify-center">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          </div>
                          <h2 class="text-xl font-bold text-white mb-2">Entry Failed</h2>
                          <p class="text-red-400 text-sm mb-6">{error()}</p>
                          <button onClick={() => { setError(null); setStep("method"); }}
                            class="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition">
                            Try Again
                          </button>
                        </div>
                      </Show>
                    </div>
                  </div>
                </div>

                {/* RIGHT — Sidebar (renders ABOVE the form on mobile) */}
                <div class="w-full lg:w-72 flex-shrink-0 flex flex-col gap-4 order-1 lg:order-2">

                  {/* Order Summary — sticky only on lg; on mobile it sits
                      above the form as a regular block. */}
                  <div class="bg-black border border-[#222] rounded-xl overflow-hidden shadow-xl shadow-black/50 lg:sticky lg:top-4">
                    <div class={`px-4 py-3 border-b border-[#1a1a1a] bg-gradient-to-r ${style().softGradient}`}>
                      <h3 class="text-sm font-bold text-white">Order Summary</h3>
                    </div>
                    <div class="p-4 space-y-3">
                      <div>
                        <p class="text-[10px] text-gray-600 uppercase tracking-wider mb-1">Tournament</p>
                        <p class="text-sm text-white font-medium">{t().name}</p>
                      </div>
                      <div class="border-t border-[#1a1a1a] pt-3 space-y-2 text-sm">
                        <div class="flex justify-between">
                          <span class="text-gray-500">Account</span>
                          <span class="text-white">${Number(t().account_size).toLocaleString()}</span>
                        </div>
                        <div class="flex justify-between">
                          <span class="text-gray-500">Players</span>
                          <span class="text-white">{t().reserved_spots}/{t().total_spots}</span>
                        </div>
                        <div class="flex justify-between">
                          <span class="text-gray-500">Max DD</span>
                          <span class="text-white">{t().max_drawdown_percentage}%</span>
                        </div>
                      </div>
                      <div class="border-t border-[#1a1a1a] pt-3">
                        <Show when={voucherDiscount()} fallback={
                          <div class="flex justify-between items-baseline">
                            <span class="text-sm text-gray-400">Total</span>
                            <span class="text-2xl font-black text-green-400">${t().entry_fee}</span>
                          </div>
                        }>
                          {(d) => (
                            <div>
                              <div class="flex justify-between items-baseline mb-1">
                                <span class="text-sm text-gray-400">Original</span>
                                <span class="text-sm text-gray-500 line-through">${d().original_amount.toFixed(2)}</span>
                              </div>
                              <div class="flex justify-between items-baseline mb-1">
                                <span class="text-sm text-green-500">{d().discount_percentage}% discount</span>
                                <span class="text-sm text-green-500">-${d().discount_amount.toFixed(2)}</span>
                              </div>
                              <div class="flex justify-between items-baseline border-t border-[#1a1a1a] pt-2 mt-1">
                                <span class="text-sm text-gray-400">Total</span>
                                <span class="text-2xl font-black text-green-400">${d().final_amount.toFixed(2)}</span>
                              </div>
                            </div>
                          )}
                        </Show>
                      </div>
                    </div>
                  </div>

                  {/* Prize Breakdown */}
                  <div class="bg-black rounded-xl overflow-hidden shadow-xl shadow-black/50">
                    <div class={`px-4 py-3 flex items-center justify-between bg-gradient-to-r ${style().softGradient}`}>
                      <h3 class="text-sm font-bold text-white">Prize Breakdown</h3>
                      <span class="text-[10px] text-white/50">
                        {(t().prizes as any[]).reduce((s: number, p: any) => s + (p.rank_to - p.rank_from + 1), 0)} of {t().total_spots} win
                      </span>
                    </div>
                    <div class="p-3 space-y-1">
                      {(t().prizes as any[]).map((p: any, i: number) => (
                        <div class={`rounded-lg px-3 py-2.5 ${i === 0 ? "bg-yellow-400/5 border border-yellow-400/15" : "bg-[#0a0a0a]"}`}>
                          <div class="flex items-center justify-between mb-1">
                            <span class={`text-xs font-bold ${i === 0 ? "text-yellow-400" : "text-gray-400"}`}>
                              {p.rank_from === p.rank_to
                                ? `${p.rank_from}${p.rank_from === 1 ? "st" : p.rank_from === 2 ? "nd" : p.rank_from === 3 ? "rd" : "th"} Place`
                                : `${p.rank_from}${p.rank_from === 1 ? "st" : p.rank_from === 2 ? "nd" : p.rank_from === 3 ? "rd" : "th"} \u2013 ${p.rank_to}th Place`
                              }
                            </span>
                            <span class="text-[10px] text-gray-600">
                              {p.rank_to - p.rank_from + 1} {p.rank_to - p.rank_from + 1 === 1 ? "winner" : "winners"}
                            </span>
                          </div>
                          <p class={`text-base font-bold ${i === 0 ? "text-yellow-300" : "text-white"}`}>
                            {p.label || p.type}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Rules */}
                  <div class="bg-black rounded-xl overflow-hidden shadow-xl shadow-black/50">
                    <div class="px-4 py-3 border-b border-[#1a1a1a]">
                      <h3 class="text-sm font-bold text-white">Rules</h3>
                    </div>
                    <div class="p-4 space-y-2.5 text-sm">
                      <RuleRow label="Max Drawdown" value={`${t().max_drawdown_percentage}%`} />
                      <RuleRow label="Daily Drawdown" value={`${t().max_daily_drawdown_percentage}%`} />
                      <RuleRow label="Ranked By" value="Profit %" />
                      <RuleRow label="Instruments" value="Crypto pairs" />
                      <RuleRow label="Leverage" value="None (1:1)" />
                      <RuleRow label="Elimination" value="Drawdown breach" />
                    </div>
                  </div>

                  {/* Back link */}
                  <A href={`/tournaments/${t().slug}`} class="text-center text-xs text-gray-600 hover:text-white transition py-2">
                    \u2190 Back to Tournament
                  </A>
                </div>
              </div>
            </div>
            </Show>
          )}
        </Show>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DetailHero — identical to the tournament detail page hero
// ═══════════════════════════════════════════════════════════════════════════

function DetailHero(props: { tournament: Tournament }) {
  const t = () => props.tournament;
  const style = () => getStatusStyle(t().status);
  const isLive = () => t().status === "active";
  const isReg = () => t().status === "registration";
  const isScheduled = () => t().status === "scheduled";
  const isFinished = () => t().status === "finished";
  const totalDays = () => Math.round((new Date(t().ends_at).getTime() - new Date(t().starts_at).getTime()) / 86400000);
  const isSprint = () => t().name.includes("Sprint");
  const isClassic = () => t().name.includes("Classic");
  const spotsPercent = () => Math.max((t().reserved_spots / t().total_spots) * 100, 3);

  return (
    <div class={`bg-black rounded-xl overflow-hidden shadow-xl ${style().glow} border ${style().ring}`}>
      {/* Banner */}
      <div class={`relative bg-gradient-to-r ${style().gradient}`}>
        <div class="absolute inset-0 opacity-[0.08]" style="background: repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,0.2) 8px, rgba(255,255,255,0.2) 16px);" />
        <div class="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/60 to-transparent" />

        <div class="relative px-6 py-5">
          {/* Breadcrumb back link */}
          <A
            href={`/tournaments/${t().slug}`}
            class="inline-flex items-center gap-1.5 text-white/50 hover:text-white text-xs font-medium mb-3 transition"
          >
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            {t().name}
          </A>
          <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6">
            <div class="flex-1 min-w-0">
              <p class="text-sm text-white/60 font-medium mb-0.5">
                Tournament \u2022 {totalDays()} Day {isSprint() ? "Sprint" : isClassic() ? "Classic" : "Marathon"}
                <span class={`ml-2 inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full align-middle ${style().badge}`}>
                  <Show when={isLive()}>
                    <span class="relative flex h-1.5 w-1.5"><span class="animate-ping absolute h-full w-full rounded-full bg-white opacity-75" /><span class="relative rounded-full h-1.5 w-1.5 bg-white" /></span>
                  </Show>
                  {style().label}
                </span>
              </p>
              <A href={`/tournaments/${t().slug}`} class="hover:underline">
                <h1 class="text-xl sm:text-3xl font-black text-white leading-tight drop-shadow-md mb-4">{t().name}</h1>
              </A>
              <div class="flex items-center gap-2 flex-wrap">
                {(t().prizes as any[]).map((p: any, i: number) => (
                  <div class={`flex items-center gap-2 rounded-lg px-3 py-2 border ${
                    i === 0 ? "bg-yellow-400/10 border-yellow-400/30" : "bg-black/30 border-white/10"
                  }`}>
                    <span class={`text-lg font-black ${i === 0 ? "text-yellow-300" : "text-white"}`}>
                      {p.type === "cash" ? `$${p.value}` : (p.label || p.type).replace("Free ", "").replace(/\$\d+K /g, "")}
                    </span>
                    <span class={`text-base font-black ${i === 0 ? "text-yellow-200" : "text-white/70"}`}>
                      x{p.rank_to - p.rank_from + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div class="flex-shrink-0">
              <Show when={isLive()}>
                <FlipClock targetDate={t().ends_at} label="ENDS IN" size="lg" />
              </Show>
              <Show when={isReg()}>
                <FlipClock targetDate={t().starts_at} label="STARTS IN" size="lg" />
              </Show>
              <Show when={isScheduled()}>
                <FlipClock targetDate={t().registration_opens_at} label="REGISTRATION IN" size="lg" />
              </Show>
              <Show when={isFinished()}>
                <div class="text-center px-4 py-3 bg-black/30 rounded-lg">
                  <p class="text-[10px] text-white/60 uppercase tracking-wider mb-0.5">Ended</p>
                  <p class="text-xl font-black text-white leading-tight">
                    {new Date(t().ends_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
              </Show>
            </div>
          </div>
        </div>
      </div>

      {/* Progress + Stats strip */}
      <div class="flex items-center gap-px bg-[#1a1a1a]">
        <div class="flex-1 bg-black px-4 py-2">
          <Show when={isLive()}>
            <TournamentProgress startsAt={t().starts_at} endsAt={t().ends_at} totalDays={totalDays()} />
          </Show>
          <Show when={isReg()}>
            <div class="flex items-center justify-between text-[10px] mb-1">
              <span class="text-gray-500">{t().reserved_spots}/{t().total_spots} spots</span>
              <span class="text-gray-600">{t().spots_available} left</span>
            </div>
            <div class="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
              <div class={`h-full bg-gradient-to-r ${style().gradient} rounded-full`} style={`width:${spotsPercent()}%`} />
            </div>
          </Show>
          <Show when={isScheduled()}>
            <p class={`text-[10px] ${style().accent}`}>
              Registration opens {new Date(t().registration_opens_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
          </Show>
          <Show when={isFinished()}>
            <p class="text-[10px] text-gray-600">Tournament completed</p>
          </Show>
        </div>
        <StatCell label="Account" value={`$${Number(t().account_size).toLocaleString()}`} />
        <StatCell label="Players" value={`${t().reserved_spots}/${t().total_spots}`} />
        <StatCell label="Entry" value={`$${t().entry_fee}`} accent />
        <StatCell label="Max DD" value={`${t().max_drawdown_percentage}%`} />
      </div>
    </div>
  );
}

function StatCell(props: { label: string; value: string; accent?: boolean }) {
  return (
    <div class="bg-black px-4 py-2.5">
      <p class="text-[9px] text-gray-600 uppercase tracking-wider">{props.label}</p>
      <p class={`text-sm font-bold ${props.accent ? "text-green-400" : "text-white"}`}>{props.value}</p>
    </div>
  );
}

function RuleRow(props: { label: string; value: string }) {
  return (
    <div class="flex items-center justify-between">
      <span class="text-gray-500">{props.label}</span>
      <span class="text-white font-medium">{props.value}</span>
    </div>
  );
}

function StepIndicator(props: { current: Step }) {
  const steps: { id: Step; label: string }[] = [
    { id: "auth", label: "Account" },
    { id: "method", label: "Method" },
    { id: "payment", label: "Payment" },
    { id: "success", label: "Done" },
  ];
  const currentIdx = () => steps.findIndex((s) => s.id === props.current);

  return (
    <div class="flex items-center gap-3">
      {steps.map((s, i) => {
        const isCurrent = () => props.current === s.id;
        const isPast = () => i < currentIdx();
        return (
          <>
            <div class="flex items-center gap-2">
              <div class={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border ${
                isPast() ? "bg-green-600 border-green-600 text-white" :
                isCurrent() ? "bg-green-500/10 border-green-500 text-green-400" :
                "bg-[#0a0a0a] border-gray-800 text-gray-600"
              }`}>
                {isPast() ? "\u2713" : i + 1}
              </div>
              <span class={`text-xs font-medium ${
                isCurrent() ? "text-white" : isPast() ? "text-gray-400" : "text-gray-600"
              }`}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div class={`flex-1 h-px ${isPast() ? "bg-green-600/40" : "bg-gray-800"}`} />
            )}
          </>
        );
      })}
    </div>
  );
}

