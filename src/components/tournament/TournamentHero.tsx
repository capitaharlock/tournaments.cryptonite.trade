import { Show } from "solid-js";
import type { Tournament } from "../../types/tournament";
import FlipClock from "./FlipClock";
import TournamentProgress from "./TournamentProgress";
import { getStatusStyle } from "../../lib/statusStyles";

interface Props {
  tournament: Tournament;
}

export default function TournamentHero(props: Props) {
  const t = () => props.tournament;
  const style = () => getStatusStyle(t().status);
  const isLive = () => t().status === "active";
  const isReg = () => t().status === "registration";
  const isScheduled = () => t().status === "scheduled";
  const isFinished = () => t().status === "finished";
  const totalDays = () => Math.round((new Date(t().ends_at).getTime() - new Date(t().starts_at).getTime()) / 86400000);
  const cashPrize = () => {
    const p = (t().prizes as any[]).find(p => p.type === "cash");
    return p ? p.value : null;
  };
  const totalPrizes = () => (t().prizes as any[]).reduce((sum, p) => sum + (p.rank_to - p.rank_from + 1), 0);
  const spotsPercent = () => Math.max((t().reserved_spots / t().total_spots) * 100, 3);
  const isSprint = () => t().name.includes("Sprint");
  const isClassic = () => t().name.includes("Classic");

  return (
    <div class="relative overflow-hidden">
      {/* ═══ TOP BANNER — colored strip with gradient ═══ */}
      <div class={`relative h-12 overflow-hidden bg-gradient-to-r ${style().gradient}`}>
        {/* Diagonal stripe pattern */}
        <div class="absolute inset-0 opacity-10" style="background: repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px);" />

        {/* Banner content */}
        <div class="relative h-full flex items-center justify-between px-4">
          <div class="flex items-center gap-2">
            <span class="flex items-center gap-1.5 text-[11px] font-bold text-white bg-black/20 px-2.5 py-0.5 rounded-full backdrop-blur-sm">
              <Show when={isLive()}>
                <span class="relative flex h-2 w-2">
                  <span class="animate-ping absolute h-full w-full rounded-full bg-white opacity-75" />
                  <span class="relative rounded-full h-2 w-2 bg-white" />
                </span>
              </Show>
              {style().label}
            </span>
            <span class="text-[11px] text-white/70 font-medium">
              {isSprint() ? "⚡ SPRINT" : isClassic() ? "🏆 CLASSIC" : "🏔️ MARATHON"} • {totalDays()} DAYS
            </span>
          </div>

          {/* Timer in banner */}
          <div class="flex items-center gap-3">
            <Show when={cashPrize()}>
              <span class="text-white/60 text-[10px]">1ST PRIZE</span>
              <span class="text-white font-black text-lg">${cashPrize()}</span>
            </Show>
          </div>
        </div>
      </div>

      {/* ═══ BODY ═══ */}
      <div class="relative">
        {/* Subtle glow from banner */}
        <div class={`absolute top-0 left-0 right-0 h-16 opacity-20 bg-gradient-to-b ${style().gradient.split(" ")[0].replace("from-", "from-")} to-transparent`} />

        <div class="relative p-4">
          {/* Row 1: Trophy + Title + Clock */}
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-3">
              {/* Trophy */}
              <div class={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                isLive()
                  ? "bg-yellow-500/10 border-yellow-500/20"
                  : "bg-gray-500/10 border-gray-600/20"
              }`}>
                <svg class={`w-5 h-5 ${isLive() ? "text-yellow-400" : "text-gray-400"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
                  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 7 7 7 7" />
                  <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 17 7 17 7" />
                  <path d="M4 22h16" />
                  <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                  <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                  <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                </svg>
              </div>
              <div>
                <h2 class="text-base font-bold text-white leading-tight">{t().name}</h2>
                <p class="text-[11px] text-gray-500">
                  ${Number(t().account_size).toLocaleString()} • {t().total_spots} players • ${t().entry_fee}
                </p>
              </div>
            </div>

            {/* Clock top right / Ended date */}
            <Show when={isLive()}>
              <FlipClock targetDate={t().ends_at} size="sm" />
            </Show>
            <Show when={isReg()}>
              <FlipClock targetDate={t().starts_at} label="STARTS" size="sm" />
            </Show>
            <Show when={isScheduled()}>
              <FlipClock targetDate={t().registration_opens_at} label="OPENS" size="sm" />
            </Show>
            <Show when={isFinished()}>
              <div class="text-right">
                <p class="text-[9px] text-gray-600 uppercase tracking-wider mb-0.5">Ended</p>
                <p class="text-sm font-bold text-gray-400">
                  {new Date(t().ends_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </p>
              </div>
            </Show>
          </div>

          {/* Row 2: Progress (live/finished) or Spots bar (registration) */}
          <Show when={isLive() || isFinished()}>
            <TournamentProgress startsAt={t().starts_at} endsAt={t().ends_at} totalDays={totalDays()} />
          </Show>
          <Show when={isReg()}>
            <div>
              <div class="flex items-center justify-between text-[10px] mb-1">
                <span class="text-gray-500">{t().reserved_spots}/{t().total_spots} spots</span>
                <span class="text-gray-600">{t().spots_available} left</span>
              </div>
              <div class="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                <div class={`h-full bg-gradient-to-r ${style().gradient} rounded-full transition-all`} style={`width:${spotsPercent()}%`} />
              </div>
            </div>
          </Show>

          {/* Row 3: Prizes strip */}
          <div class="flex items-center gap-2 mt-3 pt-2.5 border-t border-white/[0.04]">
            <div class="flex items-center gap-1.5 flex-1 overflow-hidden">
              {(t().prizes as any[]).map((p) => (
                <span class="text-[9px] bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 rounded-full text-gray-400 whitespace-nowrap">
                  <span class="text-yellow-400/80">x{p.rank_to - p.rank_from + 1}</span>{" "}{p.type === "cash" ? `$${p.value}` : (p.label || p.type).replace("Free ", "").replace(/\$\d+K /g, "")}
                </span>
              ))}
            </div>
            <span class="text-[10px] text-gray-600 flex-shrink-0">{totalPrizes()} winners</span>
          </div>
        </div>
      </div>
    </div>
  );
}
