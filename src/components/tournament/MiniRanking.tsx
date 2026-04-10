import { For, Show } from "solid-js";
import { A } from "@solidjs/router";
import type { RankingEntry } from "../../types/tournament";

interface Props {
  rankings: RankingEntry[];
  tournamentSlug: string;
  maxRows?: number;
}

const AVATAR_COLORS = [
  "bg-emerald-600", "bg-blue-600", "bg-purple-600", "bg-pink-600",
  "bg-orange-600", "bg-teal-600", "bg-cyan-600", "bg-rose-600",
  "bg-indigo-600", "bg-amber-600",
];

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

const RANK_BADGE: Record<number, string> = {
  1: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  2: "bg-gray-400/10 text-gray-300 border-gray-400/20",
  3: "bg-orange-500/15 text-orange-400 border-orange-500/20",
};

export default function MiniRanking(props: Props) {
  const rows = () => props.rankings.slice(0, props.maxRows || 10);

  return (
    <div class="space-y-px">
      <For each={rows()}>
        {(entry) => {
          const name = () => entry.nickname || "Anon";
          const isPositive = () => entry.profit_percentage >= 0;
          const badge = () => RANK_BADGE[entry.rank];

          return (
            <A
              href={`/tournaments/${props.tournamentSlug}`}
              class="leaderboard-row flex items-center gap-2 px-2.5 py-[7px] rounded-md hover:bg-white/[0.04] transition-colors group"
            >
              {/* Rank */}
              <span class={`w-6 h-6 rounded flex items-center justify-center text-[11px] font-mono flex-shrink-0 ${
                badge() ? `border ${badge()}` : "text-gray-600"
              }`}>
                {entry.rank}
              </span>

              {/* Avatar */}
              <div class={`w-6 h-6 rounded-full ${avatarColor(name())} flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0`}>
                {name()[0].toUpperCase()}
              </div>

              {/* Name */}
              <span class="flex-1 text-[13px] text-gray-300 group-hover:text-white truncate leading-none">
                {name()}
              </span>

              {/* Profit */}
              <span class={`text-[12px] font-mono tabular-nums leading-none ${isPositive() ? "text-green-400" : "text-red-400"}`}>
                {isPositive() ? "+" : ""}{entry.profit_percentage.toFixed(2)}%
              </span>
            </A>
          );
        }}
      </For>
      <Show when={props.rankings.length === 0}>
        <div class="text-center py-8 text-gray-700 text-xs">
          Waiting for participants...
        </div>
      </Show>
    </div>
  );
}
