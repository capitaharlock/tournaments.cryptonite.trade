/**
 * UserEntries — lightweight context that knows which tournaments the
 * logged-in user is already registered in. Consumed by every "Sign Up"
 * CTA across the site so a registered user sees "You're in — good luck"
 * instead of a button that would fail at checkout with a 409.
 *
 * Zero extra infra: reads the SSO cookie, decodes the JWT `sub` claim for
 * the user_id (no /me call), and hits GET /v1/tournaments/user/:user_id
 * once on mount. Results cached in-memory for the session; `refresh()` is
 * exposed for post-checkout flows that need to refetch.
 */
import {
  createContext,
  createSignal,
  createResource,
  onMount,
  useContext,
  JSX,
} from "solid-js";
import { getSSOToken } from "../lib/sso";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:7002";

interface UserEntry {
  id: string;
  tournament_id: string;
  tournament_slug?: string;
  status: string;
}

interface UserEntriesContextValue {
  /** user_id from JWT, or null if not logged in */
  userId: () => string | null;
  /** Set of tournament IDs the user has an entry in (any status). */
  registeredTournamentIds: () => Set<string>;
  /** True iff the user has an entry in that tournament (regardless of status). */
  isRegistered: (tournamentId: string) => boolean;
  /** Force a refetch — call after checkout completes. */
  refresh: () => void;
  /** True while the initial fetch is in flight. */
  loading: () => boolean;
}

const Ctx = createContext<UserEntriesContextValue>();

/** Decode a JWT's `sub` claim without verifying the signature.
 * Safe here because we're only using it to decide UI — the server still
 * enforces real auth on every request. */
function decodeJwtSub(jwt: string): string | null {
  try {
    const parts = jwt.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")),
    );
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

async function fetchEntries(
  userId: string,
  token: string,
): Promise<UserEntry[]> {
  const res = await fetch(`${API_URL}/v1/tournaments/user/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    // 401/403 = stale cookie; treat as logged-out. Any other = transient
    // network error; return [] so the UI defaults to "not registered" and
    // the user can still try to sign up. Server-side 409 still protects.
    return [];
  }
  const json = await res.json();
  return Array.isArray(json?.data) ? json.data : [];
}

export function UserEntriesProvider(props: { children: JSX.Element }) {
  const [userId, setUserId] = createSignal<string | null>(null);
  const [token, setToken] = createSignal<string | null>(null);
  const [reloadTick, setReloadTick] = createSignal(0);

  onMount(() => {
    const t = getSSOToken();
    if (!t) return;
    const sub = decodeJwtSub(t);
    if (!sub) return;
    setToken(t);
    setUserId(sub);
  });

  const [entries] = createResource(
    () => {
      const uid = userId();
      const tok = token();
      return uid && tok ? { uid, tok, tick: reloadTick() } : null;
    },
    async (args) => (args ? fetchEntries(args.uid, args.tok) : []),
  );

  const registeredTournamentIds = () => {
    const list = entries() ?? [];
    return new Set(list.map((e) => e.tournament_id));
  };

  const value: UserEntriesContextValue = {
    userId,
    registeredTournamentIds,
    isRegistered: (tournamentId: string) =>
      registeredTournamentIds().has(tournamentId),
    refresh: () => setReloadTick((n) => n + 1),
    loading: () => entries.loading,
  };

  return <Ctx.Provider value={value}>{props.children}</Ctx.Provider>;
}

export function useUserEntries(): UserEntriesContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) {
    // Safe default so components don't crash if consumed outside the
    // provider (e.g. during SSR before hydration): behave as "not
    // registered" and the CTA renders normally.
    return {
      userId: () => null,
      registeredTournamentIds: () => new Set(),
      isRegistered: () => false,
      refresh: () => {},
      loading: () => false,
    };
  }
  return ctx;
}
