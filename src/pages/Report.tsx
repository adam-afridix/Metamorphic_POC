import type { ReactNode } from "react";
import { Printer } from "lucide-react";
import { usePipeline } from "../hooks/useTestingPipeline";
import RequireRun from "../components/RequireRun";
import { SeverityBadge } from "../components/ui";
import RobustnessChart from "../components/RobustnessChart";
import { conditionRobustness, summary } from "../lib/report";
import { RELATION_STATS, REJECTED_RELATIONS } from "../lib/relationStats";
import { BASELINE_PROFILE } from "../services/mockModel";
import { RESOLVED_CASES } from "../data/testCases";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t hairline pt-5">
      <h2 className="report-h2 mb-2.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-500">
        {title}
      </h2>
      <div className="text-[13px] leading-relaxed text-slate-300">{children}</div>
    </section>
  );
}

function KV({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
      {items.map(([k, v]) => (
        <div key={k} className="flex justify-between gap-4 border-b hairline pb-1.5">
          <dt className="text-slate-500">{k}</dt>
          <dd className="text-right text-slate-200">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function ReportView() {
  const { completedCases, status, config, domainProfile } = usePipeline();
  const done = status === "done" && completedCases.length === RESOLVED_CASES.length;
  const cases = completedCases;
  const s = summary(cases);
  const conds = conditionRobustness(cases);
  const worst = conds.filter((c) => c.violations > 0).slice(0, 4);
  const violations = cases.filter((c) => c.result === "VIOLATION" && c.failure);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="label">Generated testing report</div>
          <h1 className="text-xl font-bold text-slate-100">Metamorphic robustness assessment</h1>
          <p className="mt-1 text-[12px] text-slate-500">
            {domainProfile?.label.toLowerCase() ?? "vision"} · object detection · deterministic POC run
          </p>
        </div>
        <button className="btn-ghost !py-1.5 !text-xs" onClick={() => window.print()}>
          <Printer size={13} /> Print / PDF
        </button>
      </div>

      {!done && (
        <p className="rounded-md border border-warn/30 bg-warn/[0.06] px-3 py-2 text-[12px] text-warn">
          Partial report — {cases.length}/{RESOLVED_CASES.length} executions completed.
        </p>
      )}

      <div className="report-sections space-y-6">
      <Section title="Executive summary">
        Metamorphic testing exercised {s.total} generated transformations against the detector.
        {" "}
        {s.violations} of {s.total} relations were violated, concentrated on the{" "}
        <span className="text-slate-100">{s.mostAffected}</span> class under{" "}
        <span className="text-slate-100">
          {worst.map((w) => w.condition.toLowerCase()).join(", ") || "no"}
        </span>{" "}
        conditions. Photometric and geometric relations were satisfied throughout. Overall
        assessment: <span className="font-semibold text-warn">needs improvement</span>.
      </Section>

      <Section title="Test scope">
        Robustness of an object-detection model under generated environmental, photometric and
        geometric transformations, checked against metamorphic relations that define the expected
        input–output behaviour. No retraining or model modification is performed.
      </Section>

      <Section title="Model under test">
        <KV
          items={[
            ["Artefact", <span className="mono">{config.modelName ?? "detector"}</span>],
            ["Task", config.taskType],
            ["Baseline mAP@0.5", <span className="mono">{s.baselineMap.toFixed(2)}</span>],
            ["Weak classes", BASELINE_PROFILE.weakClasses.join(", ")],
          ]}
        />
      </Section>

      <Section title="Test data">
        <KV
          items={[
            ["Source images", `${RESOLVED_CASES.length}`],
            ["Annotations", "ground-truth bounding boxes"],
            ["Source", <span className="mono">KITTI (nateraw/kitti · Hugging Face)</span>],
            ["Licence", "CC BY-NC-SA 3.0 — research use"],
          ]}
        />
      </Section>

      <Section title="Metamorphic relations">
        <div className="flex flex-wrap gap-x-8 gap-y-2">
          {[
            ["Candidate", RELATION_STATS.candidate, `${RELATION_STATS.base} base · ${RELATION_STATS.proposed} proposed`],
            ["Validated", RELATION_STATS.validated, `${RELATION_STATS.rejected} rejected`],
            ["Selected", RELATION_STATS.selected, "chosen for a test"],
            ["Executed", RELATION_STATS.executed, "this run"],
          ].map(([k, v, sub]) => (
            <div key={k as string}>
              <div className="text-lg font-bold tabular-nums text-slate-100">{v}</div>
              <div className="text-[11px] text-slate-500">{k} — {sub}</div>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[12px] text-slate-500">
          Rejected: {REJECTED_RELATIONS.map((m) => m.name).join("; ")}.
        </p>
      </Section>

      <Section title="Test executions">
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b hairline text-left text-[10.5px] uppercase tracking-wide text-slate-500">
                <th className="py-1.5 pr-3 font-medium">Case</th>
                <th className="py-1.5 pr-3 font-medium">Relation</th>
                <th className="py-1.5 pr-3 font-medium">Type</th>
                <th className="py-1.5 font-medium">Result</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((c) => (
                <tr key={c.id} className="border-b hairline last:border-0">
                  <td className="py-1.5 pr-3 mono text-slate-500">{c.id}</td>
                  <td className="py-1.5 pr-3 text-slate-300">
                    <span className="mono text-slate-500">{c.mr.id}</span> {c.mr.name}
                  </td>
                  <td className="py-1.5 pr-3 text-slate-500">{c.mr.relationType}</td>
                  <td className={`py-1.5 ${c.result === "PASS" ? "text-pass" : "text-fail"}`}>
                    {c.result === "PASS" ? "satisfied" : "violation"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Results">
        <KV
          items={[
            ["Relations satisfied", <span className="text-pass">{s.passed}</span>],
            ["Relations violated", <span className="text-fail">{s.violations}</span>],
            ["Violation rate", `${(s.violationRate * 100).toFixed(1)}%`],
            ["High-severity violations", <span className="text-fail">{s.highSeverity}</span>],
          ]}
        />
      </Section>

      <Section title="Violations">
        {violations.length === 0 ? (
          <p className="text-slate-500">None recorded.</p>
        ) : (
          <ul className="space-y-2">
            {violations.map((c) => (
              <li key={c.id} className="rounded-md border border-fail/25 bg-fail/[0.05] px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-200">
                    {c.transformName} — {c.failure!.category} on {c.failure!.affectedClass}
                  </span>
                  <SeverityBadge severity={c.failure!.severity} />
                </div>
                <p className="mt-1 text-[12px] text-slate-500">{c.failure!.observed}</p>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Robustness by condition">
        <RobustnessChart data={[...conds].reverse()} />
      </Section>

      <Section title="Affected classes">
        <p>
          Every violation in this run affects the{" "}
          <span className="font-semibold text-fail">{s.mostAffected}</span> class. Vehicle
          detections remained stable across all tested conditions.
        </p>
      </Section>

      <Section title="Key findings">
        <ul className="list-disc space-y-1 pl-5 text-slate-300">
          <li>The detector is robust to photometric and geometric relations (brightness, motion blur, rotation).</li>
          <li>
            Violations are concentrated under low-visibility conditions
            {worst.length > 0 && ` (${worst.map((w) => w.condition.toLowerCase()).join(", ")})`}.
          </li>
          <li>Fog, occlusion and lens glare each caused a previously detected object to be lost entirely.</li>
          <li>Night reduced pedestrian confidence below the decision threshold without changing scene semantics (CLIP-verified).</li>
        </ul>
      </Section>

      <Section title="Limitations">
        <ul className="list-disc space-y-1 pl-5 text-slate-400">
          <li>{Math.round(s.mrCoverage * 100)}% relation coverage over {RESOLVED_CASES.length} source images — a demonstration-scale run.</li>
          <li>Single domain ({domainProfile?.label.toLowerCase() ?? "vision"}); one model artefact.</li>
          <li>Deterministic POC — external model and tool outputs are fixed (see implementation note).</li>
        </ul>
      </Section>

      <Section title="Assessment">
        <p>
          The model shows a robustness weakness for {s.mostAffected} detection under low-visibility
          conditions. Recommended action: increase training-data diversity for low-visibility,
          night-time and partially occluded road users, then re-test.
        </p>
        <p className="mt-2 text-slate-500">
          This is a metamorphic robustness assessment based on generated conditions — it is not a
          guarantee of production readiness.
        </p>
      </Section>
      </div>

      <div className="rounded-md border hairline bg-base-800 p-3 text-[11.5px] leading-relaxed text-slate-500">
        <span className="font-medium text-slate-400">POC implementation note — </span>
        External model/tool calls are deterministic in this proof-of-concept to provide reproducible
        demonstrations. The interface and orchestration represent the proposed production workflow.
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
