import { useEffect, useRef, useState } from "react";
import { CircuitBoard } from "lucide-react";

export default function PocBadge() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-md border border-base-700 bg-base-800 px-2 py-1 text-[10.5px] font-medium uppercase tracking-[0.1em] text-slate-400 transition-colors hover:text-slate-200"
        title="This is a deterministic proof-of-concept — click for details"
      >
        <CircuitBoard size={12} className="text-accent" />
        POC mode · deterministic demonstration
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-30 w-[320px] rounded-lg border hairline bg-base-850 p-3.5 text-[12.5px] leading-relaxed text-slate-400 shadow-lg">
          <p className="mb-2 font-medium text-slate-200">Deterministic demonstration</p>
          <p>
            This proof-of-concept demonstrates the complete testing workflow using deterministic
            model and tool outputs. The orchestration, relation validation, testing logic, memory
            flow, results and reporting are implemented for reproducible demonstration.
          </p>
          <p className="mt-2 text-[11.5px] text-slate-500">
            External calls (LLM, image editor, CLIP, detector) are mocked. The interface and
            orchestration represent the proposed production workflow.
          </p>
        </div>
      )}
    </div>
  );
}
