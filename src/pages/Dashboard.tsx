import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Images,
  ScanText,
  Sparkles,
  Wand2,
  ScanSearch,
  Boxes,
  ShieldCheck,
  Database,
  ArrowRight,
  Play,
} from "lucide-react";
import { usePipeline } from "../hooks/useTestingPipeline";
import { AnimatedNumber } from "../components/ui";
import { BASE_MRS, GENERATED_MRS } from "../data/metamorphicRelations";
import { conditionRobustness, summary } from "../lib/report";

const STRIP = [
  { icon: Images, label: "Source" },
  { icon: ScanText, label: "Describe" },
  { icon: Sparkles, label: "Relation" },
  { icon: Wand2, label: "Transform" },
  { icon: ScanSearch, label: "CLIP" },
  { icon: Boxes, label: "Model" },
  { icon: ShieldCheck, label: "Verify" },
  { icon: Database, label: "Memory" },
];

const ACCENT = {
  blue: { bar: "bg-accent", text: "text-accent" },
  green: { bar: "bg-pass", text: "text-pass" },
  red: { bar: "bg-fail", text: "text-fail" },
  indigo: { bar: "bg-violet", text: "text-violet" },
} as const;

function StatTile({
  to,
  label,
  value,
  suffix = "",
  sub,
  accent,
}: {
  to: string;
  label: string;
  value: number;
  suffix?: string;
  sub?: string;
  accent: keyof typeof ACCENT;
}) {
  const a = ACCENT[accent];
  return (
    <Link to={to} className="card card-hover relative overflow-hidden card-pad block">
      <span className={`absolute left-0 top-0 h-full w-0.5 ${a.bar}`} />
      <div className="label">{label}</div>
      <div className={`mt-1.5 text-3xl font-bold leading-none ${a.text}`}>
        <AnimatedNumber value={value} suffix={suffix} />
      </div>
      <div className="mt-1 text-[12px] text-slate-500">{sub ?? " "}</div>
    </Link>
  );
}

function Donut({ passed, violations }: { passed: number; violations: number }) {
  const total = passed + violations;
  const r = 42;
  const c = 2 * Math.PI * r;
  const passFrac = total ? passed / total : 0;
  return (
    <div className="relative h-32 w-32 shrink-0">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="10" />
        {total > 0 && (
          <>
            <motion.circle
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke="#ff6b6b"
              strokeWidth="10"
              strokeDasharray={c}
              initial={{ strokeDashoffset: c }}
              animate={{ strokeDashoffset: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
            <motion.circle
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke="#3ddc97"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={c}
              initial={{ strokeDashoffset: c }}
              animate={{ strokeDashoffset: c * (1 - passFrac) }}
              transition={{ duration: 0.9, ease: "easeOut" }}
            />
          </>
        )}
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="text-xl font-bold text-slate-100">
            <AnimatedNumber value={total ? Math.round(passFrac * 100) : 0} suffix="%" />
          </div>
          <div className="text-[10px] uppercase tracking-wide text-slate-500">passing</div>
        </div>
      </div>
    </div>
  );
}

function PipelineStrip() {
  const { status, activeCaseIndex, stageState } = usePipeline();
  const running = status === "running" || status === "paused";
  const st = running && activeCaseIndex != null ? stageState(activeCaseIndex) : null;
  const keys = ["pick", "describe", "plan", "transform", "clip", "model", "verify", "store"] as const;

  return (
    <Link
      to="/testing"
      className="card card-pad card-hover block"
      aria-label="Open the testing view"
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="label">Testing pipeline</span>
        <span className="text-[11px] text-slate-500">
          {status === "idle" ? "idle" : status === "done" ? "complete" : `iteration ${(activeCaseIndex ?? 0) + 1}/10`}
        </span>
      </div>
      <ol className="flex items-center">
        {STRIP.map((s, i) => {
          const state = st ? st[keys[i]] : status === "done" ? "done" : "todo";
          return (
            <li key={s.label} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-1">
                <motion.span
                  className={`grid h-9 w-9 place-items-center rounded-full border ${
                    state === "done"
                      ? "border-accent/60 bg-accent/20 text-accent"
                      : state === "active"
                      ? "border-accent bg-accent/25 text-accent shadow-glow"
                      : "border-base-700 text-slate-600"
                  }`}
                  animate={
                    state === "active"
                      ? { scale: [1, 1.12, 1] }
                      : status === "idle"
                      ? { opacity: [0.4, 1, 0.4] }
                      : {}
                  }
                  transition={
                    state === "active"
                      ? { repeat: Infinity, duration: 1.1 }
                      : { repeat: Infinity, duration: 1.6, delay: i * 0.16 }
                  }
                >
                  <s.icon size={16} />
                </motion.span>
                <span className="text-[10px] text-slate-500">{s.label}</span>
              </div>
              {i < STRIP.length - 1 && (
                <span
                  className={`mx-1 h-px flex-1 ${state !== "todo" ? "bg-accent/40" : "bg-base-700"}`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </Link>
  );
}

function CondBars({ data }: { data: { condition: string; robustness: number; violations: number }[] }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setOn(true), 60);
    return () => clearTimeout(t);
  }, []);

  if (data.length === 0) {
    return <p className="text-[13px] text-slate-500">Run the pipeline to populate robustness data.</p>;
  }
  return (
    <ul className="space-y-2.5">
      {data.map((d, i) => (
        <li key={d.condition} className="flex items-center gap-3 text-[13px]">
          <span className="w-24 shrink-0 truncate text-slate-400">{d.condition}</span>
          <span className="h-2 flex-1 overflow-hidden rounded-full bg-base-700">
            <span
              className={`block h-full rounded-full transition-[width] duration-700 ease-out ${
                d.robustness < 60 ? "bg-fail" : "bg-accent"
              }`}
              style={{ width: on ? `${d.robustness}%` : "0%", transitionDelay: `${i * 40}ms` }}
            />
          </span>
          <span className="mono w-9 shrink-0 text-right text-slate-500">{d.robustness}%</span>
        </li>
      ))}
    </ul>
  );
}

export default function Dashboard() {
  const nav = useNavigate();
  const { status, memory, canStart, start, completedCases } = usePipeline();

  const s = summary(completedCases);
  const conds = conditionRobustness(completedCases);
  const pool = BASE_MRS.length + GENERATED_MRS.length;
  const passRate = s.total ? Math.round((s.passed / s.total) * 100) : 0;

  const cta =
    status === "idle"
      ? { label: canStart ? "Start run" : "Configure run", onClick: () => (canStart ? (start(), nav("/testing")) : nav("/setup")) }
      : status === "done"
      ? { label: "View report", onClick: () => nav("/report") }
      : { label: "Open testing", onClick: () => nav("/testing") };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Metamorph</h1>
          <p className="mt-1 text-[13px] text-slate-500">
            Agentic metamorphic testing · autonomous-driving detection model
          </p>
        </div>
        <button className="btn-primary" onClick={cta.onClick}>
          {status === "idle" ? <Play size={15} /> : null}
          {cta.label}
          {status !== "idle" && <ArrowRight size={15} />}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile to="/testing" label="Iterations" value={memory.testsCompleted} suffix=" / 10" accent="blue" sub={status === "idle" ? "not started" : status} />
        <StatTile to="/results" label="Pass rate" value={passRate} suffix="%" accent="green" sub={s.total ? `${s.passed} of ${s.total} satisfied` : "awaiting results"} />
        <StatTile to="/violations" label="Violations" value={s.violations} accent="red" sub={`${s.highSeverity} high severity`} />
        <StatTile to="/mr" label="Relation pool" value={pool} accent="indigo" sub={`${GENERATED_MRS.length} discovered`} />
      </div>

      <PipelineStrip />

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="card card-pad">
          <div className="mb-3 flex items-center justify-between">
            <span className="label">Robustness by condition</span>
            {conds.length > 0 && (
              <span className="text-[11px] text-slate-500">most vulnerable first</span>
            )}
          </div>
          <CondBars data={conds} />
        </div>

        <div className="card card-pad">
          <div className="label mb-3">Run summary</div>
          {s.total === 0 ? (
            <p className="text-[13px] text-slate-500">No completed iterations yet.</p>
          ) : (
            <div className="flex items-center gap-5">
              <Donut passed={s.passed} violations={s.violations} />
              <div className="space-y-2 text-[13px]">
                <div>
                  <div className="text-slate-500">Most affected class</div>
                  <div className="font-medium text-fail">{s.mostAffected}</div>
                </div>
                <div>
                  <div className="text-slate-500">Weakest condition</div>
                  <div className="font-medium text-slate-200">
                    {conds[0] ? `${conds[0].condition} · ${conds[0].robustness}%` : "—"}
                  </div>
                </div>
                {status === "done" && (
                  <Link to="/report" className="inline-flex items-center gap-1 text-accent">
                    Full report <ArrowRight size={13} />
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
