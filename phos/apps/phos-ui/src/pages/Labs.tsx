import { useState } from 'react';
import { postLabInterpret } from '../lib/api';

export default function Labs() {
  const [input, setInput] = useState('{\n  "biomarker": "LDL",\n  "value": 120\n}');
  const [result, setResult] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      setLoading(true);
      const payload = JSON.parse(input);
      const data = await postLabInterpret(payload);
      setResult(data);
    } catch (err: any) {
      setError(err?.message ?? 'Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="panel">
      <h2>Labs Interpreter</h2>
      <form onSubmit={submit}>
        <label>JSON Payload</label>
        <textarea value={input} onChange={(e) => setInput(e.target.value)} className="input" />
        <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
          <button type="submit" className="button" disabled={loading}>{loading ? 'Submitting...' : 'Submit'}</button>
        </div>
      </form>
      {error && <p style={{ color: '#ff6b6b' }}>Error: {error}</p>}
      {result && (
        <div style={{ marginTop: 16 }}>
          <h3>Response</h3>
          <pre className="panel">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
