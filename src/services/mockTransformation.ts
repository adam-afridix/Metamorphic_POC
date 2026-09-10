import type { TransformStyle } from "../data/testCases";

// The transformation engine. Generative styles are produced by an image-editing model
// (InstructPix2Pix); the rest by deterministic OpenCV code.

export interface TransformSpec {
  style: TransformStyle;
  /** parameter shown in the UI as "what the agent asked for" */
  param: string;
  kind: "photometric" | "geometric" | "generative" | "domain";
}

const SPECS: Record<TransformStyle, TransformSpec> = {
  brightness: { style: "brightness", param: "delta = +0.35", kind: "photometric" },
  contrast: { style: "contrast", param: "factor = 0.75", kind: "photometric" },
  blur: { style: "blur", param: "sigma = 2.0", kind: "photometric" },
  bgr: { style: "bgr", param: "channels = B,G,R", kind: "photometric" },
  motionblur: { style: "motionblur", param: "kernel = 17px · angle = 0°", kind: "photometric" },
  rotate: { style: "rotate", param: "angle = 9°", kind: "geometric" },
  haze: { style: "haze", param: "density = 0.45", kind: "generative" },
  fog: { style: "fog", param: "density = 0.7", kind: "generative" },
  rain: { style: "rain", param: "intensity = 0.6", kind: "generative" },
  night: { style: "night", param: "illumination = 0.15", kind: "generative" },
  dusk: { style: "dusk", param: "warmth = 0.6 · exposure = -0.3", kind: "generative" },
  glare: { style: "glare", param: "intensity = 0.9 · radius = 0.4", kind: "generative" },
  occlusion: { style: "occlusion", param: "coverage = 0.4", kind: "domain" },
  insert: { style: "insert", param: "class = car · pos = mid-right", kind: "domain" },
};

export const transformSpec = (style: TransformStyle): TransformSpec => SPECS[style];
