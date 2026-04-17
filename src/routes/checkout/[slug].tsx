import { createResource, createSignal, Show, For, onMount } from "solid-js";
import { useParams, useSearchParams, A } from "@solidjs/router";
import { Title } from "@solidjs/meta";
import { fetchTournament } from "../../services/api";
import type { Tournament, PrizeBand } from "../../types/tournament";
import Header from "../../components/layout/Header";
import FlipClock from "../../components/tournament/FlipClock";
import TournamentProgress from "../../components/tournament/TournamentProgress";
import { getStatusStyle } from "../../lib/statusStyles";
import { getSSOToken, setSSOToken } from "../../lib/sso";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:7002";

type Step = "auth" | "method" | "payment" | "success" | "error";
type PaymentMethod = "card" | "crypto" | "paypal";

export default function Checkout() {
  const params = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tournament] = createResource(() => params.slug, fetchTournament);
  const [email, setEmail] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [nickname, setNickname] = createSignal("");
  const [step, setStep] = createSignal<Step>("auth");
  const [paymentMethod, setPaymentMethod] = createSignal<PaymentMethod>("card");
  const [jwt, setJwt] = createSignal<string | null>(null);
  const [userName, setUserName] = createSignal<string | null>(null);
  const [error, setError] = createSignal<string | null>(null);
  const [loading, setLoading] = createSignal(false);
  const [entryResult, setEntryResult] = createSignal<any>(null);
  const [voucherCode, setVoucherCode] = createSignal("");
  const [voucherApplied, setVoucherApplied] = createSignal(false);

  const style = () => getStatusStyle(tournament()?.status);

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
    // 1. Try SSO cookie (set by broker or any *.cryptonite.trade login)
    const cookieToken = getSSOToken();
    if (cookieToken && await tryAutoAuth(cookieToken)) return;

    // 2. Fallback: URL ?token= param (legacy cross-site redirect)
    const urlToken = searchParams.token as string | undefined;
    if (urlToken) {
      await tryAutoAuth(urlToken);
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

  const handleEnter = async () => {
    if (!jwt() || !tournament()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/v1/tournaments/${tournament()!.id}/enter`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt()}` },
        body: JSON.stringify({
          nickname: nickname() || null,
          voucher_code: voucherCode() || null,
        }),
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

              {/* HERO */}
              <DetailHero tournament={t()} />

              {/* MAIN CONTENT — 2 columns */}
              <div class="flex flex-col lg:flex-row gap-4">

                {/* LEFT — Checkout Steps */}
                <div class="flex-1">
                  <div class="bg-black border border-[#222] rounded-xl overflow-hidden shadow-xl shadow-black/50">
                    <div class="px-5 py-4 border-b border-[#1a1a1a]">
                      <StepIndicator current={step()} />
                    </div>

                    <div class="p-6">
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

                      {/* PAYMENT METHOD */}
                      <Show when={step() === "method"}>
                        <Show when={userName()}>
                          <div class="mb-4 flex items-center gap-2 bg-green-900/15 border border-green-700/20 rounded-lg px-4 py-2.5">
                            <span class="text-green-400 text-xs font-bold">Signed in as</span>
                            <span class="text-white text-sm font-medium">{userName()}</span>
                          </div>
                        </Show>
                        <h2 class="text-xl font-bold text-white mb-1">Choose payment method</h2>
                        <p class="text-sm text-gray-500 mb-6">Select how you want to pay the entry fee</p>

                        <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6 max-w-2xl">
                          <PaymentOption method="card" active={paymentMethod()} onClick={() => setPaymentMethod("card")} />
                          <PaymentOption method="crypto" active={paymentMethod()} onClick={() => setPaymentMethod("crypto")} />
                          <PaymentOption method="paypal" active={paymentMethod()} onClick={() => setPaymentMethod("paypal")} />
                        </div>

                        <div class="flex gap-3">
                          <Show when={!userName()}>
                            <button onClick={() => setStep("auth")}
                              class="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition text-sm">
                              \u2190 Back
                            </button>
                          </Show>
                          <button onClick={() => setStep("payment")}
                            class="px-8 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition text-sm">
                            Continue \u2192
                          </button>
                        </div>
                      </Show>

                      {/* PAYMENT */}
                      <Show when={step() === "payment"}>
                        <h2 class="text-xl font-bold text-white mb-1">Complete payment</h2>
                        <p class="text-sm text-gray-500 mb-6">
                          {voucherApplied() ? "Free entry with voucher!" : `Pay $${t().entry_fee} to enter ${t().name}`}
                        </p>

                        <div class="mb-6 max-w-md">
                          <Show when={!voucherApplied()}>
                            <div class="flex gap-2">
                              <input type="text" placeholder="Voucher code (optional)" value={voucherCode()}
                                onInput={(e) => setVoucherCode(e.currentTarget.value)}
                                class="flex-1 px-4 py-2.5 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white text-sm focus:border-green-500 focus:outline-none font-mono" />
                              <Show when={voucherCode().length > 0}>
                                <button onClick={() => setVoucherApplied(true)}
                                  class="px-4 py-2.5 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition text-sm">
                                  Apply
                                </button>
                              </Show>
                            </div>
                            <p class="text-[10px] text-gray-600 mt-1">Have a retry voucher? Enter it above to skip payment.</p>
                          </Show>
                          <Show when={voucherApplied()}>
                            <div class="flex items-center gap-2 bg-green-900/20 border border-green-700/30 rounded-lg px-4 py-2.5">
                              <span class="text-green-400 text-sm font-bold">Voucher applied:</span>
                              <span class="text-white font-mono text-sm">{voucherCode()}</span>
                              <button onClick={() => { setVoucherApplied(false); setVoucherCode(""); }}
                                class="ml-auto text-xs text-gray-500 hover:text-red-400">Remove</button>
                            </div>
                          </Show>
                        </div>

                        <Show when={!voucherApplied()}>
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
                        </Show>

                        <Show when={error()}>
                          <p class="text-red-400 text-sm mb-4">{error()}</p>
                        </Show>

                        <div class="flex gap-3">
                          <button onClick={() => setStep("method")}
                            class="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition text-sm">
                            \u2190 Back
                          </button>
                          <button onClick={handleEnter} disabled={loading()}
                            class="px-8 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition disabled:opacity-50 text-sm">
                            {loading() ? "Processing..." : voucherApplied() ? "Join Free with Voucher" : `Join Tournament \u2014 $${t().entry_fee}`}
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
                              View Tournament Rankings \u2192
                            </A>
                          </div>
                        </div>
                      </Show>

                      {/* ERROR */}
                      <Show when={step() === "error"}>
                        <div class="text-center py-8">
                          <div class="text-5xl mb-4">\u274C</div>
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

                {/* RIGHT — Sidebar */}
                <div class="lg:w-72 flex-shrink-0 flex flex-col gap-4">

                  {/* Order Summary */}
                  <div class="bg-black border border-[#222] rounded-xl overflow-hidden shadow-xl shadow-black/50 sticky top-4">
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
                        <div class="flex justify-between items-baseline">
                          <span class="text-sm text-gray-400">Total</span>
                          <span class="text-2xl font-black text-green-400">${t().entry_fee}</span>
                        </div>
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
                      <RuleRow label="Instruments" value="25 crypto pairs" />
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
          <div class="flex items-start justify-between gap-6">
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
              <h1 class="text-3xl font-black text-white leading-tight drop-shadow-md mb-4">{t().name}</h1>
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

function PaymentOption(props: { method: PaymentMethod; active: PaymentMethod; onClick: () => void }) {
  const isActive = () => props.method === props.active;
  const labels: Record<PaymentMethod, { name: string; icon: string; desc: string }> = {
    card: { name: "Card", icon: "\uD83D\uDCB3", desc: "Visa, Mastercard" },
    crypto: { name: "Crypto", icon: "\u20BF", desc: "BTC, ETH, USDT" },
    paypal: { name: "PayPal", icon: "\uD83C\uDD7F", desc: "PayPal balance" },
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
