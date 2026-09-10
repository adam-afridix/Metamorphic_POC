import type { ResolvedCase } from "../data/testCases";
import { transformSpec } from "../services/mockTransformation";

const CONDITION_WORD: Record<string, string> = {
  brightness: "brightness",
  contrast: "contrast",
  blur: "blur",
  bgr: "channel-order",
  rotate: "rotation",
  haze: "haze",
  fog: "fog",
  rain: "rain",
  night: "night",
  dusk: "dusk",
  glare: "lens-glare",
  motionblur: "motion-blur",
  occlusion: "occlusion",
  insert: "added-object",
};

/** Confidence change on the affected class (from the pre-computed predictions). */
export function affectedDelta(tc: ResolvedCase): { cls: string; before: number; after: number; pct: number } | null {
  if (!tc.failure) return null;
  const cls = tc.failure.affectedClass;
  const near = (a: number[], b: number[]) => a.every((v, i) => Math.abs(v - b[i]) < 4);

  let best: { before: number; after: number } | null = null;
  for (const o of tc.originalPreds) {
    if (o.cls !== cls) continue;
    const t = tc.transformedPreds.find((p) => near(p.bbox, o.bbox));
    const after = t && t.cls === cls ? t.conf : 0; // dropped or re-classified → 0
    if (!best || o.conf - after > best.before - best.after) best = { before: o.conf, after };
  }
  if (!best) return null;
  const pct = best.before ? -((best.before - best.after) / best.before) * 100 : 0;
  return { cls, ...best, pct };
}

export interface TraceStep {
  n: number;
  stage: string;
  title: string;
  body: string;
  tone?: "pass" | "fail" | "neutral";
}

export function buildTrace(tc: ResolvedCase): TraceStep[] {
  const spec = transformSpec(tc.transformStyle);
  const generative = spec.kind === "generative";
  const d = affectedDelta(tc);
  const cond = CONDITION_WORD[tc.transformStyle] ?? tc.transformStyle;
  const clipPct = Math.round(tc.clipScore * 100);
  const thr = Math.round(tc.clipThreshold * 100);

  return [
    {
      n: 1,
      stage: "Source",
      title: `KITTI street scene · ${tc.id}`,
      body: tc.caption,
    },
    {
      n: 2,
      stage: "AI analysis",
      title: "Scene described by the vision model",
      body: `Objects: ${tc.originalPreds.map((p) => p.cls).join(", ")}. The baseline profile flags ${tc.failure ? tc.failure.affectedClass : "pedestrian / cyclist"} as a weak class.`,
    },
    {
      n: 3,
      stage: "Relation",
      title: `${tc.mr.id} · ${tc.mr.name}`,
      body: tc.mr.expected,
    },
    {
      n: 4,
      stage: "Transform",
      title: generative ? "InstructPix2Pix edit" : "Deterministic transform",
      body: generative
        ? `Instruction: "${cond.replace("-", " ")}". Test-case image generated.`
        : `${spec.param}. Test-case image generated.`,
    },
    {
      n: 5,
      stage: "CLIP validation",
      title:
        tc.clipInitial != null
          ? `Regenerated once, then accepted (${clipPct}% ≥ ${thr}%)`
          : `Transformation accepted (${clipPct}% ≥ ${thr}%)`,
      body: "Semantic consistency with the original scene is maintained, so the test-case image is admitted.",
    },
    {
      n: 6,
      stage: "Model",
      title: "Detector run on original and test-case image",
      body: d
        ? `${d.cls} confidence: ${d.before.toFixed(2)} → ${d.after.toFixed(2)}`
        : "Detections remain within tolerance across both images.",
    },
    {
      n: 7,
      stage: "Verify",
      title: tc.result === "PASS" ? "Expected relation satisfied" : "Expected relation violated",
      body: `expected ${tc.expectedSummary} · observed ${tc.actualSummary}`,
      tone: tc.result === "PASS" ? "pass" : "fail",
    },
    {
      n: 8,
      stage: "Result",
      title:
        tc.result === "PASS"
          ? "PASS"
          : `VIOLATION · ${tc.failure?.severity ?? "MEDIUM"} SEVERITY`,
      body: tc.failure
        ? `${tc.failure.category} on the ${tc.failure.affectedClass} class.`
        : "The relation held under this transformation.",
      tone: tc.result === "PASS" ? "pass" : "fail",
    },
    {
      n: 9,
      stage: "Memory",
      title: tc.result === "PASS" ? "Recorded as robust under this condition" : `${cond.replace("-", " ")} added to vulnerable-condition memory`,
      body:
        tc.result === "PASS"
          ? "The result is stored; this condition is de-prioritised for follow-up."
          : `The finding is stored and raises the priority of related low-visibility conditions for the remaining test budget.`,
      tone: tc.result === "PASS" ? "pass" : "fail",
    },
  ];
}
