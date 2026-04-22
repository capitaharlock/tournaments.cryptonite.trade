import { createResource, createSignal, Show, onCleanup, createMemo, createEffect } from "solid-js";
import { createStore, reconcile } from "solid-js/store";
import { useParams, A } from "@solidjs/router";
import { Title } from "@solidjs/meta";
import { fetchTournament, fetchRankingsWithMeta } from "../../../services/api";
import type { Tournament } from "../../../types/tournament";
import Header from "../../../components/layout/Header";
import FlipClock from "../../../components/tournament/FlipClock";
import TournamentProgress from "../../../components/tournament/TournamentProgress";
import RankingTable from "../../../components/tournament/RankingTable";
import { getStatusStyle } from "../../../lib/statusStyles";

const WORKER_WS_URL = import.meta.env.VITE_WORKER_WS_URL || "wss://cryptonite-tournament-worker.fly.dev";

export default function TournamentDetail() {
  const params = useParams<{ slug: string }>();
  const [tournament, { refetch: refetchTournament }] = createResource(() => params.slug, fetchTournament);

  // ─── Live rankings via store + reconcile (no flash, stable identity) ────
  // Critical: use createStore + reconcile keyed by entry_id so row objects
  // keep the SAME reference across polls when entry_id doesn't change.
  // Otherwise <For> remounts every row each poll → <LivePositions> loses
  // its internal state and the expanded "positions" panel collapses.
  const [rankingsStore, setRankingsStore] = createStore<{ list: any[] }>({ list: [] });
  const [hasLoadedOnce, setHasLoadedOnce] = createSignal(false);
  const [rankingsStale, setRankingsStale] = createSignal(false);

  const loadRankings = async () => {
    const id = tournament()?.id;
    if (!id) return;
    try {
      const useLive = tournament()?.status === "active";
      const { data, stale } = await fetchRankingsWithMeta(id, 100, useLive);
      setRankingsStale(stale);
      // reconcile merges by entry_id: same row => same object ref => <For> keeps children mounted
      setRankingsStore("list", reconcile(data || [], { key: "entry_id", merge: true }));
      setHasLoadedOnce(true);
    } catch (e) {
      console.error("rankings fetch failed", e);
    }
  };

  // ─── Re-fetch tournament status every 30s when live ──────────────────
  // Prevents stale status after tournament transitions (active → closing/finished)
  // which would otherwise leave the WebSocket in an infinite reconnect loop.
  let tournamentRefetchInterval: ReturnType<typeof setInterval> | null = null;
  createEffect(() => {
    if (tournament()?.status === "active") {
      if (!tournamentRefetchInterval) {
        tournamentRefetchInterval = setInterval(refetchTournament, 30_000);
      }
    } else {
      if (tournamentRefetchInterval) {
        clearInterval(tournamentRefetchInterval);
        tournamentRefetchInterval = null;
      }
    }
  });
  onCleanup(() => {
    if (tournamentRefetchInterval) clearInterval(tournamentRefetchInterval);
  });

  // Initial HTTP fetch ONLY for non-active tournaments (finished, registration,
  // scheduled). Active tournaments get their data exclusively from the WebSocket
  // to avoid the flicker where stale HTTP data briefly overwrites live WS data.
  createEffect(() => {
    const t = tournament();
    if (t?.id && !hasLoadedOnce() && t.status !== "active") {
      loadRankings();
    }
  });

  const rankings = createMemo(() => {
    return rankingsStore.list;
  });

  // ─── WebSocket for active AND registration tournaments ───────────────
  // Active: streams full rankings (including positions) every 1s.
  // Registration: receives push events (sign-ups, status changes) the
  // moment they happen — no polling needed.
  // Always falls back to the 30s tournament refetch if the WS drops an
  // event or disconnects; nothing is ever lost.
  let wsRef: WebSocket | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  // Statuses that benefit from a live connection. Finished / cancelled get
  // only the initial fetch (no updates needed).
  const wsWantedStatuses = new Set(["registration", "scheduled", "active"]);

  const connectWs = (tournamentId: string) => {
    if (wsRef) {
      wsRef.close();
      wsRef = null;
    }
    const url = `${WORKER_WS_URL}/ws/tournaments/${tournamentId}`;
    const ws = new WebSocket(url);

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        // Dispatch by explicit type (new push events) first, then fall
        // back to the legacy ranking-frame format (no `type` field).
        if (msg.type === "registration") {
          // Merge count fields into the existing tournament signal so the
          // whole UI (spots counter, progress bar, CTA) reacts atomically.
          refetchTournament();
          return;
        }
        if (msg.type === "status_change") {
          refetchTournament();
          return;
        }
        if (msg.rankings && Array.isArray(msg.rankings) && msg.rankings.length > 0) {
          // Only update if Worker sent actual data (not empty — which means
          // it hasn't completed its first price+position cycle yet).
          setRankingsStore("list", reconcile(msg.rankings, { key: "entry_id", merge: true }));
          setHasLoadedOnce(true);
        }
      } catch (e) {
        console.error("ws message parse error", e);
      }
    };

    ws.onclose = () => {
      wsRef = null;
      // Trigger a tournament re-fetch so that if the tournament has ended,
      // tournament()?.status will update before the reconnect fires.
      refetchTournament();
      // Reconnect after 3s if the tournament still benefits from a live WS.
      if (wsWantedStatuses.has(tournament()?.status ?? "")) {
        reconnectTimer = setTimeout(() => {
          if (wsWantedStatuses.has(tournament()?.status ?? "")) connectWs(tournamentId);
        }, 3000);
      }
    };

    ws.onerror = () => {
      // onclose will fire after onerror, which triggers reconnect
      ws.close();
    };

    wsRef = ws;
  };

  // Open/close WebSocket when tournament status changes
  createEffect(() => {
    const t = tournament();
    if (t && wsWantedStatuses.has(t.status) && t.id) {
      connectWs(t.id);
    } else {
      // Not a status we care to stream — close any open WS
      if (wsRef) {
        wsRef.close();
        wsRef = null;
      }
    }
  });

  onCleanup(() => {
    if (wsRef) {
      wsRef.close();
      wsRef = null;
    }
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  });

  const isLive = () => tournament()?.status === "active";
  const isReg = () => tournament()?.status === "registration";
  const isScheduled = () => tournament()?.status === "scheduled";
  const isFinished = () => tournament()?.status === "finished";
  const style = () => getStatusStyle(tournament()?.status);


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

              {/* ═══ DETAIL HERO — bigger, more color, prominent countdown ═══ */}
              <DetailHero tournament={t()} />

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
                        <Show when={isLive() && !rankingsStale()}>
                          <span class="flex items-center gap-1 text-[10px] text-green-400">
                            <span class="relative flex h-1.5 w-1.5">
                              <span class="animate-ping absolute h-full w-full rounded-full bg-green-400 opacity-75" />
                              <span class="relative rounded-full h-1.5 w-1.5 bg-green-500" />
                            </span>
                            Live
                          </span>
                        </Show>
                        <Show when={isLive() && rankingsStale()}>
                          <span class="flex items-center gap-1 text-[10px] text-yellow-500" title="Live feed unavailable — showing last known rankings (may be up to 1 min old)">
                            <svg class="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
                            Delayed
                          </span>
                        </Show>
                      </div>
                      <div class="flex items-center gap-2">
                        <Show when={rankings().length > 0 && (isLive() || isFinished())}>
                          <button
                            onClick={() => {
                              const code = prompt("Enter your nickname or entry ID:");
                              if (!code) return;
                              const term = code.trim().toLowerCase();
                              const match = (rankings() || []).find((r: any) =>
                                (r.nickname || "").toLowerCase().includes(term) ||
                                r.entry_id === term
                              );
                              if (!match) {
                                alert("Not found in this tournament's rankings.");
                                return;
                              }
                              // Scroll into view + highlight
                              const el = document.querySelector(`[data-entry-id="${match.entry_id}"]`);
                              if (el) {
                                el.scrollIntoView({ behavior: "smooth", block: "center" });
                                el.classList.add("ring-2", "ring-cyan-400", "bg-cyan-500/10");
                                setTimeout(() => {
                                  el.classList.remove("ring-2", "ring-cyan-400", "bg-cyan-500/10");
                                }, 3000);
                              }
                            }}
                            class="text-[10px] px-2 py-0.5 rounded border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10 transition"
                          >
                            🔍 Find me
                          </button>
                        </Show>
                        <span class="text-[10px] text-gray-600">
                          {rankings().length} of {t().total_spots} participants
                        </span>
                      </div>
                    </div>

                    {/* Rankings / Participants table */}
                    <Show
                      when={rankings().length > 0 && !isScheduled()}
                      fallback={
                        <div class="text-center py-16">
                          <div class={`inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br ${style().softGradient} border ${style().ring} mb-3`}>
                            <svg class={`w-5 h-5 ${style().accent}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                          </div>
                          <p class={`text-sm font-bold ${style().accent} mb-1`}>
                            {isScheduled() ? "Tournament Not Started" : isReg() ? "Waiting For Participants" : "No participants yet"}
                          </p>
                          <p class="text-gray-600 text-xs">
                            {isScheduled()
                              ? "Rankings will appear once registration opens"
                              : isReg()
                              ? "Be the first to join — registration is open"
                              : ""}
                          </p>
                        </div>
                      }
                    >
                      <RankingTable rankings={rankings()} prizes={isReg() ? [] : (t().prizes as any)} tournamentId={t().id} preRace={isReg() || isScheduled()} />
                    </Show>
                  </div>
                </div>

                {/* RIGHT — Sidebar info */}
                <div class="lg:w-72 flex flex-col gap-4">

                  {/* ═══ CTA CARD — fully conditional by status ═══ */}
                  <Show when={isReg() && t().spots_available > 0}>
                    <div class={`relative bg-gradient-to-br ${style().softGradient} rounded-xl overflow-hidden shadow-xl ${style().glow} border ${style().ring} p-5`}>
                      <div class="absolute inset-0 opacity-[0.05] pointer-events-none" style="background: repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.3) 10px, rgba(255,255,255,0.3) 20px);" />
                      <div class="relative text-center">
                        <div class="flex items-center justify-center gap-1.5 mb-2">
                          <span class={`w-1.5 h-1.5 rounded-full ${style().accent.replace("text-", "bg-")} animate-pulse`} />
                          <p class={`text-[10px] font-black uppercase tracking-[0.15em] ${style().accent}`}>Registration Open</p>
                        </div>
                        <p class="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Entry Fee</p>
                        <p class="text-4xl font-black text-white mb-3 leading-none">${t().entry_fee}</p>
                        <A
                          href={`/checkout/${t().slug}`}
                          class={`block w-full py-3.5 ${style().cta} font-black rounded-lg transition text-sm mb-3 shadow-lg ${style().glow}`}
                        >
                          SIGN UP NOW →
                        </A>
                        <div class="bg-black/40 rounded-lg p-2.5">
                          <FlipClock targetDate={t().starts_at} label="REGISTRATION CLOSES IN" size="sm" />
                        </div>
                        <p class="text-gray-400 text-[10px] mt-2">{t().spots_available} of {t().total_spots} spots remaining</p>
                      </div>
                    </div>
                  </Show>

                  <Show when={isReg() && t().spots_available <= 0}>
                    <div class="bg-black rounded-xl overflow-hidden shadow-xl shadow-black/50 p-5">
                      <div class="text-center">
                        <p class="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Entry Fee</p>
                        <p class="text-3xl font-black text-gray-500 mb-3 line-through">${t().entry_fee}</p>
                        <div class="w-full py-3 bg-gray-800 text-gray-500 font-bold rounded-lg text-sm">
                          Tournament Full
                        </div>
                        <p class="text-gray-600 text-[10px] mt-2">{t().total_spots}/{t().total_spots} spots filled</p>
                      </div>
                    </div>
                  </Show>

                  <Show when={isScheduled()}>
                    <div class={`relative bg-gradient-to-br ${style().softGradient} rounded-xl overflow-hidden shadow-xl ${style().glow} border ${style().ring} p-5`}>
                      <div class="absolute inset-0 opacity-[0.05] pointer-events-none" style="background: repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.3) 10px, rgba(255,255,255,0.3) 20px);" />
                      <div class="relative text-center">
                        <div class="flex items-center justify-center gap-1.5 mb-2">
                          <span class={`w-1.5 h-1.5 rounded-full ${style().accent.replace("text-", "bg-")} animate-pulse`} />
                          <p class={`text-[10px] font-black uppercase tracking-[0.15em] ${style().accent}`}>Coming Soon</p>
                        </div>
                        <p class="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Entry Fee</p>
                        <p class="text-4xl font-black text-white mb-3 leading-none">${t().entry_fee}</p>
                        <A
                          href={`/checkout/${t().slug}`}
                          class={`block w-full py-3.5 ${style().cta} font-black rounded-lg transition text-sm mb-3 shadow-lg ${style().glow}`}
                        >
                          NOTIFY ME WHEN OPEN →
                        </A>
                        <div class="bg-black/40 rounded-lg p-2.5">
                          <FlipClock targetDate={t().registration_opens_at} label="REGISTRATION OPENS IN" size="sm" />
                        </div>
                        <p class="text-gray-400 text-[10px] mt-2">{t().total_spots} spots total</p>
                      </div>
                    </div>
                  </Show>

                  <Show when={isLive()}>
                    <div class={`relative bg-gradient-to-br ${style().softGradient} rounded-xl overflow-hidden shadow-xl ${style().glow} border ${style().ring} p-5`}>
                      <div class="relative text-center">
                        <div class="flex items-center justify-center gap-1.5 mb-2">
                          <span class="relative flex h-2 w-2">
                            <span class="animate-ping absolute h-full w-full rounded-full bg-green-400 opacity-75" />
                            <span class="relative rounded-full h-2 w-2 bg-green-500" />
                          </span>
                          <p class={`text-[10px] font-black uppercase tracking-[0.15em] ${style().accent}`}>Tournament Live</p>
                        </div>
                        <p class="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Registration Closed</p>
                        <p class="text-2xl font-black text-white mb-3">In Progress</p>
                        <div class="bg-black/40 rounded-lg p-2.5 mb-3">
                          <FlipClock targetDate={t().ends_at} label="ENDS IN" size="sm" />
                        </div>
                        <p class="text-gray-400 text-[10px]">{t().reserved_spots} traders competing</p>
                      </div>
                    </div>
                  </Show>

                  <Show when={isFinished()}>
                    <div class={`relative bg-gradient-to-br ${style().softGradient} rounded-xl overflow-hidden shadow-xl ${style().glow} border ${style().ring} p-5`}>
                      <div class="relative text-center">
                        <p class={`text-[10px] font-black uppercase tracking-[0.15em] ${style().accent} mb-2`}>Tournament Ended</p>
                        <p class="text-2xl font-black text-white mb-1">
                          {new Date(t().ends_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                        <p class="text-gray-500 text-[10px] mb-3">Final results below</p>
                        <A
                          href="/schedule"
                          class="block w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-lg transition text-sm"
                        >
                          VIEW UPCOMING TOURNAMENTS →
                        </A>
                      </div>
                    </div>
                  </Show>

                  {/* Prize breakdown — position by position */}
                  <div class="bg-black rounded-xl overflow-hidden shadow-xl shadow-black/50">
                    <div class={`px-4 py-3 flex items-center justify-between bg-gradient-to-r ${style().softGradient}`}>
                      <h3 class="text-sm font-bold text-white">
                        {isFinished() ? "Prizes Awarded" : "Prize Breakdown"}
                      </h3>
                      <span class="text-[10px] text-white/50">
                        {(t().prizes as any[]).reduce((s, p) => s + (p.rank_to - p.rank_from + 1), 0)} of {t().total_spots} win
                      </span>
                    </div>
                    <div class="p-3 space-y-1">
                      {(t().prizes as any[]).map((p, i) => (
                        <div class={`rounded-lg px-3 py-2.5 ${i === 0 ? "bg-yellow-400/5 border border-yellow-400/15" : "bg-[#0a0a0a]"}`}>
                          <div class="flex items-center justify-between mb-1">
                            <span class={`text-xs font-bold ${i === 0 ? "text-yellow-400" : "text-gray-400"}`}>
                              {p.rank_from === p.rank_to
                                ? `${p.rank_from}${p.rank_from === 1 ? "st" : p.rank_from === 2 ? "nd" : p.rank_from === 3 ? "rd" : "th"} Place`
                                : `${p.rank_from}${p.rank_from === 1 ? "st" : p.rank_from === 2 ? "nd" : p.rank_from === 3 ? "rd" : "th"} – ${p.rank_to}th Place`
                              }
                            </span>
                            <span class="text-[10px] text-gray-600">
                              {p.rank_to - p.rank_from + 1} {p.rank_to - p.rank_from + 1 === 1 ? "winner" : "winners"}
                            </span>
                          </div>
                          <p class={`text-base font-bold ${i === 0 ? "text-yellow-300" : "text-white"}`}>
                            {p.label || p.type}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Rules — hidden on finished tournaments (focus on results) */}
                  <Show when={!isFinished()}>
                    <div class="bg-black rounded-xl overflow-hidden shadow-xl shadow-black/50">
                      <div class="px-4 py-3 border-b border-[#1a1a1a]">
                        <h3 class="text-sm font-bold text-white">Rules</h3>
                      </div>
                      <div class="p-4 space-y-2.5 text-sm">
                        <RuleRow label="Max Drawdown" value={`${t().max_drawdown_percentage}%`} />
                        <RuleRow label="Daily Drawdown" value={`${t().max_daily_drawdown_percentage}%`} />
                        <RuleRow label="Ranked By" value="Profit %" />
                        <RuleRow label="Instruments" value="Crypto pairs" />
                        <RuleRow label="Leverage" value="None (1:1)" />
                        <RuleRow label="Elimination" value="Drawdown breach" />
                      </div>
                    </div>
                  </Show>

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

function DetailHero(props: { tournament: Tournament }) {
  const t = () => props.tournament;
  const style = () => getStatusStyle(t().status);
  const isLive = () => t().status === "active";
  const isReg = () => t().status === "registration";
  const isScheduled = () => t().status === "scheduled";
  const isFinished = () => t().status === "finished";
  const totalDays = () => Math.round((new Date(t().ends_at).getTime() - new Date(t().starts_at).getTime()) / 86400000);
  const isSprint = () => t().name.includes("Sprint");
  const isClassic = () => t().name.includes("Classic");
  const spotsPercent = () => Math.max((t().reserved_spots / t().total_spots) * 100, 3);


  return (
    <div class={`bg-black rounded-xl overflow-hidden shadow-xl ${style().glow} border ${style().ring}`}>
      {/* ═══ BANNER — compact, vivid, prizes visible ═══ */}
      <div class={`relative bg-gradient-to-r ${style().gradient}`}>
        <div class="absolute inset-0 opacity-[0.08]" style="background: repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,0.2) 8px, rgba(255,255,255,0.2) 16px);" />
        <div class="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/60 to-transparent" />

        <div class="relative px-6 py-5">
          <div class="flex items-start justify-between gap-6">
            {/* LEFT: Title (2 lines) + Prizes big */}
            <div class="flex-1 min-w-0">
              {/* Line 1: Type label */}
              <p class="text-sm text-white/60 font-medium mb-0.5">
                Tournament • {totalDays()} Day {isSprint() ? "Sprint" : isClassic() ? "Classic" : "Marathon"}
                <span class={`ml-2 inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full align-middle ${style().badge}`}>
                  <Show when={isLive()}>
                    <span class="relative flex h-1.5 w-1.5"><span class="animate-ping absolute h-full w-full rounded-full bg-white opacity-75" /><span class="relative rounded-full h-1.5 w-1.5 bg-white" /></span>
                  </Show>
                  {style().label}
                </span>
              </p>

              {/* Line 2: Tournament name — big */}
              <h1 class="text-3xl font-black text-white leading-tight drop-shadow-md mb-4">{t().name}</h1>

              {/* Prizes — one box per prize */}
              <div class="flex items-center gap-2 flex-wrap">
                {(t().prizes as any[]).map((p, i) => (
                  <div class={`flex items-center gap-2 rounded-lg px-3 py-2 border ${
                    i === 0
                      ? "bg-yellow-400/10 border-yellow-400/30"
                      : "bg-black/30 border-white/10"
                  }`}>
                    <span class={`text-lg font-black ${i === 0 ? "text-yellow-300" : "text-white"}`}>
                      {p.type === "cash" ? `$${p.value}` : (p.label || p.type).replace("Free ", "").replace(/\$\d+K /g, "")}
                    </span>
                    <span class={`text-base font-black ${i === 0 ? "text-yellow-200" : "text-white/70"}`}>
                      x{p.rank_to - p.rank_from + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT: Countdown — big, no wrapper, just the clock */}
            <div class="flex-shrink-0">
              <Show when={isLive()}>
                <FlipClock targetDate={t().ends_at} label="ENDS IN" size="lg" />
              </Show>
              <Show when={isReg()}>
                <FlipClock targetDate={t().starts_at} label="STARTS IN" size="lg" />
              </Show>
              <Show when={isScheduled()}>
                <FlipClock targetDate={t().registration_opens_at} label="REGISTRATION IN" size="lg" />
              </Show>
              <Show when={isFinished()}>
                <div class="text-center px-4 py-3 bg-black/30 rounded-lg">
                  <p class="text-[10px] text-white/60 uppercase tracking-wider mb-0.5">Ended</p>
                  <p class="text-xl font-black text-white leading-tight">
                    {new Date(t().ends_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
              </Show>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Progress + Stats — compact strip ═══ */}
      <div class="flex items-center gap-px bg-[#1a1a1a]">
        {/* Progress takes remaining space */}
        <div class="flex-1 bg-black px-4 py-2">
          <Show when={isLive()}>
            <TournamentProgress startsAt={t().starts_at} endsAt={t().ends_at} totalDays={totalDays()} />
          </Show>
          <Show when={isReg()}>
            <div class="flex items-center justify-between text-[10px] mb-1">
              <span class="text-gray-500">{t().reserved_spots}/{t().total_spots} spots</span>
              <span class="text-gray-600">{t().spots_available} left</span>
            </div>
            <div class="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
              <div class={`h-full bg-gradient-to-r ${style().gradient} rounded-full`} style={`width:${spotsPercent()}%`} />
            </div>
          </Show>
          <Show when={isScheduled()}>
            <p class={`text-[10px] ${style().accent}`}>
              Registration opens {new Date(t().registration_opens_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
          </Show>
          <Show when={isFinished()}>
            <p class="text-[10px] text-gray-600">Tournament completed</p>
          </Show>
        </div>
        <StatCell label="Account" value={`$${Number(t().account_size).toLocaleString()}`} />
        <StatCell label="Players" value={`${t().reserved_spots}/${t().total_spots}`} />
        <StatCell label="Entry" value={`$${t().entry_fee}`} accent />
        <StatCell label="Max DD" value={`${t().max_drawdown_percentage}%`} />
      </div>
    </div>
  );
}

function StatCell(props: { label: string; value: string; accent?: boolean }) {
  return (
    <div class="bg-black px-4 py-2.5">
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
