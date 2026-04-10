import { createResource, For, Show } from "solid-js";
import { Title } from "@solidjs/meta";
import { fetchTournaments } from "../services/api";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import TournamentCard from "../components/tournament/TournamentCard";

export default function Schedule() {
  const [upcoming] = createResource(() => fetchTournaments("scheduled"));
  const [registering] = createResource(() => fetchTournaments("registration"));

  return (
    <>
      <Title>Tournament Schedule — Cryptonite</Title>
      <Header />

      <main class="max-w-7xl mx-auto px-4 py-8">
        <h1 class="text-3xl font-bold mb-2">Tournament Schedule</h1>
        <p class="text-gray-400 mb-8">
          New tournaments every Friday at 6:00 PM EST. Monthly marathons start on the 1st.
        </p>

        <Show when={registering() && registering()!.length > 0}>
          <section class="mb-10">
            <h2 class="text-xl font-semibold mb-4 text-green-400">Registration Open</h2>
            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <For each={registering()}>
                {(t) => <TournamentCard tournament={t} />}
              </For>
            </div>
          </section>
        </Show>

        <Show when={upcoming() && upcoming()!.length > 0}>
          <section class="mb-10">
            <h2 class="text-xl font-semibold mb-4 text-gray-400">Coming Soon</h2>
            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <For each={upcoming()}>
                {(t) => <TournamentCard tournament={t} />}
              </For>
            </div>
          </section>
        </Show>

        <Show when={(!upcoming() || upcoming()!.length === 0) && (!registering() || registering()!.length === 0)}>
          <p class="text-gray-500 text-center py-16">
            No upcoming tournaments at the moment. Check back soon!
          </p>
        </Show>
      </main>

      <Footer />
    </>
  );
}
