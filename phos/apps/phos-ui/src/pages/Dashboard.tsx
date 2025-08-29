import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const lineData = [
  { day: 'Mon', score: 62 },
  { day: 'Tue', score: 70 },
  { day: 'Wed', score: 66 },
  { day: 'Thu', score: 72 },
  { day: 'Fri', score: 75 },
  { day: 'Sat', score: 80 },
  { day: 'Sun', score: 78 },
];

const barData = [
  { name: 'Protein', val: 68 },
  { name: 'Fiber', val: 45 },
  { name: 'Omega-3', val: 22 },
  { name: 'Vitamin D', val: 55 },
];

export default function Dashboard() {
  return (
    <div className="panel">
      <h2>Dashboard</h2>
      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr' }}>
        <div className="panel">
          <h3>Health Score (Mock)</h3>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#5ac8fa" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="panel">
          <h3>Nutrient Coverage (Mock)</h3>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="val" fill="#a78bfa" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
