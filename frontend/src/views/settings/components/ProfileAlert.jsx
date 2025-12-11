import React from 'react';

export default function ProfileAlert({ alertState }) {
  if (!alertState?.show) return null;
  const isError = alertState.type === 'error';
  const baseClasses = 'max-w-5xl mx-auto mb-4 rounded-lg border px-4 py-2 text-sm';
  const variantClasses = isError
    ? 'border-red-200 bg-red-50 text-red-800'
    : 'border-emerald-200 bg-emerald-50 text-emerald-800';

  return <div className={`${baseClasses} ${variantClasses}`}>{alertState.message}</div>;
}
