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

// Prize SVG icons
function PrizeIcon(props: { type: string }) {
  switch (props.type) {
    case "cash":
      return (
        <svg class="w-3.5 h-3.5 text-yellow-400" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="1.5" />
          <path d="M12 6v12M9 9.5c0-.83.67-1.5 1.5-1.5h1c1.38 0 2.5 1.12 2.5 2.5S12.88 13 11.5 13h-1c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5h1c1.38 0 2.5-1.12 2.5-2.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        </svg>
      );
    case "challenge":
      return (
        <svg class="w-3.5 h-3.5 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      );
    case "qualify":
      return (
        <svg class="w-3.5 h-3.5 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      );
    case "retry":
      return (
        <svg class="w-3.5 h-3.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
          <path d="M1 4v6h6" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
        </svg>
      );
    case "funded":
      return (
        <svg class="w-3.5 h-3.5 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
          <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      );
    default:
      return null;
  }
}

function prizeLabel(p: PrizeBand): string {
  if (p.type === "cash") return `$${p.value}`;
  if (p.type === "challenge") return "Challenge";
  if (p.type === "qualify") return "Qualify";
  if (p.type === "retry") return "Retry";
  if (p.type === "funded") return "Funded";
  if (p.type === "discount") return `${p.value}% off`;
  return p.type;
}

const PRIZE_TEXT: Record<string, string> = {
  cash: "text-yellow-400",
  challenge: "text-blue-400",
  qualify: "text-purple-400",
  retry: "text-gray-500",
  funded: "text-green-400",
};

export default function MiniRanking(props: Props) {
  const rows = () => props.rankings.slice(0, props.maxRows || 10);
  const acctSize = () => props.accountSize || 5000;

  return (
    <div>
      {/* Header */}
      <div class="flex items-center gap-2 px-3 py-2 text-[10px] text-gray-500 uppercase tracking-wider border-b border-gray-800/50">
        <span class="w-9 text-center">Rank</span>
        <span class="w-6" />
        <span class="flex-1">Trader</span>
        <span class="w-16 text-right">Profit</span>
        <span class="w-16 text-right">Equity</span>
        <span class="w-20 text-right">Prize</span>
      </div>

      <For each={rows()}>
        {(entry) => {
          const name = () => entry.nickname || "Anon";
          const isPositive = () => entry.profit_percentage >= 0;
          const equity = () => acctSize() + (acctSize() * entry.profit_percentage / 100);
          const prize = () => getPrize(entry.rank, props.prizes);

          return (
            <A
              href={`/tournaments/${props.tournamentSlug}`}
              class="leaderboard-row flex items-center gap-2 px-3 py-[6px] border-b border-[#1a1a1a] hover:bg-white/[0.03] transition-colors group"
            >
              {/* Rank badge */}
              <div class={`w-9 h-6 rounded-md flex items-center justify-center text-[10px] font-bold flex-shrink-0 border ${
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
                #{entry.rank}
              </div>

              {/* Avatar */}
              <div class={`w-6 h-6 rounded-full border border-gray-700 flex items-center justify-center text-[10px] font-bold ${letterColor(name())} flex-shrink-0`}>
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

              {/* Equity */}
              <span class="w-16 text-right text-[11px] font-mono tabular-nums text-gray-400">
                ${equity().toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>

              {/* Prize — icon + label */}
              <div class="w-20 flex items-center justify-end gap-1 flex-shrink-0">
                <Show when={prize()} fallback={<span class="text-[#1a1a1a] text-[10px]">—</span>}>
                  <PrizeIcon type={prize()!.type} />
                  <span class={`text-[10px] font-medium ${PRIZE_TEXT[prize()!.type] || "text-gray-500"}`}>
                    {prizeLabel(prize()!)}
                  </span>
                </Show>
              </div>
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
