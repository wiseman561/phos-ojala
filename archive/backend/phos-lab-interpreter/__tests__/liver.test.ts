import { liverHeuristic } from '../src/labs/algorithms/liver';

test('cholestatic pattern', () => {
  expect(liverHeuristic(180, 80, undefined, undefined)).toBe('cholestatic_pattern_suspected');
});


