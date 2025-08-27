import RequireRole from '../components/RequireRole';
import axios from 'axios';
import React from 'react';

export default function Billing() {
  const [userId, setUserId] = React.useState('u1');
  const [amount, setAmount] = React.useState(10);
  const [status, setStatus] = React.useState<string>('');
  const submit = async () => {
    const res = await axios.post('/api/billing/charge', { userId, amount, method: 'credit' });
    setStatus(JSON.stringify(res.data));
  };
  return (
    <RequireRole roles={["Admin"]}>
      <div className="panel">
        <h2>Billing</h2>
        <div>
          <label htmlFor="billing-user">UserId</label>
          <input id="billing-user" value={userId} onChange={(e) => setUserId(e.target.value)} />
        </div>
        <div>
          <label htmlFor="billing-amount">Amount</label>
          <input id="billing-amount" type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
        </div>
        <button onClick={submit}>Charge</button>
        <pre>{status}</pre>
      </div>
    </RequireRole>
  );
}


