import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import ProtectedRoute from '../components/ProtectedRoute';

type AuditLog = { id: number; timestamp: string; source: string; userId: string; action: string };

function AuditLogsTable() {
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(25);
  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page, pageSize],
    queryFn: async () => (await axios.get<AuditLog[]>(`/api/audit-logs?page=${page}&pageSize=${pageSize}`)).data,
  });
  if (isLoading) return <div>Loading...</div>;
  return (
    <div>
      <div>
        <button onClick={() => setPage((p) => Math.max(1, p - 1))}>&lt;</button>
        <span> Page {page} </span>
        <button onClick={() => setPage((p) => p + 1)}>&gt;</button>
        <select aria-label="Page size" value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </div>
      <table>
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Source</th>
            <th>User</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {data?.map((l) => (
            <tr key={l.id}>
              <td>{new Date(l.timestamp).toLocaleString()}</td>
              <td>{l.source}</td>
              <td>{l.userId}</td>
              <td>{l.action}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AuditLogsPage() {
  return (
    <ProtectedRoute roles={["Admin"]}>
      <div className="panel">
        <h2>Audit Logs</h2>
        <AuditLogsTable />
      </div>
    </ProtectedRoute>
  );
}


