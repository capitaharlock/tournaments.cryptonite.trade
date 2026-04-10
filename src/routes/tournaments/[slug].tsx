import { createResource, createSignal, Show, onCleanup } from "solid-js";
import { useParams } from "@solidjs/router";
import { Title } from "@solidjs/meta";
import { fetchTournament, fetchRankings } from "../../services/api";
import type { Tournament, RankingEntry } from "../../types/tournament";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import Countdown from "../../components/tournament/Countdown";
import RankingTable from "../../components/tournament/RankingTable";

export default function TournamentDetail() {
  const params = useParams<{ slug: string }>();
  const [tournament] = createResource(() => params.slug, fetchTournament);
  const [rankings, { refetch }] = createResource(
    () => tournament()?.id,
    (id) => (id ? fetchRankings(id) : Promise.resolve([]))
  );

  // Auto-refresh rankings every 30s for active tournaments
  const interval = setInterval(() => {
    if (tournament()?.status === "active") refetch();
  }, 30000);
  onCleanup(() => clearInterval(interval));

  const isLive = () => tournament()?.status === "active";
  const isRegistering = () => tournament()?.status === "registration";

  return (
    <>
      <Title>{tournament()?.name || "Tournament"} — Cryptonite</Title>
      <Header />

      <main class="max-w-7xl mx-auto px-4 py-8">
        <Show when={tournament()} fallback={<p class="text-gray-500">Loading...</p>}>
          {(t) => (
            <>
              {/* Header */}
              <div class="mb-8">
                <div class="flex items-center gap-3 mb-2">
                  <h1 class="text-3xl font-bold">{t().name}</h1>
                  <span class={`text-xs px-2 py-0.5 rounded-full ${
                    isLive() ? "bg-brand-gold/20 text-brand-gold" :
                    isRegistering() ? "bg-green-500/20 text-green-400" :
                    "bg-gray-500/20 text-gray-400"
                  }`}>
                    {t().status}
                  </span>
                </div>
                <p class="text-gray-400">{t().description}</p>
              </div>

              {/* Stats + Countdown */}
              <div class="grid md:grid-cols-4 gap-4 mb-8">
                <div class="bg-brand-card border border-brand-border rounded-lg p-4">
                  <p class="text-gray-500 text-xs mb-1">Account Size</p>
                  <p class="text-xl font-bold">${t().account_size.toLocaleString()}</p>
                </div>
                <div class="bg-brand-card border border-brand-border rounded-lg p-4">
                  <p class="text-gray-500 text-xs mb-1">Players</p>
                  <p class="text-xl font-bold">{t().reserved_spots} / {t().total_spots}</p>
                </div>
                <div class="bg-brand-card border border-brand-border rounded-lg p-4">
                  <p class="text-gray-500 text-xs mb-1">Entry Fee</p>
                  <p class="text-xl font-bold">${t().entry_fee}</p>
                </div>
                <div class="bg-brand-card border border-brand-border rounded-lg p-4">
                  <Show when={isLive()}>
                    <Countdown targetDate={t().ends_at} label="Ends in" />
                  </Show>
                  <Show when={isRegistering()}>
                    <Countdown targetDate={t().starts_at} label="Starts in" />
                  </Show>
                  <Show when={!isLive() && !isRegistering()}>
                    <p class="text-gray-500 text-xs mb-1">Status</p>
                    <p class="text-xl font-bold capitalize">{t().status}</p>
                  </Show>
                </div>
              </div>

              {/* Prize Breakdown */}
              <div class="bg-brand-card border border-brand-border rounded-lg p-5 mb-8">
                <h2 class="font-semibold mb-3">Prize Breakdown</h2>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(t().prizes as any[]).map((p) => (
                    <div class="bg-brand-dark rounded p-3">
                      <p class="text-brand-gold font-mono text-sm">
                        #{p.rank_from}{p.rank_to > p.rank_from ? `–${p.rank_to}` : ""}
                      </p>
                      <p class="text-white text-sm font-medium mt-1">{p.label || p.type}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rules */}
              <div class="bg-brand-card border border-brand-border rounded-lg p-5 mb-8">
                <h2 class="font-semibold mb-3">Rules</h2>
                <div class="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p class="text-gray-500">Max Drawdown</p>
                    <p class="text-white">{t().max_drawdown_percentage}%</p>
                  </div>
                  <div>
                    <p class="text-gray-500">Daily Drawdown</p>
                    <p class="text-white">{t().max_daily_drawdown_percentage}%</p>
                  </div>
                  <div>
                    <p class="text-gray-500">Ranking By</p>
                    <p class="text-white capitalize">{t().ranking_metric.replace("_", " ")}</p>
                  </div>
                </div>
              </div>

              {/* Live Rankings */}
              <div class="mb-8">
                <div class="flex items-center justify-between mb-4">
                  <h2 class="font-semibold text-lg">
                    {isLive() ? "Live Rankings" : "Final Rankings"}
                  </h2>
                  <Show when={isLive()}>
                    <span class="text-xs text-gray-500">Refreshes every 30s</span>
                  </Show>
                </div>

                <Show
                  when={rankings() && rankings()!.length > 0}
                  fallback={<p class="text-gray-500 text-sm">No rankings yet</p>}
                >
                  <RankingTable rankings={rankings()!} prizes={t().prizes as any} />
                </Show>
              </div>

              {/* CTA */}
              <Show when={isRegistering() && t().spots_available > 0}>
                <div class="text-center py-8">
                  <a
                    href={`/checkout/${t().slug}`}
                    class="inline-block bg-brand-gold text-black px-8 py-3 rounded-lg font-bold text-lg hover:brightness-110 transition"
                  >
                    Join This Tournament — ${t().entry_fee}
                  </a>
                  <p class="text-gray-500 text-sm mt-2">
                    {t().spots_available} spots remaining
                  </p>
                </div>
              </Show>
            </>
          )}
        </Show>
      </main>

      <Footer />
    </>
  );
}
