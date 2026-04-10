import { createResource, For, Show, createMemo } from "solid-js";
import { A } from "@solidjs/router";
import { Title } from "@solidjs/meta";
import { fetchTournaments, fetchRankings } from "../services/api";
import { generateMockRankings } from "../services/mockData";
import type { Tournament } from "../types/tournament";
import Header from "../components/layout/Header";
import FlipClock from "../components/tournament/FlipClock";
import MiniRanking from "../components/tournament/MiniRanking";
import TournamentProgress from "../components/tournament/TournamentProgress";

export default function Home() {
  const [active] = createResource(() => fetchTournaments("active"));
  const [registering] = createResource(() => fetchTournaments("registration"));
  const [scheduled] = createResource(() => fetchTournaments("scheduled"));
  const [finished] = createResource(() => fetchTournaments("finished"));

  const allLive = createMemo(() => {
    const all = [...(active() || []), ...(registering() || [])];
    return all.sort((a, b) => new Date(a.ends_at).getTime() - new Date(b.ends_at).getTime());
  });

  const primary = () => allLive()[0] || null;
  const secondary = () => allLive()[1] || null;
  const rest = () => allLive().slice(2);

  return (
    <>
      <Title>Cryptonite Tournaments — Compete, Trade, Win</Title>
      <Header />

      <div class="min-h-screen bg-[#1a1a1a]">
        <div class="flex flex-col lg:flex-row min-h-[calc(100vh-48px)] gap-4 p-4">

          {/* LEFT (42%) */}
          <div class="lg:w-[42%] flex-shrink-0">
            <Show when={primary()} fallback={<EmptyPanel />}>
              {(t) => <TournamentPanel tournament={t()} maxRanks={10} />}
            </Show>
          </div>

          {/* MIDDLE (30%) */}
          <div class="lg:w-[30%] flex-shrink-0">
            <Show when={secondary()} fallback={<EmptyPanel />}>
              {(t) => <TournamentPanel tournament={t()} maxRanks={10} />}
            </Show>
          </div>

          {/* RIGHT (28%) */}
          <div class="lg:flex-1 flex flex-col gap-4 overflow-y-auto">
            <For each={rest()}>
              {(t) => <CompactPanel tournament={t} />}
            </For>
            <Show when={scheduled() && scheduled()!.length > 0}>
              <For each={scheduled()}>
                {(t) => <ScheduleCard tournament={t} />}
              </For>
            </Show>
            <Show when={finished() && finished()!.length > 0}>
              <div class="bg-black rounded-xl p-4">
                <h3 class="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-3">Recent Results</h3>
                <For each={finished()!.slice(0, 3)}>
                  {(t) => (
                    <A href={`/tournaments/${t.slug}`} class="flex items-center justify-between py-2 border-b border-gray-800/50 last:border-0 hover:text-white transition text-gray-500 text-sm">
                      <span>{t.name}</span>
                      <span class="text-xs text-gray-700">{t.reserved_spots}p →</span>
                    </A>
                  )}
                </For>
              </div>
            </Show>
          </div>
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TOURNAMENT PANEL
// ═══════════════════════════════════════════════════════════════════════════

function TournamentPanel(props: { tournament: Tournament; maxRanks: number }) {
  const t = () => props.tournament;
  const isLive = () => t().status === "active";
  const isReg = () => t().status === "registration";

  const [apiRankings] = createResource(() => t().id, (id) => fetchRankings(id, props.maxRanks));
  const rankings = createMemo(() => {
    const real = apiRankings();
    if (real && real.length > 0) return real;
    return generateMockRankings(props.maxRanks, t().name.includes("Sprint") ? 6 : 8);
  });

  const totalDays = () => Math.round((new Date(t().ends_at).getTime() - new Date(t().starts_at).getTime()) / 86400000);
  const icon = () => t().name.includes("Sprint") ? "⚡" : t().name.includes("Classic") ? "🏆" : "🏔️";

  return (
    <div class="bg-black rounded-xl flex flex-col h-full overflow-hidden shadow-xl shadow-black/50">
      {/* ─── Top bar: title left, clock right ─── */}
      <div class="flex items-start justify-between p-4 pb-3">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="text-lg">{icon()}</span>
            <h2 class="text-base font-bold text-white">{t().name}</h2>
          </div>
          <div class="flex items-center gap-3 text-[11px] text-gray-500">
            <span>${Number(t().account_size).toLocaleString()}</span>
            <span class="text-gray-700">•</span>
            <span class="text-green-400 font-medium">${t().entry_fee}</span>
            <span class="text-gray-700">•</span>
            <span>{t().reserved_spots}/{t().total_spots} players</span>
          </div>
        </div>
        {/* Clock + status at top right */}
        <div class="flex flex-col items-end gap-1.5 flex-shrink-0">
          <Show when={isLive()}>
            <FlipClock targetDate={t().ends_at} size="sm" />
          </Show>
          <Show when={isReg()}>
            <FlipClock targetDate={t().starts_at} size="sm" />
          </Show>
        </div>
      </div>

      {/* Progress bar (live only) */}
      <Show when={isLive()}>
        <div class="px-4 pb-2">
          <TournamentProgress startsAt={t().starts_at} endsAt={t().ends_at} totalDays={totalDays()} />
        </div>
      </Show>

      {/* Prizes strip */}
      <div class="px-4 py-2 bg-[#0a0a0a] border-y border-gray-800/30 flex items-center justify-between">
        <div class="flex flex-wrap gap-1.5 flex-1">
          {(t().prizes as any[]).map((p) => (
            <span class="text-[10px] bg-[#111] border border-gray-800/50 px-2 py-0.5 rounded-full text-gray-400">
              <span class="text-yellow-400 font-mono">#{p.rank_from}{p.rank_to > p.rank_from ? `–${p.rank_to}` : ""}</span>{" "}{p.label || p.type}
            </span>
          ))}
        </div>
        {/* Join button — compact, right-aligned */}
        <Show when={isReg() && t().spots_available > 0}>
          <A
            href={`/checkout/${t().slug}`}
            class="ml-3 px-4 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded-lg transition flex-shrink-0"
          >
            Join ${t().entry_fee}
          </A>
        </Show>
      </div>

      {/* Rankings */}
      <div class="flex-1 overflow-y-auto">
        <MiniRanking
          rankings={rankings()}
          tournamentSlug={t().slug}
          maxRows={props.maxRanks}
          accountSize={Number(t().account_size)}
        />
      </div>

      {/* Footer */}
      <A
        href={`/tournaments/${t().slug}`}
        class="block text-center py-2 text-xs text-gray-600 hover:text-white bg-[#0a0a0a] border-t border-gray-800/30 transition"
      >
        {isLive() ? "Full Rankings →" : "View Details →"}
      </A>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPACT PANEL — Right column extra tournaments
// ═══════════════════════════════════════════════════════════════════════════

function CompactPanel(props: { tournament: Tournament }) {
  const t = () => props.tournament;
  const isLive = () => t().status === "active";
  const isReg = () => t().status === "registration";

  const [apiRankings] = createResource(() => t().id, (id) => fetchRankings(id, 5));
  const rankings = createMemo(() => {
    const real = apiRankings();
    if (real && real.length > 0) return real;
    return generateMockRankings(5);
  });

  const icon = () => t().name.includes("Sprint") ? "⚡" : t().name.includes("Classic") ? "🏆" : "🏔️";

  return (
    <div class="bg-black rounded-xl overflow-hidden shadow-lg shadow-black/30">
      {/* Header: title left, clock right */}
      <div class="px-3 py-2.5 flex items-center justify-between border-b border-gray-800/30">
        <div class="flex items-center gap-2">
          <span class="text-sm">{icon()}</span>
          <span class="text-sm font-semibold text-white">{t().name}</span>
          <span class="text-[10px] text-gray-600">{t().reserved_spots}/{t().total_spots}</span>
        </div>
        <div class="flex items-center gap-2">
          <Show when={isLive()}><FlipClock targetDate={t().ends_at} size="sm" /></Show>
          <Show when={isReg()}><FlipClock targetDate={t().starts_at} size="sm" /></Show>
        </div>
      </div>
      <MiniRanking rankings={rankings()} tournamentSlug={t().slug} maxRows={5} accountSize={Number(t().account_size)} />
      <div class="flex items-center justify-between px-3 py-2 border-t border-gray-800/30 bg-[#0a0a0a]">
        <div class="flex gap-1">
          {(t().prizes as any[]).slice(0, 2).map((p) => (
            <span class="text-[9px] bg-[#111] px-1.5 py-0.5 rounded text-gray-500">
              <span class="text-yellow-400">#{p.rank_from}</span> {(p.label || p.type).split(" ").slice(0, 2).join(" ")}
            </span>
          ))}
        </div>
        <Show when={isReg() && t().spots_available > 0}>
          <A href={`/checkout/${t().slug}`} class="px-3 py-1 bg-green-600 hover:bg-green-500 text-white text-[10px] font-bold rounded transition">
            Join ${t().entry_fee}
          </A>
        </Show>
        <Show when={isLive()}>
          <A href={`/tournaments/${t().slug}`} class="text-[10px] text-gray-600 hover:text-white transition">View →</A>
        </Show>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SCHEDULE CARD — No rankings, date/price/prizes/countdown
// ═══════════════════════════════════════════════════════════════════════════

function ScheduleCard(props: { tournament: Tournament }) {
  const t = () => props.tournament;
  const icon = () => t().name.includes("Sprint") ? "⚡" : t().name.includes("Classic") ? "🏆" : "🏔️";
  const startDate = () => new Date(t().starts_at);

  return (
    <div class="bg-black rounded-xl overflow-hidden shadow-lg shadow-black/30">
      <div class="p-4">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <span class="text-lg">{icon()}</span>
            <h3 class="text-sm font-semibold text-white">{t().name}</h3>
          </div>
          <span class="text-[10px] text-gray-500 bg-[#111] px-2 py-0.5 rounded-full">Upcoming</span>
        </div>

        <div class="grid grid-cols-3 gap-1.5 mb-3 text-center">
          <div class="bg-[#111] rounded-lg py-2">
            <p class="text-[9px] text-gray-600 uppercase">Starts</p>
            <p class="text-xs font-medium text-white">{startDate().toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
          </div>
          <div class="bg-[#111] rounded-lg py-2">
            <p class="text-[9px] text-gray-600 uppercase">Entry</p>
            <p class="text-xs font-medium text-green-400">${t().entry_fee}</p>
          </div>
          <div class="bg-[#111] rounded-lg py-2">
            <p class="text-[9px] text-gray-600 uppercase">Account</p>
            <p class="text-xs font-medium text-white">${Number(t().account_size).toLocaleString()}</p>
          </div>
        </div>

        <div class="flex flex-wrap gap-1 mb-3">
          {(t().prizes as any[]).slice(0, 3).map((p) => (
            <span class="text-[9px] bg-[#111] px-1.5 py-0.5 rounded text-gray-500">
              <span class="text-yellow-400">#{p.rank_from}</span> {p.label || p.type}
            </span>
          ))}
        </div>

        <div class="flex items-center justify-between">
          <FlipClock targetDate={t().registration_opens_at} label="Registration in" size="sm" />
          <A href={`/tournaments/${t().slug}`} class="text-[10px] text-gray-600 hover:text-white transition">Details →</A>
        </div>
      </div>
    </div>
  );
}

function EmptyPanel() {
  return (
    <div class="bg-black rounded-xl flex items-center justify-center h-full min-h-[300px] shadow-lg shadow-black/30">
      <div class="text-center">
        <p class="text-gray-600 text-sm mb-2">No active tournaments</p>
        <A href="/schedule" class="text-xs text-green-500 hover:text-green-400">View schedule →</A>
      </div>
    </div>
  );
}
