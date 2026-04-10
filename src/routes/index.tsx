import { createResource, For, Show } from "solid-js";
import { A } from "@solidjs/router";
import { Title } from "@solidjs/meta";
import { fetchTournaments } from "../services/api";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import TournamentColumn from "../components/tournament/TournamentColumn";
import Countdown from "../components/tournament/Countdown";

export default function Home() {
  const [active] = createResource(() => fetchTournaments("active"));
  const [registering] = createResource(() => fetchTournaments("registration"));
  const [scheduled] = createResource(() => fetchTournaments("scheduled"));
  const [finished] = createResource(() => fetchTournaments("finished"));

  const liveTournaments = () => [...(active() || []), ...(registering() || [])];

  return (
    <>
      <Title>Cryptonite Tournaments — Compete, Trade, Win</Title>
      <Header />

      <main class="max-w-7xl mx-auto px-4 py-6">

        {/* Hero — compact */}
        <section class="text-center mb-8">
          <h1 class="text-3xl md:text-4xl font-bold mb-2">
            Tournament Trading
          </h1>
          <p class="text-gray-400 max-w-xl mx-auto">
            Compete against real traders. Top ranks win cash, free challenges, and funded accounts.
          </p>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            LIVE TOURNAMENT COLUMNS — the main show
            Each column is a mini-leaderboard with live rankings
        ═══════════════════════════════════════════════════════════════ */}
        <Show when={liveTournaments().length > 0}>
          <section class="mb-10">
            <div class="flex items-center gap-2 mb-4">
              <span class="relative flex h-2.5 w-2.5">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
              </span>
              <h2 class="text-lg font-semibold text-white">Live & Open</h2>
            </div>
            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <For each={liveTournaments()}>
                {(t) => <TournamentColumn tournament={t} />}
              </For>
            </div>
          </section>
        </Show>

        {/* No tournaments — empty state */}
        <Show when={liveTournaments().length === 0 && !active.loading && !registering.loading}>
          <section class="mb-10 text-center py-16 bg-gray-900 rounded-lg border border-gray-800">
            <p class="text-gray-400 text-lg mb-2">No live tournaments right now</p>
            <p class="text-gray-500 text-sm">Check the schedule for upcoming events</p>
            <A href="/schedule" class="inline-block mt-4 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-md text-sm transition">
              View Schedule
            </A>
          </section>
        </Show>

        {/* ═══════════════════════════════════════════════════════════════
            UPCOMING — next tournaments with countdown to registration
        ═══════════════════════════════════════════════════════════════ */}
        <Show when={scheduled() && scheduled()!.length > 0}>
          <section class="mb-10">
            <h2 class="text-lg font-semibold text-white mb-4">Coming Soon</h2>
            <div class="space-y-3">
              <For each={scheduled()}>
                {(t) => (
                  <div class="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-lg px-5 py-4">
                    <div>
                      <h3 class="font-medium text-white">{t.name}</h3>
                      <p class="text-xs text-gray-500">
                        ${Number(t.account_size).toLocaleString()} account • {t.total_spots} spots • ${t.entry_fee} entry
                      </p>
                    </div>
                    <div class="flex items-center gap-4">
                      <Countdown targetDate={t.registration_opens_at} label="Registration opens in" />
                      <A
                        href={`/tournaments/${t.slug}`}
                        class="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded transition"
                      >
                        Details
                      </A>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </section>
        </Show>

        {/* ═══════════════════════════════════════════════════════════════
            HOW IT WORKS — quick 3 steps
        ═══════════════════════════════════════════════════════════════ */}
        <section class="mb-10 bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-5 text-center">How It Works</h2>
          <div class="grid md:grid-cols-3 gap-6 text-center text-sm">
            <div>
              <div class="w-8 h-8 rounded-full bg-green-600 text-white font-bold flex items-center justify-center mx-auto mb-2">1</div>
              <h3 class="font-medium text-white mb-1">Pick a Tournament</h3>
              <p class="text-gray-400">Sprint (3 days) or Classic (7 days). Pay the entry fee.</p>
            </div>
            <div>
              <div class="w-8 h-8 rounded-full bg-green-600 text-white font-bold flex items-center justify-center mx-auto mb-2">2</div>
              <h3 class="font-medium text-white mb-1">Trade to Win</h3>
              <p class="text-gray-400">Same platform, same rules. Ranked by profit %.</p>
            </div>
            <div>
              <div class="w-8 h-8 rounded-full bg-green-600 text-white font-bold flex items-center justify-center mx-auto mb-2">3</div>
              <h3 class="font-medium text-white mb-1">Claim Your Prize</h3>
              <p class="text-gray-400">Cash, free challenges, retries, and more.</p>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            RECENT RESULTS
        ═══════════════════════════════════════════════════════════════ */}
        <Show when={finished() && finished()!.length > 0}>
          <section class="mb-10">
            <h2 class="text-lg font-semibold text-white mb-4">Recent Results</h2>
            <div class="space-y-2">
              <For each={finished()!.slice(0, 5)}>
                {(t) => (
                  <A
                    href={`/tournaments/${t.slug}`}
                    class="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-lg px-5 py-3 hover:border-gray-700 transition"
                  >
                    <div>
                      <span class="font-medium text-white">{t.name}</span>
                      <span class="text-gray-500 text-xs ml-2">{t.reserved_spots} participants</span>
                    </div>
                    <span class="text-xs text-gray-500">View results →</span>
                  </A>
                )}
              </For>
            </div>
          </section>
        </Show>
      </main>

      <Footer />
    </>
  );
}
