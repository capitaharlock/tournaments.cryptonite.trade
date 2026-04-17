import { createResource, createMemo, For, Show } from "solid-js";
import { A } from "@solidjs/router";
import { Title } from "@solidjs/meta";
import { fetchTournaments } from "../services/api";
import type { Tournament } from "../types/tournament";
import Header from "../components/layout/Header";
import FlipClock from "../components/tournament/FlipClock";
import { getStatusStyle } from "../lib/statusStyles";

export default function Schedule() {
  const [registering] = createResource(() => fetchTournaments("registration"));
  const [upcoming] = createResource(() => fetchTournaments("scheduled"));

  const allUpcoming = createMemo(() => {
    const reg = registering() || [];
    const sched = upcoming() || [];
    return [...reg, ...sched].sort(
      (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
    );
  });

  // Within next 7 days → featured (big cards)
  const within7Days = createMemo(() => {
    const cutoff = Date.now() + 7 * 86400000;
    return allUpcoming().filter((t) => new Date(t.starts_at).getTime() <= cutoff);
  });

  // After 7 days → grouped by tier
  const later = createMemo(() =>
    allUpcoming().filter((t) => new Date(t.starts_at).getTime() > Date.now() + 7 * 86400000)
  );

  const laterSprint = createMemo(() => later().filter((t) => t.name.includes("Sprint")));
  const laterClassic = createMemo(() => later().filter((t) => t.name.includes("Classic")));
  const laterMarathon = createMemo(() => later().filter((t) => t.name.includes("Marathon")));

  return (
    <>
      <Title>Tournament Schedule — Cryptonite</Title>
      <Header />

      <div class="min-h-screen bg-[#1a1a1a]">
        {/* ═══ Header ═══ */}
        <div class="px-4 pt-6 pb-4">
          <div class="max-w-7xl mx-auto">
            <p class="text-[10px] text-green-500 uppercase tracking-[0.2em] font-bold mb-1">Schedule</p>
            <h1 class="text-3xl font-black text-white mb-1">Upcoming Tournaments</h1>
            <p class="text-sm text-gray-500">
              New events every Friday at 6:00 PM EST (22:00 UTC). Reserve your spot before registration closes.
            </p>
          </div>
        </div>

        <div class="px-4 pb-12">
          <div class="max-w-7xl mx-auto">
            <Show
              when={allUpcoming().length > 0}
              fallback={
                <div class="bg-black border border-[#222] rounded-xl p-16 text-center">
                  <p class="text-gray-500 text-sm">No upcoming tournaments at the moment.</p>
                  <p class="text-gray-700 text-xs mt-1">New events are scheduled weekly. Check back soon.</p>
                </div>
              }
            >
              {/* ═══ FEATURED — next 7 days ═══ */}
              <Show when={within7Days().length > 0}>
                <div class="mb-8">
                  <div class="flex items-center gap-3 mb-4">
                    <span class="relative flex h-2.5 w-2.5">
                      <span class="animate-ping absolute h-full w-full rounded-full bg-green-400 opacity-75" />
                      <span class="relative rounded-full h-2.5 w-2.5 bg-green-500" />
                    </span>
                    <h2 class="text-lg font-bold text-white">
                      This Week <span class="text-gray-500 text-sm font-normal">— starting in the next 7 days</span>
                    </h2>
                  </div>
                  <div class="space-y-4">
                    <For each={within7Days()}>
                      {(t) => <ScheduleCard tournament={t} />}
                    </For>
                  </div>
                </div>
              </Show>

              {/* ═══ LATER — grouped by tier ═══ */}
              <Show when={later().length > 0 || within7Days().length === 0}>
                <div class="mt-10">
                  <div class="flex items-center gap-3 mb-4">
                    <svg class="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <h2 class="text-lg font-bold text-white">
                      Looking Ahead <span class="text-gray-500 text-sm font-normal">— beyond this week</span>
                    </h2>
                  </div>
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <TierColumn
                      icon="⚡"
                      title="Sprint"
                      subtitle="3 days · $5K · $3.99 entry"
                      tournaments={laterSprint()}
                    />
                    <TierColumn
                      icon="🏆"
                      title="Classic"
                      subtitle="7 days · $10K · $9.99 entry"
                      tournaments={laterClassic()}
                    />
                    <TierColumn
                      icon="🏔️"
                      title="Marathon"
                      subtitle="30 days · $25K · $15.99 entry"
                      tournaments={laterMarathon()}
                    />
                  </div>
                </div>
              </Show>
            </Show>
          </div>
        </div>
      </div>
    </>
  );
}

// ───────────────────────────────────────────────────────────────────────
// TIER COLUMN — compact list of future tournaments in a single tier
// ───────────────────────────────────────────────────────────────────────

function TierColumn(props: {
  icon: string;
  title: string;
  subtitle: string;
  tournaments: Tournament[];
}) {
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <div class="bg-black border border-[#222] rounded-xl overflow-hidden shadow-xl shadow-black/30 hover:border-green-500/20 transition">
      {/* Unified dark header — tier icon + name + spec, green accent only */}
      <div class="relative px-4 py-3 border-b border-[#1a1a1a] bg-gradient-to-b from-[#0f0f0f] to-black">
        <div class="flex items-center gap-2.5">
          <span class="text-xl">{props.icon}</span>
          <div class="min-w-0">
            <h3 class="text-sm font-bold text-white leading-tight">{props.title}</h3>
            <p class="text-[10px] text-gray-500 truncate">{props.subtitle}</p>
          </div>
        </div>
      </div>

      {/* List */}
      <Show
        when={props.tournaments.length > 0}
        fallback={
          <div class="p-8 text-center">
            <p class="text-gray-600 text-xs">No future {props.title} tournaments scheduled yet.</p>
            <p class="text-gray-700 text-[10px] mt-1">Check back soon — new events are announced regularly.</p>
          </div>
        }
      >
        <div class="divide-y divide-[#1a1a1a]">
          <For each={props.tournaments.slice(0, 6)}>
            {(t) => (
              <A
                href={`/tournaments/${t.slug}`}
                class="block px-4 py-3 hover:bg-white/[0.02] transition group"
              >
                <div class="flex items-center justify-between mb-1">
                  <p class="text-sm font-medium text-white truncate">{t.name}</p>
                  <span class="text-[10px] font-bold text-green-400">
                    {fmtDate(t.starts_at)}
                  </span>
                </div>
                <div class="flex items-center justify-between text-[10px] text-gray-600">
                  <span>
                    {t.status === "registration" ? (
                      <span class="text-green-500">● Open now</span>
                    ) : (
                      "Scheduled"
                    )}
                  </span>
                  <span>{t.total_spots} spots</span>
                </div>
              </A>
            )}
          </For>
          <Show when={props.tournaments.length > 6}>
            <div class="px-4 py-2 text-center text-[10px] text-gray-600">
              +{props.tournaments.length - 6} more
            </div>
          </Show>
        </div>
      </Show>
    </div>
  );
}

function ScheduleCard(props: { tournament: Tournament }) {
  const t = () => props.tournament;
  const style = () => getStatusStyle(t().status);
  const isReg = () => t().status === "registration";
  const isScheduled = () => t().status === "scheduled";
  const totalDays = () =>
    Math.round((new Date(t().ends_at).getTime() - new Date(t().starts_at).getTime()) / 86400000);
  const isSprint = () => t().name.includes("Sprint");
  const isClassic = () => t().name.includes("Classic");
  const spotsPercent = () =>
    Math.max((t().reserved_spots / t().total_spots) * 100, 3);

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });

  return (
    <div class={`bg-black border ${style().ring} rounded-xl overflow-hidden shadow-xl ${style().glow}`}>
      {/* ─── Banner ─── */}
      <div class={`relative bg-gradient-to-r ${style().gradient}`}>
        <div
          class="absolute inset-0 opacity-[0.08]"
          style="background: repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,0.2) 8px, rgba(255,255,255,0.2) 16px);"
        />
        <div class="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/60 to-transparent" />

        <div class="relative px-6 py-5 flex items-start justify-between gap-6">
          {/* Left: type + title + prizes */}
          <div class="flex-1 min-w-0">
            <p class="text-sm text-white/60 font-medium mb-0.5">
              Tournament • {totalDays()} Day {isSprint() ? "Sprint" : isClassic() ? "Classic" : "Marathon"}
              <span class={`ml-2 text-[11px] font-bold px-2 py-0.5 rounded-full align-middle ${style().badge}`}>
                {style().label}
              </span>
            </p>
            <h2 class="text-2xl font-black text-white leading-tight drop-shadow-md mb-3">{t().name}</h2>

            {/* Prize pills */}
            <div class="flex items-center gap-2 flex-wrap">
              <For each={t().prizes as any[]}>
                {(p, i) => (
                  <div
                    class={`flex items-center gap-2 rounded-lg px-3 py-1.5 border ${
                      i() === 0 ? "bg-yellow-400/10 border-yellow-400/30" : "bg-black/30 border-white/10"
                    }`}
                  >
                    <span class={`font-black leading-none ${i() === 0 ? "text-lg text-yellow-300" : "text-sm text-white"}`}>
                      {p.type === "cash" ? `$${p.value}` : (p.label || p.type).replace("Free ", "").replace(/\$\d+K /g, "")}
                    </span>
                    <span class={`text-xs font-black ${i() === 0 ? "text-yellow-200" : "text-white/70"}`}>
                      x{p.rank_to - p.rank_from + 1}
                    </span>
                  </div>
                )}
              </For>
            </div>
          </div>

          {/* Right: countdown */}
          <div class="flex-shrink-0">
            <Show when={isReg()}>
              <FlipClock targetDate={t().starts_at} label="STARTS IN" size="lg" />
            </Show>
            <Show when={isScheduled()}>
              <FlipClock targetDate={t().registration_opens_at} label="REGISTRATION IN" size="lg" />
            </Show>
          </div>
        </div>
      </div>

      {/* ─── Details grid ─── */}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-[#1a1a1a]">
        <DetailCell label="Tournament Starts" value={fmtDate(t().starts_at)} icon="play" />
        <DetailCell label="Tournament Ends" value={fmtDate(t().ends_at)} icon="stop" />
        <DetailCell label="Registration Opens" value={fmtDate(t().registration_opens_at)} icon="calendar" />
        <DetailCell label="Registration Closes" value={fmtDate(t().starts_at)} icon="lock" />
      </div>

      {/* ─── Stats + Rules + CTA (CTA takes double width) ─── */}
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-px bg-[#1a1a1a]">
        {/* Stats */}
        <div class="bg-black p-5 lg:col-span-1">
          <h3 class="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3">Tournament Stats</h3>
          <div class="space-y-2 text-sm">
            <StatLine label="Account Size" value={`$${Number(t().account_size).toLocaleString()}`} />
            <StatLine label="Entry Fee" value={`$${t().entry_fee}`} accent />
            <StatLine
              label="Players"
              value={`${t().reserved_spots} / ${t().total_spots}`}
            />
            <StatLine
              label="Total Winners"
              value={`${(t().prizes as any[]).reduce(
                (s, p) => s + (p.rank_to - p.rank_from + 1),
                0
              )}`}
            />
          </div>

          {/* Spots progress */}
          <div class="mt-4">
            <div class="flex items-center justify-between text-[10px] mb-1">
              <span class="text-gray-500">{t().reserved_spots}/{t().total_spots} spots filled</span>
              <span class="text-gray-600">{t().spots_available} left</span>
            </div>
            <div class="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
              <div
                class={`h-full bg-gradient-to-r ${style().gradient} rounded-full`}
                style={`width: ${spotsPercent()}%`}
              />
            </div>
          </div>
        </div>

        {/* Rules */}
        <div class="bg-black p-5 lg:col-span-1">
          <h3 class="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3">Rules</h3>
          <div class="space-y-2 text-sm">
            <StatLine label="Max Drawdown" value={`${t().max_drawdown_percentage}%`} />
            <StatLine label="Daily Drawdown" value={`${t().max_daily_drawdown_percentage}%`} />
            <StatLine label="Ranked By" value="Profit %" />
            <StatLine label="Instruments" value="25 crypto pairs" />
            <StatLine label="Leverage" value="None (1:1)" />
            <StatLine label="Elimination" value="Drawdown breach" />
          </div>
        </div>

        {/* CTA — double width, big call-to-action */}
        <div class={`bg-gradient-to-br ${style().softGradient} p-6 lg:col-span-2 flex flex-col justify-between relative overflow-hidden`}>
          {/* Subtle stripe pattern */}
          <div
            class="absolute inset-0 opacity-[0.04] pointer-events-none"
            style="background: repeating-linear-gradient(45deg, transparent, transparent 12px, rgba(255,255,255,0.3) 12px, rgba(255,255,255,0.3) 24px);"
          />

          <div class="relative">
            <div class="flex items-center gap-2 mb-2">
              <span class={`inline-block w-1.5 h-1.5 rounded-full ${isReg() ? "bg-cyan-400" : "bg-amber-400"} animate-pulse`} />
              <h3 class={`text-[11px] font-black uppercase tracking-[0.15em] ${style().accent}`}>
                {isReg() ? "Join Now — Limited Spots" : "Reserve Your Spot"}
              </h3>
            </div>

            <Show when={isReg() && t().spots_available > 0}>
              <p class="text-4xl md:text-5xl font-black text-white leading-none mb-1">${t().entry_fee}</p>
              <p class="text-xs text-gray-400 mb-4">
                One-time entry fee • {t().spots_available} of {t().total_spots} spots left
              </p>
            </Show>

            <Show when={isReg() && t().spots_available <= 0}>
              <p class="text-4xl md:text-5xl font-black text-gray-500 line-through leading-none mb-1">${t().entry_fee}</p>
              <p class="text-xs text-red-400/80 mb-4">Sold Out — {t().total_spots}/{t().total_spots} spots filled</p>
            </Show>

            <Show when={isScheduled()}>
              <p class="text-3xl md:text-4xl font-black text-white leading-none mb-1">${t().entry_fee}</p>
              <p class="text-xs text-gray-400 mb-3">
                Entry fee when registration opens • {t().total_spots} spots total
              </p>
              <p class="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Registration opens in</p>
              <p class={`text-sm ${style().accent} font-bold mb-4`}>
                {new Date(t().registration_opens_at).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZoneName: "short",
                })}
              </p>
            </Show>
          </div>

          <div class="relative flex flex-col items-start gap-2">
            <Show when={isReg() && t().spots_available > 0}>
              <A
                href={`/checkout/${t().slug}`}
                class={`inline-flex items-center gap-1.5 px-5 py-2.5 ${style().cta} font-black rounded-lg transition text-sm shadow-md ${style().glow}`}
              >
                SIGN UP NOW →
              </A>
              <A
                href={`/tournaments/${t().slug}`}
                class="text-[11px] text-gray-500 hover:text-white transition"
              >
                View tournament details →
              </A>
            </Show>

            <Show when={isReg() && t().spots_available <= 0}>
              <div class={`inline-flex items-center px-5 py-2.5 ${style().ctaMuted} font-bold rounded-lg text-sm`}>
                TOURNAMENT FULL
              </div>
            </Show>

            <Show when={isScheduled()}>
              <div class="flex items-center gap-2 flex-wrap">
                <A
                  href={`/checkout/${t().slug}?reserve=1`}
                  class={`inline-flex items-center gap-1.5 px-5 py-2.5 ${style().cta} font-black rounded-lg transition text-sm shadow-md ${style().glow}`}
                >
                  RESERVE MY SPOT →
                </A>
                <A
                  href={`/tournaments/${t().slug}?notify=1`}
                  class="inline-flex items-center gap-1.5 px-4 py-2.5 border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white font-bold rounded-lg transition text-sm"
                >
                  🔔 Notify Me
                </A>
              </div>
              <A
                href={`/tournaments/${t().slug}`}
                class="text-[11px] text-gray-500 hover:text-white transition"
              >
                View tournament details →
              </A>
            </Show>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailCell(props: { label: string; value: string; icon: string }) {
  const icons: Record<string, string> = {
    play: "M5 3l14 9-14 9V3z",
    stop: "M6 6h12v12H6z",
    calendar: "M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zM16 2v4 M8 2v4 M3 10h18",
    lock: "M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z M7 11V7a5 5 0 0 1 10 0v4",
  };
  return (
    <div class="bg-black px-5 py-3.5 flex items-center gap-3">
      <div class="w-8 h-8 rounded-lg bg-[#0a0a0a] border border-gray-800/60 flex items-center justify-center flex-shrink-0">
        <svg class="w-4 h-4 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d={icons[props.icon]} />
        </svg>
      </div>
      <div class="min-w-0 flex-1">
        <p class="text-[10px] text-gray-600 uppercase tracking-wider">{props.label}</p>
        <p class="text-xs text-white font-medium truncate">{props.value}</p>
      </div>
    </div>
  );
}

function StatLine(props: { label: string; value: string; accent?: boolean }) {
  return (
    <div class="flex items-center justify-between">
      <span class="text-gray-500 text-xs">{props.label}</span>
      <span class={`text-xs font-bold ${props.accent ? "text-green-400" : "text-white"}`}>{props.value}</span>
    </div>
  );
}
