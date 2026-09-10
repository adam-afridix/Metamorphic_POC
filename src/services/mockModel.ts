import type { Prediction, ResolvedCase } from "../data/testCases";

// Simulated CV model inference. Deterministic: returns the pre-authored predictions.

export interface ModelOutputs {
  original: Prediction[];
  transformed: Prediction[];
}

export function runModel(tc: ResolvedCase): ModelOutputs {
  return { original: tc.originalPreds, transformed: tc.transformedPreds };
}

// Baseline profiling numbers shown before metamorphic testing starts.
export const BASELINE_PROFILE = {
  task: "detection",
  metrics: [
    { name: "mAP@0.5", value: 0.91 },
    { name: "Precision", value: 0.9 },
    { name: "Recall", value: 0.88 },
    { name: "Mean IoU", value: 0.82 },
    { name: "Avg. confidence", value: 0.78 },
  ],
  perClassAP: [
    { cls: "car", ap: 0.95 },
    { cls: "truck", ap: 0.92 },
    { cls: "cyclist", ap: 0.74 },
    { cls: "pedestrian", ap: 0.71 },
  ],
  weakClasses: ["pedestrian", "cyclist"],
  commonFailures: ["distant / small objects", "crowded scenes", "partially occluded road users"],
};
