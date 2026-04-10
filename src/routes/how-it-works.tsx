import { Title } from "@solidjs/meta";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

export default function HowItWorks() {
  return (
    <>
      <Title>How It Works — Cryptonite Tournaments</Title>
      <Header />

      <main class="max-w-4xl mx-auto px-4 py-8">
        <h1 class="text-3xl font-bold mb-8">How Tournaments Work</h1>

        {/* Steps */}
        <div class="space-y-8 mb-12">
          <Step n={1} title="Choose Your Tournament">
            <p><strong>Sprint (3 days)</strong> — $3.99 entry, $5K account, 30 players</p>
            <p><strong>Classic (7 days)</strong> — $9.99 entry, $10K account, 50 players</p>
            <p><strong>Marathon (30 days)</strong> — $15.99 entry, $25K account, 100 players</p>
          </Step>

          <Step n={2} title="Register & Get Your Account">
            <p>Purchase your spot during the registration window. You'll receive a tournament trading account with the full balance — ready to trade the moment the tournament starts.</p>
          </Step>

          <Step n={3} title="Trade to Climb the Rankings">
            <p>Trade crypto just like a real account. Same instruments, same rules, same platform. Your rank is determined by profit percentage — the best trader wins.</p>
          </Step>

          <Step n={4} title="Win Prizes">
            <p>When the tournament ends, prizes are distributed by rank: cash, free challenges, qualify accounts, and retry vouchers.</p>
          </Step>
        </div>

        {/* Rules */}
        <div class="bg-brand-card border border-brand-border rounded-lg p-6 mb-12">
          <h2 class="text-xl font-semibold mb-4">Trading Rules</h2>
          <div class="grid md:grid-cols-2 gap-4 text-sm">
            <div class="space-y-2">
              <p><span class="text-gray-400">Max Drawdown:</span> <span class="text-white">10%</span></p>
              <p><span class="text-gray-400">Daily Drawdown:</span> <span class="text-white">5%</span></p>
              <p><span class="text-gray-400">Ranking Metric:</span> <span class="text-white">Profit %</span></p>
            </div>
            <div class="space-y-2">
              <p><span class="text-gray-400">Instruments:</span> <span class="text-white">25 crypto pairs</span></p>
              <p><span class="text-gray-400">Leverage:</span> <span class="text-white">None (1:1)</span></p>
              <p><span class="text-gray-400">Elimination:</span> <span class="text-white">Drawdown breach = out</span></p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div class="mb-12">
          <h2 class="text-xl font-semibold mb-4">FAQ</h2>
          <div class="space-y-4">
            <Faq q="Can I join multiple tournaments at once?" a="Yes — you can be in a Sprint, Classic, and Marathon simultaneously. Use the account selector in the Broker to switch between them." />
            <Faq q="What happens if I get eliminated?" a="If your drawdown exceeds the limit, your account is closed. You can still watch the tournament rankings. Retry vouchers let you enter the next one for free." />
            <Faq q="When do tournaments start?" a="Every Friday at 6:00 PM EST (22:00 UTC). Monthly marathons start on the 1st of each month." />
            <Faq q="How are prizes delivered?" a="Cash prizes go to your wallet after admin approval. Free challenges and qualify accounts are created automatically. Retry vouchers appear in your account." />
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

function Step(props: { n: number; title: string; children: any }) {
  return (
    <div class="flex gap-4">
      <div class="flex-none w-10 h-10 rounded-full bg-brand-gold text-black font-bold flex items-center justify-center">
        {props.n}
      </div>
      <div>
        <h3 class="text-lg font-semibold mb-2">{props.title}</h3>
        <div class="text-gray-400 text-sm space-y-1">{props.children}</div>
      </div>
    </div>
  );
}

function Faq(props: { q: string; a: string }) {
  return (
    <div class="bg-brand-card border border-brand-border rounded-lg p-4">
      <p class="font-medium text-white mb-1">{props.q}</p>
      <p class="text-gray-400 text-sm">{props.a}</p>
    </div>
  );
}
