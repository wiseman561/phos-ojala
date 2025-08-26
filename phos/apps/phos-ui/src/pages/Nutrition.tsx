import { useState } from 'react';
import { postNutritionAnalyze } from '../lib/api';
import { NutritionAnalyzeRequest, NutritionAnalyzeResponse, MealItem } from '../lib/types';

type Item = { name: string; grams: number };

export default function Nutrition() {
  const [items, setItems] = useState<Item[]>([{ name: 'chicken', grams: 150 }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<NutritionAnalyzeResponse | null>(null);

  function updateItem(idx: number, patch: Partial<Item>) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }

  function addItem() {
    setItems((prev) => [...prev, { name: '', grams: 100 }]);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    try {
      setLoading(true);
      const mealItems: MealItem[] = items.map((i) => ({ name: i.name, grams: i.grams }));
      const payload: NutritionAnalyzeRequest = { meals: [{ items: mealItems }] };
      const data = await postNutritionAnalyze(payload);
      setResult(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="panel">
      <h2>Nutrition Analyzer</h2>
      <form onSubmit={submit}>
        {items.map((it, idx) => (
          <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input className="input" placeholder="item name" value={it.name} onChange={(e) => updateItem(idx, { name: e.target.value })} />
            <input className="input" type="number" placeholder="grams" value={it.grams} onChange={(e) => updateItem(idx, { grams: Number(e.target.value) })} />
          </div>
        ))}
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="button" onClick={addItem}>Add item</button>
          <button type="submit" className="button" disabled={loading}>{loading ? 'Analyzing...' : 'Analyze'}</button>
        </div>
      </form>
      {error && <p style={{ color: '#ff6b6b' }}>Error: {error}</p>}
      {result && (
        <div style={{ marginTop: 16 }}>
          <h3>Totals</h3>
          <div className="panel">
            <p>Calories: {result.kcal}</p>
            <p>Protein: {result.protein_g} g</p>
            <p>Fat: {result.fat_g} g</p>
            <p>Carbs: {result.carbs_g} g</p>
          </div>
        </div>
      )}
    </div>
  );
}
