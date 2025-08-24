import { anemiaHeuristic } from '../src/labs/algorithms/anemia';

test('iron deficiency pattern', () => {
  expect(anemiaHeuristic(11.0, 72, 16, 10)).toBe('iron_deficiency_likely');
});


