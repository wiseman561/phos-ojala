import { thyroidHeuristic } from '../src/labs/algorithms/thyroid';

test('overt hypothyroid', () => {
  expect(thyroidHeuristic(6.0, 0.6)).toBe('overt_hypothyroid');
});


