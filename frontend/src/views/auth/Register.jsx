import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  alertErrorClass,
  alertSuccessClass,
  authFormCard,
  authShell,
  formInputClass,
} from '../../ui/classNames';
import { apiUrl, getCsrfToken } from '../../utils/api';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      if (password !== confirmPassword) throw new Error('Şifreler eşleşmiyor.');
      if (password.length < 8) throw new Error('Şifre en az 8 karakter uzunluğunda olmalıdır.');
      const res = await fetch(apiUrl('/api/users/register/'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCsrfToken() },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok && res.status !== 200) {
        const msg =
          data.message ||
          data.email?.[0] ||
          data.name?.[0] ||
          data.password?.[0] ||
          'Kayıt başarısız. Lütfen tekrar deneyin.';
        throw new Error(msg);
      }
      setSuccess(
        data.message || 'Hesap başarıyla oluşturuldu! Doğrulama sayfasına yönlendiriliyorsunuz...',
      );
      setTimeout(() => navigate(`/verify?email=${encodeURIComponent(email)}`), 1400);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={authShell}>
      <div className={authFormCard}>
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-extrabold text-slate-900">BayKoç&apos;a Katılın</h2>
          <p className="mt-2 text-sm text-slate-600">Başlamak için hesabınızı oluşturun</p>
        </div>

        {error && <div className={alertErrorClass}>{error}</div>}
        {success && <div className={alertSuccessClass}>{success}</div>}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="reg-name" className="block text-sm font-medium text-slate-700">
              Ad Soyad
            </label>
            <input
              id="reg-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className={formInputClass}
            />
          </div>

          <div>
            <label htmlFor="reg-email" className="block text-sm font-medium text-slate-700">
              E-posta Adresi
            </label>
            <input
              id="reg-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              className={formInputClass}
            />
          </div>

          <div>
            <label htmlFor="reg-password" className="block text-sm font-medium text-slate-700">
              Şifre
            </label>
            <input
              id="reg-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
              className={formInputClass}
            />
            <p className="text-xs text-slate-500 mt-1">
              Şifre en az 8 karakter uzunluğunda olmalıdır
            </p>
          </div>

          <div>
            <label
              htmlFor="reg-password-confirm"
              className="block text-sm font-medium text-slate-700"
            >
              Şifreyi Onayla
            </label>
            <input
              id="reg-password-confirm"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              type="password"
              required
              className={formInputClass}
            />
          </div>

          <button
            disabled={loading}
            className="w-full inline-flex justify-center items-center rounded-md btn-primary text-white px-4 py-2 font-semibold shadow hover:opacity-95 transition"
          >
            {loading ? 'Hesap oluşturuluyor…' : 'Hesap Oluştur'}
          </button>
        </form>

        <div className="mt-6 text-sm text-slate-600">
          <Link to="/login" className="text-indigo-600 hover:underline">
            Zaten hesabınız var mı? Giriş yapın
          </Link>
        </div>
      </div>
    </div>
  );
}
