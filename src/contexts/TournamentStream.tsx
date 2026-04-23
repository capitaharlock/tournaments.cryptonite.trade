/**
 * TournamentStream — global WebSocket channel for structural tournament
 * events (state transitions, new tournaments appearing, grace-window
 * closing). Consumed by the home page, the schedule, and any future
 * multi-tournament view so the UI stays alive without refreshes.
 *
 * Rankings still travel on the per-tournament /ws/tournaments/:id
 * channel; this provider only handles low-frequency STATE events.
 *
 * Rehydration contract: on first load, each page does its usual HTTP
 * fetch to render the current state. This stream only delivers NEW
 * events from the moment it connects. If a client disconnects briefly,
 * any missed events are covered by the 30s refetches pages already run.
 */
import {
  createContext,
  onCleanup,
  onMount,
  useContext,
  JSX,
} from "solid-js";

const WORKER_WS_URL =
  import.meta.env.VITE_WORKER_WS_URL ||
  "wss://cryptonite-tournament-worker.fly.dev";

export type TournamentEvent = {
  type: string;
  tournament_id?: string;
  slug?: string;
  status?: string;
  previous_status?: string;
  registration_closes_at?: string;
  starts_at?: string;
  ends_at?: string;
  reserved_spots?: number;
  total_spots?: number;
  spots_available?: number;
  [k: string]: any;
};

type Handler = (ev: TournamentEvent) => void;

interface TournamentStreamContext {
  /** Subscribe to events of the given `type` (or "*" for all). Returns
   * an unsubscribe fn. Safe to call during render (use inside onMount /
   * createEffect to tie the subscription to the component lifecycle). */
  subscribe: (type: string, handler: Handler) => () => void;
  /** True while the underlying WebSocket is connected. */
  connected: () => boolean;
}

const Ctx = createContext<TournamentStreamContext>();

export function TournamentStreamProvider(props: { children: JSX.Element }) {
  const handlers = new Map<string, Set<Handler>>();
  let ws: WebSocket | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let backoffMs = 1_000; // starts at 1s, caps at 30s
  let isConnected = false;
  let stopped = false;

  const connectedRef = { value: false };
  const connected = () => connectedRef.value;

  const dispatch = (ev: TournamentEvent) => {
    const byType = handlers.get(ev.type);
    if (byType) byType.forEach((h) => safeCall(h, ev));
    const all = handlers.get("*");
    if (all) all.forEach((h) => safeCall(h, ev));
  };

  const safeCall = (h: Handler, ev: TournamentEvent) => {
    try {
      h(ev);
    } catch (err) {
      // One subscriber blowing up shouldn't bring down the stream.
      console.error("TournamentStream handler error", err, ev);
    }
  };

  const connect = () => {
    if (stopped) return;
    if (typeof WebSocket === "undefined") return; // SSR / no-DOM guard
    try {
      ws = new WebSocket(`${WORKER_WS_URL}/ws/tournaments`);
    } catch (e) {
      scheduleReconnect();
      return;
    }

    ws.onopen = () => {
      isConnected = true;
      connectedRef.value = true;
      backoffMs = 1_000; // reset backoff
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg && typeof msg.type === "string") {
          dispatch(msg as TournamentEvent);
        }
      } catch (err) {
        console.error("TournamentStream parse error", err, event.data);
      }
    };

    ws.onerror = () => {
      // onclose will follow; don't schedule twice.
    };

    ws.onclose = () => {
      isConnected = false;
      connectedRef.value = false;
      ws = null;
      scheduleReconnect();
    };
  };

  const scheduleReconnect = () => {
    if (stopped) return;
    if (reconnectTimer) return;
    const delay = backoffMs;
    backoffMs = Math.min(backoffMs * 2, 30_000);
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      connect();
    }, delay);
  };

  onMount(() => {
    connect();
  });

  onCleanup(() => {
    stopped = true;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    if (ws) {
      try { ws.close(); } catch { /* noop */ }
      ws = null;
    }
  });

  const value: TournamentStreamContext = {
    subscribe: (type, handler) => {
      let set = handlers.get(type);
      if (!set) {
        set = new Set();
        handlers.set(type, set);
      }
      set.add(handler);
      return () => {
        const s = handlers.get(type);
        if (s) {
          s.delete(handler);
          if (s.size === 0) handlers.delete(type);
        }
      };
    },
    connected,
  };

  return <Ctx.Provider value={value}>{props.children}</Ctx.Provider>;
}

export function useTournamentStream(): TournamentStreamContext {
  const ctx = useContext(Ctx);
  if (!ctx) {
    // No-op fallback when consumed outside the provider (e.g. during
    // server-side render or if an isolated component renders without
    // being wrapped). Returns a dummy API so callers don't crash.
    return {
      subscribe: () => () => {},
      connected: () => false,
    };
  }
  return ctx;
}
