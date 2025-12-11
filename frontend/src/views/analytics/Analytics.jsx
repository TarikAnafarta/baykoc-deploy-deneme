import React, { useEffect, useMemo, useState } from 'react';
import * as d3 from 'd3';
import { useTheme } from '../../context/ThemeContext';
import { apiUrl, parseJsonResponse, extractErrorMessage } from '../../utils/api';

async function authFetch(path, options = {}) {
  const token = localStorage.getItem('authToken');
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers || {}),
  };
  if (token) headers.Authorization = `Token ${token}`;

  const res = await fetch(apiUrl(path), { ...options, headers });

  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem('authToken');
    window.location.replace('/login');
  }

  return res;
}

function Analytics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [subjects, setSubjects] = useState([]); // örn: matematik, turkce
  const [konuMap, setKonuMap] = useState({}); // { subject: [konu_slug_1, konu_slug_2] }

  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedKonu, setSelectedKonu] = useState('');
  const { palette } = useTheme();

  // Zaman serisi ve kazanım bazlı veri
  const [timelineData, setTimelineData] = useState([]); // [{date, average_success_0_100}]
  const [kazanimStats, setKazanimStats] = useState([]); // [{id, label, success_0_100}]

  function handleBackClick() {
    const token = localStorage.getItem('authToken');
    window.location.href = token ? '/dashboard' : '/';
  }

  // --- KAYNAK YÜKLEME (ders + konu listeleri) ---
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      window.location.replace('/login');
      return;
    }

    let cancelled = false;

    async function loadSources() {
      setLoading(true);
      setError('');
      try {
        const res = await authFetch('/api/graph/sources/');
        const data = await parseJsonResponse(res);
        if (!res.ok) {
          throw new Error(
            extractErrorMessage(data, `Kaynaklar yüklenemedi (HTTP ${res.status})`),
          );
        }
        // GraphSourcesAPIView doğrudan { subject_key: [konu_slug, ...] } döndürüyor.
        // Örn: { "matematik": ["konu_sayilar_ve_cebir", ...], "turkce": [...] }
        const subjectKeys = Object.keys(data || {});

        if (!cancelled) {
          setSubjects(subjectKeys);
          setKonuMap(data || {});
          if (subjectKeys.length > 0) {
            setSelectedSubject((prev) => prev || subjectKeys[0]);
          }
        }
      } catch (e) {
        if (!cancelled) setError(e.message || 'Kaynaklar yüklenirken bir hata oluştu');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadSources();

    return () => {
      cancelled = true;
    };
  }, []);

  // --- ANALİTİK VERİLERİ YÜKLEME (zaman serisi + kazanım başarıları) ---
  useEffect(() => {
    if (!selectedSubject) return;

    let cancelled = false;

    async function loadAnalytics() {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams();
        params.set('subject', selectedSubject);
        if (selectedKonu) params.set('konu', selectedKonu);

        // Örnek endpoint: /api/analytics/progress/?subject=...&konu=...
        const res = await authFetch(`/api/analytics/progress/?${params.toString()}`);
        const data = await parseJsonResponse(res);
        if (!res.ok) {
          throw new Error(
            extractErrorMessage(data, `Analitik veriler alınamadı (HTTP ${res.status})`),
          );
        }
        // Beklenen basit yapı örneği:
        // {
        //   timeline: [ { date: "2025-11-01", average_success: 42.5 }, ... ],
        //   kazanims: [ { id, label, success: 0-100 }, ... ]
        // }

        const timeline = (data.timeline || []).map((d) => ({
          date: d.date,
          success: Number.isFinite(Number(d.average_success)) ? Number(d.average_success) : 0,
        }));

        const kazanims = (data.kazanims || []).map((k) => ({
          id: k.id,
          label: k.label || k.name || 'Kazanım',
          success: Number.isFinite(Number(k.success)) ? Number(k.success) : 0,
        }));

        if (!cancelled) {
          setTimelineData(timeline);
          setKazanimStats(kazanims);
        }
      } catch (e) {
        if (!cancelled) setError(e.message || 'Analitik veriler alınırken bir hata oluştu');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAnalytics();

    return () => {
      cancelled = true;
    };
  }, [selectedSubject, selectedKonu]);

  const currentKonular = useMemo(
    () => (selectedSubject ? konuMap[selectedSubject] || [] : []),
    [selectedSubject, konuMap],
  );

  function handleSubjectChange(e) {
    const v = e.target.value;
    setSelectedSubject(v);
    setSelectedKonu('');
  }

  function handleKonuChange(e) {
    const v = e.target.value;
    setSelectedKonu(v);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Üst başlık ve açıklama */}
        <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Öğrenme Analitiği</h1>
            <p className="mt-1 text-sm text-slate-400 max-w-2xl">
              Seçtiğiniz ders ve konulardaki kazanım başarı puanlarınızı zaman içindeki değişimiyle
              birlikte izleyin. Başarı puanları 0-100 arasında hesaplanır.
            </p>
          </div>
          <button
            type="button"
            onClick={handleBackClick}
            className="inline-flex items-center justify-center rounded-full border border-slate-700 bg-slate-900/80 px-2.5 py-1 text-[11px] font-medium text-slate-100 hover:bg-slate-800 hover:border-slate-500 transition-colors"
          >
            <span className="mr-1 text-xs" aria-hidden="true">
              ←
            </span>
            Geri
          </button>
        </section>

        {/* Filtreler */}
        <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-slate-200 tracking-wide">Filtreler</h2>
            {loading && (
              <span className="inline-flex items-center rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                Yükleniyor...
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Ders seçimi */}
            <div>
              <label
                htmlFor="analytics-subject"
                className="block text-xs font-medium text-slate-300 mb-1.5"
              >
                Ders
              </label>
              <select
                id="analytics-subject"
                value={selectedSubject}
                onChange={handleSubjectChange}
                disabled={subjects.length === 0}
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-60"
              >
                {subjects.length === 0 && <option value="">Dersler yükleniyor...</option>}
                {subjects.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Konu seçimi */}
            <div>
              <label
                htmlFor="analytics-konu"
                className="block text-xs font-medium text-slate-300 mb-1.5"
              >
                Konu (opsiyonel)
              </label>
              <select
                id="analytics-konu"
                value={selectedKonu}
                onChange={handleKonuChange}
                disabled={currentKonular.length === 0}
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-60"
              >
                <option value="">Tüm konular</option>
                {currentKonular.map((k) => {
                  const value = typeof k === 'string' ? k : k.slug || k.label || '';
                  const label = typeof k === 'string' ? k : k.label || k.slug || '';
                  return (
                    <option key={value || label} value={value}>
                      {label || value}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Özet bilgi kartı */}
            <div className="flex flex-col justify-between rounded-xl bg-slate-950 border border-slate-800 px-3 py-3 text-xs">
              <span className="text-slate-400 mb-1">Seçili kapsam</span>
              <span className="text-slate-50 font-medium truncate">
                {selectedSubject || 'Henüz ders seçilmedi'}
              </span>
              <span className="text-slate-400 truncate text-[11px]">
                {selectedKonu ? `Konu: ${selectedKonu}` : 'Tüm konular'}
              </span>
            </div>
          </div>
        </section>

        {/* Hata mesajı */}
        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {/* Grafikler bölümü */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {/* Zaman serisi (çizgi grafik) */}
          <div className="lg:col-span-2 rounded-2xl bg-slate-900/80 border border-slate-800 p-4 sm:p-5 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-100 mb-0.5">
                  Zaman İçinde Ortalama Başarı
                </h2>
                <p className="text-xs text-slate-400">
                  Çözdüğünüz sorulara göre ortalama başarı puanınızın (0-100) günlere göre değişimi.
                </p>
              </div>
            </div>

            <TimelineChart data={timelineData} palette={palette} />
          </div>

          {/* Kazanım dağılımı (bar chart) */}
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 sm:p-5 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-100 mb-0.5">
                  Kazanım Başarı Dağılımı
                </h2>
                <p className="text-xs text-slate-400">
                  Seçili kapsamda öne çıkan kazanımlar ve güncel başarı puanlarınız.
                </p>
              </div>
            </div>

            <KazanımBarList data={kazanimStats} palette={palette} />
          </div>
        </section>
      </main>
    </div>
  );
}

// --- Çizgi Grafik Bileşeni ---
function TimelineChart({ data, palette }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-xs text-slate-500 border border-dashed border-slate-700 rounded-xl mt-2">
        Bu kapsam için henüz yeterli veri yok. Soru çözdükçe ilerleme grafiğiniz oluşacak.
      </div>
    );
  }

  const margin = { top: 10, right: 12, bottom: 20, left: 30 };
  const width = 640;
  const height = 220;
  const gridColor = palette?.chartGrid || '#1e293b';
  const tickColor = palette?.chartTick || '#64748b';
  const lineColor = palette?.chartLine || '#4f46e5';
  const areaStart = palette?.chartAreaStart || '#22c55e';
  const areaMid = palette?.chartAreaMid || '#4f46e5';
  const areaEnd = palette?.chartAreaEnd || '#0f172a';
  const pointColor = palette?.chartPoint || '#22c55e';

  const parseDate = d3.timeParse('%Y-%m-%d');

  const processed = data
    .map((d) => ({
      date: parseDate(d.date) || new Date(d.date),
      success: Math.max(0, Math.min(100, d.success)),
    }))
    .sort((a, b) => a.date - b.date);

  const x = d3
    .scaleTime()
    .domain(d3.extent(processed, (d) => d.date))
    .range([margin.left, width - margin.right]);

  const y = d3
    .scaleLinear()
    .domain([0, 100])
    .nice()
    .range([height - margin.bottom, margin.top]);

  const linePath = d3
    .line()
    .x((d) => x(d.date))
    .y((d) => y(d.success))
    .curve(d3.curveMonotoneX)(processed);

  const areaPath = d3
    .area()
    .x((d) => x(d.date))
    .y0(y(0))
    .y1((d) => y(d.success))
    .curve(d3.curveMonotoneX)(processed);

  return (
    <div className="mt-2 overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-56 text-xs text-slate-300 [&_text]:select-none"
      >
        {/* Y ekseni grid çizgileri */}
        {y.ticks(5).map((t) => (
          <g key={t}>
            <line
              x1={margin.left}
              x2={width - margin.right}
              y1={y(t)}
              y2={y(t)}
              stroke={gridColor}
              strokeWidth="1"
              strokeDasharray="2 2"
            />
            <text
              x={margin.left - 4}
              y={y(t)}
              dy="0.32em"
              textAnchor="end"
              fill={tickColor}
              fontSize="9"
            >
              {t}
            </text>
          </g>
        ))}

        {/* X ekseni label'ları (maksimum 6 tick) */}
        {x.ticks(Math.min(6, processed.length)).map((d) => (
          <text
            key={d.toISOString()}
            x={x(d)}
            y={height - 5}
            textAnchor="middle"
            fill={tickColor}
            fontSize="9"
          >
            {d3.timeFormat('%d.%m')(d)}
          </text>
        ))}

        {/* Alan */}
        <path d={areaPath} fill="url(#timelineGradient)" opacity="0.85" />

        {/* Çizgi */}
        <path d={linePath} fill="none" stroke={lineColor} strokeWidth="2" />

        {/* Noktalar */}
        {processed.map((d, idx) => (
          <g key={idx}>
            <circle cx={x(d.date)} cy={y(d.success)} r={3.4} fill={pointColor} />
          </g>
        ))}

        {/* Gradient tanımı */}
        <defs>
          <linearGradient id="timelineGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={areaStart} stopOpacity="0.75" />
            <stop offset="45%" stopColor={areaMid} stopOpacity="0.35" />
            <stop offset="100%" stopColor={areaEnd} stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

// --- Kazanım Bar Listesi ---
function KazanımBarList({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-xs text-slate-500 border border-dashed border-slate-700 rounded-xl mt-2">
        Henüz görüntülenecek kazanım verisi yok. İlgili derste soru çözdükçe burası dolacak.
      </div>
    );
  }

  // En çok üzerinde çalışılan / fark yaratan ilk 8 kazanımı gösterelim
  const top = [...data]
    .map((k) => ({ ...k, success: Math.max(0, Math.min(100, k.success)) }))
    .sort((a, b) => b.success - a.success)
    .slice(0, 8);

  return (
    <div className="mt-2 space-y-2 overflow-y-auto max-h-64 pr-1">
      {top.map((k) => (
        <article
          key={k.id}
          className="rounded-lg bg-slate-950/70 border border-slate-800 px-3 py-2.5 text-xs flex flex-col gap-1.5"
        >
          <header className="flex items-start justify-between gap-2">
            <h3 className="font-medium text-slate-50 text-[11px] line-clamp-2">{k.label}</h3>
            <span className="ml-1 inline-flex items-center rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-200">
              %{Math.round(k.success)}
            </span>
          </header>

          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div className="h-full rounded-full spectrum-bar" style={{ width: `${k.success}%` }} />
          </div>

          <footer className="flex items-center justify-between text-[10px] text-slate-500">
            <span>Daha güçlü hale getirmek için çalış</span>
            <span>Başarı puanı</span>
          </footer>
        </article>
      ))}
    </div>
  );
}

export default Analytics;
