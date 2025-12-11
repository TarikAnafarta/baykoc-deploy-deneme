import React, { useMemo, useState } from 'react';
import useGraphData from '../../hooks/useGraphData';
import GraphSidebar from './components/GraphSidebar';
import GraphVisualizer from './components/GraphVisualizer';
import GraphChatWidget from './components/GraphChatWidget';
import { useTheme } from '../../context/ThemeContext';

export default function GraphPage() {
  const [showLegend, setShowLegend] = useState(false);
  const { graphContext, filterState, handlers, loading, error } = useGraphData();
  const { palette } = useTheme();
  const filters = useMemo(
    () => ({
      selectedSubject: filterState.selectedSubject,
      selectedKonu: filterState.selectedKonu,
      selectedGrup: filterState.selectedGrup,
      selectedAltGrup: filterState.selectedAltGrup,
      selectedGrades: filterState.selectedGrades,
      hasAnyFilter: filterState.hasAnyFilter,
      canSelectGrup: filterState.canSelectGrup,
      canSelectAltGrup: filterState.canSelectAltGrup,
    }),
    [filterState],
  );
  const options = useMemo(
    () => ({
      subjects: filterState.subjects,
      konuOptions: filterState.konuOptions,
      grupOptions: filterState.grupOptions,
      altGrupOptions: filterState.altGrupOptions,
      sourcesLoading: filterState.sourcesLoading,
      filterOptionsLoading: filterState.filterOptionsLoading,
    }),
    [filterState],
  );

  function handleBackClick() {
    const token = localStorage.getItem('authToken');
    window.location.href = token ? '/dashboard' : '/';
  }

  return (
    <div className="min-h-screen h-screen bg-slate-900 text-gray-100 relative flex overflow-hidden">
      <GraphSidebar
        filters={filters}
        options={options}
        handlers={handlers}
        loading={loading}
        onBack={handleBackClick}
      />

      <div className="flex-1 relative h-full overflow-hidden">
        <div className="absolute top-4 right-4 z-30 flex flex-col items-end gap-2">
          <button
            type="button"
            onClick={() => setShowLegend((prev) => !prev)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-slate-900/90 text-slate-200 text-sm font-semibold shadow-md hover:bg-slate-800 hover:border-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/70"
            aria-label="Grafik bilgisi"
          >
            i
          </button>
          {showLegend && (
            <aside className="bg-slate-800/95 border border-slate-700 p-3 rounded-lg shadow-xl max-w-xs">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-semibold">Grafik Gösterge</div>
                <span className="text-[10px] uppercase tracking-[0.16em] text-slate-400">
                  Açıklama
                </span>
              </div>
              <ul className="space-y-2 text-sm text-slate-200" aria-label="Grafik açıklama">
                <li className="flex items-center gap-3">
                  <span
                    className="w-3 h-3 rounded-full bg-blue-500 inline-block"
                    aria-hidden="true"
                  />
                  Konu (başlık)
                </li>
                <li className="flex items-center gap-3">
                  <span
                    className="w-3 h-3 rounded-full bg-purple-600 inline-block"
                    aria-hidden="true"
                  />
                  Grup (başlık)
                </li>
                <li className="flex items-center gap-3">
                  <span
                    className="w-3 h-3 rounded-full bg-teal-600 inline-block"
                    aria-hidden="true"
                  />
                  Alt Grup (başlık)
                </li>
                <li className="flex items-center gap-3">
                  <span
                    className="w-3 h-3 rounded-full inline-block legend-spectrum"
                    aria-hidden="true"
                  />
                  Kazanım (renk = başarı)
                </li>
              </ul>
              <div className="mt-2 text-xs text-slate-400">Büyüklük: hiyerarşi düzeyi / başarı</div>
            </aside>
          )}
        </div>

        <main className="w-full h-full overflow-hidden relative">
          <div aria-live="polite" className="sr-only">
            {loading ? 'Grafik yüklüyor' : error ? `Hata: ${error}` : 'Grafik yüklendi'}
          </div>
          {loading && (
            <div className="absolute inset-0 flex items-start justify-center pt-8 z-20 pointer-events-none">
              <div className="bg-slate-800/80 text-slate-100 px-4 py-2 rounded-md shadow">
                Yükleniyor...
              </div>
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex items-start justify-center pt-8 z-20">
              <div className="bg-red-700/90 text-white px-4 py-2 rounded-md shadow">
                Hata: {error}
              </div>
            </div>
          )}
          <GraphVisualizer nodes={graphContext.nodes} links={graphContext.links} colors={palette} />
        </main>
      </div>

      <GraphChatWidget graphContext={graphContext} />
    </div>
  );
}
