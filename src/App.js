import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import AgentView from './pages/AgentView';
import AdminPanel from './pages/AdminPanel';
import EditorPanel from './pages/EditorPanel';
import Profile from './pages/profile';
import MFA from './pages/MFA';
import MaintenanceScreen from './components/MaintenanceScreen';
import MFASetup from './pages/MFASetup';



const API = process.env.REACT_APP_API_URL || 'https://runaki-kb-api.vercel.app';

// Wraps the app — shows maintenance screen for agents if active
function MaintenanceGate({ children }) {
  const { user } = useAuth();
  const [maintenance, setMaintenance] = useState({ active: false, message: '' });

  useEffect(() => {
    // Timeout after 3s so a slow API never blocks the whole app
    const timer = setTimeout(() => setMaintenance({ active: false, message: '' }), 3000);
    fetch(`${API}/api/maintenance`)
      .then(r => r.json())
      .then(d => { clearTimeout(timer); setMaintenance(d || { active: false, message: '' }); })
      .catch(() => { clearTimeout(timer); setMaintenance({ active: false, message: '' }); });
    return () => clearTimeout(timer);
  }, []);

  // Never block login page or non-agents
  const isLoginPage = window.location.pathname === '/login';
  const isAgent = !user || user.role === 'agent';
  if (maintenance.active && isAgent && !isLoginPage) {
    return <MaintenanceScreen message={maintenance.message} />;
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              fontFamily: "'Inter','Segoe UI',sans-serif",
              fontSize: '13.5px',
              fontWeight: '600',
              borderRadius: '12px',
              padding: '12px 16px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
        <MaintenanceGate>
       <Routes>
  <Route path="/login" element={<Login />} />
  <Route path="/mfa" element={<MFA />} />

  <Route
    path="/mfa-setup"
    element={
      <PrivateRoute>
        <MFASetup />
      </PrivateRoute>
    }
  />

  <Route
    path="/"
    element={
      <PrivateRoute>
        <AgentView />
      </PrivateRoute>
    }
  />
          <Route
  path="/editor"
  element={
    <PrivateRoute roles={['editor','admin']}>
      <EditorPanel />
    </PrivateRoute>
  }
/>
        <Route
  path="/admin"
  element={
    <PrivateRoute roles={['admin']}>
      <AdminPanel />
    </PrivateRoute>
  }
/>
          <Route path="/profile" element={
            <PrivateRoute><Profile /></PrivateRoute>
          } />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        </MaintenanceGate>
      </BrowserRouter>
    </AuthProvider>
  );
}