import { A } from "@solidjs/router";

export default function Footer() {
  return (
    <footer class="bg-black border-t border-gray-800 mt-16">
      <div class="max-w-6xl mx-auto px-4 py-12">

        {/* Top — Brand + columns */}
        <div class="flex flex-col lg:flex-row gap-10 lg:gap-16 mb-10">

          {/* Brand */}
          <div class="lg:w-72 flex-shrink-0">
            <div class="flex items-center gap-2 mb-3">
              <img src="/img/logo/isotype-black.png" alt="Cryptonite" class="h-7 w-7" />
              <span class="text-lg font-bold text-white">cryptonite</span>
              <span class="text-lg font-bold bg-gradient-to-r from-green-400 via-yellow-400 to-orange-400 bg-clip-text text-transparent">
                tournaments
              </span>
            </div>
            <p class="text-sm text-gray-400 leading-relaxed mb-4">
              Trade crypto. Win real prizes. The competitive arena of the Cryptonite ecosystem — live rankings, real accounts, real money.
            </p>
            <a
              href="https://broker.cryptonite.trade"
              class="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-bold rounded-lg transition"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
              Open Trading Platform
            </a>
          </div>

          {/* Links */}
          <div class="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-8">
            <div>
              <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Tournaments</h4>
              <ul class="space-y-2">
                <li><A href="/" class="text-sm text-gray-400 hover:text-white transition">Active Now</A></li>
                <li><A href="/schedule" class="text-sm text-gray-400 hover:text-white transition">Schedule</A></li>
                <li><A href="/how-it-works" class="text-sm text-gray-400 hover:text-white transition">How It Works</A></li>
              </ul>
            </div>
            <div>
              <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Platform</h4>
              <ul class="space-y-2">
                <li><a href="https://broker.cryptonite.trade" class="text-sm text-gray-400 hover:text-white transition">Trading Station</a></li>
                <li><a href="https://broker.cryptonite.trade/dashboard/challenges" class="text-sm text-gray-400 hover:text-white transition">Challenges</a></li>
                <li><a href="https://broker.cryptonite.trade/dashboard" class="text-sm text-gray-400 hover:text-white transition">Dashboard</a></li>
                <li><a href="https://broker.cryptonite.trade/dashboard/support" class="text-sm text-gray-400 hover:text-white transition">Support</a></li>
              </ul>
            </div>
            <div>
              <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Cryptonite</h4>
              <ul class="space-y-2">
                <li><a href="https://cryptonite.trade" class="text-sm text-gray-400 hover:text-white transition">Website</a></li>
                <li><a href="https://broker.cryptonite.trade" class="text-sm text-gray-400 hover:text-white transition">Broker</a></li>
                <li><a href="https://broker.cryptonite.trade/dashboard/support" class="text-sm text-gray-400 hover:text-white transition">Contact</a></li>
              </ul>
            </div>
          </div>
        </div>

        {/* What is Cryptonite — for visitors arriving from ads */}
        <div class="border border-gray-800 rounded-xl p-5 mb-8 bg-gray-900/30">
          <p class="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-2">What is Cryptonite?</p>
          <p class="text-sm text-gray-400 leading-relaxed">
            Cryptonite is a crypto trading simulator where traders compete in funded-style challenges.
            Start with a virtual account, prove your edge, and earn real rewards — cash prizes, funded accounts, and more.
            Tournaments are time-limited competitions with live rankings and real prizes for the best performers.{" "}
            <a href="https://broker.cryptonite.trade" class="text-green-400 hover:text-green-300 transition font-medium">
              Start trading free →
            </a>
          </p>
        </div>

        {/* Bottom */}
        <div class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-gray-800">
          <p class="text-xs text-gray-600">© {new Date().getFullYear()} Cryptonite. All rights reserved.</p>
          <div class="flex items-center gap-4">
            <a href="https://broker.cryptonite.trade" class="text-xs text-gray-600 hover:text-gray-400 transition">broker.cryptonite.trade</a>
            <span class="text-gray-800">·</span>
            <a href="https://cryptonite.trade" class="text-xs text-gray-600 hover:text-gray-400 transition">cryptonite.trade</a>
          </div>
        </div>

      </div>
    </footer>
  );
}
