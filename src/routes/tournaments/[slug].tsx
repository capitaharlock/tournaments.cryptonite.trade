import { createResource, Show, onCleanup } from "solid-js";
import { useParams } from "@solidjs/router";
import { Title } from "@solidjs/meta";
import { fetchTournament, fetchRankings } from "../../services/api";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import Countdown from "../../components/tournament/Countdown";
import RankingTable from "../../components/tournament/RankingTable";

export default function TournamentDetail() {
  const params = useParams<{ slug: string }>();
  const [tournament] = createResource(() => params.slug, fetchTournament);
  const [rankings, { refetch }] = createResource(
    () => tournament()?.id,
    (id) => (id ? fetchRankings(id, 100) : Promise.resolve([]))
  );

  // Auto-refresh rankings every 30s for active tournaments
  const interval = setInterval(() => {
    if (tournament()?.status === "active") refetch();
  }, 30000);
  onCleanup(() => clearInterval(interval));

  const isLive = () => tournament()?.status === "active";
  const isRegistering = () => tournament()?.status === "registration";
  const isFinished = () => tournament()?.status === "finished";

  return (
    <>
      <Title>{tournament()?.name || "Tournament"} — Cryptonite</Title>
      <Header />

      <main class="max-w-6xl mx-auto px-4 py-6">
        <Show when={tournament()} fallback={
          <div class="text-center py-16 text-gray-500">Loading tournament...</div>
        }>
          {(t) => (
            <>
              {/* ─── Header ─── */}
              <div class="flex items-start justify-between mb-6">
                <div>
                  <div class="flex items-center gap-3 mb-1">
                    <h1 class="text-2xl font-bold text-white">{t().name}</h1>
                    <Show when={isLive()}>
                      <span class="flex items-center gap-1 text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded">
                        <span class="relative flex h-2 w-2">
                          <span class="animate-ping absolute h-full w-full rounded-full bg-green-400 opacity-75" />
                          <span class="relative rounded-full h-2 w-2 bg-green-500" />
                        </span>
                        LIVE
                      </span>
                    </Show>
                    <Show when={isRegistering()}>
                      <span class="text-xs bg-green-500/10 text-green-400 px-2 py-0.5 rounded">REGISTRATION OPEN</span>
                    </Show>
                    <Show when={isFinished()}>
                      <span class="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded">FINISHED</span>
                    </Show>
                  </div>
                  <p class="text-gray-400 text-sm">{t().description}</p>
                </div>
                <Show when={isRegistering() && t().spots_available > 0}>
                  <a
                    href={`/checkout/${t().slug}`}
                    class="px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white font-bold rounded-md transition flex-shrink-0"
                  >
                    Join — ${t().entry_fee}
                  </a>
                </Show>
              </div>

              {/* ─── Stats bar ─── */}
              <div class="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                <Stat label="Account Size" value={`$${Number(t().account_size).toLocaleString()}`} />
                <Stat label="Players" value={`${t().reserved_spots} / ${t().total_spots}`} />
                <Stat label="Entry Fee" value={`$${t().entry_fee}`} />
                <Stat label="Max Drawdown" value={`${t().max_drawdown_percentage}%`} />
                <div class="bg-gray-900 border border-gray-800 rounded-lg p-3">
                  <Show when={isLive()}>
                    <Countdown targetDate={t().ends_at} label="Ends in" />
                  </Show>
                  <Show when={isRegistering()}>
                    <Countdown targetDate={t().starts_at} label="Starts in" />
                  </Show>
                  <Show when={isFinished()}>
                    <p class="text-gray-500 text-xs">Finished</p>
                    <p class="text-white text-sm font-medium">Completed</p>
                  </Show>
                </div>
              </div>

              {/* ─── Prize breakdown ─── */}
              <div class="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
                <h2 class="text-sm font-semibold text-gray-400 mb-3">PRIZES</h2>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {(t().prizes as any[]).map((p) => (
                    <div class="bg-black rounded px-3 py-2">
                      <p class="text-green-400 font-mono text-xs">
                        #{p.rank_from}{p.rank_to > p.rank_from ? `–${p.rank_to}` : ""}
                      </p>
                      <p class="text-white text-sm font-medium mt-0.5">{p.label || p.type}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* ─── Rankings ─── */}
              <div class="mb-6">
                <div class="flex items-center justify-between mb-3">
                  <h2 class="text-sm font-semibold text-gray-400">
                    {isLive() ? "LIVE RANKINGS" : isFinished() ? "FINAL RANKINGS" : "REGISTERED PARTICIPANTS"}
                  </h2>
                  <Show when={isLive()}>
                    <span class="text-xs text-gray-600">Auto-refreshes every 30s</span>
                  </Show>
                </div>

                <div class="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
                  <Show
                    when={rankings() && rankings()!.length > 0}
                    fallback={
                      <div class="text-center py-12 text-gray-600 text-sm">
                        {isRegistering() ? "Rankings will appear when the tournament starts" : "No participants yet"}
                      </div>
                    }
                  >
                    <RankingTable rankings={rankings()!} prizes={t().prizes as any} />
                  </Show>
                </div>
              </div>

              {/* ─── Entry CTA (bottom) ─── */}
              <Show when={isRegistering() && t().spots_available > 0}>
                <div class="text-center py-6 bg-gray-900 border border-gray-800 rounded-lg">
                  <p class="text-gray-400 mb-3">{t().spots_available} spots remaining</p>
                  <a
                    href={`/checkout/${t().slug}`}
                    class="inline-block px-8 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg text-lg transition"
                  >
                    Join This Tournament — ${t().entry_fee}
                  </a>
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

function Stat(props: { label: string; value: string }) {
  return (
    <div class="bg-gray-900 border border-gray-800 rounded-lg p-3">
      <p class="text-gray-500 text-xs">{props.label}</p>
      <p class="text-white text-sm font-medium">{props.value}</p>
    </div>
  );
}
