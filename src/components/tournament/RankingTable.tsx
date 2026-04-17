import { For, Show, createSignal } from "solid-js";
import type { RankingEntry, PrizeBand, LivePosition } from "../../types/tournament";

interface Props {
  rankings: RankingEntry[];
  prizes: PrizeBand[];
  /** Tournament UUID — kept for compatibility, no longer used for fetching */
  tournamentId?: string;
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
            <th class="py-2 px-3 text-center w-10 hidden md:table-cell">1h</th>
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
              const profitPct = () => Number(entry.profit_percentage) || 0;
              const isPositive = () => profitPct() >= 0;
              const isExpanded = () => expandedEntry() === entry.entry_id;

              return (
                <>
                  <tr
                    data-entry-id={entry.entry_id}
                    class={`leaderboard-row border-b border-gray-800/50 cursor-pointer transition-colors ${
                      isExpanded() ? "bg-gray-800/60" : "hover:bg-gray-800/30"
                    }`}
                    onClick={() => toggleExpand(entry.entry_id)}
                  >
                    <td class="py-2 px-2">
                      <div class={`w-9 h-6 rounded-md flex items-center justify-center text-[10px] font-bold border ${
                        entry.rank === 1
                          ? "bg-yellow-400/15 border-yellow-400/40 text-yellow-400"
                          : entry.rank === 2
                          ? "bg-gray-300/10 border-gray-400/30 text-gray-300"
                          : entry.rank === 3
                          ? "bg-orange-400/12 border-orange-400/30 text-orange-400"
                          : "bg-[#1a1a1a] border-gray-700/50 text-gray-400"
                      }`}>
                        #{entry.rank}
                      </div>
                    </td>
                    <td class="py-2 px-1 text-center hidden md:table-cell">
                      {(() => {
                        const c = entry.rank_change_1h;
                        if (c == null || c === 0) return <span class="text-gray-700 text-[9px]">—</span>;
                        if (c > 0) return <span class="text-green-400 text-[9px] font-bold">▲{c}</span>;
                        return <span class="text-red-400 text-[9px] font-bold">▼{Math.abs(c)}</span>;
                      })()}
                    </td>
                    <td class="py-2 px-2">
                      <div class="flex items-center gap-2">
                        <div class={`w-6 h-6 rounded-full border border-gray-700 flex items-center justify-center text-[10px] font-bold ${letterColor(entry.nickname || "A")} flex-shrink-0`}>
                          {(entry.nickname || "A")[0].toUpperCase()}
                        </div>
                        <span class="font-medium text-white text-[13px]">{entry.nickname || "Anonymous"}</span>
                      </div>
                    </td>
                    <td class={`py-2.5 px-3 text-right font-mono ${isPositive() ? "text-green-400" : "text-red-400"}`}>
                      {isPositive() ? "+" : ""}{profitPct().toFixed(2)}%
                    </td>
                    <td class="py-2.5 px-3 text-right font-mono text-gray-300">
                      ${Number(entry.equity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td class="py-2.5 px-3 text-right font-mono text-gray-400 hidden md:table-cell">
                      {entry.max_drawdown_percent != null ? `${Number(entry.max_drawdown_percent).toFixed(1)}%` : "—"}
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

                  {/* Expanded: inline positions from WebSocket data */}
                  <Show when={isExpanded()}>
                    <tr>
                      <td colspan="8" class="bg-gray-900/50 px-6 py-3 border-b border-gray-800">
                        <InlinePositions
                          positions={entry.positions || []}
                          nickname={entry.nickname || "Anonymous"}
                          profitPercentage={Number(entry.profit_percentage) || 0}
                          equity={Number(entry.equity) || 0}
                        />
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

// ═══════════════════════════════════════════════════════════════════════════
// INLINE POSITIONS — rendered from ranking data (positions included via WS).
// No separate fetch needed — data is reactive through the store.
// ═══════════════════════════════════════════════════════════════════════════

function InlinePositions(props: {
  positions: LivePosition[];
  nickname: string;
  profitPercentage: number;
  equity: number;
}) {
  return (
    <div>
      <div class="flex items-center justify-between mb-2">
        <div class="text-xs text-gray-400">
          <span class="text-white font-medium">{props.nickname}</span>
          <span class={`ml-3 font-mono ${props.profitPercentage >= 0 ? "text-green-400" : "text-red-400"}`}>
            {props.profitPercentage >= 0 ? "+" : ""}{props.profitPercentage.toFixed(2)}%
          </span>
          <span class="ml-2 text-gray-500">
            equity ${props.equity.toFixed(2)}
          </span>
        </div>
        <span class="text-[10px] text-gray-600">live</span>
      </div>
      <Show
        when={props.positions.length > 0}
        fallback={<p class="text-gray-600 text-xs italic">No open positions right now.</p>}
      >
        <table class="w-full text-xs">
          <thead>
            <tr class="text-gray-600 border-b border-gray-800/50">
              <th class="text-left py-1 px-2 font-medium">Symbol</th>
              <th class="text-left py-1 px-2 font-medium">Side</th>
              <th class="text-right py-1 px-2 font-medium">Qty</th>
              <th class="text-right py-1 px-2 font-medium">Entry</th>
              <th class="text-right py-1 px-2 font-medium">Current</th>
              <th class="text-right py-1 px-2 font-medium">Unrealized PnL</th>
            </tr>
          </thead>
          <tbody>
            <For each={props.positions}>
              {(p) => {
                const pnl = () => Number(p.unrealized_pnl);
                const isPos = () => pnl() >= 0;
                return (
                  <tr class="border-b border-gray-800/30">
                    <td class="py-1 px-2 text-white font-mono">{p.symbol}</td>
                    <td class="py-1 px-2">
                      <span class={p.side === "long" ? "text-green-400" : "text-red-400"}>
                        {p.side.toUpperCase()}
                      </span>
                    </td>
                    <td class="py-1 px-2 text-right text-gray-300 font-mono">{Number(p.quantity).toFixed(4)}</td>
                    <td class="py-1 px-2 text-right text-gray-400 font-mono">${Number(p.entry_price).toFixed(2)}</td>
                    <td class="py-1 px-2 text-right text-gray-200 font-mono">${Number(p.current_price).toFixed(2)}</td>
                    <td class={`py-1 px-2 text-right font-mono font-bold ${isPos() ? "text-green-400" : "text-red-400"}`}>
                      {isPos() ? "+" : ""}${pnl().toFixed(2)}
                    </td>
                  </tr>
                );
              }}
            </For>
          </tbody>
        </table>
      </Show>
    </div>
  );
}
