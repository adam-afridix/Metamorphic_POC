import { useState } from "react";
import { ChevronRight } from "lucide-react";
import type { ResolvedCase } from "../data/testCases";
import { buildTrace } from "../lib/testTrace";
import DatasetImage from "./DatasetImage";

export default function TestTrace({
  tc,
  defaultOpen = false,
  caseNumber,
}: {
  tc: ResolvedCase;
  defaultOpen?: boolean;
  caseNumber?: number;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const steps = buildTrace(tc);
  const label =
    caseNumber != null ? `Case ${String(caseNumber).padStart(2, "0")}` : tc.id;

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-5 py-3.5 text-left"
        aria-expanded={open}
      >
        <ChevronRight
          size={16}
          className={`shrink-0 text-slate-500 transition-transform ${open ? "rotate-90" : ""}`}
        />
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold text-slate-100">
            {label} · {tc.transformName}
            <span className="ml-2 font-normal text-slate-500">— end-to-end test trace</span>
          </div>
        </div>
        <span
          className={`shrink-0 rounded px-2 py-0.5 text-[11px] font-semibold ${
            tc.result === "PASS" ? "bg-pass/12 text-pass" : "bg-fail/12 text-fail"
          }`}
        >
          {tc.result === "PASS" ? "RELATION SATISFIED" : "VIOLATION"}
        </span>
      </button>

      {open && (
        <div className="border-t hairline px-5 py-5">
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <figure className="overflow-hidden rounded-md border hairline">
              <DatasetImage tc={tc} kind="original" />
              <figcaption className="border-t hairline px-2.5 py-1 text-[11px] text-slate-500">
                Source
              </figcaption>
            </figure>
            <figure className="overflow-hidden rounded-md border hairline">
              <DatasetImage tc={tc} kind="transformed" />
              <figcaption className="border-t hairline px-2.5 py-1 text-[11px] text-slate-500">
                Test case
              </figcaption>
            </figure>
          </div>

          <ol className="relative space-y-3 border-l-2 border-base-700 pl-5">
            {steps.map((s) => (
              <li key={s.n} className="relative">
                <span
                  className={`absolute -left-[27px] top-0.5 grid h-5 w-5 place-items-center rounded-full border-2 bg-base-850 text-[10px] font-semibold ${
                    s.tone === "fail"
                      ? "border-fail text-fail"
                      : s.tone === "pass"
                      ? "border-pass text-pass"
                      : "border-base-600 text-slate-500"
                  }`}
                >
                  {s.n}
                </span>
                <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  {s.stage}
                </div>
                <div
                  className={`text-[13px] font-medium ${
                    s.tone === "fail" ? "text-fail" : s.tone === "pass" ? "text-pass" : "text-slate-200"
                  }`}
                >
                  {s.title}
                </div>
                <div className="mt-0.5 text-[12px] leading-relaxed text-slate-500">{s.body}</div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
