import { Show } from "solid-js";
import type { Tournament } from "../../types/tournament";
import FlipClock from "./FlipClock";
import TournamentProgress from "./TournamentProgress";

interface Props {
  tournament: Tournament;
}

export default function TournamentHero(props: Props) {
  const t = () => props.tournament;
  const isLive = () => t().status === "active";
  const isReg = () => t().status === "registration";
  const totalDays = () => Math.round((new Date(t().ends_at).getTime() - new Date(t().starts_at).getTime()) / 86400000);
  const cashPrize = () => {
    const p = (t().prizes as any[]).find(p => p.type === "cash");
    return p ? p.value : null;
  };
  const totalPrizes = () => (t().prizes as any[]).reduce((sum, p) => sum + (p.rank_to - p.rank_from + 1), 0);
  const spotsPercent = () => Math.max((t().reserved_spots / t().total_spots) * 100, 3);

  return (
    <div class="relative overflow-hidden">
      {/* Background gradient — tournament feel */}
      <div class={`absolute inset-0 ${
        isLive()
          ? "bg-gradient-to-br from-green-900/20 via-black to-black"
          : "bg-gradient-to-br from-blue-900/15 via-black to-black"
      }`} />

      {/* Subtle grid pattern overlay */}
      <div class="absolute inset-0 opacity-[0.03]" style="background-image: radial-gradient(circle, #fff 1px, transparent 1px); background-size: 20px 20px;" />

      <div class="relative p-4">
        {/* Row 1: Status badge + Timer */}
        <div class="flex items-center justify-between mb-3">
          <Show when={isLive()}>
            <div class="flex items-center gap-2">
              <span class="flex items-center gap-1.5 text-[11px] font-semibold text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full">
                <span class="relative flex h-2 w-2">
                  <span class="animate-ping absolute h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span class="relative rounded-full h-2 w-2 bg-green-500" />
                </span>
                LIVE
              </span>
              <span class="text-[10px] text-gray-600">{totalDays()} day tournament</span>
            </div>
          </Show>
          <Show when={isReg()}>
            <div class="flex items-center gap-2">
              <span class="text-[11px] font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-full">
                REGISTRATION OPEN
              </span>
              <span class="text-[10px] text-gray-600">{totalDays()} day tournament</span>
            </div>
          </Show>

          <Show when={isLive()}>
            <FlipClock targetDate={t().ends_at} size="sm" />
          </Show>
          <Show when={isReg()}>
            <FlipClock targetDate={t().starts_at} label="STARTS IN" size="sm" />
          </Show>
        </div>

        {/* Row 2: Trophy + Title + Prize */}
        <div class="flex items-center gap-3 mb-3">
          {/* Trophy icon */}
          <div class={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
            isLive()
              ? "bg-gradient-to-br from-yellow-500/20 to-orange-500/10 border border-yellow-500/20"
              : "bg-gradient-to-br from-blue-500/15 to-purple-500/10 border border-blue-500/20"
          }`}>
            <svg class={`w-6 h-6 ${isLive() ? "text-yellow-400" : "text-blue-400"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 7 7 7 7" />
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 17 7 17 7" />
              <path d="M4 22h16" />
              <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
              <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
              <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
            </svg>
          </div>

          <div class="flex-1 min-w-0">
            <h2 class="text-base font-bold text-white leading-tight">{t().name}</h2>
            <p class="text-[11px] text-gray-500 mt-0.5">
              ${Number(t().account_size).toLocaleString()} account • {t().total_spots} players • ${t().entry_fee} entry
            </p>
          </div>

          {/* Prize callout */}
          <Show when={cashPrize()}>
            <div class="flex-shrink-0 text-right">
              <p class="text-[9px] text-gray-600 uppercase tracking-wider">1st Prize</p>
              <p class="text-xl font-black text-yellow-400 leading-tight">${cashPrize()}</p>
            </div>
          </Show>
        </div>

        {/* Row 3: Progress bar (live) */}
        <Show when={isLive()}>
          <TournamentProgress startsAt={t().starts_at} endsAt={t().ends_at} totalDays={totalDays()} />
        </Show>

        {/* Row 3 alt: Spots bar (registration) */}
        <Show when={isReg()}>
          <div>
            <div class="flex items-center justify-between text-[10px] mb-1">
              <span class="text-gray-500">{t().reserved_spots} / {t().total_spots} spots filled</span>
              <span class="text-gray-600">{t().spots_available} remaining</span>
            </div>
            <div class="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
              <div class="h-full bg-gradient-to-r from-green-600 to-green-400 rounded-full transition-all" style={`width:${spotsPercent()}%`} />
            </div>
          </div>
        </Show>

        {/* Row 4: Prize strip — compact */}
        <div class="flex items-center gap-3 mt-3 pt-3 border-t border-white/[0.04]">
          <div class="flex items-center gap-1.5 flex-1 overflow-hidden">
            {(t().prizes as any[]).map((p) => (
              <span class="text-[9px] bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 rounded-full text-gray-400 whitespace-nowrap">
                <span class="text-yellow-400/80">#{p.rank_from}{p.rank_to > p.rank_from ? `–${p.rank_to}` : ""}</span>{" "}{(p.label || p.type).replace("Free ", "").replace("$5K ", "").replace("$10K ", "").replace("$25K ", "")}
              </span>
            ))}
          </div>
          <span class="text-[10px] text-gray-600 flex-shrink-0">{totalPrizes()} winners</span>
        </div>
      </div>
    </div>
  );
}
