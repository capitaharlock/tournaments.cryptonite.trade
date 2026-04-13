import { For, Show, createSignal } from "solid-js";
import type { RankingEntry, PrizeBand } from "../../types/tournament";

interface Props {
  rankings: RankingEntry[];
  prizes: PrizeBand[];
}

function getPrizeForRank(rank: number, prizes: PrizeBand[]): PrizeBand | undefined {
  return prizes.find((p) => rank >= p.rank_from && rank <= p.rank_to);
}

// Prize icons + colors (same as MiniRanking)
function PrizeIcon(props: { type: string }) {
  switch (props.type) {
    case "cash":
      return (
        <svg class="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v12M9 9.5c0-.83.67-1.5 1.5-1.5h1c1.38 0 2.5 1.12 2.5 2.5S12.88 13 11.5 13h-1c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5h1c1.38 0 2.5-1.12 2.5-2.5" />
        </svg>
      );
    case "challenge":
      return (
        <svg class="w-3.5 h-3.5 text-blue-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      );
    case "qualify":
      return (
        <svg class="w-3.5 h-3.5 text-purple-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      );
    case "retry":
      return (
        <svg class="w-3.5 h-3.5 text-gray-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
          <path d="M1 4v6h6" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
        </svg>
      );
    case "funded":
      return (
        <svg class="w-3.5 h-3.5 text-green-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
          <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      );
    default:
      return null;
  }
}

const PRIZE_TEXT: Record<string, string> = {
  cash: "text-yellow-400",
  challenge: "text-blue-400",
  qualify: "text-purple-400",
  retry: "text-gray-400",
  funded: "text-green-400",
};

export default function RankingTable(props: Props) {
  const [expandedEntry, setExpandedEntry] = createSignal<string | null>(null);

  const toggleExpand = (entryId: string) => {
    setExpandedEntry(expandedEntry() === entryId ? null : entryId);
  };

  return (
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="text-gray-500 text-xs border-b border-gray-800">
            <th class="py-2 px-3 text-left w-12">#</th>
            <th class="py-2 px-3 text-left">Trader</th>
            <th class="py-2 px-3 text-right">Profit %</th>
            <th class="py-2 px-3 text-right">Equity</th>
            <th class="py-2 px-3 text-right hidden md:table-cell">Max DD</th>
            <th class="py-2 px-3 text-right hidden md:table-cell">Positions</th>
            <th class="py-2 px-3 text-right">Prize</th>
          </tr>
        </thead>
        <tbody>
          <For each={props.rankings}>
            {(entry) => {
              const prize = () => getPrizeForRank(entry.rank, props.prizes);
              const isPositive = () => entry.profit_percentage >= 0;
              const isExpanded = () => expandedEntry() === entry.entry_id;

              return (
                <>
                  <tr
                    class={`leaderboard-row border-b border-gray-800/50 cursor-pointer transition-colors ${
                      isExpanded() ? "bg-gray-800/60" : "hover:bg-gray-800/30"
                    }`}
                    onClick={() => toggleExpand(entry.entry_id)}
                  >
                    <td class="py-2.5 px-3 font-mono text-gray-400">
                      <span class={entry.rank <= 3 ? "text-yellow-400 font-bold" : ""}>
                        {entry.rank}
                      </span>
                    </td>
                    <td class="py-2.5 px-3">
                      <span class="font-medium text-white">{entry.nickname || "Anonymous"}</span>
                    </td>
                    <td class={`py-2.5 px-3 text-right font-mono ${isPositive() ? "text-green-400" : "text-red-400"}`}>
                      {isPositive() ? "+" : ""}{entry.profit_percentage.toFixed(2)}%
                    </td>
                    <td class="py-2.5 px-3 text-right font-mono text-gray-300">
                      ${entry.equity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td class="py-2.5 px-3 text-right font-mono text-gray-400 hidden md:table-cell">
                      {entry.max_drawdown_percent != null ? `${entry.max_drawdown_percent.toFixed(1)}%` : "—"}
                    </td>
                    <td class="py-2.5 px-3 text-right text-gray-400 hidden md:table-cell">
                      {entry.open_positions_count}
                    </td>
                    <td class="py-2.5 px-3 text-right">
                      <Show when={prize()} fallback={<span class="text-gray-700">—</span>}>
                        <div class="inline-flex items-center gap-1.5 justify-end">
                          <PrizeIcon type={prize()!.type} />
                          <span class={`text-xs font-medium ${PRIZE_TEXT[prize()!.type] || "text-gray-400"}`}>
                            {prize()!.label || prize()!.type}
                          </span>
                        </div>
                      </Show>
                    </td>
                  </tr>

                  {/* Expanded: show open positions */}
                  <Show when={isExpanded()}>
                    <tr>
                      <td colspan="7" class="bg-gray-900/50 px-6 py-3 border-b border-gray-800">
                        <div class="text-xs text-gray-500 mb-2">
                          Open Positions — {entry.nickname || "Anonymous"}
                        </div>
                        <Show
                          when={entry.open_positions_count > 0}
                          fallback={<p class="text-gray-600 text-xs">No open positions</p>}
                        >
                          <p class="text-gray-500 text-xs italic">
                            Position details will load from the API when available.
                          </p>
                        </Show>
                      </td>
                    </tr>
                  </Show>
                </>
              );
            }}
          </For>
        </tbody>
      </table>
    </div>
  );
}
