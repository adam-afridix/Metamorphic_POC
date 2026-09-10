import { useState } from "react";
import { Download, Images, TriangleAlert } from "lucide-react";
import { usePipeline } from "../hooks/useTestingPipeline";
import RequireRun from "../components/RequireRun";
import { SectionTitle, EmptyState } from "../components/ui";
import ViolationCard from "../components/ViolationCard";
import DatasetImage from "../components/DatasetImage";
import { downloadImage } from "../lib/download";
import { assetUrl } from "../data/testCases";

function Gallery() {
  const { completedCases } = usePipeline();

  const save = (image: string, id: string, style: string) =>
    downloadImage(assetUrl(image), `${id}-${style}.jpg`);

  return (
    <div className="card card-pad">
      <SectionTitle hint="Every transformed input generated during the run is retained and can be exported.">
        <span className="inline-flex items-center gap-2">
          <Images size={16} /> Transformed image gallery
        </span>
      </SectionTitle>
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {completedCases.map((tc) => (
          <div key={tc.id} className="group relative overflow-hidden rounded-lg border border-base-700/50">
            <DatasetImage tc={tc} kind="transformed" />
            <div className="flex items-center justify-between bg-base-900/70 px-2 py-1 text-[10px]">
              <span className="text-slate-400">{tc.id} · {tc.transformName}</span>
              <button onClick={() => save(tc.transformedImage, tc.id, tc.transformStyle)} className="text-slate-500 hover:text-accent">
                <Download size={12} />
              </button>
            </div>
            <span
              className={`absolute right-1 top-1 rounded px-1.5 py-0.5 text-[9px] font-bold ${
                tc.result === "PASS" ? "bg-pass/20 text-pass" : "bg-fail/20 text-fail"
              }`}
            >
              {tc.result === "PASS" ? "PASS" : "VIOLATION"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ViolationsView() {
  const { completedCases } = usePipeline();
  const [tab, setTab] = useState<"violations" | "gallery">("violations");
  const violations = completedCases.filter((c) => c.result === "VIOLATION");

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        <button
          onClick={() => setTab("violations")}
          className={tab === "violations" ? "btn-primary !py-1.5 !text-xs" : "btn-ghost !py-1.5 !text-xs"}
        >
          <TriangleAlert size={14} /> Violating cases ({violations.length})
        </button>
        <button
          onClick={() => setTab("gallery")}
          className={tab === "gallery" ? "btn-primary !py-1.5 !text-xs" : "btn-ghost !py-1.5 !text-xs"}
        >
          <Images size={14} /> All transformed images
        </button>
      </div>

      {tab === "gallery" ? (
        <Gallery />
      ) : violations.length === 0 ? (
        <EmptyState
          title="No violations recorded yet"
          body="Either the run has not reached a violating case, or the model satisfied every metamorphic relation tested so far."
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {violations.map((tc, i) => (
            <ViolationCard key={tc.id} tc={tc} n={i + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Violations() {
  return (
    <RequireRun>
      <ViolationsView />
    </RequireRun>
  );
}
