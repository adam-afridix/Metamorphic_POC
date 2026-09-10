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

/** The MR validator: a proposed relation must clear every check before it can be selected for testing. */
export interface ValidationRow {
  check: string;
  ok: boolean;
  note: string;
}

export interface ValidationResult {
  rows: ValidationRow[];
  verdict: "VALIDATED" | "REJECTED";
}

export function validateMR(mrName: string): ValidationResult {
  const n = mrName.toLowerCase();
  const isFlip = n.includes("mirror") || n.includes("flip");
  const isRedundant = n.includes("snow"); // overlaps base MR-20 "Sunny → snowy"

  const rows: ValidationRow[] = [
    { check: "Domain relevance", ok: !isFlip, note: isFlip ? "mirroring swaps left/right road semantics" : "condition occurs in the declared domain" },
    { check: "Semantic consistency", ok: !isFlip, note: isFlip ? "changes scene meaning, not just appearance" : "transformation preserves scene meaning" },
    { check: "Transformation validity", ok: true, note: "deterministic / generative service can produce it" },
    { check: "Expected prediction relationship", ok: true, note: "an expected input–output relation is defined" },
    { check: "Testability", ok: true, note: "the relation is checkable by the oracle" },
    { check: "Non-redundancy", ok: !isRedundant, note: isRedundant ? "already covered by base relation MR-20" : "not covered by an existing relation" },
  ];
  return { rows, verdict: rows.every((r) => r.ok) ? "VALIDATED" : "REJECTED" };
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
