import { motion } from "framer-motion";
import { Check, Crosshair, Layers, ScanEye } from "lucide-react";
import { usePipeline } from "../hooks/useTestingPipeline";
import RequireRun from "../components/RequireRun";
import { SectionTitle, MetricCard, Bar } from "../components/ui";
import DatasetImage from "../components/DatasetImage";
import { RESOLVED_CASES } from "../data/testCases";
import { BASELINE_PROFILE } from "../services/mockModel";
import { transformSpec } from "../services/mockTransformation";

function Analysis() {
  const { domainProfile, activeCaseIndex, stageState } = usePipeline();
  const idx = activeCaseIndex ?? 0;
  const tc = RESOLVED_CASES[idx];
  const st = stageState(idx);
  const selected = st.plan !== "todo";
  const spec = transformSpec(tc.transformStyle);

  return (
    <div className="space-y-6">
      {/* boot analysis */}
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="card card-pad">
          <SectionTitle hint="Model evaluated on the original dataset before metamorphic testing begins.">
            Baseline model profile
          </SectionTitle>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {BASELINE_PROFILE.metrics.map((m) => (
              <div key={m.name} className="rounded-lg border border-base-700/50 bg-base-900/40 px-3 py-2">
                <div className="text-[11px] text-slate-500">{m.name}</div>
                <div className="mono text-lg text-slate-100">{m.value.toFixed(2)}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-2">
            {BASELINE_PROFILE.perClassAP.map((c) => (
              <Bar key={c.cls} label={`AP · ${c.cls}`} value={c.ap} tone={c.ap < 0.75 ? "warn" : "pass"} />
            ))}
          </div>
        </div>

        <div className="card card-pad">
          <SectionTitle>Initial failure profile</SectionTitle>
          <pre className="mono overflow-x-auto rounded-lg bg-base-900/70 p-3 text-[12px] leading-relaxed text-slate-300">
{`{
  "task": "${BASELINE_PROFILE.task}",
  "baseline_map": 0.91,
  "weak_classes": ${JSON.stringify(BASELINE_PROFILE.weakClasses)},
  "common_failures": ${JSON.stringify(BASELINE_PROFILE.commonFailures, null, 0)},
  "average_confidence": 0.78
}`}
          </pre>
          {domainProfile && (
            <div className="mt-3 rounded-lg border border-accent/30 bg-accent/5 p-3">
              <div className="text-[11px] uppercase tracking-wide text-slate-400">Domain identified</div>
              <div className="text-sm font-bold text-accent">{domainProfile.label}</div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {domainProfile.conditions.map((c) => (
                  <span key={c} className="chip">{c}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* current image analysis */}
      <div className="card card-pad">
        <div className="flex items-center justify-between">
          <SectionTitle hint="Concise reasoning summary — not exposed chain-of-thought.">
            Scene analysis · {tc.id}
          </SectionTitle>
          <span className="chip"><ScanEye size={13} /> image {idx + 1} / 10</span>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <div className="overflow-hidden rounded-lg border border-base-700/50">
            <DatasetImage tc={tc} kind="original" />
          </div>

          <div className="space-y-3">
            <div>
              <div className="label mb-1.5">AI agent</div>
              <div className="space-y-1.5">
                {["Objects identified", "Scene characteristics extracted", "Baseline prediction obtained"].map(
                  (t) => (
                    <div key={t} className="flex items-center gap-2 text-sm text-slate-300">
                      <Check size={14} className="text-pass" /> {t}
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="rounded-lg border border-base-700/50 bg-base-900/40 p-3">
              <div className="label mb-1.5 flex items-center gap-1.5"><Crosshair size={12} /> Detected</div>
              <div className="flex flex-wrap gap-1.5">
                {tc.originalPreds.map((p, i) => (
                  <span key={i} className="chip">{p.cls} · {p.conf.toFixed(2)}</span>
                ))}
              </div>
            </div>

            <p className="rounded-lg border border-base-700/50 bg-base-900/40 p-3 text-sm text-slate-300">
              “{tc.sceneSummary}”
            </p>
          </div>
        </div>
      </div>

      {/* transformation selection */}
      <div className="card card-pad">
        <SectionTitle hint="Hardcoded for the POC, but presented as an agent decision driven by the failure profile and testing memory.">
          Transformation selection
        </SectionTitle>
        <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
          <motion.div
            key={tc.id}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: selected ? 1 : 0.35, scale: 1 }}
            className="grid place-items-center rounded-xl border border-accent/40 bg-accent/5 p-6 text-center shadow-glow"
          >
            <Layers className="text-accent" />
            <div className="mt-2 text-xs text-slate-400">{tc.mr.id}</div>
            <div className="text-lg font-bold text-slate-100">{tc.transformName}</div>
            <div className="mono mt-1 text-xs text-slate-400">{spec.param}</div>
            <div className="mt-2 chip border-accent/30 bg-accent/10 text-accent capitalize">{spec.kind}</div>
          </motion.div>

          <div className="space-y-2 text-sm">
            {["Domain analysed", "Previous test history checked", "Candidate transformations evaluated"].map(
              (t) => (
                <div key={t} className="flex items-center gap-2 text-slate-300">
                  <Check size={14} className={selected ? "text-pass" : "text-slate-600"} /> {t}
                </div>
              )
            )}
            <p className="mt-2 rounded-lg border border-base-700/50 bg-base-900/40 p-3 text-slate-300">
              <span className="text-slate-500">Reason — </span>
              {tc.selectionReason}
            </p>
            <div className="grid grid-cols-3 gap-2 pt-1">
              <MetricCard label="Expected" value={tc.mr.relationType} />
              <MetricCard label="MR category" value={<span className="capitalize">{tc.mr.category}</span>} />
              <MetricCard label="CLIP threshold" value={`${Math.round(tc.clipThreshold * 100)}%`} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AIAnalysis() {
  return (
    <RequireRun>
      <Analysis />
    </RequireRun>
  );
}
