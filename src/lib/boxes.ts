import type { BBox, ResolvedCase } from "../data/testCases";

export interface Box {
  bbox: BBox;
  label: string;
  conf: number;
  weak?: boolean;
}

/** Detection boxes for the original or transformed view — predictions already carry pixel bboxes. */
export function buildBoxes(tc: ResolvedCase, kind: "original" | "transformed"): Box[] {
  const preds = kind === "original" ? tc.originalPreds : tc.transformedPreds;
  return preds.map((p) => ({
    bbox: p.bbox,
    label: p.cls,
    conf: p.conf,
    weak: kind === "transformed" && p.conf < 0.5,
  }));
}
