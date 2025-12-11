import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiUrl } from '../../utils/api';
import { sanitizeNextPath } from '../../utils/navigation';

export default function GoogleCallback() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setAuthData, clearAuth } = useAuth();
  const [status, setStatus] = useState('Google hesabınız doğrulanıyor…');
  const [error, setError] = useState('');

  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);

  useEffect(() => {
    const googleError = params.get('error');
    if (googleError) {
      setError(googleError);
      setStatus('');
      return;
    }

    const token = params.get('token');
    if (!token) {
      setError('Google girişinden token alınamadı.');
      setStatus('');
      return;
    }

    const nextPath = sanitizeNextPath(params.get('next'));
    const profileCompletedFlag = params.get('profile_completed') === 'true';

    async function finalizeLogin() {
      try {
        const response = await fetch(apiUrl('/api/users/me/'), {
          headers: {
            Authorization: `Token ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) {
          throw new Error('Kullanıcı bilgisi alınamadı.');
        }
        const me = await response.json();
        setAuthData(token, me);
        if (!profileCompletedFlag && !me.profile_completed) {
          navigate('/complete-profile', { replace: true });
          return;
        }
        navigate(nextPath, { replace: true });
      } catch (err) {
        clearAuth();
        setError(err.message);
        setStatus('');
      }
    }

    finalizeLogin();
  }, [params, navigate, setAuthData, clearAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow p-8 text-center space-y-4">
        <h1 className="text-2xl font-semibold text-slate-900">Google ile Giriş</h1>
        {status && (
          <p className="text-slate-600" data-testid="google-status">
            {status}
          </p>
        )}
        {error && (
          <div className="p-4 rounded-md bg-red-50 text-red-700 text-sm" data-testid="google-error">
            <p>{error}</p>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="mt-3 inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-white"
            >
              Giriş Sayfasına Dön
            </button>
          </div>
        )}
        {!error && !status && (
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-white"
          >
            Dashboarda Git
          </button>
        )}
      </div>
    </div>
  );
}
