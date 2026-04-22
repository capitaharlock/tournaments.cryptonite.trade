/**
 * RegisteredCTA — drop-in replacement for the "Sign Up" button when the
 * user already has an entry in the tournament. Same footprint (full-width
 * block element) so it can replace the CTA without layout shifts.
 */
import { A } from "@solidjs/router";
import { JSX } from "solid-js";

interface Props {
  /** Tournament slug used for the "View Tournament" link. */
  slug: string;
  /** Tailwind class override for sizing; defaults match most CTAs. */
  class?: string;
  /** Slightly different copy depending on the tournament phase. */
  tone?: "waiting" | "live" | "ended";
}

export default function RegisteredCTA(props: Props): JSX.Element {
  const label = () => {
    switch (props.tone) {
      case "live":
        return "✓ You're in — trade now";
      case "ended":
        return "✓ You participated";
      default:
        return "✓ You're in — good luck!";
    }
  };

  return (
    <A
      href={`/tournaments/${props.slug}`}
      class={
        props.class ||
        "block w-full py-3.5 text-center bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/40 text-emerald-300 font-bold rounded-lg text-sm transition hover:from-emerald-500/30 hover:to-emerald-600/20"
      }
    >
      {label()}
    </A>
  );
}
