import { useState } from 'react';
import { postLabInterpret } from '../lib/api';
import { LabInterpretRequest, LabInterpretResponse } from '../lib/types';

export default function Labs() {
  const [input, setInput] = useState(`{
  "userId": "u123",
  "context": { "sex": "male", "ageYears": 40 },
  "measurements": [
    { "code": "LDL_C", "name": "LDL Cholesterol", "value": 120, "unit": "mg/dL" },
    { "code": "A1C", "value": 5.9, "unit": "%" }
  ]
}`);
  const [result, setResult] = useState<LabInterpretResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      setLoading(true);
      const payload = JSON.parse(input) as LabInterpretRequest;
      const data = await postLabInterpret(payload);
      setResult(data);
      setToast({ type: 'success', msg: 'Interpretation complete' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed';
      setError(msg);
      setToast({ type: 'error', msg: msg ?? 'Request failed' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="panel">
      <h2>Labs Interpreter</h2>
      <form onSubmit={submit}>
        <label htmlFor="labs-json">JSON Payload</label>
        <textarea id="labs-json" placeholder="Paste JSON payload" value={input} onChange={(e) => setInput(e.target.value)} className="input" />
        <div className="row gap">
          <button type="submit" className="button" disabled={loading}>{loading ? 'Submitting...' : 'Submit'}</button>
        </div>
      </form>
      {error && <p style={{ color: '#ff6b6b' }}>Error: {error}</p>}
      {result && (
        <div className="mt">
          <h3>Results</h3>
          {Array.isArray(result.results) ? (
            <div className="panel">
              <table className="table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Value</th>
                    <th>Unit</th>
                    <th>Severity</th>
                    <th>Summary</th>
                  </tr>
                </thead>
                <tbody>
                  {result.results.map((r, idx) => (
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
