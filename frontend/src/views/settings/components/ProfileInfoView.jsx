import React from 'react';

export default function ProfileInfoView({ user, trackLabel, gradeLabel, languageLabel }) {
  if (!user) return null;
  return (
    <div className="space-y-4 text-sm">
      <div className="flex items-center justify-between border-b border-slate-300 pb-3">
        <span className="text-slate-500">İsim</span>
        <span className="font-medium text-slate-900">{user.name || '-'}</span>
      </div>
      <div className="flex items-center justify-between border-b border-slate-300 pb-3">
        <span className="text-slate-500">Sınıf</span>
        <span className="font-medium text-slate-900">{gradeLabel(user.grade)}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-slate-500">Alan</span>
        <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-900">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          {user.track ? trackLabel(user.track) : '-'}
        </span>
      </div>
      {user.track === 'dil' && (
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Yabancı Dil</span>
          <span className="font-medium text-slate-900">
            {user.language ? languageLabel(user.language) : '-'}
          </span>
        </div>
      )}
    </div>
  );
}
