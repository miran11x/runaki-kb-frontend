import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import AgentView from './pages/AgentView';
import AdminPanel from './pages/AdminPanel';
import EditorPanel from './pages/EditorPanel';

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
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <PrivateRoute><AgentView /></PrivateRoute>
          } />
          <Route path="/editor" element={
            <PrivateRoute roles={['qa_officer','team_lead']}>
              <EditorPanel />
            </PrivateRoute>
          } />
          <Route path="/admin" element={
            <PrivateRoute roles={['team_lead']}>
              <AdminPanel />
            </PrivateRoute>
          } />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}