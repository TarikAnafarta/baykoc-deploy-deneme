import React from 'react';

const GRADE_LEVELS = [9, 10, 11, 12];

export default function GraphSidebar({ filters, options, handlers, loading, onBack }) {
  const {
    selectedSubject,
    selectedKonu,
    selectedGrup,
    selectedAltGrup,
    selectedGrades,
    hasAnyFilter,
    canSelectGrup,
    canSelectAltGrup,
  } = filters;

  const {
    subjects = [],
    konuOptions = [],
    grupOptions = [],
    altGrupOptions = [],
    sourcesLoading,
    filterOptionsLoading,
  } = options;

  const {
    handleSubjectChange,
    handleKonuChange,
    handleGrupChange,
    handleAltGrupChange,
    handleGradeToggle,
    handleResetFilters,
  } = handlers;

  return (
    <aside className="w-72 bg-slate-950/90 border-r border-slate-800 flex flex-col py-4 px-3 z-30 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-sm font-semibold text-slate-100 tracking-wide">Konu Grafiği</h1>
          <p className="text-[11px] text-slate-400">Ders, konu ve gruplara göre filtrele</p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center justify-center rounded-full border border-slate-700 bg-slate-900/80 px-2.5 py-1 text-[11px] font-medium text-slate-100 hover:bg-slate-800 hover:border-slate-500 transition-colors"
        >
          <span className="mr-1 text-xs" aria-hidden="true">
            ←
          </span>
          Geri
        </button>
      </div>

      <div className="theme-divider mb-4" />

      <div className="space-y-4 text-sm overflow-y-auto pr-1">
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              Filtreler
            </p>
            <span
              aria-live="polite"
              className={`text-[10px] text-indigo-300 h-4 flex items-center transition-opacity ${filterOptionsLoading ? 'opacity-100' : 'opacity-0'}`}
            >
              Seçenekler güncelleniyor...
            </span>
          </div>

          <div className="flex justify-end mb-2">
            <button
              type="button"
              onClick={handleResetFilters}
              disabled={!hasAnyFilter || loading}
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] transition-colors ${
                hasAnyFilter
                  ? 'border-slate-700 bg-slate-900/80 text-slate-200 hover:bg-slate-800 hover:border-slate-500'
                  : 'border-slate-800 bg-slate-950/80 text-slate-500'
              } ${loading ? 'opacity-70 cursor-wait' : ''}`}
            >
              <span className="text-xs" aria-hidden="true">
                ⟳
              </span>
              Filtreleri sıfırla
            </button>
          </div>

          <div className="mb-3">
            <p className="block text-[11px] text-slate-300 mb-1.5">Sınıf (opsiyonel)</p>
            <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-200">
              {GRADE_LEVELS.map((grade) => (
                <label
                  key={grade}
                  className={`inline-flex items-center gap-1 select-none ${loading ? 'cursor-wait' : 'cursor-pointer'}`}
                >
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 rounded border-slate-600 bg-slate-900 text-indigo-500 focus:ring-indigo-500"
                    checked={selectedGrades.includes(grade)}
                    onChange={() => handleGradeToggle(grade)}
                    disabled={loading}
                  />
                  <span>{grade}. sınıf</span>
                </label>
              ))}
            </div>
            <p className="mt-1 text-[10px] text-slate-500">
              Bir veya daha fazla sınıf seçebilirsin; boş bırakırsan tüm sınıflar gelir.
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label htmlFor="graph-subject" className="block text-[11px] text-slate-300 mb-1.5">
                Ders (subject)
              </label>
              <select
                id="graph-subject"
                value={selectedSubject}
                onChange={handleSubjectChange}
                disabled={sourcesLoading || subjects.length === 0}
                className="w-full rounded-md bg-slate-900 border border-slate-700 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-60"
              >
                {subjects.length === 0 && <option value="">Yükleniyor...</option>}
                {subjects.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="graph-konu" className="block text-[11px] text-slate-300 mb-1.5">
                Konu (opsiyonel)
              </label>
              <select
                id="graph-konu"
                value={selectedKonu}
                onChange={handleKonuChange}
                disabled={
                  sourcesLoading ||
                  filterOptionsLoading ||
                  !selectedSubject ||
                  konuOptions.length === 0
                }
                className="w-full rounded-md bg-slate-900 border border-slate-700 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-60"
              >
                <option value="">Tüm konular</option>
                {konuOptions.map((konu) => (
                  <option key={konu.slug} value={konu.slug}>
                    {konu.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="graph-grup" className="block text-[11px] text-slate-300 mb-1.5">
                Grup (opsiyonel)
              </label>
              <select
                id="graph-grup"
                value={selectedGrup}
                onChange={handleGrupChange}
                disabled={
                  !canSelectGrup ||
                  grupOptions.length === 0 ||
                  filterOptionsLoading ||
                  sourcesLoading
                }
                className="w-full rounded-md bg-slate-900 border border-slate-700 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-60"
              >
                <option value="">Tüm gruplar</option>
                {grupOptions.map((grup) => (
                  <option key={grup.slug} value={grup.slug}>
                    {grup.label}
                  </option>
                ))}
              </select>
              {!canSelectGrup && (
                <p className="mt-1 text-[10px] text-slate-500">Grup seçmek için önce konu seçin.</p>
              )}
            </div>

            <div>
              <label htmlFor="graph-alt-grup" className="block text-[11px] text-slate-300 mb-1.5">
                Alt Grup (opsiyonel)
              </label>
              <select
                id="graph-alt-grup"
                value={selectedAltGrup}
                onChange={handleAltGrupChange}
                disabled={
                  !canSelectAltGrup ||
                  altGrupOptions.length === 0 ||
                  filterOptionsLoading ||
                  sourcesLoading
                }
                className="w-full rounded-md bg-slate-900 border border-slate-700 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-60"
              >
                <option value="">Tüm alt gruplar</option>
                {altGrupOptions.map((altGrup) => (
                  <option key={altGrup.slug} value={altGrup.slug}>
                    {altGrup.label}
                  </option>
                ))}
              </select>
              {!canSelectAltGrup && (
                <p className="mt-1 text-[10px] text-slate-500">
                  Alt grup için önce konu ve grup seçin.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-auto pt-3 text-[10px] text-slate-500 border-t border-slate-800/70">
        <p>Filtreleri değiştirerek grafiği canlı olarak güncelleyebilirsin.</p>
      </div>
    </aside>
  );
}
