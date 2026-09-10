import { AlertTriangle, ShieldCheck, Printer } from "lucide-react";
import { usePipeline } from "../hooks/useTestingPipeline";
import RequireRun from "../components/RequireRun";
import { MetricCard, SectionTitle, SeverityBadge } from "../components/ui";
import RobustnessChart from "../components/RobustnessChart";
import { conditionRobustness, summary } from "../lib/report";

function ReportView() {
  const { completedCases, status } = usePipeline();
  const done = status === "done" && completedCases.length === 10;
  const cases = completedCases;
  const s = summary(cases);
  const conds = conditionRobustness(cases);
  const worst = conds.slice(0, 3);

  const sev = { HIGH: 3, MEDIUM: 2, LOW: 1 } as const;
  const problematic = cases
    .filter((c) => c.result === "VIOLATION" && c.failure)
    .map((c) => ({
      mr: c.mr.name,
      cls: c.failure!.affectedClass,
      category: c.failure!.category,
      severity: c.failure!.severity,
    }))
    .sort((a, b) => sev[b.severity] - sev[a.severity]);

  return (
    <div className="space-y-6">
      {!done && (
        <div className="rounded-lg border border-warn/30 bg-warn/5 px-4 py-2.5 text-sm text-warn">
          Partial report — {cases.length}/10 tests completed. Run the pipeline to the end for the full profile.
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <div className="label">Model robustness report</div>
          <h2 className="text-xl font-bold text-slate-100">Metamorphic Testing Report</h2>
        </div>
        <button className="btn-ghost !py-1.5 !text-xs" onClick={() => window.print()}>
          <Printer size={14} /> Print / PDF
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <MetricCard label="Baseline mAP@0.5" value={s.baselineMap.toFixed(2)} />
        <MetricCard label="Metamorphic tests" value={s.total} />
        <MetricCard label="MR violations" value={s.violations} tone="fail" sub={`${s.highSeverity} high severity`} />
        <MetricCard label="Violation rate" value={`${(s.violationRate * 100).toFixed(1)}%`} tone="warn" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="card card-pad">
          <SectionTitle hint="Heuristic score: 1 − violation rate − mean confidence drop. POC illustration.">
            Robustness by condition
          </SectionTitle>
          <RobustnessChart data={[...conds].reverse()} />
        </div>

        <div className="space-y-4">
          <div className="card card-pad">
            <div className="label mb-3">Metamorphic relations that failed</div>
            {problematic.length === 0 ? (
              <div className="text-sm text-slate-400">No violations recorded.</div>
            ) : (
              <ol className="space-y-2">
                {problematic.map((p, i) => (
                  <li key={p.mr} className="rounded-lg border border-fail/25 bg-fail/5 px-3 py-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-200">
                        <span className="mono mr-2 text-slate-600">{i + 1}</span>
                        {p.mr}
                      </span>
                      <SeverityBadge severity={p.severity} />
                    </div>
                    <div className="mono mt-1 text-[11px] text-slate-500">
                      {p.category} · {p.cls}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
          <div className="card card-pad">
            <div className="label mb-2">Most vulnerable conditions</div>
            <ol className="space-y-1.5 text-sm text-slate-300">
              {worst.map((w, i) => (
                <li key={w.condition} className="flex items-center justify-between">
                  <span>
                    <span className="mono mr-2 text-slate-600">{i + 1}</span>
                    {w.condition}
                  </span>
                  <span className="mono text-xs text-slate-500">{w.robustness}% robust</span>
                </li>
              ))}
            </ol>
            <div className="mt-3 border-t border-base-700/50 pt-2 text-sm">
              <span className="text-slate-500">Most affected class — </span>
              <span className="font-semibold text-fail">{s.mostAffected}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card card-pad border-warn/30">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 shrink-0 text-warn" />
          <div>
            <div className="text-sm font-bold uppercase tracking-wide text-warn">
              AI robustness assessment — Needs improvement
            </div>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-300">
              The model performs well under photometric and geometric metamorphic relations (brightness,
              contrast, rotation, channel reorder) and retains vehicle detections across all tested
              conditions. However, significant metamorphic violations were observed under{" "}
              <span className="text-slate-100">
                {worst.map((w) => w.condition.toLowerCase()).join(", ")}
              </span>
              , concentrated on the <span className="text-slate-100">{s.mostAffected}</span> class.
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div className="rounded-lg border border-base-700/50 bg-base-900/40 p-3 text-xs">
                <div className="text-slate-500">Recommended action</div>
                <div className="mt-1 text-slate-300">
                  Increase training-data diversity for low-visibility, night-time and partially occluded
                  road users; add targeted augmentation and re-test.
                </div>
              </div>
              <div className="rounded-lg border border-base-700/50 bg-base-900/40 p-3 text-xs">
                <div className="text-slate-500">Coverage caveat</div>
                <div className="mt-1 text-slate-300">
                  {Math.round(s.mrCoverage * 100)}% MR coverage over 10 source images. Broader coverage
                  is required before any deployment decision.
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck size={14} />
              This is a <span className="text-slate-300">metamorphic robustness assessment</span>, not a
              guarantee of production readiness.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Report() {
  return (
    <RequireRun>
      <ReportView />
    </RequireRun>
  );
}
