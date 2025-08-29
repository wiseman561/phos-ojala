export type MineralsOutcome = 'hyperparathyroidism_pattern_suspected' | 'hypoparathyroidism_pattern_suspected' | 'indeterminate';

export function mineralsHeuristic(ca: number | undefined, phos: number | undefined, mg: number | undefined): MineralsOutcome {
  if (ca !== undefined && phos !== undefined) {
    if (ca > 10.2 && phos < 2.5) return 'hyperparathyroidism_pattern_suspected';
    if (ca < 8.6 && phos > 4.5) return 'hypoparathyroidism_pattern_suspected';
  }
  return 'indeterminate';
}


