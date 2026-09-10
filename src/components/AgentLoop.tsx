import { RotateCcw } from "lucide-react";

const STEPS: { k: string; note: string }[] = [
  { k: "Observe", note: "profile the model + describe each image" },
  { k: "Analyse", note: "build the failure profile" },
  { k: "Generate", note: "discover candidate relations" },
  { k: "Select", note: "choose the next test from memory" },
  { k: "Test", note: "transform · CLIP · run detector" },
  { k: "Verify", note: "oracle checks the relation" },
  { k: "Learn", note: "write findings to testing memory" },
];

export default function AgentLoop() {
  return (
    <div className="card card-pad">
      <div className="mb-3 flex items-center justify-between">
        <span className="label">Agent loop</span>
        <span className="chip">
          <RotateCcw size={11} /> closed loop
        </span>
      </div>
      <ol className="flex flex-wrap items-stretch gap-x-1 gap-y-2">
        {STEPS.map((s, i) => (
          <li key={s.k} className="flex items-center">
            <div className="w-[104px] rounded-md border hairline bg-base-800 px-2 py-1.5">
              <div className="text-[12px] font-semibold text-slate-200">{s.k}</div>
              <div className="mt-0.5 text-[10px] leading-tight text-slate-500">{s.note}</div>
            </div>
            {i < STEPS.length - 1 && <span className="mx-1 text-slate-600">→</span>}
          </li>
        ))}
      </ol>
      <p className="mt-3 text-[11.5px] text-slate-500">
        Each cycle updates the testing memory, which drives adaptive prioritisation of the next
        <span className="text-slate-400"> Select</span> step. The POC does not perform any model
        training or machine learning from this memory.
      </p>
    </div>
  );
}
