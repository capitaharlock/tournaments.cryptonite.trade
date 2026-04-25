import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { MetaProvider } from "@solidjs/meta";
import { Suspense, onMount } from "solid-js";
import { useSearchParams } from "@solidjs/router";
import { UserEntriesProvider } from "./contexts/UserEntries";
import { TournamentStreamProvider } from "./contexts/TournamentStream";
import { setSSOToken } from "./lib/sso";
import "./app.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:7002";

// Runs on every initial page load (not in Suspense, so fires before route components).
// Handles ?token= auto-login and ?code= promo persistence for the entire app.
function TokenAuthHandler() {
  const [searchParams] = useSearchParams();

  onMount(async () => {
    const code = (searchParams.code as string | undefined)?.trim().toUpperCase();
    if (code) sessionStorage.setItem("cryptonite_promo_code", code);

    const urlToken = searchParams.token as string | undefined;
    if (!urlToken) return;

    try {
      const res = await fetch(`${API_URL}/v1/auth/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: urlToken }),
      });
      const data = await res.json();
      if (data.valid) setSSOToken(urlToken);
    } catch { /* silent — continue without auth */ }

    const redirect = searchParams.redirect as string | undefined;
    if (redirect) {
      const dest = new URL(redirect, window.location.origin);
      if (code) dest.searchParams.set("code", code);
      window.location.replace(dest.toString());
    } else {
      const clean = new URL(window.location.href);
      clean.searchParams.delete("token");
      window.location.replace(clean.toString());
    }
  });

  return null;
}

export default function App() {
  return (
    <MetaProvider>
      <Router
        root={(props) => (
          <UserEntriesProvider>
            <TournamentStreamProvider>
              <TokenAuthHandler />
              <Suspense>{props.children}</Suspense>
            </TournamentStreamProvider>
          </UserEntriesProvider>
        )}
      >
        <FileRoutes />
      </Router>
    </MetaProvider>
  );
}
