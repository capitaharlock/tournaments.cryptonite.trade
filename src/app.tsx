import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { MetaProvider } from "@solidjs/meta";
import { Suspense } from "solid-js";
import { UserEntriesProvider } from "./contexts/UserEntries";
import "./app.css";

export default function App() {
  return (
    <MetaProvider>
      <Router
        root={(props) => (
          <UserEntriesProvider>
            <Suspense>{props.children}</Suspense>
          </UserEntriesProvider>
        )}
      >
        <FileRoutes />
      </Router>
    </MetaProvider>
  );
}
