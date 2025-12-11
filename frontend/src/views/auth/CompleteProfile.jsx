import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { alertErrorClass, alertSuccessClass, frostedCardShadowLg } from '../../ui/classNames';
import { apiUrl, getCsrfToken } from '../../utils/api';

const gradeOptions = [
  { value: '5', label: '5. Sınıf' },
  { value: '6', label: '6. Sınıf' },
  { value: '7', label: '7. Sınıf' },
  { value: '8', label: '8. Sınıf' },
  { value: '9', label: '9. Sınıf' },
  { value: '10', label: '10. Sınıf' },
  { value: '11', label: '11. Sınıf' },
  { value: '12', label: '12. Sınıf' },
  { value: 'mezun', label: 'Mezunum' },
];

const languageOptions = [
  { value: 'almanca', label: 'Almanca' },
  { value: 'arapca', label: 'Arapça' },
  { value: 'fransizca', label: 'Fransızca' },
  { value: 'ingilizce', label: 'İngilizce' },
  { value: 'rusca', label: 'Rusça' },
];

const gradeToNumber = (value) => {
  if (value === 'mezun') return 13;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

export default function CompleteProfilePage() {
  const navigate = useNavigate();
  const [grade, setGrade] = useState('');
  const [track, setTrack] = useState('');
  const [language, setLanguage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    (async () => {
      try {
        const res = await fetch(apiUrl('/api/users/me/'), {
          headers: { Authorization: `Token ${token}`, 'Content-Type': 'application/json' },
        });
        if (!res.ok) {
          localStorage.removeItem('authToken');
          navigate('/login', { replace: true });
          return;
        }
        const me = await res.json();
        if (me.profile_completed) {
          navigate('/dashboard', { replace: true });
        }
      } catch (e) {
        /* ignore */
      }
    })();
  }, [navigate]);

  const gradeNumeric = gradeToNumber(grade);
  const isLowerGrade = gradeNumeric !== null && gradeNumeric <= 8;

  function onChangeGrade(val) {
    setGrade(val);
    if (!val) {
      setTrack('');
      setLanguage('');
      return;
    }
    const numeric = gradeToNumber(val);
    if (numeric !== null && numeric <= 8) {
      setTrack('lgs');
      setLanguage('');
    } else {
      setTrack('');
      setLanguage('');
    }
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    const gradePayload = grade;
    const trackPayload = isLowerGrade ? 'lgs' : track;

    if (!gradePayload || !trackPayload) {
      setError('Lütfen tüm alanları doldurun.');
      return;
    }

    if (trackPayload === 'dil' && !language) {
      setError('Dil alanı için bir yabancı dil seçmelisiniz.');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const body = {
        grade: gradePayload,
        track: trackPayload,
        language: trackPayload === 'dil' ? language : null,
      };
      const res = await fetch(apiUrl('/api/users/complete-profile/'), {
        method: 'POST',
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json',
          'X-CSRFToken': getCsrfToken(),
        },
        body: JSON.stringify(body),
      });
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('authToken');
        navigate('/login', { replace: true });
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        let msg =
          data.grade?.[0] ||
          data.track?.[0] ||
          data.language?.[0] ||
          data.message ||
          'Profil tamamlanırken bir hata oluştu.';
        setError(msg);
      } else {
        setSuccess('Profil başarıyla tamamlandı! Yönlendiriliyorsunuz...');
        setTimeout(() => navigate('/dashboard'), 1200);
      }
    } catch (err) {
      setError('Sunucu ile bağlantı kurulamadı. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center theme-gradient py-12 px-4">
      <div className={`w-full max-w-3xl ${frostedCardShadowLg} p-6 md:p-10`}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold">📚 BayKoç</h1>
            <p className="text-sm text-slate-600">Hesabını Tamamla</p>
          </div>
        </div>

        <div className="mb-6 flex gap-3 items-center">
          {[
            { label: 'Kayıt', done: true },
            { label: 'Doğrulama', done: true },
            { label: 'Profil', active: true },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold ${
                  s.active
                    ? 'bg-indigo-600 text-white'
                    : s.done
                      ? 'bg-green-100 text-green-700'
                      : 'bg-slate-100 text-slate-600'
                }`}
              >
                {s.done && !s.active ? '✓' : i + 1}
              </div>
              <div
                className={`text-sm ${s.active ? 'text-indigo-700 font-semibold' : 'text-slate-600'}`}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>

        <div className="mb-4 text-sm text-slate-700">
          <strong>🎓 Hoş geldin!</strong>
          <div className="mt-2">
            Sana en uygun içeriği sunabilmemiz için lütfen aşağıdaki bilgileri tamamla.
          </div>
        </div>

        {error && <div className={alertErrorClass}>{error}</div>}
        {success && <div className={alertSuccessClass}>{success}</div>}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="grade" className="block text-sm font-medium text-slate-700">
              Kaçıncı Sınıfta Okuyorsun? *
            </label>
            <select
              id="grade"
              name="grade"
              required
              value={grade}
              onChange={(e) => onChangeGrade(e.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Sınıf Seçin</option>
              {gradeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="track" className="block text-sm font-medium text-slate-700">
              Hangi Alan? *
            </label>
            {grade && isLowerGrade ? (
              <input
                id="track-text"
                value="LGS"
                readOnly
                className="mt-1 block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm shadow-sm"
              />
            ) : (
              <select
                id="track"
                name="track"
                required
                disabled={!grade || isLowerGrade}
                value={track}
                onChange={(e) => {
                  setTrack(e.target.value);
                  if (e.target.value !== 'dil') {
                    setLanguage('');
                  }
                }}
                className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Alan Seçin</option>
                <option value="sayisal">Sayısal</option>
                <option value="sozel">Sözel</option>
                <option value="dil">Dil</option>
              </select>
            )}
          </div>

          {track === 'dil' && (
            <div>
              <label htmlFor="language" className="block text-sm font-medium text-slate-700">
                Yabancı Dil *
              </label>
              <select
                id="language"
                name="language"
                required
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Dil Seçin</option>
                {languageOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex justify-center items-center rounded-md btn-primary text-white px-4 py-2 font-semibold shadow hover:opacity-95 transition"
            >
              {loading ? 'Profil tamamlanıyor...' : 'Profili Tamamla ve Devam Et'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
