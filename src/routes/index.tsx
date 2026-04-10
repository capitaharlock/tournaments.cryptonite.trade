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

  // Sort: ending soonest first
  const allLive = createMemo(() => {
    const all = [...(active() || []), ...(registering() || [])];
    return all.sort((a, b) => new Date(a.ends_at).getTime() - new Date(b.ends_at).getTime());
  });

  const primary = () => allLive()[0] || null;    // Ends soonest — 40% left
  const secondary = () => allLive()[1] || null;   // Ends second — middle
  const rest = () => allLive().slice(2);          // Others

  return (
    <>
      <Title>Cryptonite Tournaments — Compete, Trade, Win</Title>
      <Header />

      <div class="min-h-screen flex flex-col">
        {/* ═══════════════════════════════════════════════════════════
            MAIN 3-COLUMN LAYOUT (fills viewport)
        ═══════════════════════════════════════════════════════════ */}
        <div class="flex-1 flex flex-col lg:flex-row">

          {/* ─── LEFT: Primary tournament (40%) ─── */}
          <div class="lg:w-[40%] border-r border-gray-800/50 flex flex-col">
            <Show when={primary()} fallback={<EmptySlot label="No active tournaments" />}>
              {(t) => <TournamentPanel tournament={t()} size="large" />}
            </Show>
          </div>

          {/* ─── MIDDLE: Secondary tournament (30%) ─── */}
          <div class="lg:w-[30%] border-r border-gray-800/50 flex flex-col">
            <Show when={secondary()} fallback={
              <Show when={scheduled() && scheduled()!.length > 0} fallback={<EmptySlot label="More tournaments coming soon" />}>
                <SchedulePanel tournaments={scheduled()!} />
              </Show>
            }>
              {(t) => <TournamentPanel tournament={t()} size="medium" />}
            </Show>
          </div>

          {/* ─── RIGHT: Schedule + additional tournaments (30%) ─── */}
          <div class="lg:w-[30%] flex flex-col overflow-y-auto">
            {/* Additional live tournaments */}
            <Show when={rest().length > 0}>
              <For each={rest()}>
                {(t) => <CompactTournament tournament={t} />}
              </For>
            </Show>

            {/* Schedule */}
            <Show when={scheduled() && scheduled()!.length > 0}>
              <SchedulePanel tournaments={scheduled()!} />
            </Show>

            {/* Registration open (< 24h) */}
            <Show when={registering() && registering()!.some(t => {
              const hoursToStart = (new Date(t.starts_at).getTime() - Date.now()) / 3600000;
              return hoursToStart < 24 && hoursToStart > 0;
            })}>
              <div class="p-4 border-t border-gray-800/50">
                <div class="bg-green-500/5 border border-green-500/20 rounded-lg p-4 text-center">
                  <p class="text-green-400 text-xs font-semibold mb-1">REGISTRATION CLOSING SOON</p>
                  <p class="text-gray-400 text-xs">Less than 24 hours to join</p>
                </div>
              </div>
            </Show>

            {/* Recent results */}
            <Show when={finished() && finished()!.length > 0}>
              <div class="p-4 border-t border-gray-800/50">
                <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Recent Results</h3>
                <For each={finished()!.slice(0, 3)}>
                  {(t) => (
                    <A
                      href={`/tournaments/${t.slug}`}
                      class="flex items-center justify-between py-2 text-sm hover:text-white transition text-gray-400"
                    >
                      <span>{t.name}</span>
                      <span class="text-xs text-gray-600">{t.reserved_spots}p →</span>
                    </A>
                  )}
                </For>
              </div>
            </Show>

            {/* How it works mini */}
            <div class="mt-auto p-4 border-t border-gray-800/50">
              <div class="grid grid-cols-3 gap-2 text-center text-[10px] text-gray-500">
                <div><span class="text-green-500 font-bold">1.</span> Pick & Pay</div>
                <div><span class="text-green-500 font-bold">2.</span> Trade</div>
                <div><span class="text-green-500 font-bold">3.</span> Win Prizes</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TOURNAMENT PANEL — Main column display (large or medium)
// ═══════════════════════════════════════════════════════════════════════════

function TournamentPanel(props: { tournament: Tournament; size: "large" | "medium" }) {
  const t = () => props.tournament;
  const isLive = () => t().status === "active";
  const isReg = () => t().status === "registration";
  const isLarge = () => props.size === "large";

  const [apiRankings] = createResource(() => t().id, (id) => fetchRankings(id, isLarge() ? 15 : 10));
  const rankings = createMemo(() => {
    const real = apiRankings();
    if (real && real.length > 0) return real;
    return generateMockRankings(isLarge() ? 15 : 10, t().name.includes("Sprint") ? 6 : 8);
  });

  const totalDays = () => {
    const diff = new Date(t().ends_at).getTime() - new Date(t().starts_at).getTime();
    return Math.round(diff / 86400000);
  };

  return (
    <div class={`flex flex-col h-full ${isLive() ? "" : ""}`}>
      {/* Header */}
      <div class="p-4 border-b border-gray-800/50">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <span class="text-lg">{t().name.includes("Sprint") ? "⚡" : t().name.includes("Classic") ? "🏆" : "🏔️"}</span>
            <h2 class={`font-bold text-white ${isLarge() ? "text-xl" : "text-lg"}`}>{t().name}</h2>
          </div>
          <Show when={isLive()}>
            <span class="flex items-center gap-1.5 text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
              <span class="relative flex h-2 w-2">
                <span class="animate-ping absolute h-full w-full rounded-full bg-green-400 opacity-75" />
                <span class="relative rounded-full h-2 w-2 bg-green-500" />
              </span>
              LIVE
            </span>
          </Show>
          <Show when={isReg()}>
            <span class="text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">OPEN</span>
          </Show>
        </div>

        {/* Stats row */}
        <div class="flex items-center gap-4 text-xs text-gray-400 mb-3">
          <span>${Number(t().account_size).toLocaleString()} account</span>
          <span>{t().reserved_spots}/{t().total_spots} joined</span>
          <span>${t().entry_fee} entry</span>
        </div>

        {/* Progress bar */}
        <Show when={isLive()}>
          <TournamentProgress startsAt={t().starts_at} endsAt={t().ends_at} totalDays={totalDays()} />
        </Show>

        {/* Countdown */}
        <div class="mt-3">
          <Show when={isLive()}>
            <FlipClock targetDate={t().ends_at} label="ENDS IN" size={isLarge() ? "lg" : "md"} />
          </Show>
          <Show when={isReg()}>
            <FlipClock targetDate={t().starts_at} label="STARTS IN" size={isLarge() ? "lg" : "md"} />
          </Show>
        </div>
      </div>

      {/* Prizes */}
      <div class="px-4 py-2 border-b border-gray-800/50">
        <div class="flex flex-wrap gap-1.5">
          {(t().prizes as any[]).map((p) => (
            <span class="text-[10px] bg-gray-800/60 border border-gray-700/30 px-2 py-0.5 rounded text-gray-400">
              <span class="text-green-400 font-mono">#{p.rank_from}{p.rank_to > p.rank_from ? `–${p.rank_to}` : ""}</span>
              {" "}{p.label || p.type}
            </span>
          ))}
        </div>
      </div>

      {/* Rankings — fills remaining space */}
      <div class="flex-1 overflow-y-auto p-2">
        <div class="flex items-center justify-between px-2 py-1 mb-1">
          <span class="text-[10px] text-gray-600 uppercase tracking-wider">Rank</span>
          <span class="text-[10px] text-gray-600 uppercase tracking-wider">Profit %</span>
        </div>
        <MiniRanking rankings={rankings()} tournamentSlug={t().slug} maxRows={isLarge() ? 15 : 10} />
      </div>

      {/* CTA */}
      <Show when={isReg() && t().spots_available > 0}>
        <A
          href={`/checkout/${t().slug}`}
          class="block text-center py-3 bg-green-600 hover:bg-green-500 text-white font-bold transition"
        >
          Join Now — ${t().entry_fee}
        </A>
      </Show>
      <Show when={isLive()}>
        <A
          href={`/tournaments/${t().slug}`}
          class="block text-center py-2.5 bg-gray-800/50 hover:bg-gray-700 text-gray-400 text-sm transition"
        >
          Full Rankings →
        </A>
      </Show>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPACT TOURNAMENT — For right column additional tournaments
// ═══════════════════════════════════════════════════════════════════════════

function CompactTournament(props: { tournament: Tournament }) {
  const t = () => props.tournament;
  const isLive = () => t().status === "active";

  const [apiRankings] = createResource(() => t().id, (id) => fetchRankings(id, 5));
  const rankings = createMemo(() => {
    const real = apiRankings();
    if (real && real.length > 0) return real;
    return generateMockRankings(5);
  });

  return (
    <div class="border-b border-gray-800/50 p-3">
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center gap-1.5">
          <span>{t().name.includes("Sprint") ? "⚡" : "🏆"}</span>
          <span class="text-sm font-medium text-white">{t().name}</span>
        </div>
        <Show when={isLive()}>
          <FlipClock targetDate={t().ends_at} size="sm" />
        </Show>
      </div>
      <MiniRanking rankings={rankings()} tournamentSlug={t().slug} maxRows={5} />
      <A
        href={`/tournaments/${t().slug}`}
        class="block text-center mt-2 py-1.5 text-xs text-gray-500 hover:text-white bg-gray-800/30 rounded transition"
      >
        View →
      </A>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SCHEDULE PANEL — Upcoming tournaments list
// ═══════════════════════════════════════════════════════════════════════════

function SchedulePanel(props: { tournaments: Tournament[] }) {
  return (
    <div class="p-4 border-t border-gray-800/50">
      <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Upcoming</h3>
      <div class="space-y-3">
        <For each={props.tournaments}>
          {(t) => (
            <A
              href={`/tournaments/${t.slug}`}
              class="block bg-gray-900/30 border border-gray-800/30 rounded-lg p-3 hover:border-gray-700/50 transition"
            >
              <div class="flex items-center justify-between mb-1.5">
                <div class="flex items-center gap-1.5">
                  <span>{t.name.includes("Sprint") ? "⚡" : t.name.includes("Classic") ? "🏆" : "🏔️"}</span>
                  <span class="text-sm font-medium text-white">{t.name}</span>
                </div>
                <span class="text-xs text-gray-600">${t.entry_fee}</span>
              </div>
              <div class="flex items-center justify-between text-xs text-gray-500">
                <span>{t.total_spots} spots • ${Number(t.account_size).toLocaleString()}</span>
              </div>
              <div class="mt-2">
                <FlipClock targetDate={t.registration_opens_at} label="Registration in" size="sm" />
              </div>
            </A>
          )}
        </For>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// EMPTY SLOT
// ═══════════════════════════════════════════════════════════════════════════

function EmptySlot(props: { label: string }) {
  return (
    <div class="flex-1 flex items-center justify-center p-8">
      <div class="text-center">
        <p class="text-gray-600 text-sm">{props.label}</p>
        <A href="/schedule" class="text-xs text-green-500 hover:text-green-400 mt-2 inline-block">
          View schedule →
        </A>
      </div>
    </div>
  );
}
