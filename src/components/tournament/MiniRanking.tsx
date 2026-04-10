import { For, Show } from "solid-js";
import { A } from "@solidjs/router";
import type { RankingEntry, PrizeBand } from "../../types/tournament";

interface Props {
  rankings: RankingEntry[];
  tournamentSlug: string;
  maxRows?: number;
  accountSize?: number;
  prizes?: PrizeBand[];
}

const LETTER_COLORS = [
  "text-emerald-400", "text-blue-400", "text-purple-400", "text-pink-400",
  "text-orange-400", "text-teal-400", "text-cyan-400", "text-rose-400",
  "text-indigo-400", "text-amber-400",
];

function letterColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return LETTER_COLORS[Math.abs(hash) % LETTER_COLORS.length];
}

function getPrize(rank: number, prizes?: PrizeBand[]): PrizeBand | undefined {
  if (!prizes) return undefined;
  return prizes.find(p => rank >= p.rank_from && rank <= p.rank_to);
}

// Short label for inline display
function shortPrize(p: PrizeBand): string {
  if (p.type === "cash") return `$${p.value}`;
  if (p.type === "challenge") return "Challenge";
  if (p.type === "qualify") return "Qualify";
  if (p.type === "retry") return "Retry";
  if (p.type === "funded") return "Funded";
  if (p.type === "discount") return `${p.value}% off`;
  return p.type;
}

const PRIZE_COLORS: Record<string, string> = {
  cash: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  challenge: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  qualify: "text-purple-400 bg-purple-400/10 border-purple-400/20",
  retry: "text-gray-400 bg-gray-400/10 border-gray-500/20",
  funded: "text-green-400 bg-green-400/10 border-green-400/20",
};

export default function MiniRanking(props: Props) {
  const rows = () => props.rankings.slice(0, props.maxRows || 10);
  const acctSize = () => props.accountSize || 5000;

  return (
    <div>
      {/* Header */}
      <div class="flex items-center gap-2 px-3 py-2 text-[10px] text-gray-500 uppercase tracking-wider border-b border-gray-800/50">
        <span class="w-7 text-center">#</span>
        <span class="w-6" />
        <span class="flex-1">Trader</span>
        <span class="w-16 text-right">Profit</span>
        <span class="w-14 text-right hidden sm:block">Amount</span>
        <span class="w-16 text-right">Prize</span>
      </div>

      <For each={rows()}>
        {(entry) => {
          const name = () => entry.nickname || "Anon";
          const isPositive = () => entry.profit_percentage >= 0;
          const profitAmount = () => acctSize() * entry.profit_percentage / 100;
          const prize = () => getPrize(entry.rank, props.prizes);

          return (
            <A
              href={`/tournaments/${props.tournamentSlug}`}
              class="leaderboard-row flex items-center gap-2 px-3 py-2 border-b border-gray-800/30 hover:bg-white/[0.03] transition-colors group"
            >
              {/* Rank badge */}
              <div class={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold flex-shrink-0 border ${
                entry.rank === 1
                  ? "bg-yellow-400/15 border-yellow-400/40 text-yellow-400 shadow-sm shadow-yellow-400/10"
                  : entry.rank === 2
                  ? "bg-gray-300/10 border-gray-400/30 text-gray-300 shadow-sm shadow-gray-400/10"
                  : entry.rank === 3
                  ? "bg-orange-400/12 border-orange-400/30 text-orange-400 shadow-sm shadow-orange-400/10"
                  : entry.rank <= 10
                  ? "bg-[#1a1a1a] border-gray-700/50 text-gray-400"
                  : "bg-[#151515] border-gray-800/40 text-gray-600"
              }`}>
                {entry.rank}
              </div>

              {/* Avatar — gray circle, colored letter */}
              <div class={`w-6 h-6 rounded-full bg-[#222] flex items-center justify-center text-[10px] font-bold ${letterColor(name())} flex-shrink-0`}>
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
              <span class={`w-14 text-right text-[11px] font-mono tabular-nums hidden sm:block ${isPositive() ? "text-green-400/60" : "text-red-400/60"}`}>
                {isPositive() ? "+" : ""}${Math.abs(profitAmount()).toFixed(0)}
              </span>

              {/* Prize */}
              <span class="w-16 text-right flex-shrink-0">
                <Show when={prize()} fallback={<span class="text-gray-800 text-[10px]">—</span>}>
                  <span class={`text-[9px] px-1.5 py-0.5 rounded border inline-block ${PRIZE_COLORS[prize()!.type] || "text-gray-400 bg-gray-800 border-gray-700"}`}>
                    {shortPrize(prize()!)}
                  </span>
                </Show>
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
