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

      <div class="min-h-screen bg-black">
        <div class="flex flex-col lg:flex-row min-h-[calc(100vh-48px)] gap-3 p-3">

          {/* LEFT (42%) */}
          <div class="lg:w-[42%] flex-shrink-0">
            <Show when={primary()} fallback={<EmptyPanel />}>
              {(t) => <TournamentPanel tournament={t()} maxRanks={10} clockSize="lg" />}
            </Show>
          </div>

          {/* MIDDLE (30%) */}
          <div class="lg:w-[30%] flex-shrink-0">
            <Show when={secondary()} fallback={<EmptyPanel />}>
              {(t) => <TournamentPanel tournament={t()} maxRanks={10} clockSize="md" />}
            </Show>
          </div>

          {/* RIGHT (28%) */}
          <div class="lg:flex-1 flex flex-col gap-3 overflow-y-auto">
            <For each={rest()}>
              {(t) => <CompactPanel tournament={t} />}
            </For>
            <Show when={scheduled() && scheduled()!.length > 0}>
              <For each={scheduled()}>
                {(t) => <ScheduleCard tournament={t} />}
              </For>
            </Show>
            <Show when={finished() && finished()!.length > 0}>
              <div class="bg-gray-900 border border-gray-800 rounded-xl p-4">
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
            <div class="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4 mt-auto">
              <div class="grid grid-cols-3 gap-3 text-center text-[10px]">
                <div><div class="w-6 h-6 rounded-full bg-green-600/20 text-green-400 text-[10px] font-bold flex items-center justify-center mx-auto mb-1">1</div><p class="text-gray-500"><span class="text-gray-300">Pick</span> & Pay</p></div>
                <div><div class="w-6 h-6 rounded-full bg-green-600/20 text-green-400 text-[10px] font-bold flex items-center justify-center mx-auto mb-1">2</div><p class="text-gray-500"><span class="text-gray-300">Trade</span> Crypto</p></div>
                <div><div class="w-6 h-6 rounded-full bg-green-600/20 text-green-400 text-[10px] font-bold flex items-center justify-center mx-auto mb-1">3</div><p class="text-gray-500"><span class="text-gray-300">Win</span> Prizes</p></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function TournamentPanel(props: { tournament: Tournament; maxRanks: number; clockSize: "sm" | "md" | "lg" }) {
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
    <div class="bg-gray-900 border border-gray-800 rounded-xl flex flex-col h-full overflow-hidden">
      <div class="p-5 pb-4">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <span class="text-xl">{icon()}</span>
            <h2 class="text-lg font-bold text-white">{t().name}</h2>
          </div>
          <Show when={isLive()}>
            <span class="flex items-center gap-1.5 text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full">
              <span class="relative flex h-2 w-2"><span class="animate-ping absolute h-full w-full rounded-full bg-green-400 opacity-75" /><span class="relative rounded-full h-2 w-2 bg-green-500" /></span>
              LIVE
            </span>
          </Show>
          <Show when={isReg()}>
            <span class="text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full">OPEN</span>
          </Show>
        </div>

        <div class="grid grid-cols-3 gap-2 mb-4">
          <div class="bg-black/40 rounded-lg px-3 py-2"><p class="text-[10px] text-gray-600 uppercase">Account</p><p class="text-sm font-semibold text-white">${Number(t().account_size).toLocaleString()}</p></div>
          <div class="bg-black/40 rounded-lg px-3 py-2"><p class="text-[10px] text-gray-600 uppercase">Entry</p><p class="text-sm font-semibold text-green-400">${t().entry_fee}</p></div>
          <div class="bg-black/40 rounded-lg px-3 py-2"><p class="text-[10px] text-gray-600 uppercase">Players</p><p class="text-sm font-semibold text-white">{t().reserved_spots}<span class="text-gray-600">/{t().total_spots}</span></p></div>
        </div>

        <Show when={isLive()}>
          <div class="mb-4"><TournamentProgress startsAt={t().starts_at} endsAt={t().ends_at} totalDays={totalDays()} /></div>
        </Show>

        <Show when={isLive()}><FlipClock targetDate={t().ends_at} label="ENDS IN" size={props.clockSize} /></Show>
        <Show when={isReg()}><FlipClock targetDate={t().starts_at} label="STARTS IN" size={props.clockSize} /></Show>
      </div>

      <div class="px-5 py-2.5 bg-black/30 border-y border-gray-800/50">
        <div class="flex flex-wrap gap-1.5">
          {(t().prizes as any[]).map((p) => (
            <span class="text-[10px] bg-gray-800 border border-gray-700/50 px-2 py-0.5 rounded-full text-gray-400">
              <span class="text-green-400 font-mono">#{p.rank_from}{p.rank_to > p.rank_from ? `–${p.rank_to}` : ""}</span>{" "}{p.label || p.type}
            </span>
          ))}
        </div>
      </div>

      <div class="flex-1 overflow-y-auto px-3 py-2">
        <MiniRanking rankings={rankings()} tournamentSlug={t().slug} maxRows={props.maxRanks} />
      </div>

      <Show when={isReg() && t().spots_available > 0}>
        <A href={`/checkout/${t().slug}`} class="block text-center py-3 bg-green-600 hover:bg-green-500 text-white font-bold text-sm transition-colors">
          Join Now — ${t().entry_fee}
        </A>
      </Show>
      <Show when={isLive()}>
        <A href={`/tournaments/${t().slug}`} class="block text-center py-2.5 bg-black/30 hover:bg-gray-800 text-gray-400 text-sm transition border-t border-gray-800/50">
          Full Rankings →
        </A>
      </Show>
    </div>
  );
}

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
    <div class="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div class="px-4 py-3 flex items-center justify-between border-b border-gray-800/50">
        <div class="flex items-center gap-2"><span>{icon()}</span><span class="text-sm font-semibold text-white">{t().name}</span></div>
        <Show when={isLive()}><FlipClock targetDate={t().ends_at} size="sm" /></Show>
        <Show when={isReg()}><FlipClock targetDate={t().starts_at} size="sm" /></Show>
      </div>
      <div class="px-2 py-1"><MiniRanking rankings={rankings()} tournamentSlug={t().slug} maxRows={5} /></div>
      <Show when={isReg() && t().spots_available > 0}>
        <A href={`/checkout/${t().slug}`} class="block text-center py-2 bg-green-600 hover:bg-green-500 text-white text-xs font-bold transition">Join — ${t().entry_fee}</A>
      </Show>
      <Show when={isLive() || !isReg()}>
        <A href={`/tournaments/${t().slug}`} class="block text-center py-2 text-xs text-gray-600 hover:text-white bg-black/20 border-t border-gray-800/50 transition">View →</A>
      </Show>
    </div>
  );
}

function ScheduleCard(props: { tournament: Tournament }) {
  const t = () => props.tournament;
  const icon = () => t().name.includes("Sprint") ? "⚡" : t().name.includes("Classic") ? "🏆" : "🏔️";
  const startDate = () => new Date(t().starts_at);

  return (
    <div class="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div class="p-4">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2"><span class="text-lg">{icon()}</span><h3 class="text-sm font-semibold text-white">{t().name}</h3></div>
          <span class="text-[10px] text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full uppercase">Scheduled</span>
        </div>
        <div class="grid grid-cols-2 gap-2 mb-3">
          <div class="bg-black/30 rounded-lg px-3 py-2">
            <p class="text-[9px] text-gray-600 uppercase">Starts</p>
            <p class="text-xs font-medium text-white">{startDate().toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
            <p class="text-[10px] text-gray-500">{startDate().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</p>
          </div>
          <div class="bg-black/30 rounded-lg px-3 py-2">
            <p class="text-[9px] text-gray-600 uppercase">Entry Fee</p>
            <p class="text-xs font-medium text-green-400">${t().entry_fee}</p>
            <p class="text-[10px] text-gray-500">${Number(t().account_size).toLocaleString()} account</p>
          </div>
        </div>
        <div class="flex flex-wrap gap-1 mb-3">
          {(t().prizes as any[]).slice(0, 3).map((p) => (
            <span class="text-[9px] bg-gray-800/60 px-1.5 py-0.5 rounded text-gray-500"><span class="text-green-500">#{p.rank_from}</span> {p.label || p.type}</span>
          ))}
        </div>
        <FlipClock targetDate={t().registration_opens_at} label="REGISTRATION IN" size="sm" />
      </div>
      <A href={`/tournaments/${t().slug}`} class="block text-center py-2.5 bg-black/20 border-t border-gray-800/50 text-xs text-gray-500 hover:text-white transition">View Details →</A>
    </div>
  );
}

function EmptyPanel() {
  return (
    <div class="bg-gray-900 border border-gray-800 rounded-xl flex items-center justify-center h-full min-h-[300px]">
      <div class="text-center"><p class="text-gray-600 text-sm mb-2">No active tournaments</p><A href="/schedule" class="text-xs text-green-500 hover:text-green-400">View schedule →</A></div>
    </div>
  );
}
