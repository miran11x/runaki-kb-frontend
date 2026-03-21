import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import AgentView from './pages/AgentView';
import AdminPanel from './pages/AdminPanel';
import EditorPanel from './pages/EditorPanel';
import Profile from './pages/profile';

export default function App() {
  const isMobile = window.innerWidth < 768;

  if (isMobile) {
    return (
      <div style={{ minHeight:'100vh', background:'#0B1120', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px', fontFamily:"'Inter','Segoe UI',sans-serif" }}>
        <div style={{ textAlign:'center', maxWidth:'320px' }}>
          <div style={{ fontSize:'64px', marginBottom:'20px' }}>💻</div>
          <div style={{ fontSize:'22px', fontWeight:'900', color:'#fff', marginBottom:'12px', letterSpacing:'-0.02em' }}>Desktop Only</div>
          <div style={{ fontSize:'14px', color:'rgba(255,255,255,0.5)', lineHeight:'1.7', marginBottom:'24px' }}>
            The Runaki Knowledge Base is designed for desktop use. Please open this on your computer or laptop.
          </div>
          <div style={{ background:'rgba(255,107,53,0.1)', border:'1px solid rgba(255,107,53,0.3)', borderRadius:'14px', padding:'14px 18px', display:'flex', alignItems:'center', gap:'10px' }}>
            <span style={{ fontSize:'20px' }}>🖥️</span>
            <span style={{ fontSize:'13px', color:'#FF6B35', fontWeight:'700' }}>Please use a desktop or laptop</span>
          </div>
        </div>
      </div>
    );
  }

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
          <Route path="/profile" element={
            <PrivateRoute><Profile /></PrivateRoute>
          } />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}