import { A, useLocation } from "@solidjs/router";
import { createSignal, createEffect, onCleanup, onMount, Show } from "solid-js";
import { getSSOToken, clearSSOToken } from "../../lib/sso";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:7002";

function decodeJwtSub(token: string): string | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

export default function Header() {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;
  const [menuOpen, setMenuOpen] = createSignal(false);
  const [showUserMenu, setShowUserMenu] = createSignal(false);
  const [userName, setUserName] = createSignal<string | null>(null);
  const [soundEnabled, setSoundEnabled] = createSignal(
    typeof localStorage !== "undefined" ? localStorage.getItem("sound") !== "off" : true
  );

  onMount(async () => {
    const token = getSSOToken();
    if (!token) return;
    const userId = decodeJwtSub(token);
    if (!userId) return;
    try {
      const res = await fetch(`${API_URL}/v1/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const user = await res.json();
      setUserName(user.nickname || user.name || user.email?.split("@")[0] || "Trader");
    } catch { /* silent — stay logged-out appearance */ }
  });

  const handleSignOut = () => {
    clearSSOToken();
    setUserName(null);
    setShowUserMenu(false);
    window.location.href = "/";
  };

  const handleToggleSound = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = !soundEnabled();
    setSoundEnabled(next);
    if (typeof localStorage !== "undefined") localStorage.setItem("sound", next ? "on" : "off");
  };

  // Close dropdowns on route change
  createEffect(() => {
    location.pathname;
    setMenuOpen(false);
    setShowUserMenu(false);
  });

  // Body scroll lock while mobile drawer is open
  createEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = menuOpen() ? "hidden" : "";
    onCleanup(() => { document.body.style.overflow = ""; });
  });

  // Close user menu on outside click
  createEffect(() => {
    if (!showUserMenu()) return;
    const close = (e: MouseEvent) => {
      if (!(e.target as Element).closest("[data-user-menu]")) setShowUserMenu(false);
    };
    document.addEventListener("click", close, { capture: true });
    onCleanup(() => document.removeEventListener("click", close, { capture: true }));
  });

  return (
    <header class="bg-black border-b border-gray-800 sticky top-0 z-[1001]">
      {/* ── Desktop ── */}
      <div class="hidden md:grid grid-cols-[1fr_auto_1fr] items-center px-4 py-3">

        {/* Left — Logo */}
        <div class="flex items-center">
          <A href="/" class="flex items-center gap-1.5">
            <img src="/img/logo/isotype-black.png" alt="Cryptonite" class="h-7 w-7" />
            <span class="text-xl font-bold text-white">cryptonite</span>
            <span class="text-xl font-bold bg-gradient-to-r from-green-400 via-yellow-400 to-orange-400 bg-clip-text text-transparent">
              tournaments
            </span>
          </A>
        </div>

        {/* Center — Nav */}
        <nav class="flex items-center gap-1">
          <NavButton href="/" active={isActive("/")} label="Tournaments" showPulse />
          <NavButton href="/schedule" active={isActive("/schedule")} label="Schedule" />
          <NavButton href="/how-it-works" active={isActive("/how-it-works")} label="How It Works" />
        </nav>

        {/* Right — Sound + EN + User/Trade */}
        <div class="flex items-center justify-end gap-2">
          {/* Sound toggle */}
          <button
            onClick={handleToggleSound}
            class="p-2 rounded-md hover:bg-gray-800 transition-colors"
            title={soundEnabled() ? "Sound on – click to mute" : "Sound off – click to enable"}
          >
            <Show when={soundEnabled()} fallback={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-500">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            }>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              </svg>
            </Show>
          </button>

          {/* Language selector — EN active, ES disabled */}
          <LanguageSelector />

          {/* Go to Broker — always visible */}
          <a
            href="https://broker.cryptonite.trade"
            class="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200 transition-colors whitespace-nowrap ml-1"
          >
            Go to Broker
          </a>

          {/* User menu (only when logged in) */}
          <Show when={userName()}>
            <div class="relative ml-2" data-user-menu>
              <button
                onClick={() => setShowUserMenu(!showUserMenu())}
                class="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-800 transition-colors text-white"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-gray-400 flex-shrink-0">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span class="text-sm font-medium">{userName()}</span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-gray-500">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              <Show when={showUserMenu()}>
                <div class="absolute right-0 mt-2 w-52 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-50">
                  {/* Disabled items */}
                  <DisabledMenuItem icon="profile" label="Profile" />
                  <DisabledMenuItem icon="challenges" label="Challenges" />
                  <DisabledMenuItem icon="support" label="Soporte" />
                  {/* Logout */}
                  <button
                    onClick={handleSignOut}
                    class="flex items-center gap-3 px-4 py-3 hover:bg-gray-700 text-red-400 hover:text-red-300 w-full transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    <span class="text-sm">Logout</span>
                  </button>
                </div>
              </Show>
            </div>
          </Show>
        </div>
      </div>

      {/* ── Mobile ── */}
      <div class="md:hidden flex items-center justify-between px-4 py-2.5">
        <A href="/" class="flex items-center gap-1.5 min-w-0">
          <img src="/img/logo/isotype-black.png" alt="Cryptonite" class="h-7 w-7 flex-shrink-0" />
          <span class="text-xl font-bold text-white">cryptonite</span>
          <span class="text-xl font-bold bg-gradient-to-r from-green-400 via-yellow-400 to-orange-400 bg-clip-text text-transparent hidden sm:inline">
            tournaments
          </span>
        </A>

        <div class="flex items-center gap-2">
          {/* Mobile user icon */}
          <Show when={userName()}>
            <div class="relative" data-user-menu>
              <button
                onClick={() => setShowUserMenu(!showUserMenu())}
                class="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-zinc-300">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </button>
              <Show when={showUserMenu()}>
                <div class="absolute right-0 mt-2 w-52 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-50">
                  <DisabledMenuItem icon="profile" label="Profile" />
                  <DisabledMenuItem icon="challenges" label="Challenges" />
                  <DisabledMenuItem icon="support" label="Soporte" />
                  <button
                    onClick={handleSignOut}
                    class="flex items-center gap-3 px-4 py-3 hover:bg-gray-700 text-red-400 hover:text-red-300 w-full transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    <span class="text-sm">Logout</span>
                  </button>
                </div>
              </Show>
            </div>
          </Show>

          {/* Hamburger */}
          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={menuOpen()}
            onClick={() => setMenuOpen(!menuOpen())}
            class="flex items-center justify-center w-9 h-9 rounded-md text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <Show when={!menuOpen()} fallback={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
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

      {/* Mobile drawer */}
      <Show when={menuOpen()}>
        <div class="md:hidden border-t border-gray-800 bg-black">
          <nav class="flex flex-col px-4 py-3 gap-1">
            <MobileNavLink href="/" active={isActive("/")} label="Tournaments" showPulse />
            <MobileNavLink href="/schedule" active={isActive("/schedule")} label="Schedule" />
            <MobileNavLink href="/how-it-works" active={isActive("/how-it-works")} label="How It Works" />
            <div class="pt-2 border-t border-gray-800 mt-1">
              <a
                href="https://broker.cryptonite.trade"
                class="flex items-center gap-2 px-3 py-3 rounded-md text-base font-semibold text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              >
                Go to Broker →
              </a>
            </div>
          </nav>
        </div>
      </Show>
    </header>
  );
}

// ── Language selector — EN active, ES disabled (no i18n in tournaments) ──────
function LanguageSelector() {
  const [open, setOpen] = createSignal(false);

  createEffect(() => {
    if (!open()) return;
    const close = (e: MouseEvent) => {
      if (!(e.target as Element).closest("[data-lang-menu]")) setOpen(false);
    };
    document.addEventListener("click", close, { capture: true });
    onCleanup(() => document.removeEventListener("click", close, { capture: true }));
  });

  return (
    <div class="relative" data-lang-menu>
      <button
        onClick={() => setOpen(!open())}
        class="flex items-center gap-1.5 text-white hover:text-gray-300 transition-colors"
      >
        <img src="/img/lang/flag-usa.png" alt="EN" class="w-6 h-4 object-cover" />
        <span class="text-sm font-medium">EN</span>
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <Show when={open()}>
        <div class="absolute right-0 mt-2 w-32 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-50">
          <div class="flex items-center gap-2 p-2 bg-gray-700/50 cursor-default">
            <img src="/img/lang/flag-usa.png" alt="EN" class="w-6 h-4 object-cover" />
            <span class="text-sm text-white font-medium">EN</span>
          </div>
          <div
            class="flex items-center gap-2 p-2 opacity-40 cursor-not-allowed"
            title="Spanish not available yet"
          >
            <img src="/img/lang/flag-es.png" alt="ES" class="w-6 h-4 object-cover" />
            <span class="text-sm text-gray-400">ES</span>
          </div>
        </div>
      </Show>
    </div>
  );
}

const BROKER_TOOLTIP = "Visit broker.cryptonite.trade to manage this";

function DisabledMenuItem(props: { icon: "profile" | "challenges" | "support"; label: string }) {
  const icons = {
    profile: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
      </svg>
    ),
    challenges: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
      </svg>
    ),
    support: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
        <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
      </svg>
    ),
  };

  return (
    <div
      title={BROKER_TOOLTIP}
      class="flex items-center gap-3 px-4 py-3 border-b border-gray-700 cursor-not-allowed opacity-40 select-none"
    >
      {icons[props.icon]}
      <span class="text-sm text-gray-400">{props.label}</span>
    </div>
  );
}

function NavButton(props: { href: string; active: boolean; label: string; showPulse?: boolean }) {
  return (
    <A
      href={props.href}
      class={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
        props.active ? "bg-green-600 text-white" : "text-gray-400 hover:text-white hover:bg-gray-800"
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
        props.active ? "bg-green-600 text-white" : "text-gray-200 hover:text-white hover:bg-gray-800"
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
