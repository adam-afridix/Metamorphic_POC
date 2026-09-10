import { useSearchParams } from "react-router-dom";
import { Check, X, ChevronRight } from "lucide-react";
import { usePipeline } from "../hooks/useTestingPipeline";
import RequireRun from "../components/RequireRun";
import { MetricCard, ResultBadge, SeverityBadge, Bar } from "../components/ui";
import ImageComparison from "../components/ImageComparison";
import PredictionTable from "../components/PredictionTable";
import { RESOLVED_CASES } from "../data/testCases";

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
          <p className="text-xs text-slate-400">
            <span className="text-slate-500">Expected relation — </span>
            {tc.mr.expected}
          </p>
          <div className="mono mt-3 space-y-1 text-[12px]">
            <div className="text-slate-500">expected: <span className="text-slate-300">{tc.expectedSummary}</span></div>
            <div className="text-slate-500">actual: <span className="text-slate-300">{tc.actualSummary}</span></div>
            <div className="text-slate-500">CLIP: <span className="text-slate-300">{(tc.clipScore * 100).toFixed(1)}%</span></div>
          </div>
          {tc.failure && (
            <div className="mt-3 rounded-lg border border-fail/30 bg-fail/5 p-3">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-sm font-semibold text-fail">{tc.failure.category}</span>
                <SeverityBadge severity={tc.failure.severity} />
              </div>
              <p className="text-xs leading-relaxed text-slate-300">{tc.failure.observed}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
                <span className="text-slate-500">Likely cause — </span>
                {tc.failure.likelyCause}
              </p>
            </div>
          )}
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

  const coverage = memory.testsCompleted / 10;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-4">
        <MetricCard label="Tests" value={memory.testsCompleted} />
        <MetricCard label="Relations satisfied" value={memory.passed} tone="pass" />
        <MetricCard label="Violations" value={memory.violations} tone="fail" />
        <MetricCard label="Image coverage" value={`${Math.round(coverage * 100)}%`} tone="accent" />
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
        <div className="label mb-3">MR usage (from testing memory)</div>
        <div className="space-y-2">
          {memory.mrUsage.map((m) => (
            <Bar key={m.mr} label={m.mr} value={m.count} max={Math.max(2, ...memory.mrUsage.map((x) => x.count))} />
          ))}
        </div>
      </div>
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
