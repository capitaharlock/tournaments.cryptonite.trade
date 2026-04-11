import { A } from "@solidjs/router";
import type { Tournament } from "../../types/tournament";
import Countdown from "./Countdown";

interface Props {
  tournament: Tournament;
}

const statusColors: Record<string, string> = {
  registration: "bg-green-500/20 text-green-400",
  active: "bg-brand-gold/20 text-brand-gold",
  finished: "bg-gray-500/20 text-gray-400",
  closing: "bg-orange-500/20 text-orange-400",
};

export default function TournamentCard(props: Props) {
  const t = () => props.tournament;
  const isLive = () => t().status === "active";
  const isRegistering = () => t().status === "registration";

  return (
    <A
      href={`/tournaments/${t().slug}`}
      class="block bg-brand-card border border-brand-border rounded-lg p-5 hover:border-brand-gold/40 transition group"
    >
      <div class="flex items-center justify-between mb-3">
        <h3 class="font-semibold text-white group-hover:text-brand-gold transition">
          {t().name}
        </h3>
        <span class={`text-xs px-2 py-0.5 rounded-full ${statusColors[t().status] || "bg-gray-700 text-gray-300"}`}>
          {t().status}
        </span>
      </div>

      <div class="grid grid-cols-3 gap-3 text-sm mb-4">
        <div>
          <p class="text-gray-500 text-xs">Account</p>
          <p class="text-white font-medium">${t().account_size.toLocaleString()}</p>
        </div>
        <div>
          <p class="text-gray-500 text-xs">Entry</p>
          <p class="text-white font-medium">${t().entry_fee}</p>
        </div>
        <div>
          <p class="text-gray-500 text-xs">Spots</p>
          <p class="text-white font-medium">
            {t().reserved_spots}/{t().total_spots}
          </p>
        </div>
      </div>

      {isLive() && <Countdown targetDate={t().ends_at} label="Ends in" />}
      {isRegistering() && <Countdown targetDate={t().starts_at} label="Starts in" />}

      <div class="mt-4 pt-3 border-t border-brand-border">
        <p class="text-xs text-gray-500">Prizes</p>
        <div class="flex flex-wrap gap-1.5 mt-1">
          {(t().prizes as any[]).map((p) => (
            <span class="text-xs bg-brand-dark px-2 py-0.5 rounded text-gray-300">
              x{p.rank_to - p.rank_from + 1} {p.type === "cash" ? `$${p.value}` : (p.label || p.type).replace("Free ", "")}
            </span>
          ))}
        </div>
      </div>
    </A>
  );
}
