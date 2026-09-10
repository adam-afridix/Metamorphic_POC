import { Download, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import DatasetImage from "./DatasetImage";
import { SeverityBadge } from "./ui";
import { downloadImage } from "../lib/download";
import { assetUrl, type ResolvedCase } from "../data/testCases";

export default function ViolationCard({ tc, n }: { tc: ResolvedCase; n: number }) {
  if (!tc.failure) return null;

  return (
    <div className="card card-pad border-fail/30">
      <div className="flex items-center justify-between">
        <div className="text-sm font-bold text-fail">VIOLATION #{String(n).padStart(2, "0")}</div>
        <SeverityBadge severity={tc.failure.severity} />
      </div>

      <div className="mt-3 space-y-2">
        <div className="overflow-hidden rounded-lg border border-base-700/50">
          <DatasetImage tc={tc} kind="original" />
        </div>
        <div className="overflow-hidden rounded-lg border border-fail/30">
          <DatasetImage tc={tc} kind="transformed" />
        </div>
      </div>

      <dl className="mono mt-3 grid grid-cols-[auto_1fr] items-baseline gap-x-4 gap-y-1 text-[12px]">
        <div className="text-slate-500">Image</div>
        <div className="text-slate-300">{tc.id} · {tc.mr.id}</div>
        <div className="text-slate-500">MR</div>
        <div className="text-slate-300">{tc.mr.name}</div>
        <div className="text-slate-500">Affected class</div>
        <div className="text-fail">{tc.failure.affectedClass}</div>
        <div className="text-slate-500">Failure type</div>
        <div className="text-slate-300">{tc.failure.category}</div>
        <div className="text-slate-500">CLIP similarity</div>
        <div className="text-slate-300">{(tc.clipScore * 100).toFixed(1)}%</div>
      </dl>

      <p className="mt-3 text-xs leading-relaxed text-slate-300">{tc.failure.observed}</p>

      <div className="mt-4 flex gap-2">
        <Link to={`/results?case=${tc.id}`} className="btn-ghost !py-1.5 !text-xs">
          <Eye size={14} /> View details
        </Link>
        <button
          onClick={() => downloadImage(assetUrl(tc.transformedImage), `${tc.id}-${tc.transformStyle}-violation.jpg`)}
          className="btn-ghost !py-1.5 !text-xs"
        >
          <Download size={14} /> Save image
        </button>
      </div>
    </div>
  );
}
