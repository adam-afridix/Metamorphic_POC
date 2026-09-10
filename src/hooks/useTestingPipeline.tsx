import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { RESOLVED_CASES, type ResolvedCase } from "../data/testCases";
import { parseDomain, type DomainProfile } from "../services/mockAgent";
import { buildFrames, CASE_STAGES, type CaseStage, type Frame } from "../services/pipeline";

export type RunStatus = "idle" | "running" | "paused" | "done";

interface Config {
  modelName: string | null;
  taskType: string;
  datasetLoaded: boolean;
  domainText: string;
}

interface MemoryStats {
  testsCompleted: number;
  passed: number;
  violations: number;
  mrUsage: { mr: string; count: number }[];
  failuresByCondition: { condition: string; count: number }[];
}

interface PipelineValue {
  config: Config;
  setModel: (name: string) => void;
  setTaskType: (t: string) => void;
  loadDataset: () => void;
  setDomainText: (t: string) => void;
  domainProfile: DomainProfile | null;
  previewDomain: DomainProfile;

  status: RunStatus;
  fast: boolean;
  toggleFast: () => void;
  canStart: boolean;
  start: () => void;
  pause: () => void;
  resume: () => void;
  step: () => void;
  finishNow: () => void;
  reset: () => void;

  frames: Frame[];
  frameIndex: number;
  events: Frame[];

  activeCaseIndex: number | null;
  stageState: (i: number) => Record<CaseStage, "done" | "active" | "todo">;
  isCaseComplete: (i: number) => boolean;
  completedCases: ResolvedCase[];
  progress: number; // 0..1
  bootComplete: boolean;
  memory: MemoryStats;
}

const PipelineContext = createContext<PipelineValue | null>(null);

const CONDITION_OF: Record<string, string> = {
  haze: "Haze",
  fog: "Fog",
  night: "Night",
  dusk: "Dusk",
  glare: "Glare",
  rain: "Rain",
  motionblur: "Motion blur",
  blur: "Blur",
  brightness: "Brightness",
  contrast: "Contrast",
  rotate: "Rotation",
  bgr: "BGR reorder",
  occlusion: "Occlusion",
  insert: "Object insertion",
};

export function PipelineProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<Config>({
    modelName: null,
    taskType: "Object Detection",
    datasetLoaded: false,
    domainText: "",
  });
  const [domainProfile, setDomainProfile] = useState<DomainProfile | null>(null);
  const [status, setStatus] = useState<RunStatus>("idle");
  const [fast, setFast] = useState(false);
  const [frames, setFrames] = useState<Frame[]>([]);
  const [frameIndex, setFrameIndex] = useState(-1);
  const timer = useRef<number | null>(null);

  const previewDomain = useMemo(
    () => parseDomain(config.domainText || "computer vision"),
    [config.domainText]
  );

  const canStart = config.datasetLoaded && config.domainText.trim().length >= 10;

  const clearTimer = () => {
    if (timer.current != null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  };

  const advance = useCallback(() => {
    setFrameIndex((idx) => {
      if (idx >= frames.length - 1) {
        setStatus("done");
        return idx;
      }
      return idx + 1;
    });
  }, [frames.length]);

  useEffect(() => {
    clearTimer();
    if (status !== "running") return;
    if (frameIndex >= frames.length - 1) {
      setStatus("done");
      return;
    }
    timer.current = window.setTimeout(advance, fast ? 260 : 850);
    return clearTimer;
  }, [status, frameIndex, frames.length, fast, advance]);

  const start = useCallback(() => {
    if (!canStart) return;
    const profile = parseDomain(config.domainText);
    setDomainProfile(profile);
    setFrames(buildFrames(profile.label));
    setFrameIndex(0);
    setStatus("running");
  }, [canStart, config.domainText]);

  const pause = useCallback(() => setStatus((s) => (s === "running" ? "paused" : s)), []);
  const resume = useCallback(() => setStatus((s) => (s === "paused" ? "running" : s)), []);
  const step = useCallback(() => {
    if (status === "idle") return start();
    setStatus("paused");
    advance();
  }, [status, start, advance]);
  const finishNow = useCallback(() => {
    if (frames.length === 0) {
      const profile = parseDomain(config.domainText || "computer vision");
      setDomainProfile(profile);
      const f = buildFrames(profile.label);
      setFrames(f);
      setFrameIndex(f.length - 1);
    } else {
      setFrameIndex(frames.length - 1);
    }
    setStatus("done");
  }, [frames.length, config.domainText]);

  const reset = useCallback(() => {
    clearTimer();
    setStatus("idle");
    setFrames([]);
    setFrameIndex(-1);
    setDomainProfile(null);
  }, []);

  const events = useMemo(
    () => (frameIndex < 0 ? [] : frames.slice(0, frameIndex + 1)),
    [frames, frameIndex]
  );

  const bootComplete = useMemo(() => {
    if (frameIndex < 0) return false;
    const firstCaseFrame = frames.findIndex((f) => typeof f.scope === "number");
    return firstCaseFrame === -1 ? false : frameIndex >= firstCaseFrame;
  }, [frames, frameIndex]);

  const reachedFrames = useMemo(
    () => (frameIndex < 0 ? [] : frames.slice(0, frameIndex + 1)),
    [frames, frameIndex]
  );

  const isCaseComplete = useCallback(
    (i: number) =>
      reachedFrames.some((f) => f.scope === i && f.stage === "store"),
    [reachedFrames]
  );

  const activeCaseIndex = useMemo(() => {
    if (frameIndex < 0) return null;
    const cur = frames[frameIndex];
    if (cur && typeof cur.scope === "number") return cur.scope;
    // between cases / on a global frame: last touched case
    for (let k = frameIndex; k >= 0; k--) {
      if (typeof frames[k].scope === "number") return frames[k].scope as number;
    }
    return null;
  }, [frames, frameIndex]);

  const stageState = useCallback(
    (i: number): Record<CaseStage, "done" | "active" | "todo"> => {
      const out = {} as Record<CaseStage, "done" | "active" | "todo">;
      const reached = new Set(
        reachedFrames.filter((f) => f.scope === i).map((f) => f.stage as CaseStage)
      );
      const currentStage =
        frames[frameIndex] && frames[frameIndex].scope === i
          ? (frames[frameIndex].stage as CaseStage)
          : null;
      for (const s of CASE_STAGES) {
        if (currentStage === s.key && status !== "done") out[s.key] = "active";
        else if (reached.has(s.key)) out[s.key] = "done";
        else out[s.key] = "todo";
      }
      // "explain" folds into oracle visually; ignore here
      return out;
    },
    [reachedFrames, frames, frameIndex, status]
  );

  const completedCases = useMemo(
    () => RESOLVED_CASES.filter((_, i) => isCaseComplete(i)),
    [isCaseComplete]
  );

  const progress = useMemo(
    () => (frames.length === 0 ? 0 : Math.max(0, frameIndex + 1) / frames.length),
    [frames.length, frameIndex]
  );

  const memory = useMemo<MemoryStats>(() => {
    const done = completedCases;
    const mrCount = new Map<string, number>();
    const condCount = new Map<string, number>();
    for (const c of done) {
      mrCount.set(c.mr.name, (mrCount.get(c.mr.name) ?? 0) + 1);
      if (c.result === "VIOLATION") {
        const cond = CONDITION_OF[c.transformStyle] ?? c.transformStyle;
        condCount.set(cond, (condCount.get(cond) ?? 0) + 1);
      }
    }
    return {
      testsCompleted: done.length,
      passed: done.filter((c) => c.result === "PASS").length,
      violations: done.filter((c) => c.result === "VIOLATION").length,
      mrUsage: [...mrCount.entries()].map(([mr, count]) => ({ mr, count })),
      failuresByCondition: [...condCount.entries()]
        .map(([condition, count]) => ({ condition, count }))
        .sort((a, b) => b.count - a.count),
    };
  }, [completedCases]);

  const value: PipelineValue = {
    config,
    setModel: (name) => setConfig((c) => ({ ...c, modelName: name })),
    setTaskType: (t) => setConfig((c) => ({ ...c, taskType: t })),
    loadDataset: () => setConfig((c) => ({ ...c, datasetLoaded: true })),
    setDomainText: (t) => setConfig((c) => ({ ...c, domainText: t })),
    domainProfile,
    previewDomain,
    status,
    fast,
    toggleFast: () => setFast((f) => !f),
    canStart,
    start,
    pause,
    resume,
    step,
    finishNow,
    reset,
    frames,
    frameIndex,
    events,
    activeCaseIndex,
    stageState,
    isCaseComplete,
    completedCases,
    progress,
    bootComplete,
    memory,
  };

  return <PipelineContext.Provider value={value}>{children}</PipelineContext.Provider>;
}

export function usePipeline(): PipelineValue {
  const ctx = useContext(PipelineContext);
  if (!ctx) throw new Error("usePipeline must be used within PipelineProvider");
  return ctx;
}
