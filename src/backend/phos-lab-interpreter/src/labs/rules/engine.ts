import jsonLogic from 'json-logic-js';

export type Flag = { loinc: string; severity: 'low' | 'moderate' | 'high'; reason: string };
export type Recommendation = { code: string; text: string; rationale?: string };
export type Rule = { id: string; if: any; and?: any; flag: Flag; recommend?: Recommendation[] };

export interface RuleBundle {
  rules: Rule[];
  loincMap: Record<string, string>;
}

export class RulesEngine {
  constructor(private bundle: RuleBundle) {}
  evaluate(namedValues: Record<string, number>): { flags: Flag[]; recommendations: Recommendation[] } {
    const flags: Flag[] = [];
    const recommendations: Recommendation[] = [];
    for (const r of this.bundle.rules) {
      const cond = jsonLogic.apply(r.if, namedValues) && (r.and ? jsonLogic.apply(r.and, namedValues) : true);
      if (cond) {
        flags.push(r.flag);
        if (r.recommend) recommendations.push(...r.recommend);
      }
    }
    return { flags, recommendations };
  }
  mapFromLoinc(items: { loinc: string; value: number }[]): Record<string, number> {
    const out: Record<string, number> = {};
    for (const it of items) {
      const name = this.bundle.loincMap[it.loinc];
      if (name) out[name] = it.value;
    }
    return out;
  }
}


