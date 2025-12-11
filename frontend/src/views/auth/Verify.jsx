import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  alertErrorClass,
  alertSuccessClass,
  authFormCard,
  authShell,
  formInputClass,
} from '../../ui/classNames';
import { apiUrl, getCsrfToken } from '../../utils/api';

export default function VerifyPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const params = new URLSearchParams(window.location.search);
  const email = params.get('email') || '';

  function showError(msg) {
    setError(msg);
    setSuccess('');
  }

  function showSuccess(msg) {
    setSuccess(msg);
    setError('');
  }

  async function submit(e) {
    e.preventDefault();
    if (!email) {
      showError('E-posta bulunamadı. Lütfen tekrar kayıt olmayı deneyin.');
      return;
    }
    if (code.replace(/\D/g, '').length !== 6) {
      showError('Lütfen 6 haneli doğrulama kodunu girin.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(apiUrl('/api/users/verify/'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCsrfToken() },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Doğrulama başarısız. Lütfen tekrar deneyin.');
      showSuccess('Hesap başarıyla doğrulandı! Yönlendiriliyorsunuz...');
      setTimeout(() => navigate(`/login?verified=true&email=${encodeURIComponent(email)}`), 1400);
    } catch (err) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    if (!email) {
      showError('E-posta bulunamadı. Lütfen tekrar kayıt olmayı deneyin.');
      return;
    }
    try {
      const res = await fetch(apiUrl('/api/users/resend-verification/'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCsrfToken() },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || 'Kod tekrar gönderilemedi. Lütfen tekrar deneyin.');
      showSuccess('Doğrulama kodu başarıyla gönderildi!');
    } catch (err) {
      showError(err.message);
    }
  }

  return (
    <div className={authShell}>
      <div className={authFormCard}>
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-extrabold text-slate-900">Hesabınızı Doğrulayın</h1>
          <p className="mt-2 text-sm text-slate-600">
            E-postanıza gönderilen doğrulama kodunu girin
          </p>
        </div>

        {error && <div className={alertErrorClass}>{error}</div>}
        {success && <div className={alertSuccessClass}>{success}</div>}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="verify-code" className="block text-sm font-medium text-slate-700">
              Doğrulama Kodu
            </label>
            <input
              id="verify-code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              maxLength={6}
              placeholder="000000"
              required
              className={formInputClass}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex justify-center items-center rounded-md btn-primary text-white px-4 py-2 font-semibold shadow hover:opacity-95 transition"
          >
            {loading ? 'Doğrulanıyor...' : 'Hesabı Doğrula'}
          </button>
        </form>

        <div className="mt-4 flex justify-between">
          <button onClick={resend} className="text-sm text-indigo-600 hover:underline">
            Kodu Tekrar Gönder
          </button>
          <button
            onClick={() => navigate('/login')}
            className="text-sm text-indigo-600 hover:underline"
          >
            Giriş Sayfasına Dön
          </button>
        </div>
      </div>
    </div>
  );
}
