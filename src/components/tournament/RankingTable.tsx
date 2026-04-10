import { For, Show } from "solid-js";
import type { RankingEntry, PrizeBand } from "../../types/tournament";

interface Props {
  rankings: RankingEntry[];
  prizes: PrizeBand[];
}

const rankMedals: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

function getPrizeForRank(rank: number, prizes: PrizeBand[]): PrizeBand | undefined {
  return prizes.find((p) => rank >= p.rank_from && rank <= p.rank_to);
}

export default function RankingTable(props: Props) {
  return (
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="text-gray-500 text-xs border-b border-brand-border">
            <th class="py-2 px-3 text-left w-12">#</th>
            <th class="py-2 px-3 text-left">Trader</th>
            <th class="py-2 px-3 text-right">Profit %</th>
            <th class="py-2 px-3 text-right">Equity</th>
            <th class="py-2 px-3 text-right hidden md:table-cell">Drawdown</th>
            <th class="py-2 px-3 text-right hidden md:table-cell">Positions</th>
            <th class="py-2 px-3 text-right">Prize</th>
          </tr>
        </thead>
        <tbody>
          <For each={props.rankings}>
            {(entry) => {
              const prize = () => getPrizeForRank(entry.rank, props.prizes);
              const isPositive = () => entry.profit_percentage >= 0;

              return (
                <tr class="border-b border-brand-border/50 hover:bg-brand-card/50 transition">
                  <td class="py-2.5 px-3 font-mono text-gray-400">
                    {rankMedals[entry.rank] || entry.rank}
                  </td>
                  <td class="py-2.5 px-3 font-medium text-white">
                    {entry.nickname || "Anonymous"}
                  </td>
                  <td class={`py-2.5 px-3 text-right font-mono ${isPositive() ? "text-green-400" : "text-red-400"}`}>
                    {isPositive() ? "+" : ""}{entry.profit_percentage.toFixed(2)}%
                  </td>
                  <td class="py-2.5 px-3 text-right font-mono text-gray-300">
                    ${entry.equity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td class="py-2.5 px-3 text-right font-mono text-gray-400 hidden md:table-cell">
                    {entry.max_drawdown_percent != null ? `${entry.max_drawdown_percent.toFixed(1)}%` : "-"}
                  </td>
                  <td class="py-2.5 px-3 text-right text-gray-400 hidden md:table-cell">
                    {entry.open_positions_count}
                  </td>
                  <td class="py-2.5 px-3 text-right">
                    <Show when={prize()} fallback={<span class="text-gray-600">-</span>}>
                      <span class="text-xs bg-brand-gold/10 text-brand-gold px-2 py-0.5 rounded">
                        {prize()!.label || prize()!.type}
                      </span>
                    </Show>
                  </td>
                </tr>
              );
            }}
          </For>
        </tbody>
      </table>
    </div>
  );
}
