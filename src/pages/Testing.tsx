import { motion } from "framer-motion";
import { Pause, Play, SkipForward, StepForward, RotateCcw, Check, X, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePipeline } from "../hooks/useTestingPipeline";
import { Progress, EmptyState } from "../components/ui";
import StageChecklist from "../components/StageChecklist";
import EventLog from "../components/EventLog";
import ImageComparison from "../components/ImageComparison";
import PredictionTable from "../components/PredictionTable";
import ExpectedObserved from "../components/ExpectedObserved";
import TestingMemoryPanel from "../components/TestingMemoryPanel";
import { RESOLVED_CASES } from "../data/testCases";
import { runClip } from "../services/mockClip";

function Controls() {
  const nav = useNavigate();
  const { status, start, pause, resume, step, finishNow, reset, canStart, progress } = usePipeline();

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === "idle" && (
        <button className="btn-primary" disabled={!canStart} onClick={start}>
          <Play size={15} /> Start
        </button>
      )}
      {status === "running" && (
        <button className="btn-ghost" onClick={pause}>
          <Pause size={15} /> Pause
        </button>
      )}
      {status === "paused" && (
        <button className="btn-primary" onClick={resume}>
          <Play size={15} /> Resume
        </button>
      )}
      {(status === "running" || status === "paused") && (
        <button className="btn-ghost" onClick={step}>
          <StepForward size={15} /> Step
        </button>
      )}
      {status !== "done" && status !== "idle" && (
        <button className="btn-ghost" onClick={finishNow}>
          <SkipForward size={15} /> Skip to end
        </button>
      )}
      {status === "done" && (
        <>
          <button className="btn-primary" onClick={() => nav("/report")}>
            View report
          </button>
          <button className="btn-ghost" onClick={reset}>
            <RotateCcw size={15} /> Run again
          </button>
        </>
      )}
      <div className="ml-auto flex items-center gap-3">
        <span className="mono text-xs text-slate-500">{Math.round(progress * 100)}%</span>
        <div className="w-40">
          <Progress value={progress} />
        </div>
      </div>
    </div>
  );
}

function CurrentCase() {
  const { activeCaseIndex, stageState, bootComplete } = usePipeline();

  if (!bootComplete || activeCaseIndex == null) {
    return (
      <div className="card card-pad flex items-center gap-3 text-sm text-slate-400">
        <Loader2 className="animate-spin text-accent" size={16} />
        Bootstrapping — profiling the model, running the transformation sweep, discovering relations.
      </div>
    );
  }

  const idx = activeCaseIndex;
  const tc = RESOLVED_CASES[idx];
  const st = stageState(idx);
  const reached = (k: keyof typeof st) => st[k] !== "todo";
  const clip = runClip(tc);

  return (
    <div className="card card-pad space-y-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-slate-100">
          {tc.id} · {tc.transformName}
        </h2>
        <span className="mono text-[11px] text-slate-500">
          {tc.mr.id} · {tc.mr.category}
        </span>
      </div>

      <StageChecklist state={st} />

      <ImageComparison tc={tc} showBoxes={reached("model")} className="mx-auto max-w-2xl" />

      {reached("describe") && (
        <p className="text-[13px] leading-relaxed text-slate-400">
          <span className="text-slate-500">Description — </span>“{tc.caption}”
        </p>
      )}

      {reached("plan") && (
        <div className="text-[13px] leading-relaxed">
          <span className="label">Why this test was selected</span>
          <p className="mt-1 text-slate-400">{tc.selectionReason}</p>
        </div>
      )}

      {reached("clip") && (
        <div className="text-[13px]">
          <span className="text-slate-500">Semantic check — </span>
          <span className="mono text-slate-300">
            {(clip.similarity * 100).toFixed(0)}% / {(clip.threshold * 100).toFixed(0)}% threshold
          </span>{" "}
          <span className={clip.preserved ? "text-pass" : "text-warn"}>
            {clip.preserved ? "preserved" : "changed"}
          </span>
          {clip.regenerated && (
            <span className="text-warn">
              {" "}
              · regenerated once (initial {(clip.initialSimilarity! * 100).toFixed(0)}%)
            </span>
          )}
        </div>
      )}

      {reached("model") && (
        <div>
          <div className="label mb-2">Model output</div>
          <div className="grid gap-4 sm:grid-cols-2">
            <PredictionTable title="Original" preds={tc.originalPreds} />
            <PredictionTable title="Test case" preds={tc.transformedPreds} baseline={tc.originalPreds} />
          </div>
        </div>
      )}

      {reached("verify") && (
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
          <div className="mono text-[12px] text-slate-500">
            expected {tc.expectedSummary} · observed {tc.actualSummary}
          </div>
          <ExpectedObserved tc={tc} />
        </motion.div>
      )}
    </div>
  );
}

function Timeline() {
  const { isCaseComplete, activeCaseIndex } = usePipeline();
  return (
    <div className="card card-pad">
      <div className="label mb-2">Iterations</div>
      <div className="space-y-0.5">
        {RESOLVED_CASES.map((tc, i) => {
          const done = isCaseComplete(i);
          const active = activeCaseIndex === i && !done;
          return (
            <div
              key={tc.id}
              className={`flex items-center gap-2 rounded px-1.5 py-1 text-[12px] ${
                active ? "bg-accent/10" : ""
              }`}
            >
              {done ? (
                tc.result === "PASS" ? (
                  <Check size={13} className="text-pass" />
                ) : (
                  <X size={13} className="text-fail" />
                )
              ) : active ? (
                <Loader2 size={13} className="animate-spin text-accent" />
              ) : (
                <span className="h-3 w-3 rounded-full border border-base-600" />
              )}
              <span className="mono w-12 text-slate-500">{tc.id}</span>
              <span className="flex-1 truncate text-slate-400">{tc.transformName}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Testing() {
  const { status, canStart, events } = usePipeline();
  const nav = useNavigate();

  if (status === "idle" && !canStart) {
    return (
      <EmptyState
        title="Run not configured"
        body="Set the model, dataset and domain in Test Setup, then start the run here."
        action={
          <button className="btn-primary" onClick={() => nav("/setup")}>
            Go to Test Setup
          </button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <Controls />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <CurrentCase />
        <div className="space-y-4">
          <div className="card card-pad">
            <div className="label mb-2">Agent event stream</div>
            <EventLog events={events} height="h-[300px]" />
          </div>
          <TestingMemoryPanel />
          <Timeline />
        </div>
      </div>
    </div>
  );
}
