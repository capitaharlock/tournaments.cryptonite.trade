import { A } from "@solidjs/router";

export default function Header() {
  return (
    <header class="border-b border-brand-border bg-brand-dark/95 backdrop-blur sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <A href="/" class="flex items-center gap-2">
          <span class="text-brand-gold font-bold text-lg">CRYPTONITE</span>
          <span class="text-gray-400 text-sm">Tournaments</span>
        </A>

        <nav class="hidden md:flex items-center gap-6 text-sm">
          <A href="/" class="text-gray-300 hover:text-white transition">Home</A>
          <A href="/schedule" class="text-gray-300 hover:text-white transition">Schedule</A>
          <A href="/how-it-works" class="text-gray-300 hover:text-white transition">How It Works</A>
          <A href="/leaderboard" class="text-gray-300 hover:text-white transition">Leaderboard</A>
        </nav>

        <a
          href="https://broker.cryptonite.trade"
          class="bg-brand-gold text-black px-4 py-1.5 rounded text-sm font-semibold hover:brightness-110 transition"
        >
          Trade Now
        </a>
      </div>
    </header>
  );
}
