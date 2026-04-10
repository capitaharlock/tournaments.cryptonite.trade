import { createResource, For, Show, createSignal, createMemo } from "solid-js";
import { A } from "@solidjs/router";
import { Title } from "@solidjs/meta";
import { fetchTournaments, fetchRankings } from "../services/api";
import { generateMockRankings } from "../services/mockData";
import type { Tournament, RankingEntry } from "../types/tournament";
import Header from "../components/layout/Header";
import Countdown from "../components/tournament/Countdown";
import MiniRanking from "../components/tournament/MiniRanking";

export default function Home() {
  const [active] = createResource(() => fetchTournaments("active"));
  const [registering] = createResource(() => fetchTournaments("registration"));
  const [scheduled] = createResource(() => fetchTournaments("scheduled"));
  const [finished] = createResource(() => fetchTournaments("finished"));

  const liveTournaments = () => [...(active() || []), ...(registering() || [])];
  const featured = () => liveTournaments()[0] || null;
  const others = () => liveTournaments().slice(1);

  return (
    <>
      <Title>Cryptonite Tournaments — Compete, Trade, Win</Title>
      <Header />

      <div class="min-h-screen">

        {/* ═══════════════════════════════════════════════════════════
            HERO — Featured tournament (full width, big impact)
            Inspired by Bybit trading competitions
        ═══════════════════════════════════════════════════════════ */}
        <Show when={featured()}>
          {(t) => <HeroTournament tournament={t()} />}
        </Show>

        {/* ═══════════════════════════════════════════════════════════
            LOBBY — All tournaments grid (DraftKings style)
        ═══════════════════════════════════════════════════════════ */}
        <div class="px-4 lg:px-8 py-6">

          {/* Other live tournaments */}
          <Show when={others().length > 0}>
            <section class="mb-8">
              <div class="flex items-center gap-2 mb-4">
                <span class="relative flex h-2 w-2">
                  <span class="animate-ping absolute h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span class="relative rounded-full h-2 w-2 bg-green-500" />
                </span>
                <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider">Also Open</h2>
              </div>
              <div class="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                <For each={others()}>
                  {(t) => <LobbyCard tournament={t} />}
                </For>
              </div>
            </section>
          </Show>

          {/* Upcoming */}
          <Show when={scheduled() && scheduled()!.length > 0}>
            <section class="mb-8">
              <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Coming Soon</h2>
              <div class="space-y-2">
                <For each={scheduled()}>
                  {(t) => (
                    <A
                      href={`/tournaments/${t.slug}`}
                      class="flex items-center justify-between bg-gray-900/50 border border-gray-800/50 rounded-lg px-5 py-3 hover:border-gray-700 transition group"
                    >
                      <div class="flex items-center gap-4">
                        <div class="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-lg">
                          {t.name.includes("Sprint") ? "⚡" : t.name.includes("Classic") ? "🏆" : "🏔️"}
                        </div>
                        <div>
                          <span class="font-medium text-white group-hover:text-green-400 transition">{t.name}</span>
                          <p class="text-xs text-gray-500">
                            ${Number(t.account_size).toLocaleString()} • {t.total_spots} spots • ${t.entry_fee}
                          </p>
                        </div>
                      </div>
                      <Countdown targetDate={t.registration_opens_at} label="Registration in" />
                    </A>
                  )}
                </For>
              </div>
            </section>
          </Show>

          {/* Recent results */}
          <Show when={finished() && finished()!.length > 0}>
            <section class="mb-8">
              <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Recent Results</h2>
              <div class="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
                <For each={finished()!.slice(0, 6)}>
                  {(t) => (
                    <A
                      href={`/tournaments/${t.slug}`}
                      class="flex items-center gap-3 bg-gray-900/30 border border-gray-800/30 rounded-lg px-4 py-3 hover:border-gray-700 transition"
                    >
                      <div class="flex-1">
                        <span class="text-sm text-white">{t.name}</span>
                        <p class="text-xs text-gray-600">{t.reserved_spots} participants</p>
                      </div>
                      <span class="text-xs text-gray-600">View →</span>
                    </A>
                  )}
                </For>
              </div>
            </section>
          </Show>

          {/* How it works — minimal */}
          <section class="mb-8 border-t border-gray-800/50 pt-8">
            <div class="grid md:grid-cols-3 gap-8 text-center text-sm max-w-3xl mx-auto">
              <div>
                <div class="w-8 h-8 rounded-full bg-green-600/20 text-green-400 font-bold text-sm flex items-center justify-center mx-auto mb-2">1</div>
                <p class="text-gray-400"><span class="text-white font-medium">Pick</span> a tournament and pay entry</p>
              </div>
              <div>
                <div class="w-8 h-8 rounded-full bg-green-600/20 text-green-400 font-bold text-sm flex items-center justify-center mx-auto mb-2">2</div>
                <p class="text-gray-400"><span class="text-white font-medium">Trade</span> crypto on the same platform</p>
              </div>
              <div>
                <div class="w-8 h-8 rounded-full bg-green-600/20 text-green-400 font-bold text-sm flex items-center justify-center mx-auto mb-2">3</div>
                <p class="text-gray-400"><span class="text-white font-medium">Win</span> cash, challenges, and retries</p>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer class="border-t border-gray-800/50 py-6 text-center text-gray-600 text-xs">
          © {new Date().getFullYear()} Cryptonite. All rights reserved.
        </footer>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// HERO — Full-width featured tournament with live ranking
// ═══════════════════════════════════════════════════════════════════════════

function HeroTournament(props: { tournament: Tournament }) {
  const t = () => props.tournament;
  const isLive = () => t().status === "active";
  const isReg = () => t().status === "registration";

  // Fetch real rankings, fall back to mock for visual testing
  const [apiRankings] = createResource(() => t().id, (id) => fetchRankings(id, 15));
  const rankings = createMemo(() => {
    const real = apiRankings();
    if (real && real.length > 0) return real;
    return generateMockRankings(15, t().name.includes("Sprint") ? 6 : 8);
  });

  // Prize pool display
  const totalPrizes = () => {
    const prizes = t().prizes as any[];
    const cashPrize = prizes.find(p => p.type === "cash");
    return cashPrize ? `$${cashPrize.value}` : "Prizes";
  };

  const spotsProgress = () => {
    return (t().reserved_spots / t().total_spots) * 100;
  };

  return (
    <section class="relative border-b border-gray-800">
      {/* Gradient overlay */}
      <div class="absolute inset-0 bg-gradient-to-b from-green-900/10 via-transparent to-transparent pointer-events-none" />

      <div class="relative px-4 lg:px-8 py-8">
        <div class="flex flex-col lg:flex-row gap-6">

          {/* Left: Tournament info */}
          <div class="flex-1 min-w-0">
            {/* Badge */}
            <div class="flex items-center gap-2 mb-3">
              <Show when={isLive()}>
                <span class="flex items-center gap-1.5 text-xs font-medium text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full">
                  <span class="relative flex h-2 w-2">
                    <span class="animate-ping absolute h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span class="relative rounded-full h-2 w-2 bg-green-500" />
                  </span>
                  LIVE NOW
                </span>
              </Show>
              <Show when={isReg()}>
                <span class="text-xs font-medium text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full">
                  REGISTRATION OPEN
                </span>
              </Show>
              <span class="text-xs text-gray-500">
                {t().name.includes("Sprint") ? "⚡ 3-Day Sprint" : t().name.includes("Classic") ? "🏆 7-Day Classic" : "🏔️ 30-Day Marathon"}
              </span>
            </div>

            {/* Title */}
            <h1 class="text-3xl lg:text-4xl font-bold text-white mb-2">{t().name}</h1>
            <p class="text-gray-400 mb-6">{t().description}</p>

            {/* Stats grid */}
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div class="bg-gray-900/60 border border-gray-800/60 rounded-lg p-3">
                <p class="text-xs text-gray-500 mb-0.5">Prize Pool</p>
                <p class="text-xl font-bold text-white">{totalPrizes()}</p>
                <p class="text-xs text-green-400">+ challenges & retries</p>
              </div>
              <div class="bg-gray-900/60 border border-gray-800/60 rounded-lg p-3">
                <p class="text-xs text-gray-500 mb-0.5">Entry Fee</p>
                <p class="text-xl font-bold text-white">${t().entry_fee}</p>
              </div>
              <div class="bg-gray-900/60 border border-gray-800/60 rounded-lg p-3">
                <p class="text-xs text-gray-500 mb-0.5">Account</p>
                <p class="text-xl font-bold text-white">${Number(t().account_size).toLocaleString()}</p>
              </div>
              <div class="bg-gray-900/60 border border-gray-800/60 rounded-lg p-3">
                <Show when={isLive()}>
                  <Countdown targetDate={t().ends_at} label="Ends in" />
                </Show>
                <Show when={isReg()}>
                  <Countdown targetDate={t().starts_at} label="Starts in" />
                </Show>
              </div>
            </div>

            {/* Spots progress bar */}
            <div class="mb-6">
              <div class="flex items-center justify-between text-xs mb-1.5">
                <span class="text-gray-400">{t().reserved_spots} / {t().total_spots} spots filled</span>
                <span class="text-gray-500">{t().spots_available} remaining</span>
              </div>
              <div class="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  class="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-500"
                  style={`width: ${Math.max(spotsProgress(), 2)}%`}
                />
              </div>
            </div>

            {/* CTA */}
            <div class="flex items-center gap-3">
              <Show when={isReg() && t().spots_available > 0}>
                <A
                  href={`/checkout/${t().slug}`}
                  class="px-8 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg text-lg transition shadow-lg shadow-green-600/20"
                >
                  Join Now — ${t().entry_fee}
                </A>
              </Show>
              <A
                href={`/tournaments/${t().slug}`}
                class="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition"
              >
                {isLive() ? "Watch Live" : "View Details"}
              </A>
            </div>

            {/* Prizes strip */}
            <div class="flex flex-wrap gap-2 mt-6">
              {(t().prizes as any[]).map((p) => (
                <span class="text-xs bg-gray-800/60 border border-gray-700/40 px-2.5 py-1 rounded text-gray-400">
                  <span class="text-green-400 font-mono">#{p.rank_from}{p.rank_to > p.rank_from ? `–${p.rank_to}` : ""}</span>
                  {" "}{p.label || p.type}
                </span>
              ))}
            </div>
          </div>

          {/* Right: Live ranking column */}
          <div class="w-full lg:w-80 xl:w-96 flex-shrink-0">
            <div class="bg-gray-900/40 border border-gray-800/60 rounded-lg overflow-hidden h-full">
              <div class="px-4 py-3 border-b border-gray-800/60 flex items-center justify-between">
                <h3 class="text-sm font-semibold text-white">
                  {isLive() ? "Live Ranking" : "Preview"}
                </h3>
                <span class="text-xs text-gray-600">Profit %</span>
              </div>
              <div class="p-2 max-h-[500px] overflow-y-auto">
                <MiniRanking
                  rankings={rankings()}
                  tournamentSlug={t().slug}
                  maxRows={15}
                />
              </div>
              <A
                href={`/tournaments/${t().slug}`}
                class="block text-center py-2.5 text-xs text-gray-500 hover:text-white border-t border-gray-800/60 transition"
              >
                View full ranking →
              </A>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// LOBBY CARD — Compact tournament card for the grid
// ═══════════════════════════════════════════════════════════════════════════

function LobbyCard(props: { tournament: Tournament }) {
  const t = () => props.tournament;
  const isLive = () => t().status === "active";
  const isReg = () => t().status === "registration";

  const [apiRankings] = createResource(() => t().id, (id) => fetchRankings(id, 8));
  const rankings = createMemo(() => {
    const real = apiRankings();
    if (real && real.length > 0) return real;
    return generateMockRankings(8, t().name.includes("Sprint") ? 5 : 7);
  });

  return (
    <div class="bg-gray-900/40 border border-gray-800/50 rounded-lg overflow-hidden hover:border-gray-700/50 transition group">
      {/* Header */}
      <div class="px-4 py-3 border-b border-gray-800/50">
        <div class="flex items-center justify-between mb-1">
          <div class="flex items-center gap-2">
            <span class="text-lg">
              {t().name.includes("Sprint") ? "⚡" : t().name.includes("Classic") ? "🏆" : "🏔️"}
            </span>
            <h3 class="font-semibold text-white">{t().name}</h3>
          </div>
          <Show when={isLive()}>
            <span class="flex items-center gap-1 text-xs text-green-400">
              <span class="relative flex h-1.5 w-1.5">
                <span class="animate-ping absolute h-full w-full rounded-full bg-green-400 opacity-75" />
                <span class="relative rounded-full h-1.5 w-1.5 bg-green-500" />
              </span>
              LIVE
            </span>
          </Show>
          <Show when={isReg()}>
            <span class="text-xs text-green-400">OPEN</span>
          </Show>
        </div>
        <div class="flex items-center justify-between text-xs text-gray-500">
          <span>${Number(t().account_size).toLocaleString()} • {t().reserved_spots}/{t().total_spots}</span>
          <Show when={isLive()}>
            <Countdown targetDate={t().ends_at} />
          </Show>
          <Show when={isReg()}>
            <Countdown targetDate={t().starts_at} />
          </Show>
        </div>
      </div>

      {/* Mini ranking */}
      <div class="p-2 min-h-[180px]">
        <MiniRanking rankings={rankings()} tournamentSlug={t().slug} maxRows={8} />
      </div>

      {/* CTA */}
      <Show when={isReg() && t().spots_available > 0}>
        <A
          href={`/checkout/${t().slug}`}
          class="block text-center py-2.5 bg-green-600 hover:bg-green-500 text-white font-bold text-sm transition"
        >
          Join — ${t().entry_fee}
        </A>
      </Show>
      <Show when={isLive() || !isReg()}>
        <A
          href={`/tournaments/${t().slug}`}
          class="block text-center py-2.5 bg-gray-800/50 hover:bg-gray-700 text-gray-400 text-sm transition"
        >
          {isLive() ? "Watch Live →" : "View Details →"}
        </A>
      </Show>
    </div>
  );
}
