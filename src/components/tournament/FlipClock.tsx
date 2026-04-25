import { createSignal, onCleanup, Show, onMount } from "solid-js";

interface Props {
  targetDate: string;
  label?: string;
  size?: "sm" | "md" | "lg";
}

export default function FlipClock(props: Props) {
  const calcRemaining = () => {
    const diff = new Date(props.targetDate).getTime() - Date.now();
    if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0, total: diff };
    return {
      d: Math.floor(diff / 86400000),
      h: Math.floor((diff % 86400000) / 3600000),
      m: Math.floor((diff % 3600000) / 60000),
      s: Math.floor((diff % 60000) / 1000),
      total: diff,
    };
  };

  const [time, setTime] = createSignal(calcRemaining());
  const [mounted, setMounted] = createSignal(false);
  let intervalId: ReturnType<typeof setInterval>;

  onMount(() => {
    setMounted(true);
    setTime(calcRemaining()); // Recalc on client
    intervalId = setInterval(() => setTime(calcRemaining()), 1000);
  });
  onCleanup(() => clearInterval(intervalId));

  const isLastHour = () => time().total > 0 && time().total < 3600000;
  const sz = () => props.size || "md";

  const digitBox = () => {
    const base = "relative overflow-hidden font-mono font-black text-white rounded inline-flex items-center justify-center";
    const border = isLastHour()
      ? "border border-red-500/50 shadow-sm shadow-red-500/20"
      : "border border-gray-700/60 shadow-sm shadow-black/40";
    const bg = "bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a]";
    switch (sz()) {
      case "sm": return `${base} ${border} ${bg} w-7 h-8 text-sm`;
      case "lg": return `${base} ${border} ${bg} w-14 h-16 text-3xl`;
      default:   return `${base} ${border} ${bg} w-10 h-12 text-xl`;
    }
  };

  const labelCls = () => sz() === "lg" ? "text-xs mt-1.5" : sz() === "sm" ? "text-[10px] mt-1" : "text-[11px] mt-1";
  const colonCls = () => sz() === "lg" ? "text-gray-400 text-xl mx-0.5 mb-3" : sz() === "sm" ? "text-gray-400 text-[10px] mx-0" : "text-gray-400 text-sm mx-0";
  const gapCls = () => sz() === "lg" ? "gap-1.5" : "gap-1";

  return (
    <div class="text-center">
      <Show when={props.label}>
        <p class={`text-gray-300 mb-1.5 ${sz() === "lg" ? "text-xs" : "text-[11px]"} uppercase tracking-widest font-semibold`}>
          {props.label}
        </p>
      </Show>
      <div class={`flex items-center justify-center ${gapCls()}`}>
        <Digit value={() => time().d} label="DAYS" box={digitBox()} labelCls={labelCls()} urgent={isLastHour()} />
        <span class={colonCls()}>:</span>
        <Digit value={() => time().h} label="HRS" box={digitBox()} labelCls={labelCls()} urgent={isLastHour()} />
        <span class={colonCls()}>:</span>
        <Digit value={() => time().m} label="MIN" box={digitBox()} labelCls={labelCls()} urgent={isLastHour()} />
        <span class={colonCls()}>:</span>
        <Digit value={() => time().s} label="SEC" box={digitBox()} labelCls={labelCls()} urgent={isLastHour()} highlight />
      </div>
    </div>
  );
}

// Digit uses a getter function for reactivity
function Digit(props: { value: () => number; label: string; box: string; labelCls: string; urgent?: boolean; highlight?: boolean }) {
  return (
    <div class="flex flex-col items-center">
      <div class={props.box}>
        <div class="absolute left-0 right-0 top-1/2 h-px bg-black/40 z-10" />
        <div class="absolute inset-x-0 top-0 h-1/2 bg-white/[0.03] rounded-t" />
        <span class={props.urgent && props.highlight ? "text-red-400" : ""}>
          {String(props.value()).padStart(2, "0")}
        </span>
      </div>
      <span class={`${props.labelCls} text-gray-400 font-semibold tracking-wider uppercase`}>{props.label}</span>
    </div>
  );
}
