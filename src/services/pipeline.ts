import { RESOLVED_CASES } from "../data/testCases";
import { BASE_MRS, GENERATED_MRS } from "../data/metamorphicRelations";
import { transformSpec } from "./mockTransformation";

export type FrameKind = "info" | "agent" | "pass" | "fail" | "clip";

export type CaseStage =
  | "pick"
  | "describe"
  | "plan"
  | "transform"
  | "clip"
  | "model"
  | "verify"
  | "store";

export const CASE_STAGES: { key: CaseStage; label: string }[] = [
  { key: "pick", label: "Source" },
  { key: "describe", label: "Describe" },
  { key: "plan", label: "Relation" },
  { key: "transform", label: "Transform" },
  { key: "clip", label: "CLIP" },
  { key: "model", label: "Model" },
  { key: "verify", label: "Verify" },
  { key: "store", label: "Memory" },
];

export interface Frame {
  /** "global" for setup frames, otherwise the test-case index */
  scope: "global" | number;
  stage: CaseStage | "boot" | "explain";
  text: string;
  kind: FrameKind;
}

const POOL = BASE_MRS.length + GENERATED_MRS.length;
const ADMITTED = POOL - GENERATED_MRS.filter((m) => m.rejected).length;
const SWEEP_SAMPLES = RESOLVED_CASES.length;
const SWEEP_RESULTS = SWEEP_SAMPLES * (BASE_MRS.length - 3);

// short InstructPix2Pix-style edit instruction per generative style
const EDIT_INSTRUCTION: Record<string, string> = {
  haze: "add light atmospheric haze, lower the contrast at distance",
  fog: "add thick fog and reduce visibility",
  rain: "add heavy rain, wet road and overcast sky",
  night: "turn the daytime scene into night with street lighting",
  dusk: "change the lighting to dusk with a warm low sun",
  glare: "add strong low-sun lens glare and a blown-out bloom",
};

export function buildFrames(domainLabel: string): Frame[] {
  const d = domainLabel.toLowerCase();
  const frames: Frame[] = [
    { scope: "global", stage: "boot", kind: "info", text: "Model adapter attached — weights loaded into the inference session." },
    { scope: "global", stage: "boot", kind: "info", text: `Dataset ingested — ${SWEEP_SAMPLES} source images with ground-truth annotations.` },
    { scope: "global", stage: "boot", kind: "agent", text: `Domain description parsed → ${d}. Relevant conditions registered.` },
    { scope: "global", stage: "boot", kind: "info", text: "Baseline profiling complete — mAP@0.5 = 0.91; weak classes: pedestrian, cyclist." },
    { scope: "global", stage: "boot", kind: "info", text: `Bootstrap sweep — applying the general-purpose transformation library to ${SWEEP_SAMPLES} sample images.` },
    { scope: "global", stage: "boot", kind: "info", text: `Bootstrap complete — ${SWEEP_RESULTS} transformed samples written to testing memory.` },
    { scope: "global", stage: "boot", kind: "agent", text: "Sweep analysis — early degradation concentrated under low visibility, night and occlusion." },
    { scope: "global", stage: "boot", kind: "agent", text: `MR discovery — ${BASE_MRS.length} base relations + ${GENERATED_MRS.length} synthesised from sweep patterns and the ${d} domain.` },
    { scope: "global", stage: "boot", kind: "info", text: `MR validation — ${POOL} candidate relations screened; ${ADMITTED} validated, ${POOL - ADMITTED} rejected (horizontal flip breaks left/right semantics; snow relation redundant with MR-20).` },
    { scope: "global", stage: "boot", kind: "agent", text: "Adaptive loop starting — budget 10. Each iteration: pick image → describe → choose relation → generate → semantic check → run model → verify." },
  ];

  RESOLVED_CASES.forEach((tc, i) => {
    const spec = transformSpec(tc.transformStyle);
    const generative = spec.kind === "generative";
    const n = i + 1;

    frames.push({ scope: i, stage: "pick", kind: "info", text: `${tc.id} · selected as next source image (iteration ${n}/10).` });
    frames.push({ scope: i, stage: "describe", kind: "agent", text: `${tc.id} · vision model description → “${tc.caption}”` });
    frames.push({ scope: i, stage: "plan", kind: "agent", text: `${tc.id} · from memory patterns the agent chose ${tc.mr.id} “${tc.transformName}” — ${tc.selectionReason}` });
    frames.push({
      scope: i,
      stage: "transform",
      kind: "info",
      text: generative
        ? `${tc.id} · InstructPix2Pix edit — “${EDIT_INSTRUCTION[tc.transformStyle] ?? tc.transformName.toLowerCase()}”.`
        : `${tc.id} · deterministic transform — ${spec.param}.`,
    });
    frames.push({
      scope: i,
      stage: "clip",
      kind: "clip",
      text:
        tc.clipInitial != null
          ? `${tc.id} · CLIP similarity ${(tc.clipInitial * 100).toFixed(0)}% < threshold — regenerated → ${(tc.clipScore * 100).toFixed(0)}% (semantics preserved).`
          : `${tc.id} · CLIP similarity ${(tc.clipScore * 100).toFixed(0)}% vs ${(tc.clipThreshold * 100).toFixed(0)}% threshold — ${tc.semanticPreserved ? "semantics preserved" : "semantic change flagged"}.`,
    });
    frames.push({ scope: i, stage: "model", kind: "info", text: `${tc.id} · CV model inference on the original and the test-case image.` });
    frames.push({
      scope: i,
      stage: "verify",
      kind: tc.result === "PASS" ? "pass" : "fail",
      text: `${tc.id} · oracle → ${tc.result === "PASS" ? "RELATION SATISFIED" : "METAMORPHIC VIOLATION"} (${tc.actualSummary}).`,
    });
    if (tc.failure) {
      frames.push({
        scope: i,
        stage: "explain",
        kind: "fail",
        text: `${tc.id} · failure analysis — ${tc.failure.category}; affected class: ${tc.failure.affectedClass}; severity: ${tc.failure.severity}.`,
      });
    }
    frames.push({ scope: i, stage: "store", kind: "info", text: `${tc.id} · result written to testing memory — ${n}/10 iterations.` });
  });

  frames.push({ scope: "global", stage: "boot", kind: "agent", text: "Stopping condition met — test budget exhausted. Compiling robustness profile." });
  return frames;
}
