import type { Tournament, TournamentTier, RankingEntry, ApiResponse } from "../types/tournament";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:7002";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`);
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  const json: ApiResponse<T> = await res.json();
  if (!json.success) throw new Error(json.message || "API error");
  return json.data;
}

export async function fetchTiers(): Promise<TournamentTier[]> {
  return get("/v1/tournaments/tiers");
}

export async function fetchTournaments(status?: string): Promise<Tournament[]> {
  const qs = status ? `?status=${status}` : "";
  return get(`/v1/tournaments${qs}`);
}

export async function fetchFeatured(): Promise<Tournament[]> {
  return get("/v1/tournaments/featured");
}

export async function fetchTournament(slug: string): Promise<Tournament> {
  return get(`/v1/tournaments/${slug}`);
}

export async function fetchRankings(
  tournamentId: string,
  limit = 50,
  offset = 0
): Promise<RankingEntry[]> {
  return get(`/v1/tournaments/${tournamentId}/rankings?limit=${limit}&offset=${offset}`);
}
