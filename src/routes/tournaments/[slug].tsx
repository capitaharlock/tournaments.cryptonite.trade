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

  // Always use tournament type color — even finished tournaments keep their identity
  const bannerGradient = () =>
    isSprint()
      ? "from-green-600 via-emerald-500 to-teal-400"
      : isClassic()
      ? "from-blue-600 via-indigo-500 to-purple-400"
      : "from-orange-600 via-amber-500 to-yellow-400";


  return (
    <div class="bg-black rounded-xl overflow-hidden shadow-xl shadow-black/50">
      {/* ═══ BANNER — vivid, tall, impactful ═══ */}
      <div class={`relative bg-gradient-to-r ${bannerGradient()}`}>
        {/* Diagonal stripes */}
        <div class="absolute inset-0 opacity-[0.08]" style="background: repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,0.2) 8px, rgba(255,255,255,0.2) 16px);" />
        {/* Bottom fade to black */}
        <div class="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/80 to-transparent" />

        <div class="relative px-6 pt-4 pb-5">
          {/* Top: badges */}
          <div class="flex items-center gap-2 mb-4">
            <Show when={isLive()}>
              <span class="flex items-center gap-1.5 text-[11px] font-bold text-white bg-black/30 px-3 py-1 rounded-full backdrop-blur-sm">
                <span class="relative flex h-2 w-2">
                  <span class="animate-ping absolute h-full w-full rounded-full bg-white opacity-75" />
                  <span class="relative rounded-full h-2 w-2 bg-white" />
                </span>
                LIVE
              </span>
            </Show>
            <Show when={isReg()}>
              <span class="text-[11px] font-bold text-white bg-black/30 px-3 py-1 rounded-full backdrop-blur-sm">REGISTRATION OPEN</span>
            </Show>
            <Show when={isFinished()}>
              <span class="text-[11px] font-bold text-white bg-black/30 px-3 py-1 rounded-full backdrop-blur-sm">FINISHED</span>
            </Show>
            <span class="text-[11px] text-white/60">
              {isSprint() ? "⚡ SPRINT" : isClassic() ? "🏆 CLASSIC" : "🏔️ MARATHON"} • {totalDays()} DAYS
            </span>
          </div>

          {/* Main: Trophy + Title + Prize | Countdown */}
          <div class="flex items-center justify-between">
            {/* Left: trophy + title + prize */}
            <div class="flex items-center gap-4">
              <div class="w-16 h-16 rounded-2xl bg-black/30 backdrop-blur-sm border border-white/10 flex items-center justify-center flex-shrink-0">
                <svg class="w-8 h-8 text-yellow-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
                  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 7 7 7 7" />
                  <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 17 7 17 7" />
                  <path d="M4 22h16" />
                  <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                  <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                  <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                </svg>
              </div>
              <div>
                <h1 class="text-3xl font-black text-white leading-tight drop-shadow-lg">{t().name}</h1>
                <div class="flex items-center gap-3 mt-1">
                  <span class="text-sm text-white/60">${Number(t().account_size).toLocaleString()} account</span>
                  <span class="text-white/30">•</span>
                  <span class="text-sm text-white/60">{t().total_spots} players</span>
                  <Show when={cashPrize()}>
                    <span class="text-white/30">•</span>
                    <span class="text-sm font-bold text-yellow-300">1st Prize ${cashPrize()}</span>
                  </Show>
                </div>
              </div>
            </div>

            {/* Right: BIG countdown */}
            <div class="flex-shrink-0 bg-black/30 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10">
              <Show when={isLive()}>
                <FlipClock targetDate={t().ends_at} label="ENDS IN" size="lg" />
              </Show>
              <Show when={isReg()}>
                <FlipClock targetDate={t().starts_at} label="STARTS IN" size="lg" />
              </Show>
              <Show when={isFinished()}>
                <FlipClock targetDate={new Date(Date.now() + 30 * 86400000).toISOString()} label="NEXT IN" size="lg" />
              </Show>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Progress row ═══ */}
      <Show when={isLive()}>
        <div class="px-6 py-2 bg-[#0a0a0a]">
          <TournamentProgress startsAt={t().starts_at} endsAt={t().ends_at} totalDays={totalDays()} />
        </div>
      </Show>
      <Show when={isReg()}>
        <div class="px-6 py-2 bg-[#0a0a0a]">
          <div class="flex items-center justify-between text-[10px] mb-1">
            <span class="text-gray-500">{t().reserved_spots}/{t().total_spots} spots filled</span>
            <span class="text-gray-600">{t().spots_available} remaining</span>
          </div>
          <div class="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
            <div class="h-full bg-gradient-to-r from-green-600 to-green-400 rounded-full" style={`width:${spotsPercent()}%`} />
          </div>
        </div>
      </Show>

      {/* ═══ Stats strip ═══ */}
      <div class="grid grid-cols-5 gap-px bg-[#1a1a1a]">
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
