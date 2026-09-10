import { RESOLVED_CASES, type ResolvedCase } from "../data/testCases";
import { BASE_MRS, GENERATED_MRS } from "../data/metamorphicRelations";

const POOL_SIZE = BASE_MRS.length + GENERATED_MRS.length;

const CONDITION_OF: Record<string, string> = {
  haze: "Haze",
  fog: "Fog",
  night: "Night",
  dusk: "Dusk",
  glare: "Glare",
  rain: "Rain",
  motionblur: "Motion blur",
  blur: "Blur",
  brightness: "Brightness",
  contrast: "Contrast",
  rotate: "Rotation",
  bgr: "BGR reorder",
  occlusion: "Occlusion",
  insert: "Object insertion",
};

/** Per-case "impact": how far the transformed output moved from the original, 0 (identical) → ~1 (broken). */
export function caseImpact(c: ResolvedCase): number {
  let acc = 0;
  const n = Math.max(1, c.originalPreds.length);
  c.originalPreds.forEach((o, i) => {
    const t = c.transformedPreds[i];
    if (!t || t.cls !== o.cls) acc += o.conf; // object lost or re-classified
    else acc += Math.max(0, o.conf - t.conf);
  });
  let impact = acc / n;
  if (c.result === "VIOLATION") {
    impact = Math.max(impact, c.failure?.severity === "HIGH" ? 0.6 : 0.4) + 0.12;
  }
  return Math.min(1, impact);
}

export interface ConditionRobustness {
  condition: string;
  tests: number;
  violations: number;
  robustness: number;
}

export function conditionRobustness(cases: ResolvedCase[] = RESOLVED_CASES): ConditionRobustness[] {
  const map = new Map<string, { tests: number; violations: number; impact: number }>();
  for (const c of cases) {
    const cond = CONDITION_OF[c.transformStyle] ?? c.transformStyle;
    const row = map.get(cond) ?? { tests: 0, violations: 0, impact: 0 };
    row.tests += 1;
    if (c.result === "VIOLATION") row.violations += 1;
    row.impact += caseImpact(c);
    map.set(cond, row);
  }
  return [...map.entries()]
    .map(([condition, r]) => ({
      condition,
      tests: r.tests,
      violations: r.violations,
      robustness: Math.round(Math.max(0.1, Math.min(0.99, 1 - r.impact / r.tests)) * 100),
    }))
    .sort((a, b) => a.robustness - b.robustness);
}

export function summary(cases: ResolvedCase[] = RESOLVED_CASES) {
  const violations = cases.filter((c) => c.result === "VIOLATION");
  const affected = new Map<string, number>();
  for (const v of violations) {
    if (v.failure) affected.set(v.failure.affectedClass, (affected.get(v.failure.affectedClass) ?? 0) + 1);
  }
  const mostAffected = [...affected.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
  const mrsUsed = new Set(cases.map((c) => c.mr.id)).size;
  return {
    total: cases.length,
    passed: cases.length - violations.length,
    violations: violations.length,
    violationRate: cases.length ? violations.length / cases.length : 0,
    mrCoverage: mrsUsed / POOL_SIZE,
    mostAffected,
    highSeverity: violations.filter((v) => v.failure?.severity === "HIGH").length,
    baselineMap: 0.91,
  };
}
