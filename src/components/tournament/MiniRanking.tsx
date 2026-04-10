import { For, Show } from "solid-js";
import { A } from "@solidjs/router";
import type { RankingEntry } from "../../types/tournament";

interface Props {
  rankings: RankingEntry[];
  tournamentSlug: string;
  maxRows?: number;
}

export default function MiniRanking(props: Props) {
  const rows = () => props.rankings.slice(0, props.maxRows || 10);

  return (
    <div class="space-y-0.5">
      <For each={rows()}>
        {(entry, i) => {
          const isPositive = () => entry.profit_percentage >= 0;
          return (
            <A
              href={`/tournaments/${props.tournamentSlug}`}
              class="leaderboard-row flex items-center gap-2 px-3 py-1.5 rounded hover:bg-gray-800/50 transition-colors group"
            >
              <span class={`w-6 text-xs font-mono text-right ${
                entry.rank <= 3 ? "text-yellow-400 font-bold" : "text-gray-500"
              }`}>
                {entry.rank}
              </span>
              <span class="flex-1 text-sm text-gray-300 group-hover:text-white truncate">
                {entry.nickname || "Anonymous"}
              </span>
              <span class={`text-xs font-mono ${isPositive() ? "text-green-400" : "text-red-400"}`}>
                {isPositive() ? "+" : ""}{entry.profit_percentage.toFixed(2)}%
              </span>
            </A>
          );
        }}
      </For>
      <Show when={props.rankings.length === 0}>
        <div class="text-center py-4 text-gray-600 text-xs">
          Waiting for participants...
        </div>
      </Show>
    </div>
  );
}
