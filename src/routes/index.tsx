import { createResource, createSignal, onCleanup, onMount, For, Show, createMemo } from "solid-js";
import { A } from "@solidjs/router";
import { Title } from "@solidjs/meta";
import { fetchTournaments, fetchRankings, fetchHallOfFame, fetchRecentWinners } from "../services/api";
import type { Tournament } from "../types/tournament";
import Header from "../components/layout/Header";
import FlipClock from "../components/tournament/FlipClock";
import MiniRanking from "../components/tournament/MiniRanking";
import TournamentProgress from "../components/tournament/TournamentProgress";
import TournamentHero from "../components/tournament/TournamentHero";
import RegisteredCTA from "../components/tournament/RegisteredCTA";
import { getStatusStyle } from "../lib/statusStyles";
import { useUserEntries } from "../contexts/UserEntries";

export default function Home() {
  const [active] = createResource(() => fetchTournaments("active"));
  const [registering] = createResource(() => fetchTournaments("registration"));
  const [scheduled] = createResource(() => fetchTournaments("scheduled"));
  const [finished] = createResource(() => fetchTournaments("finished"));
  const [hallOfFame] = createResource(fetchHallOfFame);
  const [recentWinners] = createResource(fetchRecentWinners);

  // ═══════════════════════════════════════════════════════════════════════
  // STATE MACHINE for home slot selection
  //
  // Priority 1 — current action: active + recently_finished (<24h)
  //   sorted by ends_at ASC → leftmost ends first
  // Priority 2 — upcoming: registration + scheduled
  //   sorted by starts_at ASC, tiebreak ends_at ASC → soonest first
  //
  // featured[0] = primary (left, larger)
  // featured[1] = secondary (right)
  // ═══════════════════════════════════════════════════════════════════════
  const NOW_24H = 24 * 3600_000;
  const NOW_7D = 7 * 86400_000;

  const recentlyFinished = createMemo(() =>
    (finished() || []).filter(
      (t) => t.ends_at && Date.now() - new Date(t.ends_at).getTime() < NOW_24H
    )
  );

  const archivedFinished = createMemo(() =>
    (finished() || []).filter((t) => {
      if (!t.ends_at) return false;
      const age = Date.now() - new Date(t.ends_at).getTime();
      return age >= NOW_24H && age < NOW_7D;
    }).sort((a, b) => new Date(b.ends_at).getTime() - new Date(a.ends_at).getTime())
  );

  const currentAction = createMemo(() => {
    const list = [...(active() || []), ...recentlyFinished()];
    return list.sort((a, b) => new Date(a.ends_at).getTime() - new Date(b.ends_at).getTime());
  });

  const upcomingPool = createMemo(() => {
    const list = [...(registering() || []), ...(scheduled() || [])];
    return list.sort((a, b) => {
      const s = new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime();
      return s !== 0 ? s : new Date(a.ends_at).getTime() - new Date(b.ends_at).getTime();
    });
  });

  // Featured = fill slots with current_action first, pad with upcoming
  const featured = createMemo(() => {
    const result = [...currentAction()];
    const up = upcomingPool();
    let i = 0;
    while (result.length < 2 && i < up.length) {
      result.push(up[i]);
      i++;
    }
    return result;
  });

  const primary = () => featured()[0] || null;
  const secondary = () => featured()[1] || null;

  // Upcoming for the right column box — exclude ones already featured
  const upcomingForBox = createMemo(() => {
    const featuredIds = new Set(featured().map((t) => t.id));
    return upcomingPool().filter((t) => !featuredIds.has(t.id));
  });

  return (
    <>
      <Title>Cryptonite Tournaments — Compete, Trade, Win</Title>
      <Header />

      <div class="min-h-screen bg-[#1a1a1a]">
        {/* ═══ Next tournament countdown banner ═══ */}
        <NextTournamentBanner upcoming={upcomingPool()} />

        {/* ═══════════════════════════════════════════════════════════
            TOP SECTION — Live tournaments (3 columns)
        ═══════════════════════════════════════════════════════════ */}
        <div class="flex flex-col lg:flex-row gap-4 p-4 items-start">
          <div class="w-full lg:w-[42%] lg:flex-shrink-0">
            <Show when={primary()} fallback={<EmptyPanel />}>
              {(t) => <TournamentPanel tournament={t()} maxRanks={10} />}
            </Show>
          </div>
          <div class="w-full lg:w-[30%] lg:flex-shrink-0">
            <Show when={secondary()} fallback={<EmptyPanel />}>
              {(t) => <TournamentPanel tournament={t()} maxRanks={10} />}
            </Show>
          </div>
          <div class="w-full lg:flex-1">
            <UpcomingBox
              rest={[]}
              registering={(registering() || []).filter(r => !featured().some(f => f.id === r.id))}
              scheduled={(scheduled() || []).filter(s => !featured().some(f => f.id === s.id))}
            />
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            MIDDLE SECTION — Stats / showcase (different bg)
            Layout: small | wide | small | small
        ═══════════════════════════════════════════════════════════ */}
        <div class="bg-gradient-to-b from-[#0d0d0d] via-[#0a0a0a] to-[#0d0d0d] border-y border-[#1f1f1f] py-8">
          <div class="px-4">
            <div class="text-center mb-6">
              <p class="text-[10px] text-green-500 uppercase tracking-[0.2em] font-bold mb-1">Cryptonite Tournaments</p>
              <h2 class="text-2xl font-black text-white">Compete. Trade. Win.</h2>
              <p class="text-sm text-gray-500 mt-1">Real prizes. Real traders. Verified payouts.</p>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Box 1: small — Platform Stats (real data) */}
              <div class="lg:col-span-3">
                <StatsCardBox active={active() || []} registering={registering() || []} scheduled={scheduled() || []} finished={finished() || []} />
              </div>

              {/* Box 2: WIDE — Prize Vault (calculated from real data) */}
              <div class="lg:col-span-5">
                <PrizeVaultBox tournaments={[...(active() || []), ...(registering() || []), ...(scheduled() || [])]} />
              </div>

              {/* Box 3: small — Hall of Fame (real data from API) */}
              <div class="lg:col-span-2">
                <HallOfFameMiniBox entries={hallOfFame() || []} />
              </div>

              {/* Box 4: small — Recent Winners (real podium from API) */}
              <div class="lg:col-span-2">
                <RecentWinnersBox winners={recentWinners() || []} />
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            BOTTOM SECTION — Finished Tournaments (grid of 4 cols, up to 8)
        ═══════════════════════════════════════════════════════════ */}
        <Show when={(finished() || []).length > 0}>
          <div class="px-4 py-8">
            <div class="flex items-center justify-between mb-4">
              <div>
                <p class="text-[10px] text-gray-600 uppercase tracking-[0.15em] font-bold mb-0.5">Completed</p>
                <h2 class="text-lg font-bold text-white">Recent Tournaments</h2>
              </div>
              <A href="/schedule" class="text-xs text-green-500 hover:text-green-400 transition">View all</A>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <For each={(finished() || [])
                .sort((a, b) => new Date(b.ends_at).getTime() - new Date(a.ends_at).getTime())
                .slice(0, 8)
              }>
                {(t) => <FinishedCard tournament={t} />}
              </For>
            </div>
          </div>
        </Show>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TOURNAMENT PANEL
// ═══════════════════════════════════════════════════════════════════════════

function TournamentPanel(props: { tournament: Tournament; maxRanks: number }) {
  const t = () => props.tournament;
  const style = () => getStatusStyle(t().status);
  const isReg = () => t().status === "registration";
  const isLive = () => t().status === "active";
  const isScheduled = () => t().status === "scheduled";
  const isFinished = () => t().status === "finished";
  const canJoin = () => isReg() && t().spots_available > 0;
  const userEntries = useUserEntries();
  const isUserIn = () => userEntries.isRegistered(t().id);

  // ─── Live rankings via signal + manual poll (no flash on update) ────
  // Plain signal instead of createResource — refetch on createResource
  // enters "pending" state which causes <Show> blocks to flash.
  // SolidJS' fine-grained reactivity diffs only the row data when we
  // setApiRankings(); the table DOM remains intact between polls.
  const [apiRankings, setApiRankings] = createSignal<any[]>([]);

  const loadRankings = async () => {
    try {
      // Active tournaments: use live endpoint (Worker in-memory)
      // Finished/other: use DB endpoint (materialized rankings)
      const useLive = t().status === "active";
      const data = await fetchRankings(t().id, props.maxRanks, 0, useLive);
      setApiRankings(data || []);
    } catch (e) { /* silent */ }
  };

  let pollInterval: ReturnType<typeof setInterval>;
  onMount(() => {
    loadRankings();
    if (t().status === "active") {
      pollInterval = setInterval(loadRankings, 5000);
    }
  });
  onCleanup(() => clearInterval(pollInterval));

  const rankings = createMemo(() => apiRankings());

  return (
    <div class="bg-black border border-[#222] rounded-xl flex flex-col overflow-hidden shadow-xl shadow-black/50">
      {/* Hero — visual tournament identity */}
      <TournamentHero tournament={t()} />

      {/* Rankings — show for active, finished, and registration (if has participants) */}
      <div>
        <Show
          when={rankings().length > 0 || isLive() || isFinished()}
          fallback={<PrestartEmptyState tournament={t()} />}
        >
          <MiniRanking
            rankings={rankings()}
            tournamentSlug={t().slug}
            maxRows={props.maxRanks}
            accountSize={Number(t().account_size)} prizes={t().prizes as any}
            preRace={isReg() || isScheduled()}
          />
        </Show>
      </div>

      {/* ═══ FOOTER CTA — chromatically paired with header banner ═══ */}
      <div class={`relative bg-gradient-to-r ${style().mutedGradient} border-t border-white/20`}>
        {/* Top edge highlight — mirrors the banner's bottom fade */}
        <div class="absolute top-0 left-0 right-0 h-px bg-white/30" />
        {/* Diagonal stripe pattern to match header */}
        <div
          class="absolute inset-0 opacity-10 pointer-events-none"
          style="background: repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.2) 10px, rgba(255,255,255,0.2) 20px);"
        />
        <div class="relative flex items-center gap-3 px-4 h-12">
          {/* Left: participants badge (click → detail) */}
          <A
            href={`/tournaments/${t().slug}`}
            class="flex items-center gap-2 text-[11px] text-gray-400 hover:text-white transition flex-shrink-0 group"
          >
            <div class="flex -space-x-1">
              <div class="w-5 h-5 rounded-full bg-emerald-500/20 border-2 border-black" />
              <div class="w-5 h-5 rounded-full bg-blue-500/20 border-2 border-black" />
              <div class="w-5 h-5 rounded-full bg-purple-500/20 border-2 border-black" />
            </div>
            <span class="font-bold">
              +{t().total_spots - props.maxRanks}<span class="hidden sm:inline"> traders</span>
            </span>
          </A>

          {/* Right: primary CTA */}
          <div class="flex-1 flex justify-end">
            <Show when={canJoin()}>
              <Show when={!isUserIn()} fallback={
                <RegisteredCTA slug={t().slug} tone="waiting"
                  class={`flex items-center gap-1.5 px-4 h-8 bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/40 text-emerald-300 font-black rounded-md transition text-[12px] shadow-md ${style().glow}`}
                />
              }>
                <A
                  href={`/checkout/${t().slug}`}
                  class={`group flex items-center gap-1.5 px-4 h-8 ${style().cta} font-black rounded-md transition text-[12px] shadow-md ${style().glow} hover:scale-[1.02]`}
                >
                  <span>JOIN — ${t().entry_fee}</span>
                  <svg class="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">
                    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                  </svg>
                </A>
              </Show>
            </Show>
            <Show when={isLive()}>
              <A
                href={`/tournaments/${t().slug}`}
                class={`group flex items-center gap-1.5 px-4 h-8 ${style().cta} font-black rounded-md transition text-[12px] shadow-md ${style().glow} hover:scale-[1.02]`}
              >
                <span class="relative flex h-1.5 w-1.5">
                  <span class="animate-ping absolute h-full w-full rounded-full bg-white opacity-75" />
                  <span class="relative rounded-full h-1.5 w-1.5 bg-white" />
                </span>
                <span>WATCH LIVE</span>
                <svg class="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">
                  <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                </svg>
              </A>
            </Show>
            <Show when={isReg() && !canJoin()}>
              <div class="px-4 h-8 flex items-center bg-gray-800 text-gray-500 font-black rounded-md text-[12px]">
                TOURNAMENT FULL
              </div>
            </Show>
            <Show when={isScheduled()}>
              <A
                href={`/tournaments/${t().slug}`}
                class={`group flex items-center gap-1.5 px-4 h-8 ${style().cta} font-black rounded-md transition text-[12px] shadow-md ${style().glow} hover:scale-[1.02]`}
              >
                <span>🔔 NOTIFY ME</span>
              </A>
            </Show>
            <Show when={isFinished()}>
              <A
                href={`/tournaments/${t().slug}`}
                class={`group flex items-center gap-1.5 px-4 h-8 ${style().cta} font-black rounded-md transition text-[12px] shadow-md ${style().glow} hover:scale-[1.02]`}
              >
                <span>VIEW RESULTS →</span>
              </A>
            </Show>
          </div>
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
  const icon = () => t().name.includes("Sprint") ? "\u26A1" : t().name.includes("Classic") ? "\uD83C\uDFC6" : "\uD83C\uDFD4\uFE0F";
  const durationDays = () => Math.round((new Date(t().ends_at).getTime() - new Date(t().starts_at).getTime()) / 86400000);
  const isReg = () => t().status === "registration";
  const canJoin = () => isReg() && t().spots_available > 0;
  const isFull = () => isReg() && t().spots_available <= 0;
  const style = () => getStatusStyle(t().status);
  const userEntries = useUserEntries();
  const isUserIn = () => userEntries.isRegistered(t().id);

  return (
    <A
      href={`/tournaments/${t().slug}`}
      class="block px-4 py-3 border-b border-[#1a1a1a] hover:bg-white/[0.03] transition cursor-pointer"
    >
      {/* Row 1: Icon + Name + Status badge */}
      <div class="flex items-center justify-between mb-1.5">
        <div class="flex items-center gap-2">
          <span class="text-base">{icon()}</span>
          <span class="text-sm font-semibold text-white">{t().name}</span>
          <span class="text-[10px] text-gray-600 bg-[#1a1a1a] px-1.5 py-0.5 rounded">{durationDays()}d</span>
        </div>
        <Show when={props.isLive}>
          <span class="flex items-center gap-1 text-[10px] text-green-400 font-bold">
            <span class="relative flex h-1.5 w-1.5"><span class="animate-ping absolute h-full w-full rounded-full bg-green-400 opacity-75" /><span class="relative rounded-full h-1.5 w-1.5 bg-green-500" /></span>
            Live
          </span>
        </Show>
        <Show when={isReg() && canJoin()}>
          <span class={`text-[10px] font-bold ${style().accent}`}>Open</span>
        </Show>
        <Show when={isFull()}>
          <span class="text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">SOLD OUT</span>
        </Show>
        <Show when={!props.isLive && !isReg()}>
          <span class="text-[10px] text-gray-500">
            {new Date(t().starts_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        </Show>
      </div>

      {/* Row 2: Account size + spots + prize + countdown */}
      <div class="flex items-center justify-between mb-1.5">
        <div class="flex items-center gap-2 text-xs">
          <span class="font-bold text-white">${Number(t().account_size).toLocaleString()}</span>
          <span class="text-gray-700">|</span>
          <span class="text-gray-400">{t().reserved_spots}/{t().total_spots} spots</span>
          <span class="text-gray-700">|</span>
          <span class="text-yellow-400/80">{(t().prizes as any[])[0]?.label || "Prizes"}</span>
        </div>
        <FlipClock targetDate={props.isLive ? t().ends_at : t().starts_at} size="sm" />
      </div>

      {/* Row 3: CTA button (only for registration with spots)
          Aligned to the right, matching the countdown's right edge */}
      <Show when={canJoin()}>
        <div class="flex justify-end mt-2.5" onClick={(e: any) => e.preventDefault()}>
          <Show when={!isUserIn()} fallback={
            <span class="inline-block px-5 py-1.5 bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold rounded-md">
              ✓ You're in
            </span>
          }>
            <A href={`/checkout/${t().slug}`}
              class="inline-block px-5 py-1.5 bg-green-600 hover:bg-green-500 text-white text-[11px] font-bold rounded-md transition focus:outline-none focus:ring-2 focus:ring-green-400/50">
              Join — ${t().entry_fee}
            </A>
          </Show>
        </div>
      </Show>
    </A>
  );
}

function EmptyPanel() {
  return (
    <div class="bg-black border border-[#222] rounded-xl flex items-center justify-center h-full min-h-[300px] shadow-lg shadow-black/30">
      <div class="text-center">
        <p class="text-gray-600 text-sm mb-2">No active tournaments</p>
        <A href="/schedule" class="text-xs text-green-500 hover:text-green-400">View schedule →</A>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// UPCOMING TOURNAMENTS BOX — boxed with header + footer
// ═══════════════════════════════════════════════════════════════════════════

function UpcomingBox(props: { rest: Tournament[]; registering: Tournament[]; scheduled: Tournament[] }) {
  const [utcTime, setUtcTime] = createSignal("");
  let interval: ReturnType<typeof setInterval>;

  onMount(() => {
    const update = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().split(" ").slice(4, 5)[0] + " UTC");
    };
    update();
    interval = setInterval(update, 1000);
  });
  onCleanup(() => clearInterval(interval));

  // Merge + sort by soonest first (by next relevant time: starts_at for scheduled, ends_at for live)
  const merged = createMemo(() => {
    const withKind: Array<{ t: Tournament; kind: "live" | "reg" | "sched" }> = [
      ...props.rest.map((t) => ({ t, kind: "live" as const })),
      ...props.registering.map((t) => ({ t, kind: "reg" as const })),
      ...props.scheduled.map((t) => ({ t, kind: "sched" as const })),
    ];
    // Sort by starts_at ascending (soonest first)
    withKind.sort((a, b) => new Date(a.t.starts_at).getTime() - new Date(b.t.starts_at).getTime());
    return withKind;
  });

  const totalScheduled = () => merged().length;
  const visible = () => merged().slice(0, 5);
  const hidden = () => Math.max(0, merged().length - 5);

  return (
    <div class="bg-black border border-[#222] rounded-xl overflow-hidden shadow-xl shadow-black/50 flex flex-col">
      {/* Header */}
      <div class="px-4 py-3 border-b border-[#1a1a1a] bg-gradient-to-r from-green-600/20 to-emerald-500/5 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <svg class="w-4 h-4 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <h2 class="text-sm font-bold text-white">Upcoming Tournaments</h2>
        </div>
        <span class="text-[10px] text-green-400 font-bold bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
          {totalScheduled()} scheduled
        </span>
      </div>

      {/* Rows — limited to 5 closest, sorted soonest first */}
      <div>
        <For each={visible()}>
          {(item) => (
            <AgendaRow
              tournament={item.t}
              isLive={item.kind === "live"}
              isRegistering={item.kind === "reg"}
            />
          )}
        </For>
        <Show when={totalScheduled() === 0}>
          <div class="text-center py-10 text-gray-700 text-xs">No upcoming tournaments</div>
        </Show>
      </div>

      {/* "View full schedule" CTA if there are more */}
      <Show when={hidden() > 0}>
        <A
          href="/schedule"
          class="block px-4 py-3 bg-gradient-to-r from-green-600/10 to-emerald-500/5 border-t border-[#1a1a1a] hover:from-green-600/20 hover:to-emerald-500/10 transition text-center group"
        >
          <span class="text-xs text-green-400 font-bold">
            +{hidden()} more tournaments →
          </span>
          <span class="block text-[10px] text-gray-500 mt-0.5">
            View full schedule
          </span>
        </A>
      </Show>

      {/* Footer — live UTC clock + refresh tag */}
      <div class="px-4 py-2.5 border-t border-[#1a1a1a] bg-[#0a0a0a] flex items-center justify-between">
        <div class="flex items-center gap-1.5 text-[10px] text-gray-600">
          <span class="flex h-1.5 w-1.5 rounded-full bg-green-500/60" />
          <span>Updated live</span>
        </div>
        <span class="text-[10px] text-gray-500 font-mono">{utcTime()}</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PRIZE VAULT — total prize pool + breakdown + trust signal
// ═══════════════════════════════════════════════════════════════════════════

// ── Prize valuation helpers ──────────────────────────────────────────
// Real market value of each prize type in USD.
// Challenge pricing: $5K → $50, $10K → $125, $25K → $312, $50K → $625
// Qualify: half of challenge (non-split, lower-tier graduation path)
// Retry: equals the tournament entry fee saved
const challengePrice = (size: number): number => Math.round(size * 0.0125);
const qualifyPrice = (size: number): number => Math.round(size * 0.006);

function PrizeVaultBox(props: { tournaments: Tournament[] }) {
  // Calculate from real tournament data with proper valuations
  const stats = createMemo(() => {
    let cash = 0;            // total cash $ across all tournaments
    let challenges = 0;      // count of free challenges
    let qualify = 0;         // count of free qualify accounts
    let retries = 0;         // count of retry vouchers
    let challengeValue = 0;  // total $ value of challenges
    let qualifyValue = 0;    // total $ value of qualify accounts
    let retryValue = 0;      // total $ value of retries

    for (const t of props.tournaments) {
      const entryFee = Number(t.entry_fee) || 0;
      for (const p of (t.prizes as any[]) || []) {
        const count = (p.rank_to || 0) - (p.rank_from || 0) + 1;
        const size = Number(p.account_size || 0);
        if (p.type === "cash") {
          cash += (p.value || 0) * count;
        } else if (p.type === "challenge") {
          challenges += count;
          challengeValue += challengePrice(size) * count;
        } else if (p.type === "qualify") {
          qualify += count;
          qualifyValue += qualifyPrice(size) * count;
        } else if (p.type === "retry") {
          retries += count;
          retryValue += entryFee * count;
        }
      }
    }
    const total = cash + challengeValue + qualifyValue + retryValue;
    return { cash, challenges, qualify, retries, challengeValue, qualifyValue, retryValue, total };
  });

  return (
    <div class="bg-black border border-[#222] rounded-xl overflow-hidden shadow-xl shadow-black/50 h-full">
      <div class="p-5">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em]">Prize Vault</h2>
          <span class="text-[10px] text-yellow-400 font-medium">Guaranteed</span>
        </div>

        <div class="text-center mb-5">
          <p class="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Total value across active &amp; upcoming</p>
          <p class="text-5xl font-black text-yellow-300 drop-shadow-lg">${stats().total.toLocaleString()}+</p>
        </div>

        <div class="grid grid-cols-4 gap-2 mb-4">
          <VaultStat icon="cash" label="Cash" value={`$${stats().cash.toLocaleString()}`} subtext={`${stats().cash > 0 ? "cash pool" : "—"}`} />
          <VaultStat icon="challenge" label="Challenges" value={`${stats().challenges}x`} subtext={stats().challengeValue > 0 ? `$${stats().challengeValue.toLocaleString()}` : "—"} />
          <VaultStat icon="qualify" label="Qualify" value={`${stats().qualify}x`} subtext={stats().qualifyValue > 0 ? `$${stats().qualifyValue.toLocaleString()}` : "—"} />
          <VaultStat icon="retry" label="Retries" value={`${stats().retries}x`} subtext={stats().retryValue > 0 ? `$${stats().retryValue.toLocaleString()}` : "—"} />
        </div>

        <div class="bg-[#0a0a0a] rounded-lg px-4 py-3 flex items-center gap-2 border border-gray-800/60">
          <svg class="w-4 h-4 text-green-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <div>
            <p class="text-xs text-white font-medium">Funds held in escrow</p>
            <p class="text-[10px] text-gray-600">Payouts guaranteed for all tournament winners</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function VaultStat(props: { icon: string; label: string; value: string; subtext?: string }) {
  const iconColor: Record<string, string> = {
    cash: "text-yellow-400",
    challenge: "text-blue-400",
    qualify: "text-purple-400",
    retry: "text-gray-400",
  };
  return (
    <div class="bg-[#0a0a0a] rounded-lg p-2 text-center border border-gray-800/40">
      <p class={`text-xs ${iconColor[props.icon] || "text-gray-400"} mb-0.5`}>◆</p>
      <p class="text-sm font-bold text-white">{props.value}</p>
      <p class="text-[9px] text-gray-600">{props.label}</p>
      {props.subtext && <p class="text-[9px] text-gray-500 mt-0.5 font-mono">{props.subtext}</p>}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════
// RECENT RESULTS — last finished tournaments with podium
// ═══════════════════════════════════════════════════════════════════════════

function RecentResultsBox(props: { finished: Tournament[] }) {
  return (
    <div class="bg-black border border-[#222] rounded-xl overflow-hidden shadow-xl shadow-black/50 h-full">
      <div class="flex items-center justify-between px-5 pt-5 pb-3">
        <h2 class="text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em]">Recent Results</h2>
      </div>

      <div>
        <Show when={props.finished.length > 0} fallback={
          <div class="text-center py-10 text-gray-700 text-xs">No finished tournaments yet</div>
        }>
          <For each={props.finished.slice(0, 5)}>
            {(t) => (
              <A
                href={`/tournaments/${t.slug}`}
                class="block px-4 py-3 border-b border-[#1a1a1a] hover:bg-white/[0.02] transition"
              >
                <div class="flex items-center justify-between mb-1">
                  <span class="text-sm font-medium text-white">{t.name}</span>
                  <span class="text-[10px] text-gray-600">
                    {new Date(t.ends_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>
                <div class="flex items-center gap-2 text-[10px]">
                  <span class="text-gray-500">{t.total_spots} players</span>
                  <span class="text-gray-700">|</span>
                  <span class="text-yellow-400/70">{(t.prizes as any[])[0]?.label || ""}</span>
                </div>
              </A>
            )}
          </For>
        </Show>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STATS CARD — quick numbers for trust/social proof
// ═══════════════════════════════════════════════════════════════════════════

function StatsCardBox(props: { active: Tournament[]; registering: Tournament[]; scheduled: Tournament[]; finished: Tournament[] }) {
  const totalActive = () => props.active.length;
  const totalUpcoming = () => props.registering.length + props.scheduled.length;
  const totalFinished = () => props.finished.length;
  const totalPlayers = () => {
    let sum = 0;
    for (const t of [...props.active, ...props.finished]) sum += t.reserved_spots;
    return sum;
  };

  return (
    <div class="bg-black border border-[#222] rounded-xl overflow-hidden shadow-xl shadow-black/50 h-full p-5">
      <h2 class="text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em] mb-4">Platform Stats</h2>
      <div class="space-y-3">
        <StatRow icon="trophy" value={String(totalActive())} label="Active tournaments" color="text-green-400" />
        <StatRow icon="users" value={totalPlayers().toLocaleString()} label="Total participants" color="text-blue-400" />
        <StatRow icon="award" value={String(totalFinished())} label="Tournaments completed" color="text-yellow-400" />
        <StatRow icon="globe" value={String(totalUpcoming())} label="Upcoming tournaments" color="text-purple-400" />
      </div>
    </div>
  );
}

function StatRow(props: { icon: string; value: string; label: string; color: string }) {
  const icons: Record<string, string> = {
    trophy: "M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 7 7 7 7 M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 17 7 17 7 M4 22h16 M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22 M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22 M18 2H6v7a6 6 0 0 0 12 0V2Z",
    users: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75",
    award: "M12 15a7 7 0 1 0 0-14 7 7 0 0 0 0 14z M8.21 13.89L7 23l5-3 5 3-1.21-9.12",
    globe: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M2 12h20 M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z",
  };
  return (
    <div class="flex items-center gap-3">
      <div class={`w-9 h-9 rounded-lg bg-[#0a0a0a] border border-gray-800/60 flex items-center justify-center flex-shrink-0`}>
        <svg class={`w-4 h-4 ${props.color}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d={icons[props.icon]} />
        </svg>
      </div>
      <div class="flex-1">
        <p class={`text-lg font-black ${props.color} leading-none`}>{props.value}</p>
        <p class="text-[10px] text-gray-500 mt-0.5">{props.label}</p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// HALL OF FAME MINI — compact version for the showcase row
// ═══════════════════════════════════════════════════════════════════════════

function HallOfFameMiniBox(props: { entries: any[] }) {
  return (
    <div class="bg-black border border-[#222] rounded-xl overflow-hidden shadow-xl shadow-black/50 h-full p-5">
      <h2 class="text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em] mb-3">Hall of Fame</h2>
      <Show when={props.entries.length > 0} fallback={
        <p class="text-xs text-gray-700 py-4 text-center">Winners appear after first tournament</p>
      }>
        <div class="space-y-1">
          <For each={props.entries.slice(0, 5)}>
            {(entry, i) => (
              <div class="flex items-center gap-2 py-1.5 rounded hover:bg-white/[0.03] transition">
                <span class={`w-5 text-center text-[11px] font-bold ${
                  i() === 0 ? "text-yellow-400" :
                  i() === 1 ? "text-gray-300" :
                  i() === 2 ? "text-orange-400" :
                  "text-gray-600"
                }`}>
                  {i() + 1}
                </span>
                <span class="flex-1 text-xs text-gray-300 truncate">{entry.nickname}</span>
                <div class="text-right">
                  <span class="text-[10px] text-green-400 font-bold">{entry.wins_count}w</span>
                  <Show when={Number(entry.cash_earned) > 0}>
                    <span class="text-[9px] text-gray-600 ml-1">${entry.cash_earned}</span>
                  </Show>
                </div>
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}

function RecentWinnersBox(props: { winners: any[] }) {
  return (
    <div class="bg-black border border-[#222] rounded-xl overflow-hidden shadow-xl shadow-black/50 h-full">
      <div class="flex items-center justify-between px-5 pt-5 pb-3">
        <h2 class="text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em]">Recent Winners</h2>
      </div>
      <Show when={props.winners.length > 0} fallback={
        <div class="text-center py-10 text-gray-700 text-xs">No results yet</div>
      }>
        <div>
          <For each={props.winners}>
            {(w) => (
              <A
                href={`/tournaments/${w.tournament_slug}`}
                class="flex items-center gap-2 px-4 py-2 border-b border-[#1a1a1a] hover:bg-white/[0.02] transition"
              >
                <span class={`text-sm ${
                  w.final_rank === 1 ? "text-yellow-400" :
                  w.final_rank === 2 ? "text-gray-300" :
                  "text-orange-400"
                }`}>
                  #{w.final_rank}
                </span>
                <span class="flex-1 text-xs text-gray-300 truncate">{w.nickname}</span>
                <div class="text-right">
                  <p class="text-[10px] text-green-400 font-medium">{w.prize_label}</p>
                  <p class="text-[9px] text-gray-600">{w.tournament_name}</p>
                </div>
              </A>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════
// FINISHED CARD — compact card for completed tournaments grid
// ═══════════════════════════════════════════════════════════════════════════

function FinishedCard(props: { tournament: Tournament }) {
  const t = () => props.tournament;
  const icon = () => t().name.includes("Sprint") ? "\u26A1" : t().name.includes("Classic") ? "\uD83C\uDFC6" : "\uD83C\uDFD4\uFE0F";

  return (
    <A
      href={`/tournaments/${t().slug}`}
      class="bg-black border border-[#222] rounded-xl overflow-hidden hover:border-gray-700 transition group"
    >
      <div class="bg-gradient-to-r from-gray-800/30 to-gray-700/10 px-4 py-3">
        <div class="flex items-center justify-between mb-1">
          <div class="flex items-center gap-1.5">
            <span class="text-sm">{icon()}</span>
            <span class="text-sm font-bold text-white group-hover:text-green-400 transition">{t().name}</span>
          </div>
          <span class="text-[9px] text-gray-600 bg-gray-800 px-1.5 py-0.5 rounded">Finished</span>
        </div>
        <p class="text-[10px] text-gray-500">
          Ended {new Date(t().ends_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </p>
      </div>
      <div class="px-4 py-2.5 flex items-center justify-between">
        <div class="flex items-center gap-3 text-xs">
          <span class="text-white font-bold">${Number(t().account_size).toLocaleString()}</span>
          <span class="text-gray-600">{t().total_spots} players</span>
        </div>
        <span class="text-[10px] text-yellow-400/70">{(t().prizes as any[])[0]?.label || ""}</span>
      </div>
    </A>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TOURNAMENT FRIDAY BANNER — Phase 10d branding
// Shows a prominent strip on Fridays (and the 24h leading up) to highlight
// that new Sprint + Classic tournaments kick off at 22:00 UTC.
// ═══════════════════════════════════════════════════════════════════════════

function NextTournamentBanner(props: { upcoming: Tournament[] }) {
  const userEntries = useUserEntries();
  const [now, setNow] = createSignal(new Date());
  let interval: any;
  onMount(() => { interval = setInterval(() => setNow(new Date()), 1000); });
  onCleanup(() => clearInterval(interval));

  // Soonest upcoming tournament (registration or scheduled)
  const next = createMemo(() => {
    const sorted = [...props.upcoming].sort(
      (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
    );
    return sorted[0] || null;
  });

  const diff = createMemo(() => {
    if (!next()) return 0;
    return new Date(next()!.starts_at).getTime() - now().getTime();
  });

  const remaining = createMemo(() => {
    const ms = diff();
    if (ms <= 0) return null;
    return {
      d: Math.floor(ms / 86400000),
      h: Math.floor((ms % 86400000) / 3600000),
      m: Math.floor((ms % 3600000) / 60000),
      s: Math.floor((ms % 60000) / 1000),
    };
  });

  const isImminent = () => diff() > 0 && diff() < 48 * 3600000;

  return (
    <Show when={next() && diff() > 0}>
      <div class={`relative overflow-hidden border-b border-[#1f1f1f] ${
        isImminent()
          ? "bg-gradient-to-r from-green-600/30 via-emerald-500/20 to-teal-400/30"
          : "bg-gradient-to-r from-green-600/15 via-emerald-500/10 to-teal-400/15"
      }`}>
        <div class="absolute inset-0 opacity-[0.05]" style="background: repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.3) 10px, rgba(255,255,255,0.3) 20px);" />
        <div class="relative max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div class="flex items-center gap-3">
            <span class="relative flex h-2.5 w-2.5">
              <span class="animate-ping absolute h-full w-full rounded-full bg-green-400 opacity-75" />
              <span class="relative rounded-full h-2.5 w-2.5 bg-green-500" />
            </span>
            <div>
              <p class="text-[10px] text-green-400 font-black uppercase tracking-[0.15em]">
                {next()!.status === "registration"
                  ? next()!.spots_available > 0 ? "Registration Open" : "SOLD OUT"
                  : "Coming Up"}
              </p>
              <p class="text-sm text-white font-bold">
                {next()!.name} — ${Number(next()!.account_size).toLocaleString()} account
                {next()!.status === "registration" && next()!.spots_available > 0 && (
                  <span class="ml-2 text-xs text-yellow-300 font-bold">{next()!.spots_available} spots left</span>
                )}
              </p>
            </div>
          </div>
          <Show when={remaining()}>
            <div class="flex items-center gap-2 text-xs">
              <span class="text-gray-400">Starts in</span>
              <div class="flex gap-1 font-mono font-bold">
                <Show when={remaining()!.d > 0}>
                  <span class="bg-black/40 border border-green-500/30 text-green-300 px-2 py-1 rounded">
                    {remaining()!.d}d
                  </span>
                </Show>
                <span class="bg-black/40 border border-green-500/30 text-green-300 px-2 py-1 rounded">
                  {String(remaining()!.h).padStart(2, "0")}h
                </span>
                <span class="bg-black/40 border border-green-500/30 text-green-300 px-2 py-1 rounded">
                  {String(remaining()!.m).padStart(2, "0")}m
                </span>
                <span class="bg-black/40 border border-green-500/30 text-green-300 px-2 py-1 rounded">
                  {String(remaining()!.s).padStart(2, "0")}s
                </span>
              </div>
              <Show when={next()!.status === "registration" && next()!.spots_available > 0}
                fallback={
                  <A href={`/tournaments/${next()!.slug}`}
                    class="ml-2 px-3 py-1 bg-gray-700 text-gray-300 font-bold text-[11px] rounded transition hover:bg-gray-600">
                    {next()!.spots_available <= 0 ? "SOLD OUT" : "View Details"}
                  </A>
                }>
                <Show when={!userEntries.isRegistered(next()!.id)} fallback={
                  <A href={`/tournaments/${next()!.slug}`}
                    class="ml-2 px-3 py-1 bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/40 text-emerald-300 font-bold text-[11px] rounded">
                    ✓ You're in
                  </A>
                }>
                  <A href={`/checkout/${next()!.slug}`}
                    class="ml-2 px-3 py-1 bg-green-600 hover:bg-green-500 text-white font-bold text-[11px] rounded transition">
                    Get Your Spot
                  </A>
                </Show>
              </Show>
            </div>
          </Show>
        </div>
      </div>
    </Show>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PRESTART EMPTY STATE — for tournaments not yet live (registration/scheduled)
// Shows a clean "waiting to start" visual for pre-start tournaments.
// ═══════════════════════════════════════════════════════════════════════════

function PrestartEmptyState(props: { tournament: Tournament }) {
  const t = () => props.tournament;
  const style = () => getStatusStyle(t().status);
  const isReg = () => t().status === "registration";
  const userEntries = useUserEntries();
  const isUserIn = () => userEntries.isRegistered(t().id);

  return (
    <div class="px-4 py-8 flex flex-col items-center justify-center text-center">
      <div class={`w-12 h-12 rounded-full bg-gradient-to-br ${style().softGradient} border ${style().ring} flex items-center justify-center mb-3`}>
        <svg class={`w-5 h-5 ${style().accent}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      </div>
      <p class={`text-sm font-bold ${style().accent} mb-1`}>
        {isReg() ? "Registration open — no participants yet" : "Coming soon — registration not yet open"}
      </p>
      <p class="text-xs text-gray-500 mb-4 max-w-xs">
        {isReg()
          ? `Be one of the first to claim a spot. $${t().entry_fee} gets you a $${Number(t().account_size).toLocaleString()} account to compete.`
          : `Registration opens soon. Rankings appear once the tournament starts.`}
      </p>
      <Show when={isReg() && t().spots_available > 0}>
        <Show when={!isUserIn()} fallback={
          <RegisteredCTA slug={t().slug} tone="waiting"
            class={`inline-flex items-center gap-1.5 px-5 py-2 bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/40 text-emerald-300 font-black rounded-lg transition text-sm shadow-md ${style().glow}`}
          />
        }>
          <A
            href={`/checkout/${t().slug}`}
            class={`inline-flex items-center gap-1.5 px-5 py-2 ${style().cta} font-black rounded-lg transition text-sm shadow-md ${style().glow}`}
          >
            JOIN NOW — ${t().entry_fee} →
          </A>
        </Show>
      </Show>
    </div>
  );
}
