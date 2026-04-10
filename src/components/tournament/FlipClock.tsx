import { createSignal, onCleanup } from "solid-js";

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

  const digitClass = () => {
    const base = "bg-gray-900 border border-gray-700 rounded font-mono font-bold text-white inline-flex items-center justify-center";
    const blink = isLastHour() ? " animate-pulse border-red-500/60" : "";
    switch (sz()) {
      case "sm": return `${base} text-sm w-7 h-8${blink}`;
      case "lg": return `${base} text-2xl w-12 h-14${blink}`;
      default:   return `${base} text-lg w-9 h-11${blink}`;
    }
  };

  const labelClass = () => {
    switch (sz()) {
      case "sm": return "text-[9px]";
      case "lg": return "text-[11px]";
      default:   return "text-[10px]";
    }
  };

  const sepClass = () => {
    switch (sz()) {
      case "sm": return "text-gray-600 text-xs mx-0.5";
      case "lg": return "text-gray-600 text-xl mx-1";
      default:   return "text-gray-600 text-base mx-0.5";
    }
  };

  return (
    <div class="text-center">
      {props.label && (
        <p class={`text-gray-500 mb-1.5 ${labelClass()}`}>{props.label}</p>
      )}
      <div class={`flex items-center justify-center gap-1 ${isFinished() ? "opacity-40" : ""}`}>
        {/* Days */}
        {time().d > 0 && (
          <>
            <div class="flex flex-col items-center">
              <span class={digitClass()}>{String(time().d).padStart(2, "0")}</span>
              <span class={`${labelClass()} text-gray-600 mt-0.5`}>DAYS</span>
            </div>
            <span class={sepClass()}>:</span>
          </>
        )}

        {/* Hours */}
        <div class="flex flex-col items-center">
          <span class={digitClass()}>{String(time().h).padStart(2, "0")}</span>
          <span class={`${labelClass()} text-gray-600 mt-0.5`}>HRS</span>
        </div>
        <span class={sepClass()}>:</span>

        {/* Minutes */}
        <div class="flex flex-col items-center">
          <span class={digitClass()}>{String(time().m).padStart(2, "0")}</span>
          <span class={`${labelClass()} text-gray-600 mt-0.5`}>MIN</span>
        </div>
        <span class={sepClass()}>:</span>

        {/* Seconds */}
        <div class="flex flex-col items-center">
          <span class={`${digitClass()} ${isLastHour() ? "text-red-400" : ""}`}>
            {String(time().s).padStart(2, "0")}
          </span>
          <span class={`${labelClass()} text-gray-600 mt-0.5`}>SEC</span>
        </div>
      </div>
    </div>
  );
}
