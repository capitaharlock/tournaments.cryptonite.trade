import { createSignal, onCleanup, For } from "solid-js";

interface Props {
  startsAt: string;
  endsAt: string;
  totalDays: number;
}

export default function TournamentProgress(props: Props) {
  const calc = () => {
    const now = Date.now();
    const start = new Date(props.startsAt).getTime();
    const end = new Date(props.endsAt).getTime();
    const total = end - start;
    const elapsed = now - start;
    const remaining = end - now;

    if (now < start) return { started: false, daysPassed: 0, hoursInDay: 0, isLastDay: false, isLastHour: false, pct: 0 };
    if (now > end) return { started: true, daysPassed: props.totalDays, hoursInDay: 24, isLastDay: true, isLastHour: true, pct: 100 };

    const daysPassed = Math.floor(elapsed / 86400000);
    const hoursInCurrentDay = (elapsed % 86400000) / 3600000;
    const isLastDay = remaining < 86400000;
    const isLastHour = remaining < 3600000;
    const pct = (elapsed / total) * 100;

    return { started: true, daysPassed, hoursInDay: hoursInCurrentDay, isLastDay, isLastHour, pct };
  };

  const [state, setState] = createSignal(calc());
  const interval = setInterval(() => setState(calc()), 5000);
  onCleanup(() => clearInterval(interval));

  const days = () => Array.from({ length: props.totalDays }, (_, i) => i);

  return (
    <div class="space-y-1.5">
      {/* Day dots */}
      <div class="flex items-center gap-1">
        <For each={days()}>
          {(dayIndex) => {
            const isPast = () => state().daysPassed > dayIndex;
            const isCurrent = () => state().daysPassed === dayIndex && state().started;
            return (
              <div class="flex items-center gap-1 flex-1">
                <div
                  class={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${
                    isPast()
                      ? "bg-green-500"
                      : isCurrent()
                      ? "bg-green-400 ring-2 ring-green-400/30"
                      : "bg-gray-700"
                  }`}
                />
                {dayIndex < props.totalDays - 1 && (
                  <div class={`flex-1 h-0.5 rounded ${
                    isPast() ? "bg-green-500/60" : "bg-gray-800"
                  }`} />
                )}
              </div>
            );
          }}
        </For>
        <span class="text-[9px] text-gray-600 ml-1">
          D{Math.min(state().daysPassed + 1, props.totalDays)}/{props.totalDays}
        </span>
      </div>

      {/* Final-24h progress bar — always rendered (gray when not yet last day,
          so both panels have matching height). Activates with color gradient
          once we're in the last 24h. */}
      <div class={`relative h-1.5 rounded-full overflow-hidden ${
        state().isLastDay && state().isLastHour ? "ring-1 ring-red-500/50 animate-pulse" : ""
      }`}>
        <div class="absolute inset-0 bg-gray-800 rounded-full" />
        {state().isLastDay && state().started ? (
          <div
            class="absolute inset-y-0 left-0 rounded-full transition-all duration-1000"
            style={`width: ${Math.min((state().hoursInDay / 24) * 100, 100)}%; background: linear-gradient(90deg, #22c55e, #eab308, #f97316, #ef4444);`}
          />
        ) : null}
      </div>
    </div>
  );
}
