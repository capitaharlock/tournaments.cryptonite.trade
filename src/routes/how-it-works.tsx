import { createSignal, For, Show } from "solid-js";
import { Title } from "@solidjs/meta";
import { A } from "@solidjs/router";
import Header from "../components/layout/Header";

export default function HowItWorks() {
  return (
    <>
      <Title>How It Works — Cryptonite Tournaments</Title>
      <Header />

      <main class="min-h-screen bg-[#1a1a1a]">
        {/* ═══════════════════════════════════════════════════════════
            HERO
        ═══════════════════════════════════════════════════════════ */}
        <section class="relative overflow-hidden border-b border-[#1f1f1f]">
          <div class="absolute inset-0 bg-gradient-to-b from-green-600/10 via-transparent to-transparent" />
          <div
            class="absolute inset-0 opacity-[0.03]"
            style="background: repeating-linear-gradient(45deg, transparent, transparent 12px, rgba(255,255,255,0.4) 12px, rgba(255,255,255,0.4) 24px);"
          />
          <div class="relative max-w-5xl mx-auto px-4 py-16 text-center">
            <p class="text-[11px] text-green-400 uppercase tracking-[0.2em] font-bold mb-3">
              How It Works
            </p>
            <h1 class="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
              Pay a small fee.<br />Trade. <span class="text-green-400">Win real prizes.</span>
            </h1>
            <p class="text-gray-400 text-base md:text-lg max-w-2xl mx-auto mb-8">
              Compete head-to-head against other crypto traders in fixed-duration tournaments.
              Best profit % wins. No margin, no leverage, no surprises.
            </p>
            <div class="flex items-center justify-center gap-3 flex-wrap">
              <A
                href="/schedule"
                class="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-black rounded-lg transition shadow-lg shadow-green-500/20"
              >
                SEE UPCOMING TOURNAMENTS →
              </A>
              <A
                href="/"
                class="inline-flex items-center gap-2 px-6 py-3 border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white font-medium rounded-lg transition"
              >
                Watch Live Rankings
              </A>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            4 STEPS
        ═══════════════════════════════════════════════════════════ */}
        <section class="max-w-6xl mx-auto px-4 py-14">
          <div class="text-center mb-10">
            <p class="text-[10px] text-green-500 uppercase tracking-[0.2em] font-bold mb-1">
              Four Steps
            </p>
            <h2 class="text-3xl font-black text-white">From registration to payout</h2>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StepCard
              n={1}
              icon="ticket"
              title="Pick Your Tournament"
              text="Sprint, Classic or Marathon. Each has a fixed entry fee, account size and duration. New tournaments launch regularly — check the schedule for upcoming events."
            />
            <StepCard
              n={2}
              icon="wallet"
              title="Reserve Your Spot"
              text="Pay the entry fee during the registration window. Your tournament account is created with the full balance, ready to trade at kickoff."
            />
            <StepCard
              n={3}
              icon="chart"
              title="Trade To Climb"
              text="Same crypto pairs, same Cryptonite platform, zero leverage. Your rank is pure profit %. Live rankings update every 30 seconds."
            />
            <StepCard
              n={4}
              icon="trophy"
              title="Collect Prizes"
              text="When the tournament ends, prizes auto-distribute by rank: cash, free challenges, qualify accounts and retry vouchers. Top 36-40% of players win."
            />
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            TIERS — 3 cards
        ═══════════════════════════════════════════════════════════ */}
        <section class="border-y border-[#1f1f1f] bg-gradient-to-b from-[#0d0d0d] to-[#0a0a0a]">
          <div class="max-w-6xl mx-auto px-4 py-14">
            <div class="text-center mb-10">
              <p class="text-[10px] text-green-500 uppercase tracking-[0.2em] font-bold mb-1">
                Tournament Tiers
              </p>
              <h2 class="text-3xl font-black text-white">Three ways to compete</h2>
              <p class="text-gray-500 text-sm mt-2">
                Pick the duration and stakes that fit your trading style.
              </p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <TierCard
                icon="⚡"
                name="Sprint"
                duration="3 Days"
                entry="3.99"
                account="5,000"
                players={30}
                winners={11}
                cash="$100"
                highlights={[
                  "Fast action, weekend format",
                  "$100 cash to winner",
                  "11 of 30 win prizes (37%)",
                  "Registration 24h before start",
                ]}
                color="from-green-600 via-emerald-500 to-teal-400"
                accent="text-green-400"
                ring="border-green-500/20"
              />
              <TierCard
                icon="🏆"
                name="Classic"
                duration="7 Days"
                entry="9.99"
                account="10,000"
                players={50}
                winners={20}
                cash="$300"
                highlights={[
                  "Full week to prove your edge",
                  "$300 cash to winner",
                  "20 of 50 win prizes (40%)",
                  "Registration 3 days before",
                ]}
                featured
                color="from-sky-600 via-cyan-500 to-blue-400"
                accent="text-cyan-400"
                ring="border-cyan-500/30"
              />
              <TierCard
                icon="🏔️"
                name="Marathon"
                duration="30 Days"
                entry="15.99"
                account="25,000"
                players={100}
                winners={39}
                cash="$500"
                highlights={[
                  "Full calendar month",
                  "$500 cash to winner",
                  "39 of 100 win prizes (39%)",
                  "Registration ~10 days before",
                ]}
                color="from-amber-600 via-orange-500 to-yellow-400"
                accent="text-amber-400"
                ring="border-amber-500/20"
              />
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            PRIZE TYPES
        ═══════════════════════════════════════════════════════════ */}
        <section class="max-w-6xl mx-auto px-4 py-14">
          <div class="text-center mb-10">
            <p class="text-[10px] text-green-500 uppercase tracking-[0.2em] font-bold mb-1">
              Prize Types
            </p>
            <h2 class="text-3xl font-black text-white">What you can win</h2>
            <p class="text-gray-500 text-sm mt-2">
              Every tournament has a prize ladder. Higher ranks win bigger rewards.
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <PrizeCard
              icon="cash"
              label="Cash Prize"
              desc="USD payout to your wallet after admin approval."
              value="$100 – $500"
              color="text-yellow-400"
              bg="from-yellow-500/10 to-yellow-500/[0.02]"
              ring="border-yellow-500/20"
            />
            <PrizeCard
              icon="challenge"
              label="Free Challenge"
              desc="A full challenge account at tier size. Pass it → get funded."
              value="$5K – $25K"
              color="text-blue-400"
              bg="from-blue-500/10 to-blue-500/[0.02]"
              ring="border-blue-500/20"
            />
            <PrizeCard
              icon="qualify"
              label="Qualify Account"
              desc="Free qualify account. Hit the target → free challenge unlocked."
              value="$5K – $25K"
              color="text-purple-400"
              bg="from-purple-500/10 to-purple-500/[0.02]"
              ring="border-purple-500/20"
            />
            <PrizeCard
              icon="retry"
              label="Retry Voucher"
              desc="Free entry to the next same-tier tournament. Keep competing."
              value="1 free entry"
              color="text-gray-300"
              bg="from-gray-500/10 to-gray-500/[0.02]"
              ring="border-gray-500/20"
            />
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            RULES
        ═══════════════════════════════════════════════════════════ */}
        <section class="border-y border-[#1f1f1f] bg-gradient-to-b from-[#0d0d0d] to-[#0a0a0a]">
          <div class="max-w-6xl mx-auto px-4 py-14">
            <div class="text-center mb-10">
              <p class="text-[10px] text-green-500 uppercase tracking-[0.2em] font-bold mb-1">
                The Rules
              </p>
              <h2 class="text-3xl font-black text-white">Simple, transparent, fair</h2>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <RuleCard
                icon="shield"
                title="Max Drawdown 10%"
                desc="Your account can drop at most 10% from starting balance before elimination."
              />
              <RuleCard
                icon="calendar"
                title="Daily Drawdown 5%"
                desc="At most 5% loss in a single UTC day. Keeps play sustainable."
              />
              <RuleCard
                icon="target"
                title="Ranked by Profit %"
                desc="Pure skill metric. All players start from the same balance."
              />
              <RuleCard
                icon="coins"
                title="25 Crypto Pairs"
                desc="Same instruments as Cryptonite live: BTC, ETH, SOL and all majors."
              />
              <RuleCard
                icon="scales"
                title="No Leverage"
                desc="1:1 only. No margin calls, no collateral games. Only trading skill."
              />
              <RuleCard
                icon="stopwatch"
                title="Drawdown Breach = Out"
                desc="Crossing the DD limit locks the account. You keep spectator access."
              />
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            FAQ
        ═══════════════════════════════════════════════════════════ */}
        <section class="max-w-4xl mx-auto px-4 py-14">
          <div class="text-center mb-10">
            <p class="text-[10px] text-green-500 uppercase tracking-[0.2em] font-bold mb-1">
              FAQ
            </p>
            <h2 class="text-3xl font-black text-white">Frequently asked</h2>
          </div>

          <div class="space-y-2">
            <For each={FAQ_ITEMS}>
              {(item) => <FaqItem q={item.q} a={item.a} />}
            </For>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            FINAL CTA
        ═══════════════════════════════════════════════════════════ */}
        <section class="border-t border-[#1f1f1f] bg-gradient-to-b from-[#0d0d0d] to-[#050505]">
          <div class="max-w-4xl mx-auto px-4 py-16 text-center">
            <h2 class="text-3xl md:text-4xl font-black text-white mb-3">
              Ready to compete?
            </h2>
            <p class="text-gray-500 text-base mb-6">
              New tournaments launch regularly. Check upcoming events below.
            </p>
            <div class="flex items-center justify-center gap-3 flex-wrap">
              <A
                href="/schedule"
                class="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-black rounded-lg transition shadow-lg shadow-green-500/20"
              >
                VIEW SCHEDULE →
              </A>
              <A
                href="/"
                class="inline-flex items-center gap-2 px-6 py-3 border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white font-medium rounded-lg transition"
              >
                Live Rankings
              </A>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════════

function StepCard(props: { n: number; icon: string; title: string; text: string }) {
  return (
    <div class="relative bg-black border border-[#222] rounded-xl p-5 hover:border-green-500/30 transition group">
      <div class="flex items-center justify-between mb-3">
        <div class="w-10 h-10 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center group-hover:bg-green-500/20 transition">
          <StepIcon name={props.icon} />
        </div>
        <span class="text-5xl font-black text-white/[0.04] group-hover:text-green-500/10 transition leading-none">
          {String(props.n).padStart(2, "0")}
        </span>
      </div>
      <h3 class="text-base font-bold text-white mb-1.5">{props.title}</h3>
      <p class="text-xs text-gray-500 leading-relaxed">{props.text}</p>
    </div>
  );
}

function StepIcon(props: { name: string }) {
  const paths: Record<string, string> = {
    ticket: "M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z M13 5v2 M13 17v2 M13 11v2",
    wallet: "M21 12V7H5a2 2 0 0 1 0-4h14v4 M3 5v14a2 2 0 0 0 2 2h16v-5 M18 12a2 2 0 0 0 0 4h4v-4z",
    chart: "M3 3v18h18 M18.7 8l-5.1 5.2-2.8-2.7L7 14.3",
    trophy: "M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 7 7 7 7 M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 17 7 17 7 M4 22h16 M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22 M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22 M18 2H6v7a6 6 0 0 0 12 0V2z",
  };
  return (
    <svg class="w-5 h-5 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d={paths[props.name]} />
    </svg>
  );
}

function TierCard(props: {
  icon: string;
  name: string;
  duration: string;
  entry: string;
  account: string;
  players: number;
  winners: number;
  cash: string;
  highlights: string[];
  featured?: boolean;
  color: string;
  accent: string;
  ring: string;
}) {
  return (
    <div class={`relative bg-black border ${props.ring} rounded-xl overflow-hidden shadow-xl shadow-black/40 ${props.featured ? "lg:scale-[1.03]" : ""}`}>
      {/* Banner */}
      <div class={`relative bg-gradient-to-r ${props.color} px-5 py-4`}>
        <div class="absolute inset-0 opacity-[0.08]" style="background: repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,0.2) 8px, rgba(255,255,255,0.2) 16px);" />
        <div class="relative flex items-center justify-between">
          <div>
            <p class="text-[10px] text-white/70 font-bold uppercase tracking-wider">{props.duration}</p>
            <h3 class="text-2xl font-black text-white drop-shadow-md">
              {props.icon} {props.name}
            </h3>
          </div>
          <Show when={props.featured}>
            <span class="text-[9px] font-bold text-white bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full border border-white/20">
              POPULAR
            </span>
          </Show>
        </div>
      </div>

      {/* Stats */}
      <div class="p-5">
        <div class="grid grid-cols-2 gap-2 mb-4">
          <StatBlock label="Entry Fee" value={`$${props.entry}`} accent={props.accent} />
          <StatBlock label="Account Size" value={`$${props.account}`} />
          <StatBlock label="Players" value={`${props.players}`} />
          <StatBlock label="Winners" value={`${props.winners}`} />
        </div>

        <div class="bg-[#0a0a0a] border border-gray-800/60 rounded-lg p-3 mb-4 text-center">
          <p class="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Cash Prize to #1</p>
          <p class="text-3xl font-black text-yellow-300">{props.cash}</p>
        </div>

        <ul class="space-y-2">
          <For each={props.highlights}>
            {(h) => (
              <li class="flex items-start gap-2 text-xs text-gray-400">
                <svg class={`w-3.5 h-3.5 ${props.accent} flex-shrink-0 mt-0.5`} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>{h}</span>
              </li>
            )}
          </For>
        </ul>
      </div>
    </div>
  );
}

function StatBlock(props: { label: string; value: string; accent?: string }) {
  return (
    <div class="bg-[#0a0a0a] border border-gray-800/40 rounded-md px-2.5 py-2">
      <p class="text-[9px] text-gray-600 uppercase tracking-wider">{props.label}</p>
      <p class={`text-base font-black ${props.accent || "text-white"}`}>{props.value}</p>
    </div>
  );
}

function PrizeCard(props: {
  icon: string;
  label: string;
  desc: string;
  value: string;
  color: string;
  bg: string;
  ring: string;
}) {
  return (
    <div class={`relative bg-gradient-to-br ${props.bg} border ${props.ring} rounded-xl p-5 overflow-hidden`}>
      <div class="flex items-center justify-between mb-3">
        <div class={`w-10 h-10 rounded-lg bg-black/40 border border-white/5 flex items-center justify-center`}>
          <PrizeIcon name={props.icon} color={props.color} />
        </div>
        <span class={`text-[10px] font-black ${props.color} uppercase tracking-wider`}>{props.value}</span>
      </div>
      <h3 class="text-base font-bold text-white mb-1">{props.label}</h3>
      <p class="text-xs text-gray-500 leading-relaxed">{props.desc}</p>
    </div>
  );
}

function PrizeIcon(props: { name: string; color: string }) {
  return (
    <svg class={`w-5 h-5 ${props.color}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <Show when={props.name === "cash"}>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v12 M9 9.5c0-.83.67-1.5 1.5-1.5h1c1.38 0 2.5 1.12 2.5 2.5S12.88 13 11.5 13h-1c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5h1c1.38 0 2.5-1.12 2.5-2.5" />
      </Show>
      <Show when={props.name === "challenge"}>
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </Show>
      <Show when={props.name === "qualify"}>
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </Show>
      <Show when={props.name === "retry"}>
        <path d="M1 4v6h6" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
      </Show>
    </svg>
  );
}

function RuleCard(props: { icon: string; title: string; desc: string }) {
  return (
    <div class="flex items-start gap-3 bg-black border border-[#222] rounded-xl p-4 hover:border-green-500/20 transition">
      <div class="w-9 h-9 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center flex-shrink-0">
        <RuleIcon name={props.icon} />
      </div>
      <div class="min-w-0">
        <h3 class="text-sm font-bold text-white mb-0.5">{props.title}</h3>
        <p class="text-xs text-gray-500 leading-relaxed">{props.desc}</p>
      </div>
    </div>
  );
}

function RuleIcon(props: { name: string }) {
  const paths: Record<string, string> = {
    shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
    calendar: "M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z M16 2v4 M8 2v4 M3 10h18",
    target: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12z M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
    coins: "M8 14a6 6 0 1 0 0-12 6 6 0 0 0 0 12z M8 8.5v-3M6.5 7h3 M18 22a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
    scales: "M12 3v18 M3 7h18 M7 7l-4 8a4 4 0 0 0 8 0L7 7z M17 7l-4 8a4 4 0 0 0 8 0L17 7z",
    stopwatch: "M12 22a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 9v4l2 2 M9 2h6",
  };
  return (
    <svg class="w-4 h-4 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d={paths[props.name]} />
    </svg>
  );
}

function FaqItem(props: { q: string; a: string }) {
  const [open, setOpen] = createSignal(false);
  return (
    <div class="bg-black border border-[#222] rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open())}
        class="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-white/[0.02] transition"
      >
        <span class="text-sm font-medium text-white">{props.q}</span>
        <svg
          class={`w-4 h-4 text-gray-500 flex-shrink-0 transition-transform ${open() ? "rotate-180" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      <Show when={open()}>
        <div class="px-5 pb-4 text-sm text-gray-400 leading-relaxed border-t border-[#1a1a1a] pt-4">
          {props.a}
        </div>
      </Show>
    </div>
  );
}

const FAQ_ITEMS = [
  {
    q: "When do tournaments start?",
    a: "New tournaments are scheduled regularly. Sprint and Classic events launch weekly, Marathons monthly. Registration opens before each event — check the schedule page for exact dates and times.",
  },
  {
    q: "Can I join multiple tournaments at once?",
    a: "Yes. You can be in a Sprint, a Classic and a Marathon simultaneously. Each runs on its own tournament account and the account selector in the Broker lets you switch between them instantly.",
  },
  {
    q: "Is this margin trading? Do I risk losing more than the entry fee?",
    a: "No. Tournaments are 1:1, no leverage, no margin, no collateral. Your risk is capped at the entry fee. The tournament account is a virtual balance — the only money you spend is the ticket.",
  },
  {
    q: "What happens if I get eliminated?",
    a: "If your account breaches the 10% max drawdown or 5% daily drawdown, it's closed and you're out of that tournament. You keep spectator access to the rankings, and retry vouchers let you enter the next same-tier tournament for free.",
  },
  {
    q: "How is the winner decided?",
    a: "By profit percentage on the tournament account at tournament close. Everyone starts with the same balance, so the best trader wins. Ties are broken by lowest max drawdown (most efficient risk-adjusted trader).",
  },
  {
    q: "How are prizes delivered?",
    a: "Cash prizes are paid out to your Cryptonite wallet after admin approval (usually within 24h). Free challenges and qualify accounts are created automatically the moment the tournament closes. Retry vouchers appear in your Cryptonite account and apply at checkout.",
  },
  {
    q: "Are the other players real?",
    a: "Tournaments mix real human players with automated traders to guarantee every tournament fills and runs. Automated traders use real trading strategies and trade real market data — they are your competition, not placeholders.",
  },
  {
    q: "What instruments can I trade?",
    a: "Crypto perpetual pairs, including BTC, ETH, SOL and other top coins. The exact list is the same one available on the main Cryptonite platform — no hidden or special instruments.",
  },
  {
    q: "Can I withdraw the tournament account balance?",
    a: "No. The tournament account is a competition balance, not a funded account. Prizes are separate: cash goes to your wallet, and free challenges/qualify accounts are real funded-track accounts you can trade to get paid.",
  },
  {
    q: "How much does it really cost?",
    a: "Just the entry fee. Sprint $3.99, Classic $9.99, Marathon $15.99. No deposit, no subscription, no hidden charges. Retry vouchers can make your next tournament entry free.",
  },
];
