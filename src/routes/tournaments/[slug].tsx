import { createResource, createSignal, Show, onCleanup, createMemo } from "solid-js";
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

  // Demo countdown — client-side only (30 days from now)
  const [demoTarget] = createSignal(new Date(Date.now() + 30 * 86400000).toISOString());

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
              <DetailHero tournament={t()} demoTarget={demoTarget()} />

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

                  {/* Registration CTA — always first */}
                  <div class="bg-black rounded-xl overflow-hidden shadow-xl shadow-black/50 p-5">
                    <Show when={isReg() && t().spots_available > 0}>
                      {/* Registration open — can join */}
                      <div class="text-center">
                        <p class="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Entry Fee</p>
                        <p class="text-3xl font-black text-white mb-3">${t().entry_fee}</p>
                        <A
                          href={`/checkout/${t().slug}`}
                          class="block w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition text-sm mb-3"
                        >
                          Join This Tournament
                        </A>
                        <div class="bg-[#0a0a0a] rounded-lg p-2.5">
                          <FlipClock targetDate={t().starts_at} label="REGISTRATION CLOSES IN" size="sm" />
                        </div>
                        <p class="text-gray-600 text-[10px] mt-2">{t().spots_available} of {t().total_spots} spots remaining</p>
                      </div>
                    </Show>
                    <Show when={isReg() && t().spots_available <= 0}>
                      {/* Full — no spots */}
                      <div class="text-center">
                        <p class="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Entry Fee</p>
                        <p class="text-3xl font-black text-gray-500 mb-3 line-through">${t().entry_fee}</p>
                        <div class="w-full py-3 bg-gray-800 text-gray-500 font-bold rounded-lg text-sm">
                          Tournament Full
                        </div>
                        <p class="text-gray-600 text-[10px] mt-2">{t().total_spots}/{t().total_spots} spots filled</p>
                      </div>
                    </Show>
                    <Show when={isLive()}>
                      {/* Live — registration closed */}
                      <div class="text-center">
                        <p class="text-[10px] text-red-400/60 uppercase tracking-wider mb-1">Registration Closed</p>
                        <div class="w-full py-2.5 bg-gray-800/50 text-gray-500 font-medium rounded-lg text-sm mb-3">
                          Tournament In Progress
                        </div>
                        <div class="bg-[#0a0a0a] rounded-lg p-2.5">
                          <FlipClock targetDate={t().ends_at} label="ENDS IN" size="sm" />
                        </div>
                      </div>
                    </Show>
                    <Show when={isFinished()}>
                      <div class="text-center">
                        <p class="text-[10px] text-gray-600 uppercase tracking-wider mb-1">Tournament Ended</p>
                        <div class="w-full py-2.5 bg-gray-800/50 text-gray-500 font-medium rounded-lg text-sm">
                          See Results Below
                        </div>
                      </div>
                    </Show>
                  </div>

                  {/* Prize breakdown — position by position */}
                  <div class="bg-black rounded-xl overflow-hidden shadow-xl shadow-black/50">
                    <div class="px-4 py-3 flex items-center justify-between bg-gradient-to-r from-green-600/30 to-emerald-500/10">
                      <h3 class="text-sm font-bold text-white">Prize Breakdown</h3>
                      <span class="text-[10px] text-white/50">
                        {(t().prizes as any[]).reduce((s, p) => s + (p.rank_to - p.rank_from + 1), 0)} of {t().total_spots} win
                      </span>
                    </div>
                    <div class="p-3 space-y-1">
                      {(t().prizes as any[]).map((p, i) => (
                        <div class={`rounded-lg px-3 py-2.5 ${i === 0 ? "bg-yellow-400/5 border border-yellow-400/15" : "bg-[#0a0a0a]"}`}>
                          <div class="flex items-center justify-between mb-1">
                            <span class={`text-xs font-bold ${i === 0 ? "text-yellow-400" : "text-gray-400"}`}>
                              {p.rank_from === p.rank_to
                                ? `${p.rank_from}${p.rank_from === 1 ? "st" : p.rank_from === 2 ? "nd" : p.rank_from === 3 ? "rd" : "th"} Place`
                                : `${p.rank_from}${p.rank_from === 1 ? "st" : p.rank_from === 2 ? "nd" : p.rank_from === 3 ? "rd" : "th"} – ${p.rank_to}th Place`
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

function DetailHero(props: { tournament: Tournament; demoTarget?: string }) {
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
  const bannerGradient = () => "from-green-600 via-emerald-500 to-teal-400";


  return (
    <div class="bg-black rounded-xl overflow-hidden shadow-xl shadow-black/50">
      {/* ═══ BANNER — compact, vivid, prizes visible ═══ */}
      <div class={`relative bg-gradient-to-r ${bannerGradient()}`}>
        <div class="absolute inset-0 opacity-[0.08]" style="background: repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,0.2) 8px, rgba(255,255,255,0.2) 16px);" />
        <div class="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/60 to-transparent" />

        <div class="relative px-6 py-5">
          <div class="flex items-start justify-between gap-6">
            {/* LEFT: Title (2 lines) + Prizes big */}
            <div class="flex-1 min-w-0">
              {/* Line 1: Type label */}
              <p class="text-sm text-white/60 font-medium mb-0.5">
                Tournament • {totalDays()} Day {isSprint() ? "Sprint" : isClassic() ? "Classic" : "Marathon"}
                <Show when={isLive()}>
                  <span class="ml-2 inline-flex items-center gap-1 text-[11px] font-bold text-white bg-black/30 px-2 py-0.5 rounded-full align-middle">
                    <span class="relative flex h-1.5 w-1.5"><span class="animate-ping absolute h-full w-full rounded-full bg-white opacity-75" /><span class="relative rounded-full h-1.5 w-1.5 bg-white" /></span>
                    LIVE
                  </span>
                </Show>
                <Show when={isReg()}>
                  <span class="ml-2 text-[11px] font-bold text-white bg-black/30 px-2 py-0.5 rounded-full align-middle">OPEN</span>
                </Show>
                <Show when={isFinished()}>
                  <span class="ml-2 text-[11px] font-bold text-white/50 bg-black/30 px-2 py-0.5 rounded-full align-middle">FINISHED</span>
                </Show>
              </p>

              {/* Line 2: Tournament name — big */}
              <h1 class="text-3xl font-black text-white leading-tight drop-shadow-md mb-4">{t().name}</h1>

              {/* Prizes — one box per prize */}
              <div class="flex items-center gap-2 flex-wrap">
                {(t().prizes as any[]).map((p, i) => (
                  <div class={`flex items-center gap-2 rounded-lg px-3 py-2 border ${
                    i === 0
                      ? "bg-yellow-400/10 border-yellow-400/30"
                      : "bg-black/30 border-white/10"
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

            {/* RIGHT: Countdown — big, no wrapper, just the clock */}
            <div class="flex-shrink-0">
              <Show when={isLive()}>
                <FlipClock targetDate={t().ends_at} label="ENDS IN" size="lg" />
              </Show>
              <Show when={isReg()}>
                <FlipClock targetDate={t().starts_at} label="STARTS IN" size="lg" />
              </Show>
              <Show when={isFinished()}>
                <FlipClock targetDate={props.demoTarget || new Date(Date.now() + 30 * 86400000).toISOString()} label="NEXT IN" size="lg" />
              </Show>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Progress + Stats — compact strip ═══ */}
      <div class="flex items-center gap-px bg-[#1a1a1a]">
        {/* Progress takes remaining space */}
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
              <div class="h-full bg-gradient-to-r from-green-600 to-green-400 rounded-full" style={`width:${spotsPercent()}%`} />
            </div>
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
