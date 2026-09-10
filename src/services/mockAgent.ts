import type { ResolvedCase } from "../data/testCases";
import { GENERATED_MRS } from "../data/metamorphicRelations";

// Simulated agent behaviour. No chain-of-thought is exposed — only concise,
// interpretable summaries of what the agent decided and why.

export interface DomainProfile {
  label: string;
  conditions: string[];
}

export function parseDomain(text: string): DomainProfile {
  const t = text.toLowerCase();
  const has = (...k: string[]) => k.some((w) => t.includes(w));
  if (has("driv", "road", "pedestrian", "vehicle", "traffic", "autonomous")) {
    return {
      label: "AUTONOMOUS DRIVING",
      conditions: ["Weather", "Lighting", "Occlusion", "Camera conditions", "Road environment"],
    };
  }
  if (has("crop", "leaf", "plant", "agri", "farm")) {
    return {
      label: "AGRICULTURE / CROP VISION",
      conditions: ["Illumination", "Leaf orientation", "Background", "Mild occlusion", "Seasonal appearance"],
    };
  }
  if (has("medical", "x-ray", "ct", "mri", "scan", "radiolog")) {
    return {
      label: "MEDICAL IMAGING",
      conditions: ["Contrast", "Acquisition noise", "Exposure", "Scanner variation"],
    };
  }
  return {
    label: "GENERAL VISION",
    conditions: ["Weather", "Lighting", "Camera conditions", "Object appearance", "Background"],
  };
}

export const discoveredMRs = () => GENERATED_MRS;

/** The MR validator: an LLM-proposed MR must clear these checks before becoming a test. */
export interface ValidationRow {
  check: string;
  ok: boolean;
  note: string;
}

export function validateMR(mrName: string): ValidationRow[] {
  const rejected = mrName.toLowerCase().includes("mirror") || mrName.toLowerCase().includes("flip");
  return [
    { check: "MR schema", ok: true, note: "well-formed transform + relation" },
    { check: "Task compatibility", ok: true, note: "valid for object detection" },
    { check: "Domain consistency", ok: !rejected, note: rejected ? "horizontal flip changes left/right traffic semantics" : "consistent with declared domain" },
    { check: "Transformation feasibility", ok: true, note: "deterministic / generative service available" },
    { check: "Expected output relation", ok: true, note: "relation is well-defined and checkable" },
    { check: "Semantic preservation", ok: !rejected, note: rejected ? "not guaranteed" : "constraints specified" },
  ];
}

/** Whether the metamorphic relation held, based on the pre-authored result. */
export function evaluateOracle(tc: ResolvedCase) {
  return {
    satisfied: tc.result === "PASS",
    expected: tc.expectedSummary,
    actual: tc.actualSummary,
  };
}

export function failureExplanation(tc: ResolvedCase) {
  if (!tc.failure) return null;
  return {
    ...tc.failure,
    mr: tc.mr.name,
    image: tc.id,
  };
}
