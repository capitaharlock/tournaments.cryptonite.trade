import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { MetaProvider } from "@solidjs/meta";
import { Suspense, Show, createSignal, onMount } from "solid-js";
import { useSearchParams } from "@solidjs/router";
import { UserEntriesProvider } from "./contexts/UserEntries";
import { TournamentStreamProvider } from "./contexts/TournamentStream";
import { setSSOToken } from "./lib/sso";
import Footer from "./components/layout/Footer";
import "./app.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:7002";

function TokenAuthHandler(props: { onStart: () => void; onDone: () => void }) {
  const [searchParams] = useSearchParams();

  onMount(async () => {
    const code = (searchParams.code as string | undefined)?.trim().toUpperCase();
    if (code) sessionStorage.setItem("cryptonite_promo_code", code);

    const urlToken = searchParams.token as string | undefined;
    if (!urlToken) return;

    props.onStart();
    try {
      const res = await fetch(`${API_URL}/v1/auth/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: urlToken }),
      });
      const data = await res.json();
      if (data.success && data.jwt) setSSOToken(data.jwt);
    } catch { /* silent */ }
    props.onDone();
  });

  return null;
}

export default function App() {
  const [isAuthenticating, setIsAuthenticating] = createSignal(false);

  return (
    <MetaProvider>
      <Show when={isAuthenticating()}>
        <div class="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm">
          <div class="w-10 h-10 rounded-full border-4 border-zinc-600 border-t-blue-500 animate-spin mb-4" />
          <p class="text-sm text-zinc-300 tracking-wide">Authenticating…</p>
        </div>
      </Show>
      <Router
        root={(props) => (
          <UserEntriesProvider>
            <TournamentStreamProvider>
              <TokenAuthHandler
                onStart={() => setIsAuthenticating(true)}
                onDone={() => setIsAuthenticating(false)}
              />
              <Suspense>
                {props.children}
                <Footer />
              </Suspense>
            </TournamentStreamProvider>
          </UserEntriesProvider>
        )}
      >
        <FileRoutes />
      </Router>
    </MetaProvider>
  );
}
