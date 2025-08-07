import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import RNDashboard from './RNDashboard';
import Login from './Login';
import EmployerDashboard from './EmployerDashboard';
import PatientDashboard from './PatientDashboard';
import MDDashboardPage from './pages/MDDashboardPage'; // 👈 Correct path

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/rn" element={<RNDashboard />} />
        <Route path="/md" element={<PatientDashboard />} />
        <Route path="/employer" element={<EmployerDashboard />} />
        <Route path="/md/dashboard" element={<MDDashboardPage />} />
      </Routes>
    </Router>
  );
};

export default App;

