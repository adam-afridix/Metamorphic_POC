import { BASE_MRS, GENERATED_MRS } from "../data/metamorphicRelations";
import { RESOLVED_CASES } from "../data/testCases";

const rejected = GENERATED_MRS.filter((m) => m.rejected);

/** Single source of truth for the candidate → validated → selected → executed funnel. */
export const RELATION_STATS = {
  base: BASE_MRS.length,
  proposed: GENERATED_MRS.length,
  candidate: BASE_MRS.length + GENERATED_MRS.length,
  rejected: rejected.length,
  validated: BASE_MRS.length + GENERATED_MRS.length - rejected.length,
  /** distinct relations chosen for a test execution in this run */
  selected: new Set(RESOLVED_CASES.map((c) => c.mrId)).size,
  executed: RESOLVED_CASES.length,
};

export const REJECTED_RELATIONS = rejected;
