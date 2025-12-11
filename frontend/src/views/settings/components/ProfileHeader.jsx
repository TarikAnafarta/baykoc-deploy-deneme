import React from 'react';

export default function ProfileHeader({ onBack }) {
  return (
    <div className="max-w-5xl mx-auto mb-6 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Profil</h1>
        <p className="mt-1 text-sm text-slate-500">
          Hesap ve profil ayarlarını buradan yönetebilirsin.
        </p>
      </div>
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center rounded-full border border-slate-300 px-4 py-1.5 text-sm text-slate-700 transition hover:bg-white/40"
      >
        Geri dön
      </button>
    </div>
  );
}
