import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function MFA() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
   if (!state?.challengeToken){
      navigate('/login');
    }
  }, [state, navigate]);

  if (!state?.challengeToken) {
    return null;
  }

  const verify = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

const res = await api.post('/auth/mfa/login', {
  challengeToken,
  code
});

localStorage.setItem('rk_token', res.data.token);

window.location.href = '/';

      localStorage.setItem('rk_token', res.data.token);
      localStorage.setItem(
        'rk_user',
        JSON.stringify(res.data.user)
      );

      toast.success('Login successful');
      navigate('/');
    } catch (err) {
      toast.error(
        err.response?.data?.error || 'Invalid code'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      <form onSubmit={verify}>
        <h2>Authenticator Verification</h2>

        <input
          type="text"
          maxLength="6"
          placeholder="Enter 6-digit code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />

        <button type="submit" disabled={loading}>
          {loading ? 'Verifying...' : 'Verify'}
        </button>
      </form>
    </div>
  );
}