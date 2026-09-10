import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, FileUp, ImageUp, Play, Cpu } from "lucide-react";
import { usePipeline } from "../hooks/useTestingPipeline";
import { SectionTitle } from "../components/ui";
import { RESOLVED_CASES, assetUrl, DATASET_META } from "../data/testCases";

const TASKS = ["Classification", "Object Detection", "Segmentation", "Tracking"];
const EXAMPLE =
  "This model detects pedestrians, cars, trucks and cyclists in urban and suburban driving scenes (KITTI-style). It should remain robust under weather, lighting, camera and environmental variations, and under partial occlusion of road users.";

export default function TestSetup() {
  const nav = useNavigate();
  const {
    config,
    setModel,
    setTaskType,
    loadDataset,
    setDomainText,
    previewDomain,
    canStart,
    start,
    reset,
    status,
  } = usePipeline();

  const onStart = () => {
    if (status !== "idle") reset();
    start();
    nav("/testing");
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Model */}
        <div className="card card-pad">
          <SectionTitle hint="The uploaded model is not executed in the POC — inference is simulated.">
            CV Model
          </SectionTitle>
          {config.modelName ? (
            <div className="flex items-center gap-3 rounded-lg border border-pass/30 bg-pass/5 px-4 py-3">
              <CheckCircle2 className="text-pass" size={18} />
              <div>
                <div className="mono text-sm text-slate-200">{config.modelName}</div>
                <div className="text-xs text-slate-500">Model loaded successfully · adapter: PyTorch</div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setModel("yolov8n_urban.pt")}
              className="flex w-full flex-col items-center gap-2 rounded-xl border border-dashed border-base-600 bg-base-900/40 px-4 py-8 text-slate-400 transition-colors hover:border-accent/50 hover:text-slate-200"
            >
              <FileUp size={22} />
              <span className="text-sm font-medium">+ Upload Model</span>
              <span className="mono text-xs text-slate-600">.pt · .pth · .onnx · .h5</span>
            </button>
          )}

          <div className="mt-5">
            <div className="label mb-2">Model task</div>
            <div className="grid grid-cols-2 gap-2">
              {TASKS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTaskType(t)}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                    config.taskType === t
                      ? "border-accent/50 bg-accent/10 text-accent"
                      : "border-base-700/60 bg-base-900/40 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Cpu size={14} />
                  {t}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-500">
              The oracle and expected relation differ per task. POC ships the Object Detection oracle;
              the adapter interface leaves room for the others.
            </p>
          </div>
        </div>

        {/* Dataset */}
        <div className="card card-pad">
          <SectionTitle hint={`Source: ${DATASET_META.source}`}>Dataset</SectionTitle>
          {config.datasetLoaded ? (
            <>
              <div className="mb-3 flex items-center gap-2 text-sm text-pass">
                <CheckCircle2 size={16} /> 10 images loaded · object detection · {DATASET_META.license}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {RESOLVED_CASES.map((c) => (
                  <div key={c.id} className="overflow-hidden rounded-md border border-base-700/50">
                    <img src={assetUrl(c.image)} alt={c.id} className="block w-full" />
                    <div className="bg-base-900/70 px-1.5 py-0.5 text-[10px] text-slate-500">
                      {c.id} · {c.originalPreds.length} objects
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <button
              onClick={loadDataset}
              className="flex w-full flex-col items-center gap-2 rounded-xl border border-dashed border-base-600 bg-base-900/40 px-4 py-8 text-slate-400 transition-colors hover:border-accent/50 hover:text-slate-200"
            >
              <ImageUp size={22} />
              <span className="text-sm font-medium">+ Upload Dataset</span>
              <span className="text-xs text-slate-600">10 test images expected</span>
            </button>
          )}
        </div>
      </div>

      {/* Domain */}
      <div className="card card-pad">
        <SectionTitle hint="Used by the MR Discovery Agent to infer which properties must be preserved or changed.">
          Domain description
        </SectionTitle>
        <textarea
          value={config.domainText}
          onChange={(e) => setDomainText(e.target.value)}
          rows={4}
          placeholder="Describe the domain in which the CV model operates…"
          className="mono w-full resize-none rounded-lg border border-base-700/60 bg-base-900/60 p-3 text-sm text-slate-200 outline-none focus:border-accent/50"
        />
        <div className="mt-2 flex items-center justify-between">
          <button
            onClick={() => setDomainText(EXAMPLE)}
            className="text-xs text-accent hover:underline"
          >
            Use example (autonomous driving)
          </button>
          <span className="mono text-xs text-slate-600">{config.domainText.trim().length} chars</span>
        </div>

        {config.domainText.trim().length >= 10 && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 rounded-lg border border-accent/30 bg-accent/5 p-4"
          >
            <div className="text-xs uppercase tracking-wide text-slate-400">Domain identified</div>
            <div className="mt-1 text-lg font-bold text-accent">{previewDomain.label}</div>
            <div className="mt-2 text-xs text-slate-400">Relevant conditions</div>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {previewDomain.conditions.map((c) => (
                <span key={c} className="chip">{c}</span>
              ))}
            </div>
            <div className="mt-2 text-[11px] text-slate-500">Simulated for the POC.</div>
          </motion.div>
        )}
      </div>

      <div className="flex items-center justify-between rounded-xl border border-base-700/60 bg-base-850/70 px-5 py-4">
        <div className="text-sm text-slate-400">
          {canStart ? "Ready to run the agentic testing pipeline." : "Upload the dataset and enter a domain description to continue."}
        </div>
        <button className="btn-primary" disabled={!canStart} onClick={onStart}>
          <Play size={16} /> Start Agentic Test
        </button>
      </div>
    </div>
  );
}
