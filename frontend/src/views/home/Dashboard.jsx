import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { alertErrorClass } from '../../ui/classNames';
import DefaultAvatar from '../../assets/icons/user_default.svg';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  function getCSRFToken() {
    const cookies = document.cookie.split(';');
    for (const c of cookies) {
      const [n, v] = c.trim().split('=');
      if (n === 'csrftoken') return v;
    }
    return '';
  }

  useEffect(() => {
    function onDocClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    async function load() {
      try {
        setError('');
        const res = await fetch('http://localhost:8000/api/users/me/', {
          headers: { Authorization: `Token ${token}`, 'Content-Type': 'application/json' },
        });
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('authToken');
          navigate('/login', { replace: true });
          return;
        }
        if (!res.ok) {
          localStorage.removeItem('authToken');
          navigate('/login', { replace: true });
          return;
        }
        const data = await res.json();
        if (!data.profile_completed) {
          navigate('/complete-profile', { replace: true });
          return;
        }
        setUser(data);
      } catch (err) {
        setError('Kullanıcı bilgileri yüklenemedi');
      }
    }
    load();
  }, [navigate]);

  async function logout() {
    const token = localStorage.getItem('authToken');
    try {
      const res = await fetch('http://localhost:8000/api/users/logout/', {
        method: 'POST',
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json',
          'X-CSRFToken': getCSRFToken(),
        },
      });
      if (res.status === 401 || res.status === 403) {
        // ignore, just fallthrough to cleanup
      }
    } catch (_) {
      /* ignore */
    } finally {
      localStorage.removeItem('authToken');
      navigate('/', { replace: true });
    }
  }

  return (
    <div className="min-h-screen bg-app text-body">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-bold text-indigo-600">BayKoç</h1>

            <div className="relative" ref={menuRef}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen((o) => !o);
                }}
                className={`card-surface flex items-center gap-3 rounded-full px-3 py-1.5 transition hover:bg-white/40 ${
                  open ? 'ring-1 ring-black/5 shadow-lg' : ''
                }`}
                aria-haspopup="menu"
                aria-expanded={open}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/60 text-sm font-semibold shadow-inner">
                  <img
                    src={user?.profile_picture || DefaultAvatar}
                    alt="User avatar"
                    className="w-full h-full object-cover object-center rounded-full"
                  />
                </div>
                <span id="user-name" className="text-sm">
                  {user ? user.name || user.email : 'Yükleniyor...'}
                </span>
                <span className="text-xs text-slate-500">▾</span>
              </button>

              {open && (
                <div className="absolute right-0 mt-3 w-48 origin-top-right rounded-2xl card-surface shadow-xl ring-1 ring-black/5 overflow-hidden">
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-sm text-body transition hover:bg-white/40"
                  >
                    Profilim
                  </Link>
                  <button
                    onClick={logout}
                    className="w-full text-left px-4 py-2 text-sm text-body transition hover:bg-white/40"
                  >
                    Çıkış Yap
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6">
        {error && <div className={alertErrorClass}>{error}</div>}

        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-xl font-bold">
            {user ? `${user.name || user.email} Hoş Geldiniz!` : 'Hoş Geldiniz'}
          </h2>
          <p className="text-slate-600 mt-1">Eğitim müfredatı görselleştirme platformunuz</p>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-6 shadow hover:shadow-md">
            <h3 className="font-semibold text-lg">📊 Müfredatı Görselleştir</h3>
            <p className="text-slate-600 mt-2">
              Müfredat ilişkilerini ve öğrenme yollarını görselleştirmek için etkileşimli grafikler
              oluşturun.
            </p>
            <button
              onClick={() => navigate('/graph')}
              className="mt-4 inline-flex items-center gap-2 px-3 py-2 rounded btn-primary text-white"
            >
              Grafikleri Keşfet
            </button>
          </div>

          <div className="bg-white rounded-lg p-6 shadow hover:shadow-md">
            <h3 className="font-semibold text-lg">📈 İlerlemeyi İzle</h3>
            <p className="text-slate-600 mt-2">
              Öğrenme ilerlemesini izleyin ve geliştirilmesi gereken alanları belirleyin.
            </p>
            <button
              onClick={() => navigate('/analytics')}
              className="mt-4 inline-flex items-center gap-2 px-3 py-2 rounded btn-primary text-white"
            >
              Analitikleri Görüntüle
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
