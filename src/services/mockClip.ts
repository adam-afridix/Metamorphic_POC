import type { ResolvedCase } from "../data/testCases";

// Simulated CLIP / image-text semantic validation.
// Returns the pre-authored similarity for the case, plus a verdict against the threshold.

export interface ClipResult {
  originalCaption: string;
  transformedCaption: string;
  similarity: number;
  threshold: number;
  preserved: boolean;
  regenerated: boolean;
  initialSimilarity: number | null;
}

export function runClip(tc: ResolvedCase): ClipResult {
  return {
    originalCaption: tc.caption,
    transformedCaption: tc.transformedCaption,
    similarity: tc.clipScore,
    threshold: tc.clipThreshold,
    preserved: tc.clipScore >= tc.clipThreshold,
    regenerated: !!tc.regenerated,
    initialSimilarity: tc.clipInitial,
  };
}
