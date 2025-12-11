import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart2, Eye, Search, MapPin } from 'lucide-react';
import MarketingLayout from '../../ui/MarketingLayout';
import { frostedCardShadowXl } from '../../ui/classNames';
import { useTheme } from '../../context/ThemeContext';

const featureCards = [
  {
    icon: Eye,
    title: 'İlerlemeni Gör',
    description: 'Kazanımlar ve ilerleme metrikleriyle gelişimini takip et.',
  },
  {
    icon: Search,
    title: 'Eksiklerini Tespit Et',
    description: 'Analizler sayesinde hangi konularda zayıf kaldığını gör.',
  },
  {
    icon: MapPin,
    title: 'Kazanımlarını Haritalandır',
    description: 'Müfredatı görselleştirerek öğrenme yollarını keşfet.',
  },
];

function FeatureCard({ icon: Icon, title, description }) {
  return (
    <article className="p-6 bg-white rounded-xl shadow hover:shadow-xl transition">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-md bg-indigo-50 text-indigo-600">
        <Icon size={20} />
      </div>
      <h3 className="mt-4 font-semibold text-lg">{title}</h3>
      <p className="mt-2 text-slate-600 text-sm">{description}</p>
    </article>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { palette } = useTheme();
  const token = localStorage.getItem('authToken');
  const [showCookieBanner, setShowCookieBanner] = useState(() => {
    const stored = localStorage.getItem('cookieConsent');
    if (!stored) return true;
    try {
      const parsed = JSON.parse(stored);
      return !parsed || typeof parsed !== 'object';
    } catch {
      return true;
    }
  });
  const [showCookieSettings, setShowCookieSettings] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(() => {
    const stored = localStorage.getItem('cookieConsent');
    if (!stored) return true;
    try {
      const parsed = JSON.parse(stored);
      return Boolean(parsed.analytics);
    } catch {
      return true;
    }
  });

  const saveConsent = (analytics) => {
    const payload = {
      necessary: true,
      analytics: Boolean(analytics),
      date: new Date().toISOString(),
    };
    localStorage.setItem('cookieConsent', JSON.stringify(payload));
    setAnalyticsEnabled(Boolean(analytics));
    setShowCookieBanner(false);
    setShowCookieSettings(false);
  };

  const onExplore = () => {
    if (token) navigate('/dashboard');
    else navigate('/login');
  };

  const heroGlows = useMemo(
    () => [
      {
        id: 'hero-left-glow',
        className:
          'absolute -left-40 -top-28 w-[520px] h-[520px] rounded-full blur-3xl opacity-30 pointer-events-none',
        style: {
          background: `radial-gradient(circle at 35% 35%, ${palette.heroGlowA} 0%, transparent 70%)`,
        },
      },
      {
        id: 'hero-right-glow',
        className:
          'absolute right-[-120px] top-20 w-[360px] h-[360px] rounded-full blur-2xl opacity-20 pointer-events-none',
        style: {
          background: `radial-gradient(circle at 60% 40%, ${palette.heroGlowB} 0%, transparent 65%)`,
        },
      },
    ],
    [palette.heroGlowA, palette.heroGlowB],
  );

  return (
    <MarketingLayout>
      {/* HERO */}
      <section className="relative overflow-hidden">
        {heroGlows.map(({ id, className, style }) => (
          <div key={id} className={className} style={style} />
        ))}

        <div className="max-w-6xl mx-auto px-6 py-24">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className={`mx-auto ${frostedCardShadowXl} max-w-4xl p-8 md:p-12`}
          >
            <div className="flex flex-col md:flex-row md:items-center md:gap-8">
              <div className="flex-1">
                <motion.h1
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.06, duration: 0.6 }}
                  className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900"
                >
                  Öğrenmeyi Görselleştir
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.14, duration: 0.6 }}
                  className="mt-4 text-slate-700 max-w-xl"
                >
                  Öğrenci müfredatınızı, ilişkileri ve ilerlemeyi etkileşimli grafiklerle keşfedin.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className="mt-6 flex flex-wrap gap-3"
                >
                  <button
                    onClick={onExplore}
                    className="group inline-flex items-center gap-3 px-4 py-2 rounded-lg font-semibold btn-primary text-white shadow-lg overflow-hidden"
                  >
                    <span className="flex items-center justify-center w-8 h-8 rounded-md bg-white/10 group-hover:bg-white/20 transition">
                      <BarChart2 size={16} />
                    </span>
                    <span>Grafikleri Keşfet</span>
                  </button>
                  <button
                    onClick={() => navigate('/hakkimizda')}
                    className="px-4 py-2 rounded-lg text-sm btn-secondary"
                  >
                    Daha fazla
                  </button>
                </motion.div>
              </div>

              <div className="mt-6 md:mt-0 w-full md:w-1/3 flex items-center justify-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.24, duration: 0.6 }}
                  className="w-48 h-48 rounded-2xl hero-stat-card shadow-inner flex items-center justify-center"
                >
                  <svg
                    width="110"
                    height="110"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="text-indigo-400"
                  >
                    <rect
                      x="2"
                      y="8"
                      width="3"
                      height="10"
                      rx="1"
                      style={{ fill: palette.heroBarA }}
                    />
                    <rect
                      x="8.5"
                      y="4"
                      width="3"
                      height="14"
                      rx="1"
                      style={{ fill: palette.heroBarB }}
                    />
                    <rect
                      x="15"
                      y="10"
                      width="3"
                      height="8"
                      rx="1"
                      style={{ fill: palette.heroBarC }}
                    />
                  </svg>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="max-w-7xl mx-auto px-6 md:px-8 lg:px-12 py-12">
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-2xl font-bold text-slate-900"
        >
          Öne Çıkan Özellikler
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.6 }}
          className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {featureCards.map((card) => (
            <FeatureCard key={card.title} {...card} />
          ))}
        </motion.div>
      </section>
      {/* Cookie consent banner */}
      {showCookieBanner && (
        <div className="fixed left-0 bottom-0 z-50 p-3 sm:p-4">
          <div className="max-w-sm rounded-xl bg-slate-900/70 backdrop-blur-md text-slate-50 shadow-lg border border-slate-800/80 p-3 sm:p-4 text-xs sm:text-sm flex flex-col gap-2">
            <p className="leading-snug">
              Web sitemizde size daha iyi hizmet verebilmek için çerezler kullanılmaktadır. Kabul Et
              seçeneği ile tüm çerezleri kabul edebilir veya Ayarlar seçeneği ile çerezler hakkında
              daha fazla bilgi alıp tercihlerinizi yönetebilirsiniz.
            </p>
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => saveConsent(true)}
                className="inline-flex justify-center rounded-full bg-emerald-500 px-3 py-1 text-[11px] sm:text-xs font-semibold text-white hover:bg-emerald-400"
              >
                Kabul Et
              </button>
              <button
                type="button"
                onClick={() => setShowCookieSettings(true)}
                className="inline-flex justify-center rounded-full border border-slate-500 px-3 py-1 text-[11px] sm:text-xs font-medium text-slate-100 hover:bg-slate-800/80"
              >
                Ayarlar
              </button>
              <button
                type="button"
                onClick={() => navigate('/cerez-politikasi')}
                className="inline-flex justify-center text-[11px] sm:text-xs text-slate-300 hover:text-white underline underline-offset-2"
              >
                Çerez Politikası
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cookie settings modal */}
      {showCookieSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl p-6 text-slate-900">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Çerez Tercihleri</h2>
                <p className="mt-1 text-sm text-slate-600">
                  BayKoç deneyiminizi iyileştirmek için bazı çerezlere ihtiyaç duyar. Zorunlu
                  çerezler her zaman aktiftir; diğer kategoriler için tercih yapabilirsiniz.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCookieSettings(false)}
                className="text-slate-500 hover:text-slate-800 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-slate-900">Zorunlu Çerezler</div>
                  <p className="mt-1 text-xs text-slate-600">
                    Oturum açma, güvenlik ve form gönderimi gibi temel işlevler için gereklidir. Bu
                    çerezler kapatılamaz.
                  </p>
                </div>
                <span className="text-[11px] rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 font-medium">
                  Her zaman aktif
                </span>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-slate-900">Analitik Çerezler</div>
                  <p className="mt-1 text-xs text-slate-600">
                    Site kullanımını anonim olarak analiz ederek içerikleri ve performansı
                    iyileştirmemize yardımcı olur.
                  </p>
                </div>
                <label className="inline-flex items-center gap-2 text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={analyticsEnabled}
                    onChange={(e) => setAnalyticsEnabled(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  Etkin
                </label>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-3 text-sm">
              <button
                type="button"
                onClick={() => setShowCookieSettings(false)}
                className="px-4 py-1.5 rounded-full border border-slate-300 text-slate-700 hover:bg-slate-100"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={() => saveConsent(analyticsEnabled)}
                className="px-5 py-1.5 rounded-full bg-indigo-600 text-white font-semibold hover:bg-indigo-500"
              >
                Tercihleri Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </MarketingLayout>
  );
}
