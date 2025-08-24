export type AnemiaOutcome = 'iron_deficiency_likely' | 'anemia_of_chronic_disease_likely' | 'indeterminate';

export function anemiaHeuristic(hgb: number | undefined, mcv: number | undefined, rdw: number | undefined, ferritin: number | undefined): AnemiaOutcome {
  if (hgb === undefined) return 'indeterminate';
  if (mcv !== undefined && mcv < 80) {
    if (ferritin !== undefined && ferritin < 15) return 'iron_deficiency_likely';
    if (rdw !== undefined && rdw > 14.5) return 'iron_deficiency_likely';
    return 'indeterminate';
  }
  if (mcv !== undefined && mcv >= 80 && mcv <= 100) {
    if (ferritin !== undefined && ferritin < 15) return 'iron_deficiency_likely';
    return 'indeterminate';
  }
  return 'indeterminate';
}


