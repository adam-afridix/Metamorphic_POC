import { useState, type ReactNode } from "react";
import { Check, X } from "lucide-react";
import { usePipeline } from "../hooks/useTestingPipeline";
import RequireRun from "../components/RequireRun";
import MRCard from "../components/MRCard";
import { BASE_MRS, GENERATED_MRS, mrById } from "../data/metamorphicRelations";
import { validateMR } from "../services/mockAgent";
import { BASELINE_PROFILE } from "../services/mockModel";
import { RESOLVED_CASES } from "../data/testCases";
import { RELATION_STATS, REJECTED_RELATIONS } from "../lib/relationStats";

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <span className="grid h-5 w-5 place-items-center rounded-full border border-base-600 text-[10px] font-semibold text-slate-500">
          {n}
        </span>
        <h2 className="text-[13px] font-semibold uppercase tracking-wide text-slate-300">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Funnel() {
  const f = [
    { k: "Candidate relations", v: RELATION_STATS.candidate, sub: `${RELATION_STATS.base} base · ${RELATION_STATS.proposed} proposed` },
    { k: "Validated relations", v: RELATION_STATS.validated, sub: `${RELATION_STATS.rejected} rejected` },
    { k: "Selected relations", v: RELATION_STATS.selected, sub: "chosen for a test" },
    { k: "Test executions", v: RELATION_STATS.executed, sub: "this demonstration run" },
  ];
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {f.map((x, i) => (
        <div key={x.k} className="rounded-lg border hairline bg-base-800 p-3">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold tabular-nums text-slate-100">{x.v}</span>
            {i > 0 && <span className="mono text-[11px] text-slate-600">← {f[i - 1].v}</span>}
          </div>
          <div className="mt-1 text-[11px] font-medium text-slate-400">{x.k}</div>
          <div className="text-[10.5px] text-slate-500">{x.sub}</div>
        </div>
      ))}
    </div>
  );
}

function Generation() {
  const { domainProfile, config } = usePipeline();
  const [selected, setSelected] = useState(GENERATED_MRS[0].name); // Clear → Rainy (validated)
  const { rows, verdict } = validateMR(selected);

  return (
    <div className="space-y-9">
      <Step n={1} title="Model & domain context">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border hairline bg-base-800 p-3">
            <div className="label">Model under test</div>
            <div className="mt-1 text-sm text-slate-200">{config.modelName ?? "detector"}</div>
            <div className="text-[11px] text-slate-500">{config.taskType}</div>
          </div>
          <div className="rounded-lg border hairline bg-base-800 p-3">
            <div className="label">Domain</div>
            <div className="mt-1 text-sm text-accent">{domainProfile?.label ?? "—"}</div>
            <div className="text-[11px] text-slate-500">
              {domainProfile?.conditions.slice(0, 3).join(" · ") ?? ""}
            </div>
          </div>
          <div className="rounded-lg border hairline bg-base-800 p-3">
            <div className="label">Base relation library</div>
            <div className="mt-1 text-sm text-slate-200">{BASE_MRS.length} relations</div>
            <div className="text-[11px] text-slate-500">photometric · geometric · morphological</div>
          </div>
        </div>
      </Step>

      <Step n={2} title="Failure profile">
        <div className="card card-pad">
          <p className="mb-3 text-[12.5px] text-slate-400">
            Baseline profiling of the model on the original dataset — the weaknesses that guide
            which relations are worth proposing.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="label mb-1.5">Weak classes</div>
              <div className="flex flex-wrap gap-1.5">
                {BASELINE_PROFILE.weakClasses.map((c) => (
                  <span key={c} className="chip !border-warn/40 text-warn">
                    {c}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <div className="label mb-1.5">Common failure modes</div>
              <ul className="space-y-0.5 text-[12px] text-slate-400">
                {BASELINE_PROFILE.commonFailures.map((c) => (
                  <li key={c}>· {c}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Step>

      <Step n={3} title="Relation candidates">
        <div className="mb-4">
          <Funnel />
        </div>
        <p className="mb-3 text-[12.5px] text-slate-400">
          Relations proposed for the {domainProfile?.label.toLowerCase() ?? "declared"} domain from
          the failure profile. Select one to inspect its validation. In this demonstration these
          are fixed, deterministic relations — not autonomously discovered.
        </p>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {GENERATED_MRS.map((mr) => (
            <button
              key={mr.id}
              onClick={() => setSelected(mr.name)}
              className={`text-left transition-transform ${selected === mr.name ? "ring-2 ring-accent/40" : ""} rounded-[10px]`}
            >
              <MRCard mr={mr} />
            </button>
          ))}
        </div>
      </Step>

      <Step n={4} title="Validation checks">
        <div className="card card-pad">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-[13px] text-slate-300">
              Relation: <span className="font-medium text-slate-100">{selected}</span>
            </div>
            <span
              className={`rounded px-2 py-0.5 text-[11px] font-semibold ${
                verdict === "VALIDATED" ? "bg-pass/12 text-pass" : "bg-fail/12 text-fail"
              }`}
            >
              {verdict}
            </span>
          </div>
          <div className="space-y-1.5">
            {rows.map((r) => (
              <div
                key={r.check}
                className={`flex items-center justify-between rounded-md border px-3 py-2 ${
                  r.ok ? "border-base-700 bg-base-800" : "border-fail/40 bg-fail/[0.06]"
                }`}
              >
                <span className="flex items-center gap-2 text-[13px] text-slate-200">
                  {r.ok ? (
                    <Check size={14} className="text-pass" />
                  ) : (
                    <X size={14} className="text-fail" />
                  )}
                  {r.check}
                </span>
                <span className="mono text-[11px] text-slate-500">{r.note}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11.5px] text-slate-500">
            {verdict === "VALIDATED"
              ? "All checks passed — the relation is admitted to the validated set."
              : "A check failed — the relation is not used for testing."}
          </p>
        </div>
      </Step>

      <Step n={5} title={`Validated relations · ${RELATION_STATS.validated}`}>
        <div className="card card-pad space-y-3">
          <div>
            <div className="label mb-1.5">Base library · {BASE_MRS.length}</div>
            <div className="flex flex-wrap gap-1.5">
              {BASE_MRS.map((m) => (
                <span key={m.id} className="chip">
                  <span className="text-slate-600">{m.id}</span> {m.name}
                </span>
              ))}
            </div>
          </div>
          <div>
            <div className="label mb-1.5">Domain-specific · {GENERATED_MRS.filter((m) => !m.rejected).length}</div>
            <div className="flex flex-wrap gap-1.5">
              {GENERATED_MRS.filter((m) => !m.rejected).map((m) => (
                <span key={m.id} className="chip !border-accent/40 !bg-accent/10 text-accent">
                  <span className="opacity-60">{m.id}</span> {m.name}
                </span>
              ))}
            </div>
          </div>
          <div>
            <div className="label mb-1.5">Rejected · {REJECTED_RELATIONS.length}</div>
            <ul className="space-y-1 text-[12px]">
              {REJECTED_RELATIONS.map((m) => (
                <li key={m.id}>
                  <span className="mono text-slate-500">{m.id}</span>{" "}
                  <span className="text-slate-400 line-through">{m.name}</span>{" "}
                  <span className="text-slate-500">— {m.expected.replace(/^Rejected — /, "")}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Step>

      <Step n={6} title={`Test selection · ${RELATION_STATS.executed} executions`}>
        <div className="card overflow-hidden">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="border-b hairline text-left text-[10.5px] uppercase tracking-wide text-slate-500">
                <th className="px-4 py-2 font-medium">Case</th>
                <th className="px-4 py-2 font-medium">Relation</th>
                <th className="px-4 py-2 font-medium">Type</th>
                <th className="px-4 py-2 font-medium">Result</th>
              </tr>
            </thead>
            <tbody>
              {RESOLVED_CASES.map((c) => {
                const mr = mrById(c.mrId);
                return (
                  <tr key={c.id} className="border-b hairline last:border-0">
                    <td className="px-4 py-2 mono text-slate-500">{c.id}</td>
                    <td className="px-4 py-2 text-slate-300">
                      <span className="mono text-slate-500">{mr.id}</span> {mr.name}
                    </td>
                    <td className="px-4 py-2 text-slate-500">{mr.relationType}</td>
                    <td className="px-4 py-2">
                      <span className={c.result === "PASS" ? "text-pass" : "text-fail"}>
                        {c.result === "PASS" ? "satisfied" : "violation"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Step>
    </div>
  );
}

export default function MRGeneration() {
  return (
    <RequireRun>
      <Generation />
    </RequireRun>
  );
}
