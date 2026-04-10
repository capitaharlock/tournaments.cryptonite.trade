import { createSignal, onCleanup } from "solid-js";

interface Props {
  targetDate: string;
  label?: string;
}

export default function Countdown(props: Props) {
  const calcRemaining = () => {
    const diff = new Date(props.targetDate).getTime() - Date.now();
    if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0 };
    return {
      d: Math.floor(diff / 86400000),
      h: Math.floor((diff % 86400000) / 3600000),
      m: Math.floor((diff % 3600000) / 60000),
      s: Math.floor((diff % 60000) / 1000),
    };
  };

  const [time, setTime] = createSignal(calcRemaining());
  const interval = setInterval(() => setTime(calcRemaining()), 1000);
  onCleanup(() => clearInterval(interval));

  return (
    <div class="text-center">
      {props.label && <p class="text-gray-400 text-xs mb-1">{props.label}</p>}
      <div class="flex gap-2 justify-center text-sm font-mono">
        <span class="bg-brand-card px-2 py-1 rounded">{time().d}d</span>
        <span class="bg-brand-card px-2 py-1 rounded">{String(time().h).padStart(2, "0")}h</span>
        <span class="bg-brand-card px-2 py-1 rounded">{String(time().m).padStart(2, "0")}m</span>
        <span class="bg-brand-card px-2 py-1 rounded text-brand-gold">{String(time().s).padStart(2, "0")}s</span>
      </div>
    </div>
  );
}
