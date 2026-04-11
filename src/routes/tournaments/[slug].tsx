import { createResource, Show, onCleanup, createMemo } from "solid-js";
import { useParams, A } from "@solidjs/router";
import { Title } from "@solidjs/meta";
import { fetchTournament, fetchRankings } from "../../services/api";
import type { Tournament } from "../../types/tournament";
import { generateMockRankings } from "../../services/mockData";
import Header from "../../components/layout/Header";
import FlipClock from "../../components/tournament/FlipClock";
import TournamentProgress from "../../components/tournament/TournamentProgress";
import RankingTable from "../../components/tournament/RankingTable";

export default function TournamentDetail() {
  const params = useParams<{ slug: string }>();
  const [tournament] = createResource(() => params.slug, fetchTournament);
  const [apiRankings, { refetch }] = createResource(
    () => tournament()?.id,
    (id) => (id ? fetchRankings(id, 100) : Promise.resolve([]))
  );

  const rankings = createMemo(() => {
    const real = apiRankings();
    if (real && real.length > 0) return real;
    return generateMockRankings(30, tournament()?.name?.includes("Sprint") ? 6 : 8);
  });

  const interval = setInterval(() => {
    if (tournament()?.status === "active") refetch();
  }, 30000);
  onCleanup(() => clearInterval(interval));

  const isLive = () => tournament()?.status === "active";
  const isReg = () => tournament()?.status === "registration";
  const isFinished = () => tournament()?.status === "finished";

  return (
    <>
      <Title>{tournament()?.name || "Tournament"} — Cryptonite</Title>
      <Header />

      <div class="min-h-screen bg-[#1a1a1a]">
        <Show when={tournament()} fallback={
          <div class="text-center py-16 text-gray-600">Loading...</div>
        }>
          {(t) => (
            <div class="p-4 max-w-6xl mx-auto space-y-4">

              {/* ═══ DETAIL HERO — bigger, more color, prominent countdown ═══ */}
              <DetailHero tournament={t()} />

              {/* ═══ MAIN CONTENT — 2 columns on desktop ═══ */}
              <div class="flex flex-col lg:flex-row gap-4">

                {/* LEFT — Rankings (main) */}
                <div class="flex-1">
                  <div class="bg-black rounded-xl overflow-hidden shadow-xl shadow-black/50">
                    {/* Rankings header */}
                    <div class="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a]">
                      <div class="flex items-center gap-2">
                        <h2 class="text-sm font-bold text-white">
                          {isLive() ? "Live Rankings" : isFinished() ? "Final Rankings" : "Participants"}
                        </h2>
                        <Show when={isLive()}>
                          <span class="flex items-center gap-1 text-[10px] text-green-400">
                            <span class="relative flex h-1.5 w-1.5">
                              <span class="animate-ping absolute h-full w-full rounded-full bg-green-400 opacity-75" />
                              <span class="relative rounded-full h-1.5 w-1.5 bg-green-500" />
                            </span>
                            Updates every 30s
                          </span>
                        </Show>
                      </div>
                      <span class="text-[10px] text-gray-600">
                        {rankings().length} of {t().total_spots} participants
                      </span>
                    </div>

                    {/* Rankings table */}
                    <Show
                      when={rankings().length > 0}
                      fallback={
                        <div class="text-center py-16 text-gray-700 text-sm">
                          {isReg() ? "Rankings appear when the tournament starts" : "No participants yet"}
                        </div>
                      }
                    >
                      <RankingTable rankings={rankings()} prizes={t().prizes as any} />
                    </Show>
                  </div>
                </div>

                {/* RIGHT — Sidebar info */}
                <div class="lg:w-72 flex flex-col gap-4">

                  {/* Join CTA */}
                  <Show when={isReg() && t().spots_available > 0}>
                    <div class="bg-black rounded-xl overflow-hidden shadow-xl shadow-black/50 p-5 text-center">
                      <p class="text-gray-400 text-sm mb-1">Ready to compete?</p>
                      <p class="text-white text-2xl font-black mb-3">${t().entry_fee}</p>
                      <A
                        href={`/checkout/${t().slug}`}
                        class="block w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition text-sm"
                      >
                        Join This Tournament
                      </A>
                      <p class="text-gray-600 text-[10px] mt-2">{t().spots_available} spots remaining</p>
                    </div>
                  </Show>

                  {/* Prize breakdown */}
                  <div class="bg-black rounded-xl overflow-hidden shadow-xl shadow-black/50">
                    <div class="px-4 py-3 border-b border-[#1a1a1a]">
                      <h3 class="text-sm font-bold text-white">Prize Breakdown</h3>
                    </div>
                    <div class="p-3 space-y-1.5">
                      {(t().prizes as any[]).map((p) => (
                        <div class="flex items-center justify-between py-2 px-3 bg-[#0a0a0a] rounded-lg">
                          <div class="flex items-center gap-2">
                            <span class="text-yellow-400 font-mono text-xs font-bold">
                              #{p.rank_from}{p.rank_to > p.rank_from ? `–${p.rank_to}` : ""}
                            </span>
                          </div>
                          <span class="text-sm text-white font-medium">{p.label || p.type}</span>
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

                  {/* Back to all */}
                  <A href="/" class="text-center text-xs text-gray-600 hover:text-white transition py-2">
                    ← All Tournaments
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

function DetailHero(props: { tournament: Tournament }) {
  const t = () => props.tournament;
  const isLive = () => t().status === "active";
  const isReg = () => t().status === "registration";
  const isFinished = () => t().status === "finished";
  const totalDays = () => Math.round((new Date(t().ends_at).getTime() - new Date(t().starts_at).getTime()) / 86400000);
  const isSprint = () => t().name.includes("Sprint");
  const isClassic = () => t().name.includes("Classic");
  const cashPrize = () => {
    const p = (t().prizes as any[]).find(p => p.type === "cash");
    return p ? p.value : null;
  };
  const spotsPercent = () => Math.max((t().reserved_spots / t().total_spots) * 100, 3);

  const bannerGradient = () =>
    isLive()
      ? isSprint()
        ? "from-green-600 via-emerald-500 to-teal-400"
        : isClassic()
        ? "from-blue-600 via-indigo-500 to-purple-400"
        : "from-orange-600 via-amber-500 to-yellow-400"
      : "from-gray-600 via-gray-500 to-gray-600";

  const glowColor = () =>
    isLive()
      ? isSprint() ? "from-green-500" : isClassic() ? "from-blue-500" : "from-orange-500"
      : "from-gray-500";

  return (
    <div class="bg-black rounded-xl overflow-hidden shadow-xl shadow-black/50">
      {/* ═══ Color banner — taller for detail page ═══ */}
      <div class={`relative h-14 bg-gradient-to-r ${bannerGradient()}`}>
        <div class="absolute inset-0 opacity-10" style="background: repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.15) 10px, rgba(255,255,255,0.15) 20px);" />
        <div class="relative h-full flex items-center justify-between px-5">
          <div class="flex items-center gap-2">
            <Show when={isLive()}>
              <span class="flex items-center gap-1.5 text-xs font-bold text-white bg-black/25 px-3 py-1 rounded-full backdrop-blur-sm">
                <span class="relative flex h-2 w-2">
                  <span class="animate-ping absolute h-full w-full rounded-full bg-white opacity-75" />
                  <span class="relative rounded-full h-2 w-2 bg-white" />
                </span>
                LIVE
              </span>
            </Show>
            <Show when={isReg()}>
              <span class="text-xs font-bold text-white bg-black/25 px-3 py-1 rounded-full backdrop-blur-sm">REGISTRATION OPEN</span>
            </Show>
            <Show when={isFinished()}>
              <span class="text-xs font-bold text-white bg-black/25 px-3 py-1 rounded-full backdrop-blur-sm">FINISHED</span>
            </Show>
            <span class="text-xs text-white/70 font-medium">
              {isSprint() ? "⚡ SPRINT" : isClassic() ? "🏆 CLASSIC" : "🏔️ MARATHON"} • {totalDays()} DAYS
            </span>
          </div>
          <span class="text-white/60 text-xs font-medium">
            ${Number(t().account_size).toLocaleString()} account • ${t().entry_fee} entry
          </span>
        </div>
      </div>

      {/* ═══ Main hero body ═══ */}
      <div class="relative">
        {/* Glow bleed from banner */}
        <div class={`absolute top-0 left-0 right-0 h-20 opacity-15 bg-gradient-to-b ${glowColor()} to-transparent`} />

        <div class="relative px-5 py-5">
          {/* Row 1: Title (big) + Countdown (big) */}
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center gap-4">
              {/* Trophy */}
              <div class={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 border ${
                isLive() ? "bg-yellow-500/10 border-yellow-500/20" : "bg-gray-500/10 border-gray-600/20"
              }`}>
                <svg class={`w-7 h-7 ${isLive() ? "text-yellow-400" : "text-gray-400"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
                  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 7 7 7 7" />
                  <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 17 7 17 7" />
                  <path d="M4 22h16" />
                  <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                  <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                  <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                </svg>
              </div>
              <div>
                <h1 class="text-2xl font-black text-white leading-tight">{t().name}</h1>
                <p class="text-sm text-gray-500 mt-0.5">{t().description || `${t().total_spots} players competing for prizes`}</p>
              </div>
            </div>

            {/* Big countdown — right side */}
            <div class="flex-shrink-0">
              <Show when={isLive()}>
                <FlipClock targetDate={t().ends_at} label="ENDS IN" size="lg" />
              </Show>
              <Show when={isReg()}>
                <FlipClock targetDate={t().starts_at} label="STARTS IN" size="lg" />
              </Show>
            </div>
          </div>

          {/* Row 2: Prize callout + Progress */}
          <div class="flex items-center justify-between">
            {/* Prize big */}
            <Show when={cashPrize()}>
              <div class="flex items-center gap-3">
                <div class="flex items-baseline gap-1">
                  <span class="text-[10px] text-gray-500 uppercase">1st Prize</span>
                  <span class="text-3xl font-black text-yellow-400">${cashPrize()}</span>
                </div>
                <span class="text-gray-700">|</span>
                <span class="text-sm text-gray-500">{t().reserved_spots}/{t().total_spots} players</span>
              </div>
            </Show>

            {/* Progress or spots */}
            <div class="flex-1 max-w-xs ml-auto">
              <Show when={isLive()}>
                <TournamentProgress startsAt={t().starts_at} endsAt={t().ends_at} totalDays={totalDays()} />
              </Show>
              <Show when={isReg()}>
                <div>
                  <div class="flex items-center justify-between text-[10px] mb-1">
                    <span class="text-gray-500">{t().reserved_spots}/{t().total_spots} spots</span>
                    <span class="text-gray-600">{t().spots_available} left</span>
                  </div>
                  <div class="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                    <div class="h-full bg-gradient-to-r from-green-600 to-green-400 rounded-full" style={`width:${spotsPercent()}%`} />
                  </div>
                </div>
              </Show>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Stats strip ═══ */}
      <div class="grid grid-cols-5 gap-px bg-[#1a1a1a] border-t border-[#1a1a1a]">
        <StatCell label="Account" value={`$${Number(t().account_size).toLocaleString()}`} />
        <StatCell label="Players" value={`${t().reserved_spots} / ${t().total_spots}`} />
        <StatCell label="Entry" value={`$${t().entry_fee}`} accent />
        <StatCell label="Max DD" value={`${t().max_drawdown_percentage}%`} />
        <StatCell label="Daily DD" value={`${t().max_daily_drawdown_percentage}%`} />
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
