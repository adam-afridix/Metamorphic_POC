import { useSearchParams } from "react-router-dom";
import { Check, X, ChevronRight } from "lucide-react";
import { usePipeline } from "../hooks/useTestingPipeline";
import RequireRun from "../components/RequireRun";
import { ResultBadge, SeverityBadge, Bar } from "../components/ui";
import ImageComparison from "../components/ImageComparison";
import PredictionTable from "../components/PredictionTable";
import ExpectedObserved from "../components/ExpectedObserved";
import WhyMetamorph from "../components/WhyMetamorph";
import { RESOLVED_CASES } from "../data/testCases";
import { conditionRobustness, summary } from "../lib/report";

function Detail({ id }: { id: string }) {
  const tc = RESOLVED_CASES.find((c) => c.id === id)!;
  return (
    <div className="border-t border-base-700/50 bg-base-900/30 p-5">
      <ImageComparison tc={tc} />
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="card card-pad">
          <div className="label mb-3">Model output</div>
          <div className="grid grid-cols-2 gap-3">
            <PredictionTable title="Original" preds={tc.originalPreds} />
            <PredictionTable title="Transformed" preds={tc.transformedPreds} baseline={tc.originalPreds} />
          </div>
        </div>
        <div className="card card-pad">
          <div className="mb-2 flex items-center justify-between">
            <div className="label">MR oracle · {tc.mr.id}</div>
            <ResultBadge result={tc.result} />
          </div>
          <div className="mono mt-2 text-[11px] text-slate-500">
            CLIP {(tc.clipScore * 100).toFixed(1)}% · relation type {tc.mr.relationType}
          </div>
          <div className="mt-3">
            <ExpectedObserved tc={tc} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultsView() {
  const { completedCases, memory } = usePipeline();
  const [params, setParams] = useSearchParams();
  const open = params.get("case");

  const toggle = (id: string) => {
    const next = new URLSearchParams(params);
    if (open === id) next.delete("case");
    else next.set("case", id);
    setParams(next, { replace: true });
  };

  if (completedCases.length === 0) {
    return (
      <div className="card card-pad text-sm text-slate-400">
        No completed tests yet — return to <span className="text-accent">Testing</span> and run the pipeline.
      </div>
    );
  }

  const s = summary(completedCases);
  const conds = conditionRobustness(completedCases);
  const evidence = [
    { v: RESOLVED_CASES.length, k: "source cases" },
    { v: s.total, k: "test executions" },
    { v: s.passed, k: "relations satisfied", tone: "text-pass" },
    { v: s.violations, k: "violations", tone: "text-fail" },
    { v: s.highSeverity, k: "high-severity", tone: "text-fail" },
  ];

  return (
    <div className="space-y-6">
      <p className="text-[13px] text-slate-400">What the testing run revealed about the model.</p>

      <div className="card card-pad">
        <div className="label mb-3">Evidence</div>
        <div className="flex flex-wrap gap-x-10 gap-y-4">
          {evidence.map((e) => (
            <div key={e.k}>
              <div className={`text-2xl font-bold tabular-nums ${e.tone ?? "text-slate-100"}`}>{e.v}</div>
              <div className="text-[11px] uppercase tracking-wide text-slate-500">{e.k}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-4 border-t hairline pt-4 sm:grid-cols-2">
          <div>
            <div className="label mb-1.5">Most vulnerable conditions</div>
            <ol className="space-y-1 text-[12.5px] text-slate-300">
              {conds.filter((c) => c.violations > 0).map((c, i) => (
                <li key={c.condition} className="flex items-center justify-between">
                  <span><span className="mono mr-2 text-slate-600">{i + 1}</span>{c.condition}</span>
                  <span className="mono text-slate-500">{c.robustness}% robust</span>
                </li>
              ))}
              {conds.filter((c) => c.violations > 0).length === 0 && (
                <li className="text-slate-500">None — every relation was satisfied.</li>
              )}
            </ol>
          </div>
          <div>
            <div className="label mb-1.5">Most affected class</div>
            <div className="text-sm font-semibold text-fail">{s.mostAffected}</div>
            <p className="mt-3 text-[11.5px] text-slate-500">
              These results represent the deterministic POC demonstration run.
            </p>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-base-700/50 px-5 py-3 text-sm font-semibold text-slate-200">
          Test records
        </div>
        {completedCases.map((tc) => (
          <div key={tc.id}>
            <button
              onClick={() => toggle(tc.id)}
              className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-base-800/40"
            >
              {tc.result === "PASS" ? (
                <Check size={16} className="text-pass" />
              ) : (
                <X size={16} className="text-fail" />
              )}
              <span className="mono w-16 text-sm text-slate-300">{tc.id}</span>
              <span className="w-48 shrink-0 text-sm text-slate-300">{tc.transformName}</span>
              <span className="mono hidden text-xs text-slate-500 sm:inline">{tc.mr.id} · {tc.mr.category}</span>
              <span className="ml-auto flex items-center gap-3">
                {tc.failure && <SeverityBadge severity={tc.failure.severity} />}
                <ResultBadge result={tc.result} />
                <ChevronRight
                  size={16}
                  className={`text-slate-500 transition-transform ${open === tc.id ? "rotate-90" : ""}`}
                />
              </span>
            </button>
            {open === tc.id && <Detail id={tc.id} />}
          </div>
        ))}
      </div>

      <div className="card card-pad">
        <div className="label mb-3">Relations exercised</div>
        <div className="space-y-2">
          {memory.mrUsage.map((m) => (
            <Bar key={m.mr} label={m.mr} value={m.count} max={Math.max(2, ...memory.mrUsage.map((x) => x.count))} />
          ))}
        </div>
      </div>

      <WhyMetamorph compact />
    </div>
  );
}

export default function Results() {
  return (
    <RequireRun>
      <ResultsView />
    </RequireRun>
  );
}
