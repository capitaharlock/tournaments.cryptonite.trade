import { A, useLocation } from "@solidjs/router";
import { createSignal, createEffect, onCleanup, Show } from "solid-js";

export default function Header() {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;
  const [menuOpen, setMenuOpen] = createSignal(false);

  // Close the drawer whenever the route changes.
  createEffect(() => {
    location.pathname;
    setMenuOpen(false);
  });

  // Lock body scroll while the drawer is open.
  createEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = menuOpen() ? "hidden" : "";
    onCleanup(() => {
      document.body.style.overflow = "";
    });
  });

  return (
    <header class="bg-black border-b border-gray-800 sticky top-0 z-[1001]">
      <div class="flex items-center justify-between px-4 py-2.5">
        <A href="/" class="flex items-center gap-2 min-w-0">
          <img src="/img/logo/isotype-black.png" alt="Cryptonite" class="h-7 w-7 flex-shrink-0" />
          <span class="text-xl font-bold text-white">cryptonite</span>
          <span class="text-xl font-bold bg-gradient-to-r from-green-400 via-yellow-400 to-orange-400 bg-clip-text text-transparent hidden sm:inline">
            tournaments
          </span>
        </A>

        {/* Desktop nav — unchanged */}
        <nav class="hidden md:flex items-center gap-1">
          <NavButton href="/" active={isActive("/")} label="Tournaments" showPulse />
          <NavButton href="/schedule" active={isActive("/schedule")} label="Schedule" />
          <NavButton href="/how-it-works" active={isActive("/how-it-works")} label="How It Works" />
        </nav>

        <div class="flex items-center gap-2">
          <a
            href="https://broker.cryptonite.trade"
            class="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-md text-sm font-medium bg-green-600 hover:bg-green-500 text-white transition-colors whitespace-nowrap"
          >
            Trade Now
          </a>

          {/* Mobile hamburger — only below md */}
          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={menuOpen()}
            onClick={() => setMenuOpen(!menuOpen())}
            class="md:hidden flex items-center justify-center w-9 h-9 rounded-md text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <Show when={!menuOpen()} fallback={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            }>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </Show>
          </button>
        </div>
      </div>

      {/* Mobile drawer — slides below the sticky header */}
      <Show when={menuOpen()}>
        <div class="md:hidden border-t border-gray-800 bg-black">
          <nav class="flex flex-col px-4 py-3 gap-1">
            <MobileNavLink href="/" active={isActive("/")} label="Tournaments" showPulse />
            <MobileNavLink href="/schedule" active={isActive("/schedule")} label="Schedule" />
            <MobileNavLink href="/how-it-works" active={isActive("/how-it-works")} label="How It Works" />
          </nav>
        </div>
      </Show>
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

function MobileNavLink(props: { href: string; active: boolean; label: string; showPulse?: boolean }) {
  return (
    <A
      href={props.href}
      class={`flex items-center gap-3 px-3 py-3 rounded-md text-base font-semibold transition-colors ${
        props.active
          ? "bg-green-600 text-white"
          : "text-gray-200 hover:text-white hover:bg-gray-800"
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
