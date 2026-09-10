import { usePipeline } from "../hooks/useTestingPipeline";

const CONDITION_OF: Record<string, string> = {
  brightness: "Brightness", contrast: "Contrast", blur: "Blur", bgr: "Channel reorder",
  rotate: "Rotation", haze: "Haze", fog: "Fog", rain: "Rain", night: "Night", dusk: "Dusk",
  glare: "Glare", motionblur: "Motion blur", occlusion: "Occlusion", insert: "Object insertion",
};

const LOW_VIS = new Set(["Fog", "Rain", "Night", "Dusk", "Haze", "Glare"]);

export default function TestingMemoryPanel() {
  const { completedCases, memory } = usePipeline();

  const tested = completedCases.map((c) => CONDITION_OF[c.transformStyle] ?? c.transformStyle);
  const vulns = memory.failuresByCondition.map((f) => f.condition);
  const priorityLowVis = vulns.some((v) => LOW_VIS.has(v));

  return (
    <div className="card card-pad space-y-3">
      <div className="flex items-center justify-between">
        <span className="label">Testing memory</span>
        <span className="mono text-[11px] text-slate-500">{memory.testsCompleted}/10</span>
      </div>

      <div className="flex gap-5 text-sm">
        <div>
          <div className="font-semibold text-pass">{memory.passed}</div>
          <div className="text-[11px] text-slate-500">satisfied</div>
        </div>
        <div>
          <div className="font-semibold text-fail">{memory.violations}</div>
          <div className="text-[11px] text-slate-500">violations</div>
        </div>
      </div>

      {tested.length > 0 && (
        <div>
          <div className="label mb-1">Conditions probed</div>
          <div className="flex flex-wrap gap-1">
            {tested.map((t, i) => (
              <span key={i} className="chip !py-0 text-[10.5px]">
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {vulns.length > 0 && (
        <div>
          <div className="label mb-1">Observed vulnerabilities</div>
          <div className="space-y-0.5">
            {memory.failuresByCondition.map((f) => (
              <div key={f.condition} className="flex justify-between text-[12px]">
                <span className="text-slate-400">{f.condition}</span>
                <span className="text-fail">
                  {f.count} viol{f.count > 1 ? "s" : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {memory.violations > 0 && (
        <div className="border-t hairline pt-2 text-[12px]">
          <span className="text-slate-500">Affected class — </span>
          <span className="font-medium text-fail">pedestrian</span>
        </div>
      )}

      <div className="rounded-md border hairline bg-base-800 p-2.5 text-[11.5px] leading-relaxed text-slate-400">
        <span className="font-medium text-slate-300">Adaptive prioritisation: </span>
        {priorityLowVis
          ? "low-visibility conditions (fog, night, glare) are prioritised for the remaining test budget."
          : "no vulnerable-condition pattern yet — selection stays broad."}
      </div>
    </div>
  );
}
