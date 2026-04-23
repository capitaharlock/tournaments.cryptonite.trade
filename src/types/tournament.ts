export interface TournamentTier {
  id: string;
  slug: string;
  name: string;
  duration_days: number;
  account_size: number;
  total_spots: number;
  entry_fee: number;
  registration_hours: number;
  max_drawdown_percentage: number;
  max_daily_drawdown_percentage: number;
  prize_template: PrizeBand[];
  recurrence: string;
}

export interface Tournament {
  id: string;
  tier_id: string;
  slug: string;
  name: string;
  description: string | null;
  status: TournamentStatus;
  registration_opens_at: string;
  starts_at: string;
  ends_at: string;
  /** Real registration cutoff — `starts_at + grace_hours(duration)`.
   * During the grace window the tournament is visibly `active` but
   * /v1/tournaments/:id/enter still accepts signups. Optional so older
   * API deploys don't break the type. */
  registration_closes_at?: string;
  total_spots: number;
  reserved_spots: number;
  spots_available: number;
  entry_fee: number;
  account_size: number;
  max_drawdown_percentage: number;
  max_daily_drawdown_percentage: number;
  prizes: PrizeBand[];
  ranking_metric: string;
  banner_url: string | null;
  theme_color: string | null;
  featured: boolean;
}

export type TournamentStatus =
  | "scheduled"
  | "registration"
  | "active"
  | "closing"
  | "distributing"
  | "finished"
  | "cancelled";

export interface PrizeBand {
  rank_from: number;
  rank_to: number;
  type: string;
  value?: number;
  account_size?: number;
  label?: string;
}

export interface TournamentEntry {
  id: string;
  tournament_id: string;
  trading_account_id: string;
  status: string;
  nickname: string | null;
  country_code: string | null;
  final_rank: number | null;
  final_profit: number | null;
  final_profit_percentage: number | null;
  prize_type: string | null;
  prize_amount: number | null;
  registered_at: string;
}

export interface LivePosition {
  id: string;
  symbol: string;
  side: string;
  quantity: number;
  entry_price: number;
  current_price: number;
  unrealized_pnl: number;
  opened_at: string;
}

export interface RankingEntry {
  rank: number;
  rank_change_1h?: number | null;
  entry_id: string;
  nickname: string | null;
  profit: number;
  profit_percentage: number;
  equity: number;
  balance: number;
  open_positions_count: number;
  max_drawdown_percent: number | null;
  projected_prize_amount: number | null;
  projected_prize_type: string | null;
  positions?: LivePosition[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string | null;
}
