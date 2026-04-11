import { createResource, Show, onCleanup, createMemo } from "solid-js";
import { useParams, A } from "@solidjs/router";
import { Title } from "@solidjs/meta";
import { fetchTournament, fetchRankings } from "../../services/api";
import { generateMockRankings } from "../../services/mockData";
import Header from "../../components/layout/Header";
import TournamentHero from "../../components/tournament/TournamentHero";
import RankingTable from "../../components/tournament/RankingTable";

export default function TournamentDetail() {
  const params = useParams<{ slug: string }>();
  const [tournament] = createResource(() => params.slug, fetchTournament);
  const [apiRankings, { refetch }] = createResource(
    () => tournament()?.id,
    (id) => (id ? fetchRankings(id, 100) : Promise.resolve([]))
  );

  const rankings = createMemo(() => {
    const real = apiRankings();
    if (real && real.length > 0) return real;
    return generateMockRankings(30, tournament()?.name?.includes("Sprint") ? 6 : 8);
  });

  const interval = setInterval(() => {
    if (tournament()?.status === "active") refetch();
  }, 30000);
  onCleanup(() => clearInterval(interval));

  const isLive = () => tournament()?.status === "active";
  const isReg = () => tournament()?.status === "registration";
  const isFinished = () => tournament()?.status === "finished";

  return (
    <>
      <Title>{tournament()?.name || "Tournament"} — Cryptonite</Title>
      <Header />

      <div class="min-h-screen bg-[#1a1a1a]">
        <Show when={tournament()} fallback={
          <div class="text-center py-16 text-gray-600">Loading...</div>
        }>
          {(t) => (
            <div class="p-4 max-w-6xl mx-auto space-y-4">

              {/* ═══ HERO — same component as home ═══ */}
              <div class="bg-black rounded-xl overflow-hidden shadow-xl shadow-black/50">
                <TournamentHero tournament={t()} />

                {/* Stats row below hero */}
                <div class="grid grid-cols-2 md:grid-cols-5 gap-px bg-[#1a1a1a]">
                  <StatCell label="Account Size" value={`$${Number(t().account_size).toLocaleString()}`} />
                  <StatCell label="Players" value={`${t().reserved_spots} / ${t().total_spots}`} />
                  <StatCell label="Entry Fee" value={`$${t().entry_fee}`} accent />
                  <StatCell label="Max Drawdown" value={`${t().max_drawdown_percentage}%`} />
                  <StatCell label="Daily Drawdown" value={`${t().max_daily_drawdown_percentage}%`} />
                </div>
              </div>

              {/* ═══ MAIN CONTENT — 2 columns on desktop ═══ */}
              <div class="flex flex-col lg:flex-row gap-4">

                {/* LEFT — Rankings (main) */}
                <div class="flex-1">
                  <div class="bg-black rounded-xl overflow-hidden shadow-xl shadow-black/50">
                    {/* Rankings header */}
                    <div class="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a]">
                      <div class="flex items-center gap-2">
                        <h2 class="text-sm font-bold text-white">
                          {isLive() ? "Live Rankings" : isFinished() ? "Final Rankings" : "Participants"}
                        </h2>
                        <Show when={isLive()}>
                          <span class="flex items-center gap-1 text-[10px] text-green-400">
                            <span class="relative flex h-1.5 w-1.5">
                              <span class="animate-ping absolute h-full w-full rounded-full bg-green-400 opacity-75" />
                              <span class="relative rounded-full h-1.5 w-1.5 bg-green-500" />
                            </span>
                            Updates every 30s
                          </span>
                        </Show>
                      </div>
                      <span class="text-[10px] text-gray-600">
                        {rankings().length} of {t().total_spots} participants
                      </span>
                    </div>

                    {/* Rankings table */}
                    <Show
                      when={rankings().length > 0}
                      fallback={
                        <div class="text-center py-16 text-gray-700 text-sm">
                          {isReg() ? "Rankings appear when the tournament starts" : "No participants yet"}
                        </div>
                      }
                    >
                      <RankingTable rankings={rankings()} prizes={t().prizes as any} />
                    </Show>
                  </div>
                </div>

                {/* RIGHT — Sidebar info */}
                <div class="lg:w-72 flex flex-col gap-4">

                  {/* Join CTA */}
                  <Show when={isReg() && t().spots_available > 0}>
                    <div class="bg-black rounded-xl overflow-hidden shadow-xl shadow-black/50 p-5 text-center">
                      <p class="text-gray-400 text-sm mb-1">Ready to compete?</p>
                      <p class="text-white text-2xl font-black mb-3">${t().entry_fee}</p>
                      <A
                        href={`/checkout/${t().slug}`}
                        class="block w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition text-sm"
                      >
                        Join This Tournament
                      </A>
                      <p class="text-gray-600 text-[10px] mt-2">{t().spots_available} spots remaining</p>
                    </div>
                  </Show>

                  {/* Prize breakdown */}
                  <div class="bg-black rounded-xl overflow-hidden shadow-xl shadow-black/50">
                    <div class="px-4 py-3 border-b border-[#1a1a1a]">
                      <h3 class="text-sm font-bold text-white">Prize Breakdown</h3>
                    </div>
                    <div class="p-3 space-y-1.5">
                      {(t().prizes as any[]).map((p) => (
                        <div class="flex items-center justify-between py-2 px-3 bg-[#0a0a0a] rounded-lg">
                          <div class="flex items-center gap-2">
                            <span class="text-yellow-400 font-mono text-xs font-bold">
                              #{p.rank_from}{p.rank_to > p.rank_from ? `–${p.rank_to}` : ""}
                            </span>
                          </div>
                          <span class="text-sm text-white font-medium">{p.label || p.type}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Rules */}
                  <div class="bg-black rounded-xl overflow-hidden shadow-xl shadow-black/50">
                    <div class="px-4 py-3 border-b border-[#1a1a1a]">
                      <h3 class="text-sm font-bold text-white">Rules</h3>
                    </div>
                    <div class="p-4 space-y-2.5 text-sm">
                      <RuleRow label="Max Drawdown" value={`${t().max_drawdown_percentage}%`} />
                      <RuleRow label="Daily Drawdown" value={`${t().max_daily_drawdown_percentage}%`} />
                      <RuleRow label="Ranked By" value="Profit %" />
                      <RuleRow label="Instruments" value="25 crypto pairs" />
                      <RuleRow label="Leverage" value="None (1:1)" />
                      <RuleRow label="Elimination" value="Drawdown breach" />
                    </div>
                  </div>

                  {/* Back to all */}
                  <A href="/" class="text-center text-xs text-gray-600 hover:text-white transition py-2">
                    ← All Tournaments
                  </A>
                </div>
              </div>
            </div>
          )}
        </Show>
      </div>
    </>
  );
}

function StatCell(props: { label: string; value: string; accent?: boolean }) {
  return (
    <div class="bg-black px-4 py-3">
      <p class="text-[9px] text-gray-600 uppercase tracking-wider">{props.label}</p>
      <p class={`text-sm font-bold ${props.accent ? "text-green-400" : "text-white"}`}>{props.value}</p>
    </div>
  );
}

function RuleRow(props: { label: string; value: string }) {
  return (
    <div class="flex items-center justify-between">
      <span class="text-gray-500">{props.label}</span>
      <span class="text-white font-medium">{props.value}</span>
    </div>
  );
}
