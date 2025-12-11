import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  apiUrl,
  getCsrfToken,
  parseJsonResponse,
  extractErrorMessage,
} from '../../utils/api';
import { sanitizeNextPath } from '../../utils/navigation';
import googleIcon from '../../assets/icons/google.svg';
import {
  alertErrorClass,
  alertSuccessClass,
  authFormCard,
  authShell,
  formInputClass,
} from '../../ui/classNames';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuthData, clearAuth } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showVerifyPrompt, setShowVerifyPrompt] = useState(false);

  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const nextPath = useMemo(() => sanitizeNextPath(params.get('next')), [params]);

  useEffect(() => {
    // If redirected from verify success
    if (params.get('verified') === 'true') {
      const e = params.get('email') || '';
      if (e) setEmail(e);
      setSuccess('Hesabınız doğrulandı. Lütfen giriş yapın.');
    }
  }, [params]);

  function clearMessages() {
    setError('');
    setSuccess('');
    setShowVerifyPrompt(false);
  }

  async function submit(e) {
    e.preventDefault();
    clearMessages();
    setLoading(true);
    try {
      const res = await fetch(apiUrl('/api/users/login/'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCsrfToken() },
        body: JSON.stringify({ email, password }),
      });
      const data = await parseJsonResponse(res);
      if (!res.ok) {
        const message = extractErrorMessage(data, 'Giriş başarısız');
        if (res.status === 403 && message === 'Account is inactive.') {
          setShowVerifyPrompt(true);
        } else {
          throw new Error(message);
        }
        return;
      }
      const nextToken = data && typeof data === 'object' ? data.token : null;
      if (!nextToken) {
        throw new Error('Sunucudan geçerli bir oturum anahtarı alınamadı.');
      }
      let profile = null;

      try {
        const meRes = await fetch(apiUrl('/api/users/me/'), {
          headers: { Authorization: `Token ${nextToken}`, 'Content-Type': 'application/json' },
        });
        if (meRes.status === 401 || meRes.status === 403) {
          clearAuth();
          navigate('/login');
          return;
        }
        if (meRes.ok) {
          const mePayload = await parseJsonResponse(meRes);
          if (mePayload && typeof mePayload === 'object') {
            profile = mePayload;
          }
        }
      } catch (_) {
        /* ignore; AuthContext will retry if needed */
      }

      if (profile) {
        setAuthData(nextToken, profile);
        if (!profile.profile_completed) {
          navigate('/complete-profile');
          return;
        }
      } else {
        setAuthData(nextToken);
      }

      navigate(nextPath);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function startGoogleLogin() {
    clearMessages();
    setLoading(true);
    try {
      const endpoint = new URL(apiUrl('/api/users/auth/google/login/'));
      if (nextPath && nextPath !== '/dashboard') {
        endpoint.searchParams.set('next', nextPath);
      }
      const res = await fetch(endpoint.toString());
      const data = await parseJsonResponse(res);
      const authorizationUrl = data && typeof data === 'object' ? data.authorization_url : '';
      if (!res.ok || !authorizationUrl) {
        throw new Error(
          extractErrorMessage(data, 'Google ile giriş başlatılamadı.'),
        );
      }
      window.location.href = authorizationUrl;
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  async function resendVerification() {
    clearMessages();
    const currentEmail = email;
    if (!currentEmail) {
      setError('Lütfen e-postayı girin.');
      return;
    }
    try {
      const res = await fetch(apiUrl('/api/users/resend-verification/'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCsrfToken() },
        body: JSON.stringify({ email: currentEmail }),
      });
      const data = await parseJsonResponse(res);
      if (!res.ok) {
        throw new Error(
          extractErrorMessage(data, 'Doğrulama kodu gönderilemedi.'),
        );
      }
      setSuccess('Doğrulama kodu gönderildi! Doğrulama sayfasına yönlendiriliyorsunuz...');
      setTimeout(() => navigate(`/verify?email=${encodeURIComponent(currentEmail)}`), 1200);
    } catch (err) {
      setError(err.message);
    }
  }

  function goToVerify() {
    const currentEmail = email;
    if (!currentEmail) {
      setError('Lütfen e-postayı girin.');
      return;
    }
    navigate(`/verify?email=${encodeURIComponent(currentEmail)}`);
  }

  return (
    <div className={authShell}>
      <div className={authFormCard}>
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-extrabold text-slate-900">Hoş Geldiniz</h2>
          <p className="mt-2 text-sm text-slate-600">BayKoç hesabınıza giriş yapın</p>
        </div>

        {error && <div className={alertErrorClass}>{error}</div>}
        {success && <div className={alertSuccessClass}>{success}</div>}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="block text-sm font-medium text-slate-700">
              E-posta Adresi
            </label>
            <input
              id="login-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              className={formInputClass}
            />
          </div>

          <div>
            <label htmlFor="login-password" className="block text-sm font-medium text-slate-700">
              Şifre
            </label>
            <input
              id="login-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
              className={formInputClass}
            />
          </div>

          <button
            disabled={loading}
            type="submit"
            className="w-full inline-flex justify-center items-center rounded-md btn-primary text-white px-4 py-2 font-semibold shadow hover:opacity-95 transition"
          >
            {loading ? 'Giriş yapılıyor…' : 'Giriş Yap'}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-sm text-slate-500">
              <span className="bg-white px-2">veya</span>
            </div>
          </div>
          <button
            type="button"
            onClick={startGoogleLogin}
            disabled={loading}
            className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <img src={googleIcon} alt="Google" className="w-4 h-4" />
            <span className="text-base">Google ile Devam Et</span>
          </button>
        </div>

        {showVerifyPrompt && (
          <div className="mt-4 p-4 rounded-md bg-yellow-50 border border-yellow-100 text-sm">
            <p>Hesabınız henüz doğrulanmamış.</p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={resendVerification}
                className="px-3 py-1 rounded bg-indigo-600 text-white text-sm"
              >
                Doğrulama Kodunu Tekrar Gönder
              </button>
              <button
                type="button"
                onClick={goToVerify}
                className="px-3 py-1 rounded bg-indigo-50 text-indigo-700 text-sm"
              >
                Doğrulama Kodunu Gir
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 text-sm text-slate-600">
          <Link to="/register" className="text-indigo-600 hover:underline">
            Hesabınız yok mu? Kayıt olun
          </Link>
          <div className="mt-2">
            <Link to="/forgot-password" className="text-indigo-600 hover:underline">
              Şifrenizi mi unuttunuz?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
