import type { ConditionRobustness } from "../lib/report";

/** Token-themed horizontal bars — reads like a testing report, not a chart widget. */
export default function RobustnessChart({ data }: { data: ConditionRobustness[] }) {
  return (
    <ul className="space-y-3">
      {data.map((d) => {
        const tone =
          d.robustness < 60 ? "bg-fail" : d.robustness < 80 ? "bg-warn" : "bg-pass";
        return (
          <li key={d.condition} className="flex items-center gap-4 text-[13px]">
            <span className="w-28 shrink-0 truncate text-slate-300">{d.condition}</span>
            <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-track">
              <span
                className={`block h-full rounded-full ${tone}`}
                style={{ width: `${d.robustness}%` }}
              />
            </span>
            <span className="mono w-16 shrink-0 text-right text-slate-400">{d.robustness}%</span>
            <span className="mono hidden w-24 shrink-0 text-right text-slate-500 sm:block">
              {d.violations}/{d.tests} viol.
            </span>
          </li>
        );
      })}
    </ul>
  );
}
