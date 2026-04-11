import { createResource, createSignal, Show } from "solid-js";
import { useParams } from "@solidjs/router";
import { Title } from "@solidjs/meta";
import { fetchTournament } from "../../services/api";
import type { Tournament } from "../../types/tournament";
import Countdown from "../../components/tournament/Countdown";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:7002";

export default function Checkout() {
  const params = useParams<{ slug: string }>();
  const [tournament] = createResource(() => params.slug, fetchTournament);
  const [email, setEmail] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [nickname, setNickname] = createSignal("");
  const [step, setStep] = createSignal<"auth" | "confirm" | "success" | "error">("auth");
  const [jwt, setJwt] = createSignal<string | null>(null);
  const [userId, setUserId] = createSignal<string | null>(null);
  const [error, setError] = createSignal<string | null>(null);
  const [loading, setLoading] = createSignal(false);
  const [entryResult, setEntryResult] = createSignal<any>(null);

  const handleAuth = async (e: Event) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Try login first
      let res = await fetch(`${API_URL}/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email(), password: password() }),
      });

      let data = await res.json();

      if (!data.jwt) {
        // Login failed, try signup
        res = await fetch(`${API_URL}/v1/auth/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email(),
            password: password(),
            name: nickname() || email().split("@")[0],
          }),
        });
        data = await res.json();

        if (!data.user?.id) {
          throw new Error(data.message || "Registration failed");
        }

        // Login after signup
        res = await fetch(`${API_URL}/v1/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email(), password: password() }),
        });
        data = await res.json();
      }

      if (!data.jwt) throw new Error("Authentication failed");

      setJwt(data.jwt);
      setUserId(data.user?.id);
      setStep("confirm");
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
      const res = await fetch(
        `${API_URL}/v1/tournaments/${tournament()!.id}/enter`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwt()}`,
          },
          body: JSON.stringify({
            nickname: nickname() || null,
          }),
        }
      );

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

      <div class="min-h-screen bg-black flex items-center justify-center p-4">
        <div class="w-full max-w-md">
          {/* Logo */}
          <div class="text-center mb-8">
            <a href="/" class="inline-flex items-center gap-2">
              <span class="text-green-500 font-bold text-2xl">CRYPTONITE</span>
              <span class="text-gray-400">Tournaments</span>
            </a>
          </div>

          <Show when={tournament()} fallback={
            <div class="text-center text-gray-500">Loading tournament...</div>
          }>
            {(t) => (
              <div class="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
                {/* Tournament header */}
                <div class="p-5 border-b border-gray-800">
                  <h1 class="text-xl font-bold text-white mb-1">{t().name}</h1>
                  <p class="text-gray-400 text-sm">{t().description}</p>
                  <div class="grid grid-cols-3 gap-3 mt-4 text-sm">
                    <div>
                      <p class="text-gray-500 text-xs">Account</p>
                      <p class="text-white font-medium">${Number(t().account_size).toLocaleString()}</p>
                    </div>
                    <div>
                      <p class="text-gray-500 text-xs">Entry</p>
                      <p class="text-green-500 font-bold text-lg">${t().entry_fee}</p>
                    </div>
                    <div>
                      <p class="text-gray-500 text-xs">Spots left</p>
                      <p class="text-white font-medium">{t().spots_available}/{t().total_spots}</p>
                    </div>
                  </div>
                  <Show when={t().status === "registration"}>
                    <div class="mt-3">
                      <Countdown targetDate={t().starts_at} label="Starts in" />
                    </div>
                  </Show>
                </div>

                {/* Auth step */}
                <Show when={step() === "auth"}>
                  <form onSubmit={handleAuth} class="p-5 space-y-4">
                    <div>
                      <label class="text-sm text-gray-400 block mb-1">Email</label>
                      <input
                        type="email"
                        required
                        value={email()}
                        onInput={(e) => setEmail(e.currentTarget.value)}
                        class="w-full bg-black border border-gray-800 rounded px-3 py-2 text-white text-sm focus:border-green-500 outline-none"
                        placeholder="your@email.com"
                      />
                    </div>
                    <div>
                      <label class="text-sm text-gray-400 block mb-1">Password</label>
                      <input
                        type="password"
                        required
                        minLength={8}
                        value={password()}
                        onInput={(e) => setPassword(e.currentTarget.value)}
                        class="w-full bg-black border border-gray-800 rounded px-3 py-2 text-white text-sm focus:border-green-500 outline-none"
                        placeholder="Min 8 chars, 1 uppercase, 1 number"
                      />
                    </div>
                    <div>
                      <label class="text-sm text-gray-400 block mb-1">Nickname (optional)</label>
                      <input
                        type="text"
                        value={nickname()}
                        onInput={(e) => setNickname(e.currentTarget.value)}
                        class="w-full bg-black border border-gray-800 rounded px-3 py-2 text-white text-sm focus:border-green-500 outline-none"
                        placeholder="Your trader name"
                      />
                    </div>
                    <Show when={error()}>
                      <p class="text-red-400 text-sm">{error()}</p>
                    </Show>
                    <button
                      type="submit"
                      disabled={loading()}
                      class="w-full bg-green-600 text-white py-3 rounded font-bold hover:brightness-110 transition disabled:opacity-50"
                    >
                      {loading() ? "Processing..." : "Continue"}
                    </button>
                    <p class="text-gray-500 text-xs text-center">
                      Login or create account. Same credentials as broker.cryptonite.trade
                    </p>
                  </form>
                </Show>

                {/* Confirm step */}
                <Show when={step() === "confirm"}>
                  <div class="p-5 space-y-4">
                    <div class="bg-black rounded p-4">
                      <p class="text-sm text-gray-400 mb-2">You're about to join:</p>
                      <p class="text-white font-bold text-lg">{t().name}</p>
                      <p class="text-green-500 font-bold text-2xl mt-1">${t().entry_fee}</p>
                    </div>
                    <div class="bg-black rounded p-3 text-xs text-gray-400 space-y-1">
                      <p>• Account size: ${Number(t().account_size).toLocaleString()}</p>
                      <p>• Max drawdown: {t().max_drawdown_percentage}%</p>
                      <p>• Daily drawdown: {t().max_daily_drawdown_percentage}%</p>
                      <p>• Ranked by: profit percentage</p>
                    </div>
                    <Show when={error()}>
                      <p class="text-red-400 text-sm">{error()}</p>
                    </Show>
                    <button
                      onClick={handleEnter}
                      disabled={loading()}
                      class="w-full bg-green-600 text-white py-3 rounded font-bold hover:brightness-110 transition disabled:opacity-50"
                    >
                      {loading() ? "Entering..." : `Join Tournament — $${t().entry_fee}`}
                    </button>
                    <button
                      onClick={() => setStep("auth")}
                      class="w-full text-gray-500 text-sm hover:text-white transition"
                    >
                      Back
                    </button>
                  </div>
                </Show>

                {/* Success step */}
                <Show when={step() === "success"}>
                  <div class="p-5 text-center space-y-4">
                    <div class="text-4xl">🏆</div>
                    <h2 class="text-xl font-bold text-white">You're In!</h2>
                    <p class="text-gray-400 text-sm">
                      Your tournament account is ready. Start trading when the tournament begins.
                    </p>
                    <a
                      href={`https://broker.cryptonite.trade/?from_tournament=true&account_id=${entryResult()?.trading_account_id}`}
                      class="block w-full bg-green-600 text-white py-3 rounded font-bold hover:brightness-110 transition text-center"
                    >
                      Open Trading Station
                    </a>
                    <a
                      href={`/tournaments/${t().slug}`}
                      class="block text-gray-500 text-sm hover:text-white transition"
                    >
                      View Tournament Rankings
                    </a>
                  </div>
                </Show>

                {/* Error step */}
                <Show when={step() === "error"}>
                  <div class="p-5 text-center space-y-4">
                    <div class="text-4xl">❌</div>
                    <h2 class="text-lg font-bold text-white">Entry Failed</h2>
                    <p class="text-red-400 text-sm">{error()}</p>
                    <button
                      onClick={() => { setError(null); setStep("confirm"); }}
                      class="w-full bg-gray-800 text-white py-2 rounded hover:bg-gray-700 transition"
                    >
                      Try Again
                    </button>
                  </div>
                </Show>

                {/* Prizes footer */}
                <div class="border-t border-gray-800 p-4">
                  <p class="text-xs text-gray-500 mb-2">Prizes</p>
                  <div class="flex flex-wrap gap-1.5">
                    {(t().prizes as any[]).map((p) => (
                      <span class="text-xs bg-black px-2 py-0.5 rounded text-gray-300">
                        x{p.rank_to - p.rank_from + 1} {p.type === "cash" ? `$${p.value}` : (p.label || p.type).replace("Free ", "")}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Show>
        </div>
      </div>
    </>
  );
}
