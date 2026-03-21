import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Global styles
const style = document.createElement('style');
style.textContent = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', 'Segoe UI', sans-serif; -webkit-font-smoothing: antialiased; background: #f8fafc; }
  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 10px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.25); }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  input::placeholder { color: #94a3b8; }
  input:focus, select:focus, textarea:focus { border-color: #FF6B35 !important; box-shadow: 0 0 0 3px rgba(255,107,53,0.12) !important; }
`;
document.head.appendChild(style);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<React.StrictMode><App /></React.StrictMode>);