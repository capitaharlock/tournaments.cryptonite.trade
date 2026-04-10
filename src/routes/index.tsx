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
import TournamentHero from "../components/tournament/TournamentHero";

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
          {/* RIGHT COLUMN — Upcoming tournaments agenda */}
          <div class="lg:flex-1 flex flex-col overflow-y-auto">
            <div class="bg-black rounded-xl overflow-hidden shadow-xl shadow-black/50 flex flex-col h-full">
              <div class="px-4 py-3 border-b border-[#1a1a1a]">
                <h2 class="text-sm font-bold text-white">Upcoming Tournaments</h2>
              </div>

              <div class="flex-1 overflow-y-auto">
                {/* Extra live tournaments first */}
                <For each={rest()}>
                  {(t) => <AgendaRow tournament={t} isLive />}
                </For>

                {/* Registration open */}
                <For each={(registering() || []).filter(r => !allLive().slice(0, 2).some(l => l.id === r.id))}>
                  {(t) => <AgendaRow tournament={t} isRegistering />}
                </For>

                {/* Scheduled */}
                <Show when={scheduled() && scheduled()!.length > 0}>
                  <For each={scheduled()}>
                    {(t) => <AgendaRow tournament={t} />}
                  </For>
                </Show>

                {/* Empty state */}
                <Show when={!rest().length && (!scheduled() || !scheduled()!.length)}>
                  <div class="text-center py-10 text-gray-700 text-xs">No upcoming tournaments</div>
                </Show>
              </div>

              {/* Recent results footer */}
              <Show when={finished() && finished()!.length > 0}>
                <div class="border-t border-[#1a1a1a] px-4 py-3">
                  <p class="text-[10px] text-gray-600 uppercase tracking-wider mb-2">Recent Results</p>
                  <For each={finished()!.slice(0, 3)}>
                    {(t) => (
                      <A href={`/tournaments/${t.slug}`} class="flex items-center justify-between py-1.5 text-xs hover:text-white transition text-gray-600">
                        <span>{t.name}</span>
                        <span class="text-gray-700">{t.reserved_spots}p →</span>
                      </A>
                    )}
                  </For>
                </div>
              </Show>
            </div>
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
  const isReg = () => t().status === "registration";

  const [apiRankings] = createResource(() => t().id, (id) => fetchRankings(id, props.maxRanks));
  const rankings = createMemo(() => {
    const real = apiRankings();
    if (real && real.length > 0) return real;
    return generateMockRankings(props.maxRanks, t().name.includes("Sprint") ? 6 : 8);
  });

  return (
    <div class="bg-black rounded-xl flex flex-col overflow-hidden shadow-xl shadow-black/50">
      {/* Hero — visual tournament identity */}
      <TournamentHero tournament={t()} />

      {/* Rankings */}
      <div>
        <MiniRanking
          rankings={rankings()}
          tournamentSlug={t().slug}
          maxRows={props.maxRanks}
          accountSize={Number(t().account_size)} prizes={t().prizes as any}
        />
      </div>

      {/* Footer */}
      <div class="flex items-center justify-between px-4 py-2.5 bg-[#0a0a0a] border-t border-white/[0.03]">
        <A
          href={`/tournaments/${t().slug}`}
          class="text-[11px] text-gray-500 hover:text-gray-300 transition"
        >
          +{t().total_spots - props.maxRanks} more participants
        </A>

        <div class="flex items-center gap-2">
          <Show when={isReg() && t().spots_available > 0}>
            <A href={`/checkout/${t().slug}`} class="px-3 py-1 bg-green-600 hover:bg-green-500 text-white text-[10px] font-bold rounded transition">
              Join ${t().entry_fee}
            </A>
          </Show>
          <A href={`/tournaments/${t().slug}`} class="text-[11px] text-green-500 hover:text-green-400 font-medium transition">
            View Full Tournament →
          </A>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// AGENDA ROW — Horizontal row for right column (no rankings)
// ═══════════════════════════════════════════════════════════════════════════

function AgendaRow(props: { tournament: Tournament; isLive?: boolean; isRegistering?: boolean }) {
  const t = () => props.tournament;
  const icon = () => t().name.includes("Sprint") ? "⚡" : t().name.includes("Classic") ? "🏆" : "🏔️";
  const startDate = () => new Date(t().starts_at);
  const durationDays = () => Math.round((new Date(t().ends_at).getTime() - new Date(t().starts_at).getTime()) / 86400000);
  const isReg = () => t().status === "registration";
  const canJoin = () => isReg() && t().spots_available > 0;

  return (
    <div class="px-4 py-3 border-b border-[#1a1a1a] hover:bg-[#0d0d0d] transition">
      {/* Row 1: Icon + Name + Duration + Status */}
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center gap-2">
          <span class="text-base">{icon()}</span>
          <span class="text-sm font-semibold text-white">{t().name}</span>
          <span class="text-[10px] text-gray-600 bg-[#1a1a1a] px-1.5 py-0.5 rounded">{durationDays()}d</span>
        </div>
        <div class="flex items-center gap-2">
          <Show when={props.isLive}>
            <span class="flex items-center gap-1 text-[10px] text-green-400">
              <span class="relative flex h-1.5 w-1.5"><span class="animate-ping absolute h-full w-full rounded-full bg-green-400 opacity-75" /><span class="relative rounded-full h-1.5 w-1.5 bg-green-500" /></span>
              Live
            </span>
          </Show>
          <Show when={isReg()}>
            <span class="text-[10px] text-green-400">Open</span>
          </Show>
          <Show when={!props.isLive && !isReg()}>
            <span class="text-[10px] text-gray-600">
              {startDate().toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          </Show>
        </div>
      </div>

      {/* Row 2: Stats + Prizes + CTA */}
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3 text-[10px] text-gray-500">
          <span>${Number(t().account_size).toLocaleString()}</span>
          <span class="text-gray-700">•</span>
          <span>{t().reserved_spots}/{t().total_spots} spots</span>
          <span class="text-gray-700">•</span>
          <span class="text-yellow-400/70">
            {(t().prizes as any[])[0]?.label || "Prizes"}
          </span>
        </div>

        <div class="flex items-center gap-2">
          <Show when={props.isLive}>
            <FlipClock targetDate={t().ends_at} size="sm" />
          </Show>
          <Show when={isReg() && !props.isLive}>
            <FlipClock targetDate={t().starts_at} size="sm" />
          </Show>
          <Show when={!props.isLive && !isReg()}>
            <FlipClock targetDate={t().registration_opens_at} size="sm" />
          </Show>

          <Show when={canJoin()}>
            <A href={`/checkout/${t().slug}`} class="px-3 py-1 bg-green-600 hover:bg-green-500 text-white text-[10px] font-bold rounded transition">
              Join ${t().entry_fee}
            </A>
          </Show>
          <Show when={!canJoin()}>
            <A href={`/tournaments/${t().slug}`} class="text-[10px] text-gray-600 hover:text-white transition">
              {props.isLive ? "Watch →" : "Details →"}
            </A>
          </Show>
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
