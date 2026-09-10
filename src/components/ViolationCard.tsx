import type { ReactNode } from "react";
import { Download, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import DatasetImage from "./DatasetImage";
import { SeverityBadge } from "./ui";
import { downloadImage } from "../lib/download";
import { affectedDelta } from "../lib/testTrace";
import { assetUrl, type ResolvedCase } from "../data/testCases";

const CONDITION: Record<string, string> = {
  fog: "Fog", rain: "Rain", night: "Night", dusk: "Dusk", haze: "Haze", glare: "Lens glare",
  motionblur: "Motion blur", occlusion: "Occlusion", brightness: "Brightness", rotate: "Rotation",
  bgr: "Channel reorder", contrast: "Contrast", blur: "Blur", insert: "Object insertion",
};

const EFFECT: Record<string, string> = {
  "confidence degradation": "Detection confidence fell below the decision threshold.",
  "false negative": "The object was not detected.",
  "object disappearance": "A previously detected object was lost.",
  "class confusion": "The object was assigned the wrong class.",
  "localisation degradation": "The bounding box degraded significantly.",
};

function Row({ k, children }: { k: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-x-3 py-1.5">
      <dt className="label pt-0.5">{k}</dt>
      <dd className="text-[12.5px] leading-relaxed text-slate-300">{children}</dd>
    </div>
  );
}

export default function ViolationCard({ tc }: { tc: ResolvedCase; n?: number }) {
  if (!tc.failure) return null;
  const d = affectedDelta(tc);
  const cond = CONDITION[tc.transformStyle] ?? tc.transformName;

  return (
    <div className="card overflow-hidden border-fail/30">
      <div className="flex items-center justify-between border-b hairline px-4 py-2.5">
        <span className="text-[13px] font-semibold text-slate-100">
          {cond} · {tc.failure.affectedClass}
        </span>
        <SeverityBadge severity={tc.failure.severity} />
      </div>

      <div className="grid gap-2 p-3 sm:grid-cols-2">
        <figure className="overflow-hidden rounded-md border hairline">
          <DatasetImage tc={tc} kind="original" />
          <figcaption className="border-t hairline px-2 py-0.5 text-[10px] text-slate-500">Before</figcaption>
        </figure>
        <figure className="overflow-hidden rounded-md border border-fail/30">
          <DatasetImage tc={tc} kind="transformed" />
          <figcaption className="border-t hairline px-2 py-0.5 text-[10px] text-slate-500">After · {tc.transformName}</figcaption>
        </figure>
      </div>

      <dl className="divide-y hairline px-4 pb-2">
        <Row k="Condition">{cond}</Row>
        <Row k="Affected class">
          <span className="text-fail">{tc.failure.affectedClass}</span>
        </Row>
        <Row k="Expected">{tc.mr.expected}</Row>
        <Row k="Observed">
          {d ? (
            <>
              {d.cls} confidence{" "}
              <span className="mono">
                {d.before.toFixed(2)} → {d.after.toFixed(2)}
              </span>{" "}
              <span className={`mono ${d.pct <= -25 ? "text-fail" : "text-warn"}`}>
                ({d.pct.toFixed(0)}%)
              </span>
            </>
          ) : (
            tc.failure.observed
          )}
        </Row>
        <Row k="Effect">{EFFECT[tc.failure.category] ?? tc.failure.category}</Row>
      </dl>

      <div className="flex gap-2 border-t hairline px-4 py-3">
        <Link to={`/results?case=${tc.id}`} className="btn-ghost !py-1.5 !text-xs">
          <Eye size={13} /> Full trace
        </Link>
        <button
          onClick={() => downloadImage(assetUrl(tc.transformedImage), `${tc.id}-${tc.transformStyle}.jpg`)}
          className="btn-ghost !py-1.5 !text-xs"
        >
          <Download size={13} /> Evidence image
        </button>
      </div>
    </div>
  );
}
