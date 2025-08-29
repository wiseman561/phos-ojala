// Lightweight smoke: validate algorithms wire into response shape
import rules from '../src/labs/rules/rules.default.json';
import { RulesEngine, RuleBundle } from '../src/labs/rules/engine';

test('rules engine composite variables exist', () => {
  const engine = new RulesEngine(rules as unknown as RuleBundle);
  const named = { 'HbA1c': 6.6, 'FPG': 130, 'Creatinine': 1.2, 'eGFR': 50, 'TSH': 6.0, 'Free T4': 0.6, 'ALP': 180, 'GGT': 80 } as any;
  const out = engine.evaluate(named);
  expect(out.flags.length).toBeGreaterThan(0);
});


