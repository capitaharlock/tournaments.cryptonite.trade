import { createSignal, onCleanup, createEffect } from "solid-js";

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
  const interval = setInterval(() => setTime(calcRemaining()), 1000);
  onCleanup(() => clearInterval(interval));

  const isLastHour = () => time().total > 0 && time().total < 3600000;
  const isFinished = () => time().total <= 0;
  const sz = () => props.size || "md";

  return (
    <div class="text-center">
      {props.label && (
        <p class={`text-gray-500 mb-1.5 ${sz() === "lg" ? "text-[10px]" : "text-[9px]"} uppercase tracking-wider`}>
          {props.label}
        </p>
      )}
      <div class={`flex items-center justify-center ${sz() === "lg" ? "gap-1.5" : "gap-1"} ${isFinished() ? "opacity-40" : ""}`}>
        {time().d > 0 && (
          <>
            <FlipUnit value={time().d} label="DAYS" size={sz()} urgent={isLastHour()} />
            <Colon size={sz()} />
          </>
        )}
        <FlipUnit value={time().h} label="HRS" size={sz()} urgent={isLastHour()} />
        <Colon size={sz()} />
        <FlipUnit value={time().m} label="MIN" size={sz()} urgent={isLastHour()} />
        <Colon size={sz()} />
        <FlipUnit value={time().s} label="SEC" size={sz()} urgent={isLastHour()} highlight />
      </div>
    </div>
  );
}

function FlipUnit(props: { value: number; label: string; size: string; urgent?: boolean; highlight?: boolean }) {
  const [prev, setPrev] = createSignal(props.value);
  const [flipping, setFlipping] = createSignal(false);

  createEffect(() => {
    const newVal = props.value;
    if (newVal !== prev()) {
      setFlipping(true);
      setTimeout(() => {
        setPrev(newVal);
        setFlipping(false);
      }, 300);
    }
  });

  const display = () => String(props.value).padStart(2, "0");
  const prevDisplay = () => String(prev()).padStart(2, "0");

  const boxClass = () => {
    const base = "relative overflow-hidden font-mono font-black text-white rounded";
    const border = props.urgent
      ? "border border-red-500/50 shadow-sm shadow-red-500/20"
      : "border border-gray-700/60 shadow-sm shadow-black/40";
    const bg = "bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a]";

    switch (props.size) {
      case "sm": return `${base} ${border} ${bg} w-7 h-8 text-sm`;
      case "lg": return `${base} ${border} ${bg} w-14 h-16 text-3xl`;
      default:   return `${base} ${border} ${bg} w-10 h-12 text-xl`;
    }
  };

  const labelClass = () => {
    switch (props.size) {
      case "sm": return "text-[8px] mt-0.5";
      case "lg": return "text-[10px] mt-1";
      default:   return "text-[9px] mt-0.5";
    }
  };

  return (
    <div class="flex flex-col items-center">
      <div class={boxClass()}>
        {/* Split line in the middle */}
        <div class="absolute left-0 right-0 top-1/2 h-px bg-black/40 z-10" />

        {/* Top half — slightly lighter */}
        <div class="absolute inset-x-0 top-0 h-1/2 bg-white/[0.03] rounded-t" />

        {/* Number */}
        <div class={`flex items-center justify-center h-full transition-transform duration-300 ${
          flipping() ? "animate-flip" : ""
        }`}>
          <span class={props.urgent && props.highlight ? "text-red-400" : ""}>
            {display()}
          </span>
        </div>
      </div>
      <span class={`${labelClass()} text-gray-600 font-medium`}>{props.label}</span>
    </div>
  );
}

function Colon(props: { size: string }) {
  const cls = () => {
    switch (props.size) {
      case "sm": return "text-gray-600 text-[10px] mx-0";
      case "lg": return "text-gray-600 text-xl mx-0.5 mb-3";
      default:   return "text-gray-600 text-sm mx-0";
    }
  };
  return <span class={cls()}>:</span>;
}
