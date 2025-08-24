export type ThyroidOutcome = 'overt_hypothyroid' | 'subclinical_hypothyroid' | 'indeterminate';

export function thyroidHeuristic(tsh: number | undefined, ft4: number | undefined): ThyroidOutcome {
  if (tsh === undefined || ft4 === undefined) return 'indeterminate';
  if (tsh > 4.0 && ft4 < 0.8) return 'overt_hypothyroid';
  if (tsh > 4.0 && ft4 >= 0.8 && ft4 <= 1.8) return 'subclinical_hypothyroid';
  return 'indeterminate';
}


