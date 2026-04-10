import { createResource, createSignal, onCleanup, Show } from "solid-js";
import { A } from "@solidjs/router";
import type { Tournament, RankingEntry } from "../../types/tournament";
import { fetchRankings } from "../../services/api";
import Countdown from "./Countdown";
import MiniRanking from "./MiniRanking";

interface Props {
  tournament: Tournament;
}

export default function TournamentColumn(props: Props) {
  const t = () => props.tournament;
  const isLive = () => t().status === "active";
  const isRegistering = () => t().status === "registration";

  const [rankings, { refetch }] = createResource(
    () => t().id,
    (id) => fetchRankings(id, 10)
  );

  // Auto-refresh every 30s for live tournaments
  const interval = setInterval(() => {
    if (isLive()) refetch();
  }, 30000);
  onCleanup(() => clearInterval(interval));

  // Tier colors
  const tierBorder = () => {
    const days = t().name.includes("Sprint") ? "border-green-500/30" :
                 t().name.includes("Classic") ? "border-blue-500/30" :
                 "border-purple-500/30";
    return days;
  };

  return (
    <div class={`bg-gray-900 border ${tierBorder()} rounded-lg overflow-hidden flex flex-col`}>
      {/* Header */}
      <div class="p-4 border-b border-gray-800">
        <div class="flex items-center justify-between mb-2">
          <h3 class="font-bold text-white">{t().name}</h3>
          <Show when={isLive()}>
            <span class="flex items-center gap-1 text-xs text-green-400">
              <span class="relative flex h-2 w-2">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span class="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              LIVE
            </span>
          </Show>
          <Show when={isRegistering()}>
            <span class="text-xs bg-green-500/10 text-green-400 px-2 py-0.5 rounded">OPEN</span>
          </Show>
        </div>

        <div class="flex items-center justify-between text-xs text-gray-400">
          <span>${Number(t().account_size).toLocaleString()} account</span>
          <span>{t().reserved_spots}/{t().total_spots} joined</span>
        </div>

        {/* Countdown */}
        <div class="mt-2">
          <Show when={isLive()}>
            <Countdown targetDate={t().ends_at} label="Ends in" />
          </Show>
          <Show when={isRegistering()}>
            <Countdown targetDate={t().starts_at} label="Starts in" />
          </Show>
        </div>
      </div>

      {/* Mini ranking */}
      <div class="flex-1 p-2 min-h-[200px]">
        <MiniRanking
          rankings={rankings() || []}
          tournamentSlug={t().slug}
          maxRows={10}
        />
      </div>

      {/* Prize preview */}
      <div class="px-4 py-2 border-t border-gray-800">
        <div class="flex items-center justify-between text-xs">
          <span class="text-gray-500">1st prize</span>
          <span class="text-white font-medium">
            {(t().prizes as any[])?.[0]?.label || "TBD"}
          </span>
        </div>
      </div>

      {/* CTA */}
      <Show when={isRegistering() && t().spots_available > 0}>
        <A
          href={`/checkout/${t().slug}`}
          class="block text-center py-3 bg-green-600 hover:bg-green-500 text-white font-bold text-sm transition-colors"
        >
          Join — ${t().entry_fee}
        </A>
      </Show>
      <Show when={isLive() || (isRegistering() && t().spots_available <= 0)}>
        <A
          href={`/tournaments/${t().slug}`}
          class="block text-center py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm transition-colors"
        >
          {isLive() ? "Watch Live →" : "View Details →"}
        </A>
      </Show>
    </div>
  );
}
