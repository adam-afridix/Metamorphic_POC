import { ArrowRight } from "lucide-react";
import DatasetImage from "./DatasetImage";
import type { ResolvedCase } from "../data/testCases";

export default function ImageComparison({
  tc,
  showBoxes = true,
  className = "",
}: {
  tc: ResolvedCase;
  showBoxes?: boolean;
  className?: string;
}) {
  return (
    <div className={`grid grid-cols-[1fr_auto_1fr] items-center gap-3 ${className}`}>
      <figure className="card overflow-hidden">
        <DatasetImage tc={tc} kind="original" showBoxes={showBoxes} />
        <figcaption className="border-t border-base-700/50 px-2.5 py-1 text-[11px] text-slate-500">
          Original · {tc.id}
        </figcaption>
      </figure>

      <ArrowRight size={16} className="text-slate-600" />

      <figure className="card overflow-hidden">
        <DatasetImage tc={tc} kind="transformed" showBoxes={showBoxes} />
        <figcaption className="border-t border-base-700/50 px-2.5 py-1 text-[11px] text-slate-500">
          Test case · {tc.transformName}
        </figcaption>
      </figure>
    </div>
  );
}
