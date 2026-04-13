import { createResource, createSignal, Show } from "solid-js";
import { useParams, A } from "@solidjs/router";
import { Title } from "@solidjs/meta";
import { fetchTournament } from "../../services/api";
import type { Tournament } from "../../types/tournament";
import Header from "../../components/layout/Header";
import FlipClock from "../../components/tournament/FlipClock";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:7002";

type Step = "auth" | "method" | "payment" | "success" | "error";
type PaymentMethod = "card" | "crypto" | "paypal";

export default function Checkout() {
  const params = useParams<{ slug: string }>();
  const [tournament] = createResource(() => params.slug, fetchTournament);
  const [email, setEmail] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [nickname, setNickname] = createSignal("");
  const [step, setStep] = createSignal<Step>("auth");
  const [paymentMethod, setPaymentMethod] = createSignal<PaymentMethod>("card");
  const [jwt, setJwt] = createSignal<string | null>(null);
  const [error, setError] = createSignal<string | null>(null);
  const [loading, setLoading] = createSignal(false);
  const [entryResult, setEntryResult] = createSignal<any>(null);

  const handleAuth = async (e: Event) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      let res = await fetch(`${API_URL}/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email(), password: password() }),
      });
      let data = await res.json();
      if (!data.jwt) {
        res = await fetch(`${API_URL}/v1/auth/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email(), password: password(), name: nickname() || email().split("@")[0] }),
        });
        data = await res.json();
        if (!data.user?.id) throw new Error(data.message || "Registration failed");
        res = await fetch(`${API_URL}/v1/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email(), password: password() }),
        });
        data = await res.json();
      }
      if (!data.jwt) throw new Error("Authentication failed");
      setJwt(data.jwt);
      setStep("method");
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleEnter = async () => {
    if (!jwt() || !tournament()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/v1/tournaments/${tournament()!.id}/enter`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt()}` },
        body: JSON.stringify({ nickname: nickname() || null }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to enter tournament");
      setEntryResult(data.data);
      setStep("success");
    } catch (err: any) {
      setError(err.message || "Failed to enter tournament");
      setStep("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Title>Join {tournament()?.name || "Tournament"} — Cryptonite</Title>
      <Header />

      <div class="min-h-screen bg-[#1a1a1a]">
        <Show when={tournament()} fallback={<div class="text-center py-16 text-gray-600">Loading...</div>}>
          {(t) => (
            <div class="p-4 max-w-6xl mx-auto space-y-4">
              {/* HERO — same as tournament detail */}
              <CheckoutHero tournament={t()} />

              {/* MAIN CONTENT — 2 columns */}
              <div class="flex flex-col lg:flex-row gap-4">
                {/* LEFT — Steps */}
                <div class="flex-1">
                  <div class="bg-black border border-[#222] rounded-xl overflow-hidden shadow-xl shadow-black/50">
                    {/* Step indicator */}
                    <div class="px-5 py-4 border-b border-[#1a1a1a]">
                      <StepIndicator current={step()} />
                    </div>

                    {/* Step content */}
                    <div class="p-6">
                      {/* AUTH */}
                      <Show when={step() === "auth"}>
                        <h2 class="text-xl font-bold text-white mb-1">Sign in or create account</h2>
                        <p class="text-sm text-gray-500 mb-6">Same credentials as broker.cryptonite.trade</p>

                        <form onSubmit={handleAuth} class="space-y-4 max-w-md">
                          <div>
                            <label class="text-xs text-gray-400 block mb-1.5 uppercase tracking-wider font-bold">Email</label>
                            <input type="email" required value={email()} onInput={(e) => setEmail(e.currentTarget.value)}
                              class="w-full bg-[#0a0a0a] border border-gray-800 rounded-lg px-4 py-3 text-white text-sm focus:border-green-500 focus:outline-none transition"
                              placeholder="your@email.com" />
                          </div>
                          <div>
                            <label class="text-xs text-gray-400 block mb-1.5 uppercase tracking-wider font-bold">Password</label>
                            <input type="password" required minLength={8} value={password()} onInput={(e) => setPassword(e.currentTarget.value)}
                              class="w-full bg-[#0a0a0a] border border-gray-800 rounded-lg px-4 py-3 text-white text-sm focus:border-green-500 focus:outline-none transition"
                              placeholder="Min 8 chars, 1 uppercase, 1 number" />
                          </div>
                          <div>
                            <label class="text-xs text-gray-400 block mb-1.5 uppercase tracking-wider font-bold">Trader Nickname (optional)</label>
                            <input type="text" value={nickname()} onInput={(e) => setNickname(e.currentTarget.value)}
                              class="w-full bg-[#0a0a0a] border border-gray-800 rounded-lg px-4 py-3 text-white text-sm focus:border-green-500 focus:outline-none transition"
                              placeholder="How others see you in the rankings" />
                          </div>
                          <Show when={error()}>
                            <p class="text-red-400 text-sm">{error()}</p>
                          </Show>
                          <button type="submit" disabled={loading()}
                            class="w-full md:w-auto px-8 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition disabled:opacity-50">
                            {loading() ? "Processing..." : "Continue →"}
                          </button>
                        </form>
                      </Show>

                      {/* PAYMENT METHOD */}
                      <Show when={step() === "method"}>
                        <h2 class="text-xl font-bold text-white mb-1">Choose payment method</h2>
                        <p class="text-sm text-gray-500 mb-6">Select how you want to pay the entry fee</p>

                        <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6 max-w-2xl">
                          <PaymentOption method="card" active={paymentMethod()} onClick={() => setPaymentMethod("card")} />
                          <PaymentOption method="crypto" active={paymentMethod()} onClick={() => setPaymentMethod("crypto")} />
                          <PaymentOption method="paypal" active={paymentMethod()} onClick={() => setPaymentMethod("paypal")} />
                        </div>

                        <div class="flex gap-3">
                          <button onClick={() => setStep("auth")}
                            class="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition text-sm">
                            ← Back
                          </button>
                          <button onClick={() => setStep("payment")}
                            class="px-8 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition text-sm">
                            Continue →
                          </button>
                        </div>
                      </Show>

                      {/* PAYMENT */}
                      <Show when={step() === "payment"}>
                        <h2 class="text-xl font-bold text-white mb-1">Complete payment</h2>
                        <p class="text-sm text-gray-500 mb-6">Pay ${t().entry_fee} to enter {t().name}</p>

                        <div class="bg-[#0a0a0a] border border-gray-800 rounded-lg p-6 mb-6 max-w-md">
                          <Show when={paymentMethod() === "card"}>
                            <p class="text-gray-400 text-sm mb-2">Card payment integration coming soon</p>
                            <p class="text-xs text-gray-600">Use the "Join Tournament" button below to test the entry flow without payment</p>
                          </Show>
                          <Show when={paymentMethod() === "crypto"}>
                            <p class="text-gray-400 text-sm mb-2">Crypto payment integration coming soon</p>
                            <p class="text-xs text-gray-600">Will support BTC, ETH, USDT via NowPayments</p>
                          </Show>
                          <Show when={paymentMethod() === "paypal"}>
                            <p class="text-gray-400 text-sm mb-2">PayPal integration coming soon</p>
                            <p class="text-xs text-gray-600">Standard PayPal checkout flow</p>
                          </Show>
                        </div>

                        <Show when={error()}>
                          <p class="text-red-400 text-sm mb-4">{error()}</p>
                        </Show>

                        <div class="flex gap-3">
                          <button onClick={() => setStep("method")}
                            class="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition text-sm">
                            ← Back
                          </button>
                          <button onClick={handleEnter} disabled={loading()}
                            class="px-8 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition disabled:opacity-50 text-sm">
                            {loading() ? "Processing..." : `Join Tournament — $${t().entry_fee}`}
                          </button>
                        </div>
                      </Show>

                      {/* SUCCESS */}
                      <Show when={step() === "success"}>
                        <div class="text-center py-8">
                          <div class="text-5xl mb-4">🏆</div>
                          <h2 class="text-2xl font-bold text-white mb-2">You're In!</h2>
                          <p class="text-gray-400 mb-6">Your tournament account is ready. Start trading when the tournament begins.</p>
                          <a href={`https://broker.cryptonite.trade/?from_tournament=true&account_id=${entryResult()?.trading_account_id}`}
                            class="inline-block px-8 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition">
                            Open Trading Station
                          </a>
                          <div class="mt-4">
                            <A href={`/tournaments/${t().slug}`} class="text-sm text-gray-500 hover:text-white transition">
                              View Tournament Rankings →
                            </A>
                          </div>
                        </div>
                      </Show>

                      {/* ERROR */}
                      <Show when={step() === "error"}>
                        <div class="text-center py-8">
                          <div class="text-5xl mb-4">❌</div>
                          <h2 class="text-xl font-bold text-white mb-2">Entry Failed</h2>
                          <p class="text-red-400 text-sm mb-6">{error()}</p>
                          <button onClick={() => { setError(null); setStep("payment"); }}
                            class="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition">
                            Try Again
                          </button>
                        </div>
                      </Show>
                    </div>
                  </div>
                </div>

                {/* RIGHT — Order Summary */}
                <div class="lg:w-72 flex-shrink-0">
                  <div class="bg-black border border-[#222] rounded-xl overflow-hidden shadow-xl shadow-black/50 sticky top-4">
                    <div class="px-4 py-3 border-b border-[#1a1a1a] bg-gradient-to-r from-green-600/20 to-emerald-500/5">
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
                          <span class="text-white">{t().total_spots}</span>
                        </div>
                        <div class="flex justify-between">
                          <span class="text-gray-500">Max DD</span>
                          <span class="text-white">{t().max_drawdown_percentage}%</span>
                        </div>
                      </div>
                      <div class="border-t border-[#1a1a1a] pt-3">
                        <div class="flex justify-between items-baseline">
                          <span class="text-sm text-gray-400">Total</span>
                          <span class="text-2xl font-black text-green-400">${t().entry_fee}</span>
                        </div>
                      </div>

                      {/* Top prize highlight */}
                      <div class="bg-yellow-400/5 border border-yellow-400/15 rounded-lg p-3 mt-3">
                        <p class="text-[10px] text-yellow-400/70 uppercase tracking-wider mb-0.5">1st Prize</p>
                        <p class="text-xl font-black text-yellow-300">
                          {(() => {
                            const cash = (t().prizes as any[]).find(p => p.type === "cash");
                            return cash ? `$${cash.value}` : (t().prizes as any[])[0]?.label || "Prize";
                          })()}
                        </p>
                        <p class="text-[10px] text-gray-600 mt-1">
                          + {(t().prizes as any[]).reduce((s: number, p: any) => s + (p.rank_to - p.rank_from + 1), 0) - 1} other winners
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Show>
      </div>
    </>
  );
}

function CheckoutHero(props: { tournament: Tournament }) {
  const t = () => props.tournament;
  const totalDays = () => Math.round((new Date(t().ends_at).getTime() - new Date(t().starts_at).getTime()) / 86400000);
  const isSprint = () => t().name.includes("Sprint");
  const isClassic = () => t().name.includes("Classic");

  return (
    <div class="bg-black border border-[#222] rounded-xl overflow-hidden shadow-xl shadow-black/50">
      <div class="relative bg-gradient-to-r from-green-600 via-emerald-500 to-teal-400">
        <div class="absolute inset-0 opacity-[0.08]" style="background: repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,0.2) 8px, rgba(255,255,255,0.2) 16px);" />
        <div class="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/60 to-transparent" />

        <div class="relative px-6 py-5 flex items-center justify-between gap-6">
          <div class="flex-1 min-w-0">
            <p class="text-sm text-white/60 font-medium mb-0.5">
              Tournament • {totalDays()} Day {isSprint() ? "Sprint" : isClassic() ? "Classic" : "Marathon"}
              <span class="ml-2 text-[11px] font-bold text-white bg-black/30 px-2 py-0.5 rounded-full align-middle">CHECKOUT</span>
            </p>
            <h1 class="text-2xl font-black text-white leading-tight drop-shadow-md">{t().name}</h1>
          </div>
          <div class="flex-shrink-0">
            <FlipClock targetDate={t().starts_at} label="STARTS IN" size="lg" />
          </div>
        </div>
      </div>
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
                {isPast() ? "✓" : i + 1}
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

function PaymentOption(props: { method: PaymentMethod; active: PaymentMethod; onClick: () => void }) {
  const isActive = () => props.method === props.active;
  const labels: Record<PaymentMethod, { name: string; icon: string; desc: string }> = {
    card: { name: "Card", icon: "💳", desc: "Visa, Mastercard" },
    crypto: { name: "Crypto", icon: "₿", desc: "BTC, ETH, USDT" },
    paypal: { name: "PayPal", icon: "🅿", desc: "PayPal balance" },
  };
  const info = labels[props.method];
  return (
    <button onClick={props.onClick}
      class={`p-4 rounded-lg border transition text-left ${
        isActive() ? "bg-green-500/10 border-green-500/40" : "bg-[#0a0a0a] border-gray-800 hover:border-gray-700"
      }`}>
      <div class="text-2xl mb-2">{info.icon}</div>
      <p class={`text-sm font-bold ${isActive() ? "text-green-400" : "text-white"}`}>{info.name}</p>
      <p class="text-[10px] text-gray-600">{info.desc}</p>
    </button>
  );
}
