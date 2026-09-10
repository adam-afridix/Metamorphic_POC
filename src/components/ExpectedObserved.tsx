import type { ResolvedCase } from "../data/testCases";
import { affectedDelta } from "../lib/testTrace";
import { ResultBadge } from "./ui";

const INTERPRETATION: Record<string, (cls: string, cond: string) => string> = {
  "confidence degradation": (cls, cond) =>
    `Low visibility substantially reduced ${cls} detection confidence, indicating a robustness weakness under ${cond} conditions.`,
  "false negative": (cls, cond) =>
    `The ${cls} was not detected after the transformation, indicating a robustness weakness under ${cond} conditions.`,
  "object disappearance": (cls, cond) =>
    `A previously detected ${cls} was lost after the transformation — a robustness weakness under ${cond} conditions.`,
  "class confusion": (cls, cond) =>
    `The ${cls} was re-classified after the transformation, indicating unstable class boundaries under ${cond} conditions.`,
  "localisation degradation": (cls, cond) =>
    `The ${cls} bounding box degraded after the transformation under ${cond} conditions.`,
};

const CONDITION_WORD: Record<string, string> = {
  night: "night", fog: "fog", rain: "rain", glare: "lens glare", haze: "haze",
  dusk: "dusk", occlusion: "occlusion", motionblur: "motion blur", brightness: "brightness",
  rotate: "rotation", contrast: "contrast", blur: "blur", bgr: "channel reorder", insert: "added objects",
};

export default function ExpectedObserved({ tc }: { tc: ResolvedCase }) {
  const d = affectedDelta(tc);
  const cond = CONDITION_WORD[tc.transformStyle] ?? tc.transformStyle;
  const interp =
    tc.failure && INTERPRETATION[tc.failure.category]
      ? INTERPRETATION[tc.failure.category](tc.failure.affectedClass, cond)
      : tc.failure?.likelyCause;

  return (
    <div className="rounded-lg border hairline bg-base-800 p-3.5">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <div className="label mb-1">Expected behaviour</div>
          <p className="text-[12.5px] leading-relaxed text-slate-300">{tc.mr.expected}</p>
        </div>
        <div>
          <div className="label mb-1">Observed behaviour</div>
          {d ? (
            <p className="text-[12.5px] leading-relaxed text-slate-300">
              {d.cls} confidence:{" "}
              <span className="mono">
                {d.before.toFixed(2)} → {d.after.toFixed(2)}
              </span>
            </p>
          ) : (
            <p className="text-[12.5px] leading-relaxed text-slate-300">
              Detections within tolerance across both images.
            </p>
          )}
          {tc.failure && (
            <p className="mt-1 text-[11.5px] leading-relaxed text-slate-500">{tc.failure.observed}</p>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1 border-t hairline pt-2.5 text-[12.5px]">
        {d && (
          <span>
            <span className="text-slate-500">Change </span>
            <span className={`mono font-semibold ${d.pct <= -25 ? "text-fail" : d.pct < -5 ? "text-warn" : "text-slate-300"}`}>
              {d.pct >= 0 ? "+" : ""}
              {d.pct.toFixed(1)}%
            </span>
          </span>
        )}
        <span className="flex items-center gap-2">
          <span className="text-slate-500">Verdict</span>
          <ResultBadge result={tc.result} />
        </span>
      </div>

      {interp && (
        <div className="mt-3">
          <div className="label mb-1">Agent interpretation</div>
          <p className="border-l-2 border-accent/40 pl-3 text-[12.5px] leading-relaxed text-slate-400">
            {interp}
          </p>
        </div>
      )}
    </div>
  );
}
