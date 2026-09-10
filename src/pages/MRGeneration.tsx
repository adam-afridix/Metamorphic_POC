import { useState } from "react";
import { motion } from "framer-motion";
import { Check, X, Sparkles, Database } from "lucide-react";
import { usePipeline } from "../hooks/useTestingPipeline";
import RequireRun from "../components/RequireRun";
import { SectionTitle } from "../components/ui";
import MRCard from "../components/MRCard";
import { BASE_MRS, GENERATED_MRS } from "../data/metamorphicRelations";
import { validateMR } from "../services/mockAgent";

function Generation() {
  const { domainProfile, config } = usePipeline();
  const [selected, setSelected] = useState(GENERATED_MRS[1].name);
  const rows = validateMR(selected);

  return (
    <div className="space-y-6">
      <div className="card card-pad">
        <SectionTitle hint="The base library is not assumed to be exhaustive — the agent expands the testing space from the domain.">
          LLM Metamorphic Relation Discovery
        </SectionTitle>
        <div className="grid gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-base-700/50 bg-base-900/40 p-3">
            <div className="label">Model type</div>
            <div className="mt-1 text-sm text-slate-200">{config.taskType}</div>
          </div>
          <div className="rounded-lg border border-base-700/50 bg-base-900/40 p-3">
            <div className="label">Domain</div>
            <div className="mt-1 text-sm text-accent">{domainProfile?.label ?? "—"}</div>
          </div>
          <div className="rounded-lg border border-base-700/50 bg-base-900/40 p-3">
            <div className="label">Base MR library</div>
            <div className="mt-1 text-sm text-slate-200">{BASE_MRS.length} MRs</div>
          </div>
          <div className="rounded-lg border border-accent/30 bg-accent/5 p-3">
            <div className="label">Discovered</div>
            <div className="mt-1 text-sm text-accent">
              {GENERATED_MRS.length} MRs
              <span className="text-slate-500"> · {GENERATED_MRS.filter((m) => m.rejected).length} rejected</span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <SectionTitle hint="Generative / environmental and domain-specific relations inferred from the domain description.">
          <span className="inline-flex items-center gap-2">
            <Sparkles size={16} className="text-accent" /> Discovered metamorphic relations
          </span>
        </SectionTitle>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {GENERATED_MRS.map((mr, i) => (
            <button key={mr.id} onClick={() => setSelected(mr.name)} className="text-left">
              <MRCard mr={mr} index={i} />
            </button>
          ))}
        </div>
      </div>

      <div className="card card-pad">
        <SectionTitle hint="An LLM-proposed MR does not automatically become a test — it must clear the validator.">
          MR validation · <span className="text-accent">{selected}</span>
        </SectionTitle>
        <div className="space-y-1.5">
          {rows.map((r, i) => (
            <motion.div
              key={r.check}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-center justify-between rounded-lg border px-3 py-2 ${
                r.ok ? "border-base-700/50 bg-base-900/40" : "border-fail/40 bg-fail/5"
              }`}
            >
              <span className="flex items-center gap-2 text-sm text-slate-200">
                {r.ok ? <Check size={15} className="text-pass" /> : <X size={15} className="text-fail" />}
                {r.check}
              </span>
              <span className="mono text-xs text-slate-500">{r.note}</span>
            </motion.div>
          ))}
        </div>
        <div className="mt-3 text-xs text-slate-500">
          {rows.every((r) => r.ok)
            ? "All checks passed → admitted to the MR candidate pool."
            : "One or more checks failed → rejected or returned for refinement."}
        </div>
      </div>

      <div className="card card-pad">
        <SectionTitle hint="Dynamic, not fixed — base + generative + domain-specific.">
          <span className="inline-flex items-center gap-2">
            <Database size={16} /> MR candidate pool ({BASE_MRS.length + GENERATED_MRS.length})
          </span>
        </SectionTitle>
        <div className="mb-2 text-xs uppercase tracking-wide text-slate-500">Base library · 21</div>
        <div className="flex flex-wrap gap-1.5">
          {BASE_MRS.map((m) => (
            <span key={m.id} className="chip">
              <span className="text-slate-600">{m.id}</span> {m.name}
            </span>
          ))}
        </div>
        <div className="mb-2 mt-4 text-xs uppercase tracking-wide text-slate-500">Discovered · {GENERATED_MRS.length}</div>
        <div className="flex flex-wrap gap-1.5">
          {GENERATED_MRS.map((m) => (
            <span
              key={m.id}
              className={
                m.rejected
                  ? "chip border-fail/40 text-fail line-through"
                  : "chip border-accent/40 bg-accent/10 text-accent"
              }
            >
              <span className="opacity-60">{m.id}</span> {m.name}
            </span>
          ))}
        </div>
      </div>
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
