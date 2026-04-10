import { For, Show, createSignal } from "solid-js";
import type { RankingEntry, PrizeBand } from "../../types/tournament";

interface Props {
  rankings: RankingEntry[];
  prizes: PrizeBand[];
}

function getPrizeForRank(rank: number, prizes: PrizeBand[]): PrizeBand | undefined {
  return prizes.find((p) => rank >= p.rank_from && rank <= p.rank_to);
}

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
                        <span class="text-xs bg-green-500/10 text-green-400 px-2 py-0.5 rounded">
                          {prize()!.label || prize()!.type}
                        </span>
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
                            {/* TODO: Fetch /v1/tournaments/:id/rankings/:entry_id for positions */}
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
