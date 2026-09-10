import type { Prediction } from "../data/testCases";
import { CLASS_COLORS } from "../data/testCases";

export default function PredictionTable({
  title,
  preds,
  baseline,
}: {
  title: string;
  preds: Prediction[];
  baseline?: Prediction[];
}) {
  return (
    <div>
      <div className="label mb-2">{title}</div>
      <div className="space-y-1">
        {preds.map((p, i) => {
          const b = baseline?.[i];
          const delta = b ? p.conf - b.conf : 0;
          const dropped = p.conf < 0.5;
          return (
            <div
              key={i}
              className={`flex items-center gap-2 rounded-md border px-2.5 py-1.5 mono text-[12px] ${
                dropped ? "border-fail/40 bg-fail/5" : "border-base-700/50 bg-base-900/40"
              }`}
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: dropped ? "#f87171" : CLASS_COLORS[p.cls] ?? "#94a3b8" }}
              />
              <span className={`min-w-0 flex-1 truncate ${dropped ? "text-fail" : "text-slate-200"}`}>
                {p.cls}
              </span>
              <span className={`shrink-0 tabular-nums ${dropped ? "text-fail" : "text-slate-300"}`}>
                {p.conf.toFixed(2)}
              </span>
              {b && (
                <span
                  className={`w-11 shrink-0 text-right tabular-nums ${
                    delta < -0.09 ? "text-fail" : delta < -0.02 ? "text-warn" : "text-slate-600"
                  }`}
                >
                  {delta >= 0 ? "+" : ""}
                  {delta.toFixed(2)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
