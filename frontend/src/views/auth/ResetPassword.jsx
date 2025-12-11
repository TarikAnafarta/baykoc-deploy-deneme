import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { alertErrorClass, alertSuccessClass, authShell, formInputClass } from '../../ui/classNames';
import { apiUrl, getCsrfToken } from '../../utils/api';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('token') || '';
    setToken(t);
  }, []);

  async function submit(e) {
    e.preventDefault();
    if (!token) {
      showError('Geçersiz veya eksik şifre sıfırlama bağlantısı.');
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      showError('Şifre en az 8 karakter olmalıdır.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showError('Şifreler eşleşmiyor.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(apiUrl('/api/users/reset-password/'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCsrfToken() },
        body: JSON.stringify({
          token,
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.message === 'New password must be different from the current password.') {
          throw new Error('Yeni şifreniz mevcut şifrenizden farklı olmalı.');
        }
        throw new Error(data.message || 'Şifre sıfırlanamadı. Lütfen tekrar deneyin.');
      }

      showSuccess('Şifreniz başarıyla sıfırlandı. Giriş sayfasına yönlendiriliyorsunuz...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`${authShell} bg-slate-950`}>
      <div className="max-w-md w-full bg-slate-900/90 backdrop-blur-md rounded-2xl shadow-xl shadow-black/40 p-8">
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center text-sm text-slate-300 hover:text-white"
          >
            ← Geri dön
          </button>
          <div className="text-right">
            <h1 className="text-2xl font-extrabold text-slate-50">Şifreyi Sıfırla</h1>
            <p className="mt-1 text-xs text-slate-400">Yeni şifrenizi belirleyin.</p>
          </div>
        </div>

        {error && <div className={alertErrorClass}>{error}</div>}
        {success && <div className={alertSuccessClass}>{success}</div>}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="new-password" className="block text-sm font-medium text-slate-700">
              Yeni Şifre
            </label>
            <input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className={formInputClass}
            />
          </div>

          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-700">
              Şifreyi Doğrula
            </label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className={formInputClass}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex justify-center items-center rounded-md btn-primary text-white px-4 py-2 font-semibold shadow hover:opacity-95 transition"
          >
            {loading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
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
