import raw from "./generated/dataset.json";
import { mrById, type MetamorphicRelation } from "./metamorphicRelations";

export type TransformStyle =
  | "brightness"
  | "contrast"
  | "blur"
  | "bgr"
  | "rotate"
  | "haze"
  | "fog"
  | "rain"
  | "night"
  | "dusk"
  | "glare"
  | "motionblur"
  | "occlusion"
  | "insert";

export type BBox = [number, number, number, number];

export interface Prediction {
  cls: string;
  conf: number;
  bbox: BBox;
}

export type TestResult = "PASS" | "VIOLATION";

export interface FailureAnalysis {
  category: string;
  affectedClass: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  observed: string;
  likelyCause: string;
}

export interface TestCase {
  id: string;
  src: number;
  image: string;
  transformedImage: string;
  width: number;
  height: number;
  title: string;
  caption: string;
  transformedCaption: string;
  sceneSummary: string;
  mrId: string;
  transformName: string;
  transformStyle: TransformStyle;
  selectionReason: string;
  clipThreshold: number;
  clipInitial: number | null;
  regenerated: boolean;
  clipScore: number;
  semanticPreserved: boolean;
  originalPreds: Prediction[];
  transformedPreds: Prediction[];
  transformedBoxes: BBox[] | null;
  occluder: BBox | null;
  insertBox: BBox | null;
  expectedSummary: string;
  actualSummary: string;
  result: TestResult;
  failure: FailureAnalysis | null;
}

export interface ResolvedCase extends TestCase {
  mr: MetamorphicRelation;
}

interface Dataset {
  source: string;
  license: string;
  domain: string;
  cases: TestCase[];
}

const data = raw as unknown as Dataset;

export const DATASET_META = {
  source: data.source,
  license: data.license,
  domain: data.domain,
};

export const RESOLVED_CASES: ResolvedCase[] = data.cases.map((tc) => ({
  ...tc,
  mr: mrById(tc.mrId),
}));

export const caseById = (id: string): ResolvedCase =>
  RESOLVED_CASES.find((c) => c.id === id) ?? RESOLVED_CASES[0];

export const assetUrl = (p: string): string => `${import.meta.env.BASE_URL}${p}`;

export const CLASS_COLORS: Record<string, string> = {
  car: "#5b9dff",
  truck: "#a78bfa",
  pedestrian: "#34d399",
  cyclist: "#fbbf24",
};
