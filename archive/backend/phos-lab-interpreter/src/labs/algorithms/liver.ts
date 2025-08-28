export type LiverOutcome = 'cholestatic_pattern_suspected' | 'hepatocellular_pattern_suspected' | 'indeterminate';

export function liverHeuristic(alp: number | undefined, ggt: number | undefined, ast: number | undefined, alt: number | undefined): LiverOutcome {
  if (alp !== undefined && alp > 147) {
    if (ggt !== undefined && ggt > 60) return 'cholestatic_pattern_suspected';
  }
  if (ast !== undefined && alt !== undefined && (ast > 40 || alt > 44)) {
    return 'hepatocellular_pattern_suspected';
  }
  return 'indeterminate';
}


