import { NavLink, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth/AuthProvider';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Labs from './pages/Labs';
import Nutrition from './pages/Nutrition';
import Recs from './pages/Recs';
import Settings from './pages/Settings';
import Unauthorized from './pages/Unauthorized';
import ProtectedRoute from './components/ProtectedRoute';
import AuditLogsPage from './pages/AuditLogsPage';
import Dev from './pages/Dev';
import Billing from './pages/Billing';
import Fhir from './pages/Fhir';

export default function App() {
  const { roles } = useAuth();
  const isAdmin = roles.includes('Admin') || roles.includes('admin');
  return (
    <div>
      <nav className="nav">
        <NavLink to="/login">Login</NavLink>
        <NavLink to="/dashboard">Dashboard</NavLink>
        <NavLink to="/labs">Labs</NavLink>
        <NavLink to="/nutrition">Nutrition</NavLink>
        <NavLink to="/recs">Recs</NavLink>
        <NavLink to="/settings">Settings</NavLink>
        {isAdmin && <NavLink to="/audit-logs">Audit Logs</NavLink>}
        {isAdmin && <NavLink to="/billing">Billing</NavLink>}
        {isAdmin && <NavLink to="/fhir">FHIR</NavLink>}
        <NavLink to="/dev">Dev</NavLink>
      </nav>
      <div className="container">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/labs" element={<ProtectedRoute roles={["Provider","Admin"]}><Labs /></ProtectedRoute>} />
          <Route path="/nutrition" element={<ProtectedRoute roles={["Provider","Admin"]}><Nutrition /></ProtectedRoute>} />
          <Route path="/recs" element={<Recs />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/audit-logs" element={<ProtectedRoute roles={["Admin"]}><AuditLogsPage /></ProtectedRoute>} />
          <Route path="/dev" element={<Dev />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/fhir" element={<Fhir />} />
          <Route path="*" element={<Dashboard />} />
        </Routes>
      </div>
    </div>
  );
}
