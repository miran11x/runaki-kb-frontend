import { useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function MFASetup() {
  const [qrCode, setQrCode] = useState('');
  const [token, setToken] = useState('');

  const setupMFA = async () => {
    try {
      const res = await api.post('/auth/mfa/setup');
      setQrCode(res.data.qrCode);
      toast.success('QR Code generated');
    } catch (err) {
      toast.error('Failed to generate QR');
    }
  };

  const verifyMFA = async () => {
    try {
      await api.post('/auth/mfa/verify', {
        token
      });

      toast.success('MFA Enabled');
    } catch (err) {
      toast.error(
        err.response?.data?.error || 'Verification failed'
      );
    }
  };

  return (
    <div style={{ padding: 30 }}>
      <h1>MFA Setup</h1>

      <button onClick={setupMFA}>
        Generate QR Code
      </button>

      {qrCode && (
        <>
          <div style={{ marginTop: 20 }}>
            {qrCode}
          </div>

          <div style={{ marginTop: 20 }}>
            <input
              type="text"
              placeholder="Enter 6 digit code"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />

            <button
              onClick={verifyMFA}
              style={{ marginLeft: 10 }}
            >
              Verify
            </button>
          </div>
        </>
      )}
    </div>
  );
}