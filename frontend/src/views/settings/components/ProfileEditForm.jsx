import React from 'react';

export default function ProfileEditForm({
  editName,
  setEditName,
  gradeOptions,
  editGrade,
  handleGradeChange,
  isLgsLocked,
  editTrack,
  handleTrackChange,
  trackOptions,
  editLanguage,
  setEditLanguage,
  languageOptions,
  onCancel,
  onSave,
}) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label
            htmlFor="profile-name"
            className="block text-xs font-medium tracking-wide text-slate-500 uppercase mb-1.5"
          >
            İsim
          </label>
          <input
            id="profile-name"
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="block w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
          />
        </div>

        <div>
          <label
            htmlFor="profile-grade"
            className="block text-xs font-medium tracking-wide text-slate-500 uppercase mb-1.5"
          >
            Sınıf
          </label>
          <select
            id="profile-grade"
            value={editGrade}
            onChange={(e) => handleGradeChange(e.target.value)}
            className="block w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
          >
            {gradeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <span
            id="profile-track-label"
            className="block text-xs font-medium tracking-wide text-slate-500 uppercase mb-1.5"
          >
            Alan
          </span>
          {isLgsLocked ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/10 text-xs font-semibold text-indigo-600">
                  LGS
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">LGS Hazırlık</p>
                  <p className="text-xs text-slate-500">
                    8. sınıf ve altı için alan otomatik olarak LGS kabul edilir.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div
              className="grid gap-3 sm:grid-cols-2"
              role="radiogroup"
              aria-labelledby="profile-track-label"
            >
              {trackOptions.map((option) => {
                const isActive = editTrack === option.value;
                return (
                  <label
                    key={option.value}
                    className={`relative flex cursor-pointer flex-col gap-2 rounded-xl border px-4 py-3 text-left transition-all ${
                      isActive
                        ? `${option.accent.border} bg-white shadow-sm ring-2 ${option.accent.ring}`
                        : 'border-slate-200 bg-slate-50 hover:border-slate-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="profile-track"
                      value={option.value}
                      checked={isActive}
                      onChange={() => handleTrackChange(option.value)}
                      className="sr-only"
                    />
                    <span className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${isActive ? option.accent.dot : 'bg-slate-300'}`}
                      />
                      {option.title}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
          {!isLgsLocked && (
            <p className="mt-2 text-[11px] text-slate-500">
              9. sınıftan itibaren alan seçimi zorunludur.
            </p>
          )}
          {!isLgsLocked && editTrack === 'dil' && (
            <div className="mt-4">
              <label
                htmlFor="profile-language"
                className="block text-xs font-medium tracking-wide text-slate-500 uppercase mb-1.5"
              >
                Yabancı Dil
              </label>
              <select
                id="profile-language"
                value={editLanguage}
                onChange={(e) => setEditLanguage(e.target.value)}
                className="block w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
              >
                <option value="">Dil Seçin</option>
                {languageOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-slate-500">
                Dil alanı için yabancı dil seçimi zorunludur.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center rounded-full border border-slate-300 px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          Vazgeç
        </button>
        <button
          type="button"
          onClick={onSave}
          className="inline-flex items-center rounded-full bg-indigo-500 px-5 py-1.5 text-sm font-semibold text-white shadow shadow-indigo-500/40 hover:bg-indigo-400"
        >
          Kaydet
        </button>
      </div>
    </div>
  );
}
