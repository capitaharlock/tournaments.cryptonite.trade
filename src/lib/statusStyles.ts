// Status-based styling system for tournaments.
// Each status gets its own color identity so users can instantly
// recognize whether a tournament is live, open, scheduled or finished.

export type TournamentStatus =
  | "active"
  | "registration"
  | "scheduled"
  | "finished"
  | "cancelled";

export interface StatusStyle {
  /** Tailwind gradient stops (used as `bg-gradient-to-r ${gradient}`) */
  gradient: string;
  /** Muted version of the full gradient — same hues, ~30% opacity. For secondary strips (footers) that should feel chromatically related to the vibrant header banner. */
  mutedGradient: string;
  /** Soft tint gradient for subtle card backgrounds */
  softGradient: string;
  /** Small pill badge classes */
  badge: string;
  /** Short uppercase label */
  label: string;
  /** Text accent color */
  accent: string;
  /** Ring / border tint */
  ring: string;
  /** CTA button classes */
  cta: string;
  /** Disabled CTA classes (e.g. tournament full) */
  ctaMuted: string;
  /** Glow/shadow color */
  glow: string;
}

const STYLES: Record<TournamentStatus, StatusStyle> = {
  // LIVE — green = running right now
  active: {
    gradient: "from-green-600 via-emerald-500 to-teal-400",
    mutedGradient: "from-green-600/80 via-emerald-500/70 to-teal-400/80",
    softGradient: "from-green-600/20 to-emerald-500/5",
    badge: "bg-black/30 text-white",
    label: "LIVE",
    accent: "text-green-400",
    ring: "border-green-500/30",
    cta: "bg-green-600 hover:bg-green-500 text-white",
    ctaMuted: "bg-gray-800 text-gray-500",
    glow: "shadow-green-500/20",
  },
  // REGISTRATION — blue/cyan = bookable now
  registration: {
    gradient: "from-sky-600 via-cyan-500 to-blue-400",
    mutedGradient: "from-sky-600/80 via-cyan-500/70 to-blue-400/80",
    softGradient: "from-sky-600/20 to-cyan-500/5",
    badge: "bg-black/30 text-white",
    label: "REGISTRATION OPEN",
    accent: "text-cyan-400",
    ring: "border-cyan-500/30",
    cta: "bg-cyan-500 hover:bg-cyan-400 text-black",
    ctaMuted: "bg-gray-800 text-gray-500",
    glow: "shadow-cyan-500/20",
  },
  // SCHEDULED — amber = coming soon, not open yet
  scheduled: {
    gradient: "from-amber-600 via-orange-500 to-yellow-400",
    mutedGradient: "from-amber-600/80 via-orange-500/70 to-yellow-400/80",
    softGradient: "from-amber-600/20 to-orange-500/5",
    badge: "bg-black/30 text-white",
    label: "SCHEDULED",
    accent: "text-amber-400",
    ring: "border-amber-500/30",
    cta: "bg-amber-500 hover:bg-amber-400 text-black",
    ctaMuted: "bg-gray-800 text-gray-500",
    glow: "shadow-amber-500/20",
  },
  // FINISHED — slate = past, muted
  finished: {
    gradient: "from-slate-700 via-gray-600 to-zinc-700",
    mutedGradient: "from-slate-700/80 via-gray-600/70 to-zinc-700/80",
    softGradient: "from-slate-700/30 to-gray-700/10",
    badge: "bg-black/40 text-white/60",
    label: "FINISHED",
    accent: "text-gray-400",
    ring: "border-gray-700/40",
    cta: "bg-gray-700 hover:bg-gray-600 text-gray-200",
    ctaMuted: "bg-gray-800 text-gray-500",
    glow: "shadow-black/40",
  },
  cancelled: {
    gradient: "from-red-900 via-red-800 to-rose-900",
    mutedGradient: "from-red-900/50 via-red-800/35 to-rose-900/50",
    softGradient: "from-red-900/30 to-rose-900/10",
    badge: "bg-black/40 text-red-300",
    label: "CANCELLED",
    accent: "text-red-400",
    ring: "border-red-500/30",
    cta: "bg-gray-800 text-gray-500",
    ctaMuted: "bg-gray-800 text-gray-500",
    glow: "shadow-red-500/10",
  },
};

export function getStatusStyle(status: string | undefined | null): StatusStyle {
  if (!status) return STYLES.scheduled;
  return STYLES[status as TournamentStatus] || STYLES.scheduled;
}
