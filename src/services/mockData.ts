import type { RankingEntry } from "../types/tournament";

// Generate realistic mock rankings for visual testing
// These will be replaced by real API data when tournaments are active
const MOCK_NAMES = [
  "cryptowolf", "luna_trader", "btc_hunter", "eth_maxi", "sol_rider",
  "degen_pete", "whale_watch", "moonshot_", "alpha_seeker", "risk_taker",
  "chart_master", "green_candle", "hodl_king", "profit_pete", "trade_ninja",
  "crypto_jane", "bear_slayer", "bull_runner", "margin_call", "diamond_hands",
  "satoshi_fan", "defi_queen", "nft_flipper", "yield_farmer", "gas_saver",
  "block_builder", "hash_hunter", "node_runner", "smart_money", "dip_buyer",
];

const COUNTRIES = ["US", "GB", "DE", "CA", "AU", "FR", "JP", "BR", "ES", "NL"];

export function generateMockRankings(count: number, spread: number = 8): RankingEntry[] {
  const rankings: RankingEntry[] = [];

  for (let i = 0; i < count; i++) {
    // Top traders have higher profit, with realistic distribution
    const baseProfit = spread - (i * spread * 2 / count);
    const jitter = (Math.random() - 0.5) * 2;
    const profitPct = baseProfit + jitter;
    const balance = 5000; // Sprint
    const profit = balance * profitPct / 100;

    rankings.push({
      rank: i + 1,
      entry_id: `mock-${i}`,
      nickname: MOCK_NAMES[i % MOCK_NAMES.length],
      profit: profit,
      profit_percentage: parseFloat(profitPct.toFixed(2)),
      equity: balance + profit,
      balance: balance + profit,
      open_positions_count: Math.floor(Math.random() * 4),
      max_drawdown_percent: parseFloat((Math.random() * 6).toFixed(1)),
      projected_prize_amount: null,
      projected_prize_type: null,
    });
  }

  return rankings;
}
