// Metamorphic relation library used by the POC.
// "base" = the agreed 21 general-purpose MRs. "generative"/"domain" = discovered by the (simulated) LLM agent.

export type MRCategory = "photometric" | "geometric" | "morphological" | "generative" | "domain";
export type MRRelationType = "invariant" | "predictable" | "addition" | "removal" | "relational";

export interface MetamorphicRelation {
  id: string;
  name: string;
  category: MRCategory;
  relationType: MRRelationType;
  /** what the oracle expects the transformed output to satisfy */
  expected: string;
  /** true for MRs produced by the simulated MR Discovery Agent */
  generated?: boolean;
  /** true if the validator rejected this candidate (kept for display) */
  rejected?: boolean;
}

export const BASE_MRS: MetamorphicRelation[] = [
  { id: "MR-01", name: "BGR channel reorder", category: "photometric", relationType: "invariant", expected: "Predictions unchanged; colour channel order is not semantically meaningful." },
  { id: "MR-02", name: "Contrast change", category: "photometric", relationType: "invariant", expected: "Detected classes and boxes remain within tolerance." },
  { id: "MR-03", name: "Brightness change", category: "photometric", relationType: "invariant", expected: "Detected classes and boxes remain within tolerance." },
  { id: "MR-04", name: "Gaussian blur", category: "photometric", relationType: "invariant", expected: "Objects remain detectable within an acceptable degradation threshold." },
  { id: "MR-05", name: "Sharpen", category: "photometric", relationType: "invariant", expected: "Predictions unchanged within tolerance." },
  { id: "MR-06", name: "Random perturbation", category: "photometric", relationType: "invariant", expected: "Predictions robust to small pixel-level noise." },
  { id: "MR-07", name: "Rotation", category: "geometric", relationType: "predictable", expected: "Bounding boxes rotate consistently with the image." },
  { id: "MR-08", name: "Transpose", category: "geometric", relationType: "predictable", expected: "Boxes transpose consistently with the image." },
  { id: "MR-09", name: "Rotation + transpose", category: "geometric", relationType: "predictable", expected: "Composed geometric transform applies consistently to boxes." },
  { id: "MR-10", name: "Affine transformation", category: "geometric", relationType: "predictable", expected: "Boxes follow the affine transform." },
  { id: "MR-11", name: "Translation", category: "geometric", relationType: "predictable", expected: "Boxes shift by the same offset." },
  { id: "MR-12", name: "Enlarge", category: "geometric", relationType: "predictable", expected: "Boxes scale up consistently." },
  { id: "MR-13", name: "Shrink", category: "geometric", relationType: "predictable", expected: "Boxes scale down consistently." },
  { id: "MR-14", name: "Arbitrary rotation", category: "geometric", relationType: "predictable", expected: "Boxes rotate by the applied angle." },
  { id: "MR-15", name: "Rotation + translation", category: "geometric", relationType: "predictable", expected: "Composed transform applies to boxes." },
  { id: "MR-16", name: "Translation + shrink", category: "geometric", relationType: "predictable", expected: "Composed transform applies to boxes." },
  { id: "MR-17", name: "Erosion", category: "morphological", relationType: "invariant", expected: "Predictions stable under mild morphological erosion." },
  { id: "MR-18", name: "Dilation", category: "morphological", relationType: "invariant", expected: "Predictions stable under mild morphological dilation." },
  { id: "MR-19", name: "Dilation / erosion duality", category: "morphological", relationType: "relational", expected: "erosion(dilation(x)) is consistent with the original." },
  { id: "MR-20", name: "Sunny → snowy", category: "generative", relationType: "invariant", expected: "Existing objects remain detectable under seasonal appearance change." },
  { id: "MR-21", name: "JPEG compression artifacts", category: "photometric", relationType: "invariant", expected: "Predictions robust to moderate compression." },
];

// Produced by the simulated MR Discovery Agent from the domain description.
export const GENERATED_MRS: MetamorphicRelation[] = [
  {
    id: "GMR-01",
    name: "Clear → Rainy",
    category: "generative",
    relationType: "invariant",
    generated: true,
    expected: "Object classes remain consistent; confidence may degrade but must stay above the detection threshold.",
  },
  {
    id: "GMR-02",
    name: "Clear → Foggy",
    category: "generative",
    relationType: "invariant",
    generated: true,
    expected: "Existing objects remain detectable within an acceptable degradation threshold; no object may disappear.",
  },
  {
    id: "GMR-03",
    name: "Day → Night",
    category: "generative",
    relationType: "invariant",
    generated: true,
    expected: "Object classes remain consistent; spatial coordinates transform consistently.",
  },
  {
    id: "DMR-01",
    name: "Pedestrian → partially occluded pedestrian",
    category: "domain",
    relationType: "invariant",
    generated: true,
    expected: "Pedestrian identity / class remains consistent while sufficient visual evidence remains.",
  },
  {
    id: "DMR-02",
    name: "Dry road → wet road",
    category: "domain",
    relationType: "invariant",
    generated: true,
    expected: "Road-user detections are unaffected by road surface reflectance change.",
  },
  {
    id: "DMR-03",
    name: "Normal traffic → dense traffic (object insertion)",
    category: "domain",
    relationType: "addition",
    generated: true,
    expected: "All previously detected objects remain, plus the inserted vehicle.",
  },

  // weather / time / illumination
  { id: "GMR-04", name: "Clear → Snowy", category: "generative", relationType: "invariant", generated: true, rejected: true, expected: "Rejected — redundant with base relation MR-20 (Sunny → snowy)." },
  { id: "GMR-05", name: "Clear → Hazy", category: "generative", relationType: "invariant", generated: true, expected: "Objects remain detectable as haze reduces contrast at range." },
  { id: "GMR-06", name: "Day → Dusk", category: "generative", relationType: "invariant", generated: true, expected: "Predictions stable as ambient light drops and colour temperature shifts." },
  { id: "GMR-07", name: "Normal → Low-light", category: "generative", relationType: "invariant", generated: true, expected: "Object classes unchanged; confidence stays above the detection threshold." },
  { id: "GMR-08", name: "Normal → Backlit", category: "generative", relationType: "invariant", generated: true, expected: "Silhouetted objects are still detected against the bright background." },
  // camera / imaging
  { id: "GMR-09", name: "Normal → Motion blur", category: "generative", relationType: "invariant", generated: true, expected: "Objects remain detectable under directional blur within tolerance." },
  { id: "GMR-10", name: "Normal → Lens glare", category: "generative", relationType: "invariant", generated: true, expected: "Detections outside the glare region are unaffected." },
  { id: "GMR-11", name: "Clean lens → Raindrops on lens", category: "generative", relationType: "invariant", generated: true, expected: "Objects behind unoccluded lens regions remain detected." },
  { id: "GMR-12", name: "Horizontal flip", category: "geometric", relationType: "predictable", generated: true, rejected: true, expected: "Rejected — mirroring swaps left/right road semantics for a driving model." },
  // domain-specific
  { id: "DMR-04", name: "Dry road → wet road with reflections", category: "domain", relationType: "invariant", generated: true, expected: "Road-user detections unaffected by specular reflections on the surface." },
  { id: "DMR-05", name: "Sparse → crowded crossing (object insertion)", category: "domain", relationType: "addition", generated: true, expected: "All original detections retained plus the inserted pedestrians." },
  { id: "DMR-06", name: "Parked vehicle removal", category: "domain", relationType: "removal", generated: true, expected: "Remaining detections unchanged; the removed vehicle is no longer reported." },
  { id: "DMR-07", name: "Car → truck (object replacement)", category: "domain", relationType: "relational", generated: true, expected: "The replaced object is detected with the new class at the same location." },
];

export const RELATION_TYPE_LABEL: Record<MRRelationType, string> = {
  invariant: "Type 1 · Invariant  O′ ≈ O",
  predictable: "Type 2 · Predictable  O′ = T(O)",
  addition: "Type 3 · Addition  O′ = O + Δ",
  removal: "Type 4 · Removal  O′ = O − Δ",
  relational: "Type 5 · Relational  R(O, O′) = true",
};

export const mrById = (id: string): MetamorphicRelation =>
  [...BASE_MRS, ...GENERATED_MRS].find((m) => m.id === id) ?? BASE_MRS[0];
