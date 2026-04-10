import { A, useLocation } from "@solidjs/router";

export default function Header() {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <header class="bg-black border-b border-gray-800 sticky top-0 z-[1001]">
      <div class="flex items-center justify-between px-4 py-2.5">
        <A href="/" class="flex items-center gap-2">
          <img src="/img/logo/isotype-black.png" alt="Cryptonite" class="h-7 w-7" />
          <span class="text-xl font-bold text-white">cryptonite</span>
          <span class="text-xl font-bold bg-gradient-to-r from-green-400 via-yellow-400 to-orange-400 bg-clip-text text-transparent">
            tournaments
          </span>
        </A>

        <nav class="hidden md:flex items-center gap-1">
          <NavButton href="/" active={isActive("/")} label="Live" showPulse />
          <NavButton href="/schedule" active={isActive("/schedule")} label="Schedule" />
          <NavButton href="/how-it-works" active={isActive("/how-it-works")} label="How It Works" />
        </nav>

        <a
          href="https://broker.cryptonite.trade"
          class="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-green-600 hover:bg-green-500 text-white transition-colors"
        >
          Trade Now
        </a>
      </div>
    </header>
  );
}

function NavButton(props: { href: string; active: boolean; label: string; showPulse?: boolean }) {
  return (
    <A
      href={props.href}
      class={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
        props.active
          ? "bg-green-600 text-white"
          : "text-gray-400 hover:text-white hover:bg-gray-800"
      }`}
    >
      {props.showPulse && (
        <span class="relative flex h-2 w-2">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span class="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
        </span>
      )}
      {props.label}
    </A>
  );
}
