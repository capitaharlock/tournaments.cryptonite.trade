import { createResource, For, Show } from "solid-js";
import { Title } from "@solidjs/meta";
import { fetchTournaments } from "../services/api";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import TournamentCard from "../components/tournament/TournamentCard";

export default function Home() {
  const [active] = createResource(() => fetchTournaments("active"));
  const [registering] = createResource(() => fetchTournaments("registration"));
  const [finished] = createResource(() => fetchTournaments("finished"));

  return (
    <>
      <Title>Cryptonite Tournaments — Compete, Trade, Win</Title>
      <Header />

      <main class="max-w-7xl mx-auto px-4 py-8">
        {/* Hero */}
        <section class="text-center mb-12">
          <h1 class="text-4xl md:text-5xl font-bold mb-3">
            <span class="text-brand-gold">Tournament</span> Trading
          </h1>
          <p class="text-gray-400 text-lg max-w-2xl mx-auto">
            Compete against real traders. Top ranks win cash, free challenges, and funded accounts.
          </p>
        </section>

        {/* Live Tournaments */}
        <Show when={active() && active()!.length > 0}>
          <section class="mb-10">
            <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Live Tournaments
            </h2>
            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <For each={active()}>
                {(t) => <TournamentCard tournament={t} />}
              </For>
            </div>
          </section>
        </Show>

        {/* Registration Open */}
        <Show when={registering() && registering()!.length > 0}>
          <section class="mb-10">
            <h2 class="text-xl font-semibold mb-4">Registration Open</h2>
            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <For each={registering()}>
                {(t) => <TournamentCard tournament={t} />}
              </For>
            </div>
          </section>
        </Show>

        {/* How It Works (quick) */}
        <section class="mb-10 bg-brand-card border border-brand-border rounded-lg p-8">
          <h2 class="text-xl font-semibold mb-6 text-center">How It Works</h2>
          <div class="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div class="text-3xl mb-2">1</div>
              <h3 class="font-medium mb-1">Pick a Tournament</h3>
              <p class="text-gray-400 text-sm">Choose Sprint (3 days), Classic (7 days), or Marathon (30 days)</p>
            </div>
            <div>
              <div class="text-3xl mb-2">2</div>
              <h3 class="font-medium mb-1">Trade to Win</h3>
              <p class="text-gray-400 text-sm">Use your tournament account to trade crypto. Same rules as real accounts.</p>
            </div>
            <div>
              <div class="text-3xl mb-2">3</div>
              <h3 class="font-medium mb-1">Claim Your Prize</h3>
              <p class="text-gray-400 text-sm">Top traders win cash, free challenges, retries, and more.</p>
            </div>
          </div>
        </section>

        {/* Recent Results */}
        <Show when={finished() && finished()!.length > 0}>
          <section class="mb-10">
            <h2 class="text-xl font-semibold mb-4">Recent Results</h2>
            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <For each={finished()!.slice(0, 6)}>
                {(t) => <TournamentCard tournament={t} />}
              </For>
            </div>
          </section>
        </Show>
      </main>

      <Footer />
    </>
  );
}
