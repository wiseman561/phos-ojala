import { NavLink, Route, Routes } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Labs from './pages/Labs';
import Nutrition from './pages/Nutrition';
import Recs from './pages/Recs';
import Settings from './pages/Settings';

export default function App() {
  return (
    <div>
      <nav className="nav">
        <NavLink to="/login">Login</NavLink>
        <NavLink to="/dashboard">Dashboard</NavLink>
        <NavLink to="/labs">Labs</NavLink>
        <NavLink to="/nutrition">Nutrition</NavLink>
        <NavLink to="/recs">Recs</NavLink>
        <NavLink to="/settings">Settings</NavLink>
      </nav>
      <div className="container">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/labs" element={<Labs />} />
          <Route path="/nutrition" element={<Nutrition />} />
          <Route path="/recs" element={<Recs />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Dashboard />} />
        </Routes>
      </div>
    </div>
  );
}
