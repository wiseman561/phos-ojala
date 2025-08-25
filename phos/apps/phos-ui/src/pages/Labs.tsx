import { useState } from 'react';
import { postLabInterpret } from '../lib/api';

export default function Labs() {
  const [input, setInput] = useState('{\n  "biomarker": "LDL",\n  "value": 120\n}');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      setLoading(true);
      const payload = JSON.parse(input);
      const data = await postLabInterpret(payload);
      setResult(data);
      setToast({ type: 'success', msg: 'Interpretation complete' });
    } catch (err: any) {
      setError(err?.message ?? 'Failed');
      setToast({ type: 'error', msg: err?.message ?? 'Request failed' });
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
          <h3>Results</h3>
          {Array.isArray(result.results) ? (
            <div className="panel">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>Code</th>
                    <th style={{ textAlign: 'left' }}>Value</th>
                    <th style={{ textAlign: 'left' }}>Unit</th>
                    <th style={{ textAlign: 'left' }}>Severity</th>
                    <th style={{ textAlign: 'left' }}>Summary</th>
                  </tr>
                </thead>
                <tbody>
                  {result.results.map((r: any, idx: number) => (
                    <tr key={idx}>
                      <td>{r.code}</td>
                      <td>{r.value}</td>
                      <td>{r.unit}</td>
                      <td>{r.severity}</td>
                      <td>{r.summary}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <pre className="panel">{JSON.stringify(result, null, 2)}</pre>
          )}
        </div>
      )}
      {toast && (
        <div className={`toast ${toast.type}`} onAnimationEnd={() => setToast(null)}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
