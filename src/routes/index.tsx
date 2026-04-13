import { createResource, createSignal, onCleanup, onMount, For, Show, createMemo } from "solid-js";
import { A } from "@solidjs/router";
import { Title } from "@solidjs/meta";
import { fetchTournaments, fetchRankings } from "../services/api";
import { generateMockRankings } from "../services/mockData";
import type { Tournament } from "../types/tournament";
import Header from "../components/layout/Header";
import FlipClock from "../components/tournament/FlipClock";
import MiniRanking from "../components/tournament/MiniRanking";
import TournamentProgress from "../components/tournament/TournamentProgress";
import TournamentHero from "../components/tournament/TournamentHero";

export default function Home() {
  const [active] = createResource(() => fetchTournaments("active"));
  const [registering] = createResource(() => fetchTournaments("registration"));
  const [scheduled] = createResource(() => fetchTournaments("scheduled"));
  const [finished] = createResource(() => fetchTournaments("finished"));

  const allLive = createMemo(() => {
    const all = [...(active() || []), ...(registering() || [])];
    return all.sort((a, b) => new Date(a.ends_at).getTime() - new Date(b.ends_at).getTime());
  });

  const primary = () => allLive()[0] || null;
  const secondary = () => allLive()[1] || null;
  const rest = () => allLive().slice(2);

  return (
    <>
      <Title>Cryptonite Tournaments — Compete, Trade, Win</Title>
      <Header />

      <div class="min-h-screen bg-[#1a1a1a]">
        <div class="flex flex-col lg:flex-row min-h-[calc(100vh-48px)] gap-4 p-4">

          {/* LEFT (42%) */}
          <div class="lg:w-[42%] flex-shrink-0">
            <Show when={primary()} fallback={<EmptyPanel />}>
              {(t) => <TournamentPanel tournament={t()} maxRanks={10} />}
            </Show>
          </div>

          {/* MIDDLE (30%) */}
          <div class="lg:w-[30%] flex-shrink-0">
            <Show when={secondary()} fallback={<EmptyPanel />}>
              {(t) => <TournamentPanel tournament={t()} maxRanks={10} />}
            </Show>
          </div>

          {/* RIGHT (28%) */}
          <div class="lg:flex-1 flex flex-col gap-4">
            <UpcomingBox
              rest={rest()}
              registering={(registering() || []).filter(r => !allLive().slice(0, 2).some(l => l.id === r.id))}
              scheduled={scheduled() || []}
            />
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            SECOND ROW — fills the bottom space
        ═══════════════════════════════════════════════════════════ */}
        <div class="flex flex-col lg:flex-row gap-4 px-4 pb-4">
          {/* LEFT: Prize Vault (big box) */}
          <div class="lg:w-[42%]">
            <PrizeVaultBox />
          </div>

          {/* MIDDLE: Hall of Fame */}
          <div class="lg:w-[30%]">
            <HallOfFameBox />
          </div>

          {/* RIGHT: Recent Results */}
          <div class="lg:flex-1">
            <RecentResultsBox finished={finished() || []} />
          </div>
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TOURNAMENT PANEL
// ═══════════════════════════════════════════════════════════════════════════

function TournamentPanel(props: { tournament: Tournament; maxRanks: number }) {
  const t = () => props.tournament;
  const isReg = () => t().status === "registration";

  const [apiRankings] = createResource(() => t().id, (id) => fetchRankings(id, props.maxRanks));
  const rankings = createMemo(() => {
    const real = apiRankings();
    if (real && real.length > 0) return real;
    return generateMockRankings(props.maxRanks, t().name.includes("Sprint") ? 6 : 8);
  });

  return (
    <div class="bg-black rounded-xl flex flex-col overflow-hidden shadow-xl shadow-black/50">
      {/* Hero — visual tournament identity */}
      <TournamentHero tournament={t()} />

      {/* Rankings */}
      <div>
        <MiniRanking
          rankings={rankings()}
          tournamentSlug={t().slug}
          maxRows={props.maxRanks}
          accountSize={Number(t().account_size)} prizes={t().prizes as any}
        />
      </div>

      {/* Footer */}
      <div class="flex items-center justify-between px-4 py-2.5 bg-[#0a0a0a] border-t border-white/[0.03]">
        <A
          href={`/tournaments/${t().slug}`}
          class="text-[11px] text-gray-500 hover:text-gray-300 transition"
        >
          +{t().total_spots - props.maxRanks} more participants
        </A>

        <div class="flex items-center gap-2">
          <Show when={isReg() && t().spots_available > 0}>
            <A href={`/checkout/${t().slug}`} class="px-3 py-1 bg-green-600 hover:bg-green-500 text-white text-[10px] font-bold rounded transition">
              Join ${t().entry_fee}
            </A>
          </Show>
          <A href={`/tournaments/${t().slug}`} class="text-[11px] text-green-500 hover:text-green-400 font-medium transition">
            View Full Tournament →
          </A>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// AGENDA ROW — Horizontal row for right column (no rankings)
// ═══════════════════════════════════════════════════════════════════════════

function AgendaRow(props: { tournament: Tournament; isLive?: boolean; isRegistering?: boolean }) {
  const t = () => props.tournament;
  const icon = () => t().name.includes("Sprint") ? "⚡" : t().name.includes("Classic") ? "🏆" : "🏔️";
  const startDate = () => new Date(t().starts_at);
  const durationDays = () => Math.round((new Date(t().ends_at).getTime() - new Date(t().starts_at).getTime()) / 86400000);
  const isReg = () => t().status === "registration";
  const canJoin = () => isReg() && t().spots_available > 0;

  return (
    <div class="px-4 py-3 border-b border-[#1a1a1a] hover:bg-[#0d0d0d] transition">
      {/* Row 1: Icon + Name + Duration + Status */}
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center gap-2">
          <span class="text-base">{icon()}</span>
          <span class="text-sm font-semibold text-white">{t().name}</span>
          <span class="text-[10px] text-gray-600 bg-[#1a1a1a] px-1.5 py-0.5 rounded">{durationDays()}d</span>
        </div>
        <div class="flex items-center gap-2">
          <Show when={props.isLive}>
            <span class="flex items-center gap-1 text-[10px] text-green-400">
              <span class="relative flex h-1.5 w-1.5"><span class="animate-ping absolute h-full w-full rounded-full bg-green-400 opacity-75" /><span class="relative rounded-full h-1.5 w-1.5 bg-green-500" /></span>
              Live
            </span>
          </Show>
          <Show when={isReg()}>
            <span class="text-[10px] text-green-400">Open</span>
          </Show>
          <Show when={!props.isLive && !isReg()}>
            <span class="text-[10px] text-gray-600">
              {startDate().toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          </Show>
        </div>
      </div>

      {/* Row 2: Stats + Prizes + CTA */}
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3 text-[10px] text-gray-500">
          <span>${Number(t().account_size).toLocaleString()}</span>
          <span class="text-gray-700">•</span>
          <span>{t().reserved_spots}/{t().total_spots} spots</span>
          <span class="text-gray-700">•</span>
          <span class="text-yellow-400/70">
            {(t().prizes as any[])[0]?.label || "Prizes"}
          </span>
        </div>

        <div class="flex items-center gap-2">
          <Show when={props.isLive}>
            <FlipClock targetDate={t().ends_at} size="sm" />
          </Show>
          <Show when={isReg() && !props.isLive}>
            <FlipClock targetDate={t().starts_at} size="sm" />
          </Show>
          <Show when={!props.isLive && !isReg()}>
            <FlipClock targetDate={t().registration_opens_at} size="sm" />
          </Show>

          <Show when={canJoin()}>
            <A href={`/checkout/${t().slug}`} class="px-3 py-1 bg-green-600 hover:bg-green-500 text-white text-[10px] font-bold rounded transition">
              Join ${t().entry_fee}
            </A>
          </Show>
          <Show when={!canJoin()}>
            <A href={`/tournaments/${t().slug}`} class="text-[10px] text-gray-600 hover:text-white transition">
              {props.isLive ? "Watch →" : "Details →"}
            </A>
          </Show>
        </div>
      </div>
    </div>
  );
}

function EmptyPanel() {
  return (
    <div class="bg-black rounded-xl flex items-center justify-center h-full min-h-[300px] shadow-lg shadow-black/30">
      <div class="text-center">
        <p class="text-gray-600 text-sm mb-2">No active tournaments</p>
        <A href="/schedule" class="text-xs text-green-500 hover:text-green-400">View schedule →</A>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// UPCOMING TOURNAMENTS BOX — boxed with header + footer
// ═══════════════════════════════════════════════════════════════════════════

function UpcomingBox(props: { rest: Tournament[]; registering: Tournament[]; scheduled: Tournament[] }) {
  const [utcTime, setUtcTime] = createSignal("");
  let interval: ReturnType<typeof setInterval>;

  onMount(() => {
    const update = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().split(" ").slice(4, 5)[0] + " UTC");
    };
    update();
    interval = setInterval(update, 1000);
  });
  onCleanup(() => clearInterval(interval));

  const totalScheduled = () => props.rest.length + props.registering.length + props.scheduled.length;

  return (
    <div class="bg-black rounded-xl overflow-hidden shadow-xl shadow-black/50 flex flex-col">
      {/* Header */}
      <div class="px-4 py-3 border-b border-[#1a1a1a] bg-gradient-to-r from-green-600/20 to-emerald-500/5 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <svg class="w-4 h-4 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <h2 class="text-sm font-bold text-white">Upcoming Tournaments</h2>
        </div>
        <span class="text-[10px] text-green-400 font-bold bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
          {totalScheduled()} scheduled
        </span>
      </div>

      {/* Rows */}
      <div>
        <For each={props.rest}>
          {(t) => <AgendaRow tournament={t} isLive />}
        </For>
        <For each={props.registering}>
          {(t) => <AgendaRow tournament={t} isRegistering />}
        </For>
        <For each={props.scheduled}>
          {(t) => <AgendaRow tournament={t} />}
        </For>
        <Show when={totalScheduled() === 0}>
          <div class="text-center py-10 text-gray-700 text-xs">No upcoming tournaments</div>
        </Show>
      </div>

      {/* Footer — live UTC clock + refresh tag */}
      <div class="px-4 py-2.5 border-t border-[#1a1a1a] bg-[#0a0a0a] flex items-center justify-between">
        <div class="flex items-center gap-1.5 text-[10px] text-gray-600">
          <span class="flex h-1.5 w-1.5 rounded-full bg-green-500/60" />
          <span>Updated live</span>
        </div>
        <span class="text-[10px] text-gray-500 font-mono">{utcTime()}</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PRIZE VAULT — total prize pool + breakdown + trust signal
// ═══════════════════════════════════════════════════════════════════════════

function PrizeVaultBox() {
  // These will become real API data later
  const totalCash = 2400;
  const totalChallenges = 42;
  const totalQualify = 48;
  const totalRetries = 120;
  const totalValue = 10000;

  return (
    <div class="bg-black rounded-xl overflow-hidden shadow-xl shadow-black/50">
      <div class="px-5 py-3 border-b border-[#1a1a1a] bg-gradient-to-r from-yellow-600/20 to-orange-500/5 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <svg class="w-4 h-4 text-yellow-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <h2 class="text-sm font-bold text-white">Prize Vault</h2>
        </div>
        <span class="text-[10px] text-yellow-400 font-medium">Guaranteed • Next payout</span>
      </div>

      <div class="p-5">
        {/* Big total */}
        <div class="text-center mb-5">
          <p class="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Total value in upcoming tournaments</p>
          <p class="text-5xl font-black text-yellow-300 drop-shadow-lg">${totalValue.toLocaleString()}+</p>
        </div>

        {/* Breakdown grid */}
        <div class="grid grid-cols-4 gap-2 mb-4">
          <VaultStat icon="cash" label="Cash" value={`$${totalCash}`} />
          <VaultStat icon="challenge" label="Challenges" value={`${totalChallenges}×`} />
          <VaultStat icon="qualify" label="Qualify" value={`${totalQualify}×`} />
          <VaultStat icon="retry" label="Retries" value={`${totalRetries}×`} />
        </div>

        {/* Trust signal */}
        <div class="bg-[#0a0a0a] rounded-lg px-4 py-3 flex items-center justify-between border border-gray-800/60">
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <div>
              <p class="text-xs text-white font-medium">Funds held in escrow</p>
              <p class="text-[10px] text-gray-600">Verified crypto vault • Payouts guaranteed</p>
            </div>
          </div>
          <span class="text-[10px] text-gray-700">Verify →</span>
        </div>
      </div>
    </div>
  );
}

function VaultStat(props: { icon: string; label: string; value: string }) {
  const iconColor: Record<string, string> = {
    cash: "text-yellow-400",
    challenge: "text-blue-400",
    qualify: "text-purple-400",
    retry: "text-gray-400",
  };
  return (
    <div class="bg-[#0a0a0a] rounded-lg p-2 text-center border border-gray-800/40">
      <p class={`text-xs ${iconColor[props.icon] || "text-gray-400"} mb-0.5`}>◆</p>
      <p class="text-sm font-bold text-white">{props.value}</p>
      <p class="text-[9px] text-gray-600">{props.label}</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// HALL OF FAME — top winners by tournament wins
// ═══════════════════════════════════════════════════════════════════════════

const HALL_OF_FAME = [
  { nickname: "cryptowolf", wins: 14, earned: 1850, country: "US" },
  { nickname: "luna_trader", wins: 11, earned: 1420, country: "GB" },
  { nickname: "btc_hunter", wins: 9, earned: 1100, country: "DE" },
  { nickname: "eth_maxi", wins: 8, earned: 980, country: "CA" },
  { nickname: "sol_rider", wins: 7, earned: 850, country: "AU" },
];

function HallOfFameBox() {
  return (
    <div class="bg-black rounded-xl overflow-hidden shadow-xl shadow-black/50">
      <div class="px-4 py-3 border-b border-[#1a1a1a] bg-gradient-to-r from-purple-600/20 to-pink-500/5 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <svg class="w-4 h-4 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <circle cx="12" cy="8" r="7" />
            <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
          </svg>
          <h2 class="text-sm font-bold text-white">Hall of Fame</h2>
        </div>
        <span class="text-[10px] text-gray-600">Top winners</span>
      </div>

      <div class="p-2">
        <For each={HALL_OF_FAME}>
          {(entry, i) => (
            <div class="flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-white/[0.03] transition">
              <div class={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                i() === 0 ? "bg-yellow-400/10 border border-yellow-400/30 text-yellow-400" :
                i() === 1 ? "bg-gray-300/10 border border-gray-400/30 text-gray-300" :
                i() === 2 ? "bg-orange-400/10 border border-orange-400/30 text-orange-400" :
                "bg-[#1a1a1a] border border-gray-700/40 text-gray-500"
              }`}>
                {i() + 1}
              </div>
              <span class="flex-1 text-sm text-white font-medium truncate">{entry.nickname}</span>
              <div class="text-right">
                <p class="text-xs text-green-400 font-bold">{entry.wins} wins</p>
                <p class="text-[10px] text-gray-600">${entry.earned.toLocaleString()} earned</p>
              </div>
            </div>
          )}
        </For>
      </div>

      <div class="border-t border-[#1a1a1a] px-4 py-2 bg-[#0a0a0a] text-center">
        <span class="text-[10px] text-gray-600">Based on last 30 days</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// RECENT RESULTS — last finished tournaments with podium
// ═══════════════════════════════════════════════════════════════════════════

function RecentResultsBox(props: { finished: Tournament[] }) {
  const [expanded, setExpanded] = createSignal<string | null>(null);

  // Mock podium data (real data will come from ranking API later)
  const mockPodium = (tournamentId: string) => [
    { rank: 1, nickname: "cryptowolf", prize: "$100 Cash" },
    { rank: 2, nickname: "luna_trader", prize: "Free Challenge" },
    { rank: 3, nickname: "btc_hunter", prize: "Qualify Account" },
  ];

  return (
    <div class="bg-black rounded-xl overflow-hidden shadow-xl shadow-black/50">
      <div class="px-4 py-3 border-b border-[#1a1a1a] bg-gradient-to-r from-blue-600/20 to-cyan-500/5 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <svg class="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
          </svg>
          <h2 class="text-sm font-bold text-white">Recent Results</h2>
        </div>
        <span class="text-[10px] text-gray-600">Last {Math.min(props.finished.length, 10)}</span>
      </div>

      <div>
        <Show when={props.finished.length > 0} fallback={
          <div class="text-center py-10 text-gray-700 text-xs">No finished tournaments yet</div>
        }>
          <For each={props.finished.slice(0, 10)}>
            {(t) => {
              const isExpanded = () => expanded() === t.id;
              const podium = mockPodium(t.id);
              return (
                <div class="border-b border-[#1a1a1a] last:border-0">
                  <button
                    class="w-full px-4 py-3 hover:bg-white/[0.02] transition text-left"
                    onClick={() => setExpanded(isExpanded() ? null : t.id)}
                  >
                    <div class="flex items-center justify-between mb-1.5">
                      <span class="text-sm font-medium text-white">{t.name}</span>
                      <span class="text-[10px] text-gray-600">
                        {new Date(t.ends_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                    {/* Top 3 podium */}
                    <div class="flex items-center gap-3 text-[11px]">
                      <For each={podium}>
                        {(p) => (
                          <div class="flex items-center gap-1">
                            <span class={`${
                              p.rank === 1 ? "text-yellow-400" :
                              p.rank === 2 ? "text-gray-300" :
                              "text-orange-400"
                            }`}>
                              {p.rank === 1 ? "🥇" : p.rank === 2 ? "🥈" : "🥉"}
                            </span>
                            <span class="text-gray-400">{p.nickname}</span>
                          </div>
                        )}
                      </For>
                    </div>
                  </button>

                  {/* Expanded: all winners */}
                  <Show when={isExpanded()}>
                    <div class="bg-[#0a0a0a] px-4 py-3 border-t border-[#1a1a1a]">
                      <p class="text-[10px] text-gray-600 uppercase mb-2">All Winners</p>
                      <For each={podium}>
                        {(p) => (
                          <div class="flex items-center justify-between py-1 text-xs">
                            <span class="text-gray-400">#{p.rank} {p.nickname}</span>
                            <span class="text-green-400">{p.prize}</span>
                          </div>
                        )}
                      </For>
                      <A href={`/tournaments/${t.slug}`} class="block mt-2 text-[11px] text-green-500 hover:text-green-400">
                        View full results →
                      </A>
                    </div>
                  </Show>
                </div>
              );
            }}
          </For>
        </Show>
      </div>
    </div>
  );
}
