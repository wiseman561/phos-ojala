// CKD-EPI 2021 race-free (approximation). For production, validate coefficients.
export function computeEgfr(creatinineMgDl: number, ageYears: number, sex: 'male' | 'female') {
  const k = sex === 'female' ? 0.7 : 0.9;
  const a = sex === 'female' ? -0.241 : -0.302;
  const min = Math.min(creatinineMgDl / k, 1);
  const max = Math.max(creatinineMgDl / k, 1);
  const egfr = 142 * Math.pow(min, a) * Math.pow(max, -1.200) * Math.pow(0.9938, ageYears) * (sex === 'female' ? 1.012 : 1);
  const stage = egfr >= 90 ? 'G1' : egfr >= 60 ? 'G2' : egfr >= 45 ? 'G3a' : egfr >= 30 ? 'G3b' : egfr >= 15 ? 'G4' : 'G5';
  return { egfr, stage } as { egfr: number; stage: 'G1'|'G2'|'G3a'|'G3b'|'G4'|'G5' };
}


