import { useEffect, useState } from 'react';
import { getRecommendations } from '../lib/api';
import { Recommendation, RecommendationResponse } from '../lib/types';

export default function Recs() {
  const [userId, setUserId] = useState('u123');
  const [recs, setRecs] = useState<RecommendationResponse>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    setLoading(true);
    try {
      const data = await getRecommendations(userId);
      setRecs(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="panel">
      <h2>Recommendations</h2>
      <div className="row gap mb">
        <input className="input" value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="user id" />
        <button className="button" onClick={load} disabled={loading}>{loading ? 'Loading...' : 'Reload'}</button>
      </div>
      {error && <p style={{ color: '#ff6b6b' }}>Error: {error}</p>}
      <div className="panel">
        {recs.length === 0 ? (
          <p>No recommendations found.</p>
        ) : (
          <ul>
            {recs.map((r: Recommendation) => (
              <li key={r.id}><strong>{r.category}:</strong> {r.title}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
