import RequireRole from '../components/RequireRole';
import axios from 'axios';
import React from 'react';

export default function Fhir() {
  const [userId, setUserId] = React.useState('u1');
  const [bundle, setBundle] = React.useState<string>('');
  const exportBundle = async () => {
    const res = await axios.post('/api/fhir/export', { userId });
    setBundle(JSON.stringify(res.data, null, 2));
  };
  const getConfig = async () => {
    const res = await axios.get('/api/fhir/config');
    setBundle(JSON.stringify(res.data, null, 2));
  };
  return (
    <RequireRole roles={["Admin"]}>
      <div className="panel">
        <h2>FHIR Bridge</h2>
        <div>
          <label htmlFor="fhir-user">UserId</label>
          <input id="fhir-user" value={userId} onChange={(e) => setUserId(e.target.value)} />
        </div>
        <button onClick={exportBundle}>Export</button>
        <button onClick={getConfig}>Config</button>
        <pre>{bundle}</pre>
      </div>
    </RequireRole>
  );
}


