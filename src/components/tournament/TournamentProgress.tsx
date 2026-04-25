import { createSignal, onCleanup, For, Show } from "solid-js";

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

  // totalDays + 1 dots: index 0 = start, index N = end of day N
  const dots = () => Array.from({ length: props.totalDays + 1 }, (_, i) => i);

  return (
    <div class="space-y-1.5">
      {/* Day dots — full width, no label */}
      <div class="flex items-center w-full">
        <For each={dots()}>
          {(dotIndex) => {
            const isPast = () => state().daysPassed > dotIndex;
            const isCurrent = () => state().daysPassed === dotIndex && state().started;
            return (
              <div class={`flex items-center ${dotIndex < props.totalDays ? "flex-1" : "flex-none"}`}>
                <div class={`w-2 h-2 rounded-full flex-shrink-0 transition-all duration-500 ${
                  isPast()
                    ? "bg-green-500"
                    : isCurrent()
                    ? "bg-green-400 ring-2 ring-green-400/30"
                    : "bg-gray-700"
                }`} />
                <Show when={dotIndex < props.totalDays}>
                  <div class={`flex-1 h-0.5 rounded mx-0.5 ${isPast() ? "bg-green-500/60" : "bg-gray-800"}`} />
                </Show>
              </div>
            );
          }}
        </For>
      </div>

      {/* Progress bar — shows last-24h gradient when live, or full teal bar when completed */}
      <div class={`relative h-1.5 rounded-full overflow-hidden ${
        state().isLastDay && state().isLastHour && state().pct < 100 ? "ring-1 ring-red-500/50 animate-pulse" : ""
      }`}>
        <div class="absolute inset-0 bg-gray-800 rounded-full" />
        {state().pct >= 100 ? (
          /* Tournament completed — full bar with teal/silver gradient */
          <div
            class="absolute inset-y-0 left-0 rounded-full"
            style="width: 100%; background: linear-gradient(90deg, #2dd4bf, #67e8f9, #a5b4fc);"
          />
        ) : state().isLastDay && state().started ? (
          <div
            class="absolute inset-y-0 left-0 rounded-full transition-all duration-1000"
            style={`width: ${Math.min((state().hoursInDay / 24) * 100, 100)}%; background: linear-gradient(90deg, #22c55e, #eab308, #f97316, #ef4444);`}
          />
        ) : null}
      </div>
    </div>
  );
}
