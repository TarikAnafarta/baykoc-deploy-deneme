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

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
      showError('Lütfen e-posta adresinizi girin.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(apiUrl('/api/users/forgot-password/'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCsrfToken() },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'İşlem başarısız. Lütfen tekrar deneyin.');

      showSuccess(
        'Eğer bu e-posta sistemimizde kayıtlıysa, şifre sıfırlama talimatları gönderildi.',
      );
    } catch (err) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={authShell}>
      <div className={authFormCard}>
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-extrabold text-slate-900">Şifrenizi mi unuttunuz?</h1>
          <p className="mt-2 text-sm text-slate-600">
            Hesabınıza ait e-posta adresini girin, size şifre sıfırlama talimatlarını gönderelim.
          </p>
        </div>

        {error && <div className={alertErrorClass}>{error}</div>}
        {success && <div className={alertSuccessClass}>{success}</div>}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="forgot-email" className="block text-sm font-medium text-slate-700">
              E-posta Adresi
            </label>
            <input
              id="forgot-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={formInputClass}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex justify-center items-center rounded-md btn-primary text-white px-4 py-2 font-semibold shadow hover:opacity-95 transition"
          >
            {loading ? 'Gönderiliyor...' : 'Şifre Sıfırlama Maili Gönder'}
          </button>
        </form>

        <div className="mt-4 flex justify-between">
          <button
            onClick={() => navigate('/login')}
            className="text-sm text-indigo-600 hover:underline"
          >
            Giriş sayfasına dön
          </button>
        </div>
      </div>
    </div>
  );
}
