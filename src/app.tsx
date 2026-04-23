import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { MetaProvider } from "@solidjs/meta";
import { Suspense } from "solid-js";
import { UserEntriesProvider } from "./contexts/UserEntries";
import { TournamentStreamProvider } from "./contexts/TournamentStream";
import "./app.css";

export default function App() {
  return (
    <MetaProvider>
      <Router
        root={(props) => (
          <UserEntriesProvider>
            <TournamentStreamProvider>
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
