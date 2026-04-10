import { For, Show } from "solid-js";
import { A } from "@solidjs/router";
import type { RankingEntry } from "../../types/tournament";

interface Props {
  rankings: RankingEntry[];
  tournamentSlug: string;
  maxRows?: number;
  accountSize?: number;
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

export default function MiniRanking(props: Props) {
  const rows = () => props.rankings.slice(0, props.maxRows || 10);
  const acctSize = () => props.accountSize || 5000;

  return (
    <div>
      {/* Header */}
      <div class="flex items-center gap-2 px-3 py-2 text-[10px] text-gray-500 uppercase tracking-wider border-b border-gray-800/50">
        <span class="w-6 text-center">#</span>
        <span class="w-6" />
        <span class="flex-1">Trader</span>
        <span class="w-16 text-right">Profit</span>
        <span class="w-14 text-right hidden sm:block">Amount</span>
        <span class="w-10 text-right hidden md:block">Ops</span>
        <span class="w-10 text-right">Open</span>
      </div>

      <For each={rows()}>
        {(entry) => {
          const name = () => entry.nickname || "Anon";
          const isPositive = () => entry.profit_percentage >= 0;
          const profitAmount = () => acctSize() * entry.profit_percentage / 100;

          return (
            <A
              href={`/tournaments/${props.tournamentSlug}`}
              class="leaderboard-row flex items-center gap-2 px-3 py-2 border-b border-gray-800/30 hover:bg-white/[0.03] transition-colors group"
            >
              {/* Rank */}
              <span class={`w-6 text-center text-xs font-mono flex-shrink-0 ${
                entry.rank === 1 ? "text-yellow-400 font-bold" :
                entry.rank === 2 ? "text-gray-300 font-bold" :
                entry.rank === 3 ? "text-orange-400 font-bold" :
                "text-gray-600"
              }`}>
                {entry.rank}
              </span>

              {/* Avatar */}
              <div class={`w-6 h-6 rounded-full ${avatarColor(name())} flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0`}>
                {name()[0].toUpperCase()}
              </div>

              {/* Name */}
              <span class="flex-1 text-[13px] text-gray-200 group-hover:text-white truncate">
                {name()}
              </span>

              {/* Profit % */}
              <span class={`w-16 text-right text-[12px] font-mono tabular-nums ${isPositive() ? "text-green-400" : "text-red-400"}`}>
                {isPositive() ? "+" : ""}{entry.profit_percentage.toFixed(2)}%
              </span>

              {/* Profit amount */}
              <span class={`w-14 text-right text-[11px] font-mono tabular-nums hidden sm:block ${isPositive() ? "text-green-400/70" : "text-red-400/70"}`}>
                {isPositive() ? "+" : ""}${Math.abs(profitAmount()).toFixed(0)}
              </span>

              {/* Total trades (mock) */}
              <span class="w-10 text-right text-[11px] text-gray-600 hidden md:block">
                {Math.floor(Math.random() * 30) + 5}
              </span>

              {/* Open positions */}
              <span class={`w-10 text-right text-[11px] ${entry.open_positions_count > 0 ? "text-blue-400" : "text-gray-700"}`}>
                {entry.open_positions_count}
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
