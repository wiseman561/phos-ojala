import { computeEgfr } from '../src/labs/algorithms/egfr';

test('egfr staging', () => {
  const { egfr, stage } = computeEgfr(1.2, 60, 'male');
  expect(egfr).toBeGreaterThan(40);
  expect(stage === 'G2' || stage === 'G3a' || stage === 'G1').toBeTruthy();
});


