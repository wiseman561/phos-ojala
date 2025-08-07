// src/App.js
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';

// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Pages
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import PatientDetail from './pages/PatientDetail';
import Appointments from './pages/Appointments';
import MedicalRecords from './pages/MedicalRecords';
import HealthcarePlans from './pages/HealthcarePlans';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';
import Profile from './pages/Profile';
import AIInsights from './pages/AIInsights';

// Protected route component
import { ProtectedRoute } from './components/ProtectedRoute';

export default function App() {
  return (
    <Routes>
      {/* Public (authentication) routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* Protected routes */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/patients" element={<Patients />} />
        <Route path="/patients/:id" element={<PatientDetail />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/medical-records" element={<MedicalRecords />} />
        <Route path="/healthcare-plans" element={<HealthcarePlans />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/ai-insights" element={<AIInsights />} />
      </Route>

      {/* Public 404 route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
