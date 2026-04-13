import { createResource, createMemo, For, Show } from "solid-js";
import { A } from "@solidjs/router";
import { Title } from "@solidjs/meta";
import { fetchTournaments } from "../services/api";
import type { Tournament } from "../types/tournament";
import Header from "../components/layout/Header";
import FlipClock from "../components/tournament/FlipClock";

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

  return (
    <>
      <Title>Tournament Schedule — Cryptonite</Title>
      <Header />

      <div class="min-h-screen bg-[#1a1a1a]">
        {/* Top section — page title */}
        <div class="px-4 pt-6 pb-4">
          <div class="max-w-7xl mx-auto">
            <p class="text-[10px] text-green-500 uppercase tracking-[0.2em] font-bold mb-1">Schedule</p>
            <h1 class="text-3xl font-black text-white mb-1">Upcoming Tournaments</h1>
            <p class="text-sm text-gray-500">
              New events every Friday at 6:00 PM EST (22:00 UTC). Reserve your spot before registration closes.
            </p>
          </div>
        </div>

        {/* List of tournaments */}
        <div class="px-4 pb-6">
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
              <div class="space-y-4">
                <For each={allUpcoming()}>
                  {(t) => <ScheduleCard tournament={t} />}
                </For>
              </div>
            </Show>
          </div>
        </div>
      </div>
    </>
  );
}

function ScheduleCard(props: { tournament: Tournament }) {
  const t = () => props.tournament;
  const isReg = () => t().status === "registration";
  const isScheduled = () => t().status === "scheduled";
  const totalDays = () =>
    Math.round((new Date(t().ends_at).getTime() - new Date(t().starts_at).getTime()) / 86400000);
  const isSprint = () => t().name.includes("Sprint");
  const isClassic = () => t().name.includes("Classic");
  const cashPrize = () => {
    const p = (t().prizes as any[]).find((p) => p.type === "cash");
    return p ? p.value : null;
  };
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
    <div class="bg-black border border-[#222] rounded-xl overflow-hidden shadow-xl shadow-black/50">
      {/* ─── Banner ─── */}
      <div class="relative bg-gradient-to-r from-green-600 via-emerald-500 to-teal-400">
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
              <Show when={isReg()}>
                <span class="ml-2 text-[11px] font-bold text-white bg-black/30 px-2 py-0.5 rounded-full align-middle">
                  REGISTRATION OPEN
                </span>
              </Show>
              <Show when={isScheduled()}>
                <span class="ml-2 text-[11px] font-bold text-white/70 bg-black/30 px-2 py-0.5 rounded-full align-middle">
                  SCHEDULED
                </span>
              </Show>
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

      {/* ─── Stats + Rules + CTA ─── */}
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-px bg-[#1a1a1a]">
        {/* Stats */}
        <div class="bg-black p-5">
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
                class="h-full bg-gradient-to-r from-green-600 to-green-400 rounded-full"
                style={`width: ${spotsPercent()}%`}
              />
            </div>
          </div>
        </div>

        {/* Rules */}
        <div class="bg-black p-5">
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

        {/* CTA */}
        <div class="bg-black p-5 flex flex-col">
          <h3 class="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3">
            {isReg() ? "Join Now" : "Reserve Your Spot"}
          </h3>

          <div class="flex-1 flex flex-col justify-center">
            <Show when={isReg() && t().spots_available > 0}>
              <p class="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Entry Fee</p>
              <p class="text-3xl font-black text-white mb-3">${t().entry_fee}</p>
              <A
                href={`/tournaments/${t().slug}#join`}
                class="block w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition text-sm text-center mb-2"
              >
                Buy Ticket
              </A>
              <A
                href={`/tournaments/${t().slug}`}
                class="block text-center text-[11px] text-gray-500 hover:text-white transition"
              >
                View tournament details →
              </A>
            </Show>
            <Show when={isReg() && t().spots_available <= 0}>
              <div class="w-full py-3 bg-gray-800 text-gray-500 font-bold rounded-lg text-sm text-center">
                Tournament Full
              </div>
            </Show>
            <Show when={isScheduled()}>
              <p class="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Registration opens in</p>
              <div class="mb-3">
                <FlipClock targetDate={t().registration_opens_at} size="sm" />
              </div>
              <A
                href={`/tournaments/${t().slug}`}
                class="block w-full py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg text-center transition"
              >
                View Details
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
